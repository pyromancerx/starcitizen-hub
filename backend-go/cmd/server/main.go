package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/handlers"
	customMiddleware "github.com/pyromancerx/starcitizen-hub/backend-go/internal/middleware"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
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

	

		// Setup Logging to file

		logDir := "../logs"

		os.MkdirAll(logDir, 0755)

		logFile, err := os.OpenFile(filepath.Join(logDir, "backend.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

		if err == nil {

			// Multi-writer to show logs in console AND file

			mw := io.MultiWriter(os.Stdout, logFile)

			log.SetOutput(mw)

		}

	

	// Connect to Database
	// (Migrations are run inside Connect)
	database.Connect()

	// Initialize default settings
	defaultSettings := []models.SystemSetting{
		{Key: "org_name", Value: "Star Citizen Hub", Description: "The name of your organization"},
		{Key: "logo_url", Value: "", Description: "URL to the organization logo"},
		{Key: "color_sc_blue", Value: "#66fcf1", Description: "Primary accent highlight color (HEX)"},
		{Key: "color_sc_dark", Value: "#0b0c10", Description: "Primary background color (HEX)"},
		{Key: "color_sc_panel", Value: "#1f2833", Description: "Panel background color (HEX)"},
		{Key: "custom_css", Value: "", Description: "Custom CSS overrides for the entire interface"},
		{Key: "smtp_host", Value: "", Description: "SMTP Server Host (e.g., smtp.gmail.com)"},
		{Key: "smtp_port", Value: "587", Description: "SMTP Server Port (e.g., 587 or 465)"},
		{Key: "smtp_user", Value: "", Description: "SMTP Username / Email"},
		{Key: "smtp_pass", Value: "", Description: "SMTP Password / App Password"},
		{Key: "smtp_from", Value: "noreply@hub.org", Description: "Email 'From' Address"},
		{Key: "rsi_org_sid", Value: "", Description: "RSI Organization SID (e.g., NOVACORP)"},
	}

	for _, s := range defaultSettings {
		var count int64
		database.DB.Model(&models.SystemSetting{}).Where("key = ?", s.Key).Count(&count)
		if count == 0 {
			database.DB.Create(&s)
		}
	}

	// Seed Core Roles
	coreRoles := []models.Role{
		{Name: "Command (Admin)", Tier: models.RoleTierAdmin, Permissions: "[\"*\"]", SortOrder: 100},
		{Name: "Officer", Tier: models.RoleTierOfficer, Permissions: "[\"missions.*\", \"forum.*\", \"social.*\"]", SortOrder: 80},
		{Name: "Specialist", Tier: models.RoleTierMember, Permissions: "[\"missions.view\", \"forum.post\"]", SortOrder: 50},
		{Name: "Citizen", Tier: models.RoleTierMember, Permissions: "[\"forum.view\"]", IsDefault: true, SortOrder: 10},
	}

	for _, r := range coreRoles {
		var count int64
		database.DB.Model(&models.Role{}).Where("tier = ? AND name = ?", r.Tier, r.Name).Count(&count)
		if count == 0 {
			database.DB.Create(&r)
		}
	}

	// Seed Common Achievements
	defaultAchievements := []models.Achievement{
		{Name: "Verified Pilot", Description: "Successfully matched RSI identity with institutional record.", Icon: "ShieldCheck", Rarity: "common", Points: 10},
		{Name: "Logistics Specialist", Description: "Logged 10+ successful commercial trade runs.", Icon: "Truck", Rarity: "rare", Points: 50},
		{Name: "Combat Veteran", Description: "Participated in 5+ authorized combat operations.", Icon: "Swords", Rarity: "epic", Points: 100},
		{Name: "Organization Founder", Description: "Original member of the institutional core.", Icon: "Crown", Rarity: "legendary", Points: 500},
	}

	for _, a := range defaultAchievements {
		var count int64
		database.DB.Model(&models.Achievement{}).Where("name = ?", a.Name).Count(&count)
		if count == 0 {
			database.DB.Create(&a)
		}
	}

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

	if *action == "sync-rsi" {
		syncService := services.NewRSISyncService(database.DB)
		if err := syncService.SyncOrganizationMembers(); err != nil {
			log.Fatalf("Manual RSI sync failed: %v", err)
		}
		log.Println("Manual RSI sync completed successfully")
		os.Exit(0)
	}

	if *action == "sync-game-data" {
		gameDataService := services.NewGameDataService(database.DB)
		if err := gameDataService.SyncFromCommunityData(); err != nil {
			log.Fatalf("Manual game data sync failed: %v", err)
		}
		log.Println("Manual game data sync completed successfully")
		os.Exit(0)
	}

	if *action == "set-setting" {
		if *handle == "" {
			log.Fatal("Key (via -handle) is required")
		}
		adminService := services.NewAdminService()
		if err := adminService.UpdateSetting(*handle, *name); err != nil {
			log.Fatalf("Failed to update setting: %v", err)
		}
		log.Printf("Setting %s updated to %s\n", *handle, *name)
		os.Exit(0)
	}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(customMiddleware.RateLimitMiddleware)
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
	gameDataHandler := handlers.NewGameDataHandler()

	// Initialize and start background scheduler
	scheduler := services.NewSchedulerService(database.DB)
	scheduler.Start()

	// Static files for uploads
	uploadDir := "../uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}
	
	fileServer := http.FileServer(http.Dir(uploadDir))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

	// Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)
		r.Get("/system/setup-status", authHandler.GetSetupStatus)
		r.Post("/system/setup", authHandler.PerformSetup)
		r.Get("/admin/settings", adminHandler.GetSettings)

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(customMiddleware.AuthMiddleware)
			r.Get("/auth/me", authHandler.Me)

			// Ships
			r.Get("/ships/", assetHandler.ListMyShips)
			r.Post("/ships/", assetHandler.CreateShip)
			r.Patch("/ships/bulk", assetHandler.BulkUpdateShips)
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

			// Bases
			r.Get("/bases/", assetHandler.ListMyBases)
			r.Post("/bases/", assetHandler.CreateBase)
			r.Patch("/bases/{id}", assetHandler.UpdateBase)
			r.Delete("/bases/{id}", assetHandler.DeleteBase)
			r.Get("/bases/org", assetHandler.ListOrgBases)

			// Logistics
			r.Get("/stockpiles/", logisticsHandler.ListStockpiles)
			r.Get("/stockpiles/{id}", logisticsHandler.GetStockpile)
			r.Get("/stockpiles/loans", logisticsHandler.ListActiveLoans)
			r.Get("/trade/contracts", logisticsHandler.ListCargoContracts)
			r.Post("/trade/contracts", logisticsHandler.CreateCargoContract)
			r.Get("/trade/runs", logisticsHandler.ListMyTradeRuns)
			r.Post("/trade/runs", logisticsHandler.CreateTradeRun)
			r.Get("/crew/posts", logisticsHandler.ListCrewPosts)
			r.Post("/crew/posts", logisticsHandler.CreateCrewPost)
			r.Get("/operations/", logisticsHandler.ListOperations)
			r.Post("/operations/", logisticsHandler.CreateOperation)
			r.Get("/operations/{id}", logisticsHandler.GetOperation)
			r.Patch("/operations/{id}", logisticsHandler.UpdateOperation)
			r.Post("/operations/{id}/signup", logisticsHandler.SignupOperation)
			r.Post("/operations/{id}/volunteer-sub", logisticsHandler.VolunteerSubLeader)
			r.Post("/operations/sub-leaders/{subId}/process", logisticsHandler.ProcessSubLeader)
			r.Get("/projects/", logisticsHandler.ListProjects)
			r.Get("/projects/{id}", logisticsHandler.GetProject)
			r.Post("/projects/contributions", logisticsHandler.CreateContribution)
			r.Get("/treasury/analytics", logisticsHandler.GetTreasuryAnalytics)

			// Social
			r.Get("/forum/categories", socialHandler.ListForumCategories)
			r.Post("/forum/categories", socialHandler.CreateForumCategory)
			r.Get("/forum/categories/{id}", socialHandler.GetForumCategory)
			r.Get("/forum/threads/{id}", socialHandler.GetThread)
			r.Post("/forum/threads", socialHandler.CreateThread)
			r.Post("/forum/posts", socialHandler.CreatePost)
			r.Post("/social/rsi-verify", socialHandler.SubmitRSIVerification)
			r.Get("/social/members", socialHandler.ListMembers)
			r.Get("/social/achievements", socialHandler.ListAchievements)
			r.Post("/social/achievements/award", socialHandler.AwardAchievement)
			r.Get("/social/federation", socialHandler.ListFederation)
			r.Post("/social/federation", socialHandler.CreateFederationEntity)
			r.Get("/notifications/", socialHandler.GetNotifications)
			r.Patch("/notifications/{id}/read", socialHandler.MarkNotificationRead)
			r.Get("/activity/feed", socialHandler.GetActivityFeed)
			r.Get("/search", socialHandler.GlobalSearch)

			// Voice Channels
			r.Get("/social/voice-channels", socialHandler.ListVoiceChannels)
			r.Post("/social/voice-channels", socialHandler.CreateVoiceChannel)
			r.Delete("/social/voice-channels/{id}", socialHandler.DeleteVoiceChannel)
			r.Get("/social/signaling", socialHandler.HandleSignaling)

			// Announcements
			r.Get("/announcements", socialHandler.ListAnnouncements)
			r.Post("/announcements", socialHandler.CreateAnnouncement)
			r.Delete("/announcements/{id}", socialHandler.DeleteAnnouncement)

			// Messaging
			r.Get("/messages/conversations", socialHandler.ListConversations)
			r.Get("/messages/conversations/{id}", socialHandler.GetConversation)
			r.Post("/messages/", socialHandler.SendMessage)

			// Game Data
			r.Get("/game-data/ships", gameDataHandler.ListShipModels)
			r.Get("/game-data/ships/{id}", gameDataHandler.GetShipModel)
			r.Get("/game-data/items", gameDataHandler.SearchItems)

						// Admin & Integrations
						r.Group(func(r chi.Router) {
							r.Use(customMiddleware.AdminMiddleware)
							
							r.Get("/admin/users", adminHandler.ListUsers)
							r.Patch("/admin/users/me/notifications", adminHandler.UpdateMyNotificationSettings)
							r.Post("/admin/users", adminHandler.CreateUser)
							r.Patch("/admin/users/{id}", adminHandler.UpdateUser)
							r.Post("/admin/users/{id}/roles", adminHandler.AssignUserRole)
							r.Delete("/admin/users/{id}/roles/{roleId}", adminHandler.RemoveUserRole)
							r.Get("/admin/roles", adminHandler.ListRoles)
							r.Post("/admin/roles", adminHandler.CreateRole)
							r.Patch("/admin/roles/{id}", adminHandler.UpdateRole)
							r.Get("/admin/rsi-requests", adminHandler.ListRSIRequests)
							r.Post("/admin/rsi-requests/{id}/process", adminHandler.ProcessRSIRequest)
							r.Get("/admin/audit-logs", adminHandler.ListAuditLogs)
							r.Post("/admin/upload-logo", adminHandler.UploadLogo)
							r.Patch("/admin/settings", adminHandler.UpdateSetting)
							r.Get("/admin/system/version", adminHandler.GetSystemVersion)
							r.Post("/admin/system/update", adminHandler.PerformUpdate)
							r.Get("/admin/system/backup", adminHandler.CreateBackup)
							r.Post("/admin/system/restore", adminHandler.RestoreBackup)
							r.Get("/admin/system/logs", adminHandler.GetLogs)
							r.Post("/admin/system/test-email", adminHandler.TestEmail)
							r.Post("/admin/system/sync-game-data", adminHandler.SyncGameData)
							r.Post("/admin/system/sync-rsi", adminHandler.SyncRSIMembers)
							r.Get("/discord/config", adminHandler.GetDiscordConfig)
							r.Patch("/discord/config", adminHandler.UpdateDiscordConfig)
						})

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