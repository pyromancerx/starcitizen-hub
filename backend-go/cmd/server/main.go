package main

import (
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
)

func main() {
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