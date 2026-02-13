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

	// Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/login", handlers.Login)
		r.Post("/auth/register", handlers.Register)

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(customMiddleware.AuthMiddleware)
			r.Get("/auth/me", handlers.Me)

			// Ships
			r.Get("/ships/", handlers.ListMyShips)
			r.Post("/ships/", handlers.CreateShip)
			r.Patch("/ships/{id}", handlers.UpdateShip)
			r.Delete("/ships/{id}", handlers.DeleteShip)
			r.Post("/ships/import-hangarxplorer", handlers.ImportHangarXPLORER)

			// Wallet
			r.Get("/wallet/", handlers.GetMyWallet)
			r.Get("/wallet/transactions", handlers.GetWalletTransactions)

			// Inventory
			r.Get("/inventory/", handlers.ListMyInventory)
			r.Post("/inventory/", handlers.AddInventoryItem)
			r.Patch("/inventory/{id}", handlers.UpdateInventoryItem)
			r.Delete("/inventory/{id}", handlers.DeleteInventoryItem)

			// Logistics
			r.Get("/stockpiles/", handlers.ListStockpiles)
			r.Post("/trade/runs", handlers.CreateTradeRun)
			r.Get("/operations/", handlers.ListOperations)
			r.Get("/projects/", handlers.ListProjects)

			// Social
			r.Get("/forum/categories", handlers.ListForumCategories)
			r.Get("/notifications/", handlers.GetNotifications)
			r.Get("/activity/feed", handlers.GetActivityFeed)

			// Stats
			r.Get("/stats/dashboard", handlers.GetDashboardStats)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Starting Go backend on port %s", port)
	http.ListenAndServe(":"+port, r)
}