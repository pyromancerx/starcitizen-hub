package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/handlers"
	customMiddleware "github.com/pyromancerx/starcitizen-hub/backend-go/internal/middleware"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/utils"
)

func main() {
	// Flags
	createAdmin := flag.Bool("create-admin", false, "Create an admin user and exit")
	action := flag.String("action", "", "Action to perform: create-user, list-users, delete-user, approve-user")
	email := flag.String("email", "", "User email")
	password := flag.String("password", "", "User password")
	name := flag.String("name", "", "User display name")
	handle := flag.String("handle", "", "User RSI handle")
	isAdmin := flag.Bool("admin", false, "Set user as admin (for create-user)")
	flag.Parse()

	// Load .env
	godotenv.Load("../.env")

	// Connect to Database
	database.Connect()

	// Auto-migrate
	database.DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Ship{},
		&models.Wallet{},
		&models.WalletTransaction{},
		&models.PersonalInventory{},
		&models.OrgStockpile{},
		&models.StockpileTransaction{},
		&models.TradeRun{},
		&models.CargoContract{},
		&models.OrgTreasury{},
		&models.TreasuryTransaction{},
		&models.Operation{},
		&models.OperationParticipant{},
		&models.Project{},
		&models.ProjectPhase{},
		&models.Task{},
		&models.ContributionGoal{},
		&models.Contribution{},
		&models.ForumCategory{},
		&models.ForumThread{},
		&models.ForumPost{},
		&models.Conversation{},
		&models.Message{},
		&models.Notification{},
		&models.Activity{},
		&models.Achievement{},
		&models.UserAchievement{},
		&models.DiscordIntegration{},
		&models.DiscordWebhook{},
		&models.UserDiscordLink{},
		&models.DiscordRoleMapping{},
		&models.RSIVerificationRequest{},
		&models.SystemSetting{},
		&models.AuditLog{},
	)

	if *createAdmin || *action == "create-user" {
		if *email == "" || *password == "" {
			log.Fatal("Email and password are required")
		}

		userPass := *password
		userName := *name
		if userName == "" {
			userName = "New User"
		}
		userHandle := *handle
		if userHandle == "" {
			userHandle = "Citizen"
		}

		hashedPassword, _ := utils.HashPassword(userPass)
		user := models.User{
			Email:        *email,
			PasswordHash: hashedPassword,
			DisplayName:  userName,
			RSIHandle:    userHandle,
			IsActive:     true,
			IsApproved:   true,
		}

		if err := database.DB.Create(&user).Error; err != nil {
			log.Fatalf("Failed to create user: %v", err)
		}

		if *createAdmin || *isAdmin {
			var adminRole models.Role
			if err := database.DB.Where("name = ?", "Admin").First(&adminRole).Error; err != nil {
				adminRole = models.Role{
					Name:        "Admin",
					Tier:        models.RoleTierAdmin,
					Permissions: "[\"*\"]",
					SortOrder:   100,
				}
				database.DB.Create(&adminRole)
			}
			database.DB.Model(&user).Association("Roles").Append(&adminRole)
			log.Println("Admin user created successfully")
		} else {
			log.Println("User created successfully")
		}
		os.Exit(0)
	}

	if *action == "list-users" {
		var users []models.User
		database.DB.Preload("Roles").Find(&users)
		fmt.Printf("%-5s | %-25s | %-20s | %-10s | %s\n", "ID", "Email", "Name", "Approved", "Roles")
		fmt.Println("--------------------------------------------------------------------------------")
		for _, u := range users {
			roles := ""
			for i, r := range u.Roles {
				if i > 0 {
					roles += ", "
				}
				roles += r.Name
			}
			fmt.Printf("%-5d | %-25s | %-20s | %-10t | %s\n", u.ID, u.Email, u.DisplayName, u.IsApproved, roles)
		}
		os.Exit(0)
	}

	if *action == "delete-user" {
		if *email == "" {
			log.Fatal("Email is required for delete-user")
		}
		result := database.DB.Where("email = ?", *email).Delete(&models.User{})
		if result.Error != nil {
			log.Fatalf("Failed to delete user: %v", result.Error)
		}
		if result.RowsAffected == 0 {
			log.Fatal("User not found")
		}
		log.Printf("User %s deleted successfully\n", *email)
		os.Exit(0)
	}

	if *action == "approve-user" {
		if *email == "" {
			log.Fatal("Email is required for approve-user")
		}
		result := database.DB.Model(&models.User{}).Where("email = ?", *email).Update("is_approved", true)
		if result.Error != nil {
			log.Fatalf("Failed to approve user: %v", result.Error)
		}
		if result.RowsAffected == 0 {
			log.Fatal("User not found")
		}
		log.Printf("User %s approved successfully\n", *email)
		os.Exit(0)
	}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	authHandler := handlers.NewAuthHandler()
	assetHandler := handlers.NewAssetHandler()
	logisticsHandler := handlers.NewLogisticsHandler()
	socialHandler := handlers.NewSocialHandler()
	adminHandler := handlers.NewAdminHandler()

	// Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(customMiddleware.AuthMiddleware)
			r.Get("/auth/me", authHandler.Me)

			// Ships
			r.Get("/ships/", assetHandler.ListMyShips)
			r.Post("/ships/", assetHandler.CreateShip)
			r.Patch("/ships/{id}", assetHandler.UpdateShip)
			r.Delete("/ships/{id}", assetHandler.DeleteShip)
			r.Post("/ships/import-hangarxplorer", assetHandler.ImportHangarXPLORER)

			// Wallet
			r.Get("/wallet/", assetHandler.GetMyWallet)
			r.Get("/wallet/transactions", assetHandler.GetWalletTransactions)

			// Inventory
			r.Get("/inventory/", assetHandler.ListMyInventory)
			r.Post("/inventory/", assetHandler.AddInventoryItem)
			r.Patch("/inventory/{id}", assetHandler.UpdateInventoryItem)
			r.Delete("/inventory/{id}", assetHandler.DeleteInventoryItem)

			// Logistics
			r.Get("/stockpiles/", logisticsHandler.ListStockpiles)
			r.Get("/stockpiles/{id}", logisticsHandler.GetStockpile)
			r.Get("/trade/contracts", logisticsHandler.ListCargoContracts)
			r.Post("/trade/runs", logisticsHandler.CreateTradeRun)
			r.Get("/operations/", logisticsHandler.ListOperations)
			r.Get("/operations/{id}", logisticsHandler.GetOperation)
			r.Post("/operations/{id}/signup", logisticsHandler.SignupOperation)
			r.Get("/projects/", logisticsHandler.ListProjects)
			r.Get("/projects/{id}", logisticsHandler.GetProject)

			// Social
			r.Get("/forum/categories", socialHandler.ListForumCategories)
			r.Get("/forum/categories/{id}", socialHandler.GetForumCategory)
			r.Get("/forum/threads/{id}", socialHandler.GetThread)
			r.Post("/forum/threads", socialHandler.CreateThread)
			r.Post("/forum/posts", socialHandler.CreatePost)
			r.Get("/notifications/", socialHandler.GetNotifications)
			r.Patch("/notifications/{id}/read", socialHandler.MarkNotificationRead)
			r.Get("/activity/feed", socialHandler.GetActivityFeed)

			// Messaging
			r.Get("/messages/conversations", socialHandler.ListConversations)
			r.Get("/messages/conversations/{id}", socialHandler.GetConversation)
			r.Post("/messages/", socialHandler.SendMessage)

			// Admin & Integrations
			r.Get("/admin/users", adminHandler.ListUsers)
			r.Patch("/admin/users/{id}", adminHandler.UpdateUser)
			r.Get("/admin/rsi-requests", adminHandler.ListRSIRequests)
			r.Post("/admin/rsi-requests/{id}/process", adminHandler.ProcessRSIRequest)
			r.Get("/admin/settings", adminHandler.GetSettings)
			r.Patch("/admin/settings", adminHandler.UpdateSetting)
			r.Get("/discord/config", adminHandler.GetDiscordConfig)
			r.Patch("/discord/config", adminHandler.UpdateDiscordConfig)

			// Stats
			r.Get("/stats/dashboard", adminHandler.GetDashboardStats)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Starting Go backend on port %s", port)
	http.ListenAndServe(":"+port, r)
}