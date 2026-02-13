package services

import (
	"testing"
	"time"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupLogisticsTestDB() {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&models.User{}, &models.OrgStockpile{}, &models.StockpileTransaction{}, &models.Operation{}, &models.OperationParticipant{})
	database.DB = db
}

func TestStockpileManagement(t *testing.T) {
	setupLogisticsTestDB()
	s := NewLogisticsService()

	// Create a stockpile
	stockpile := models.OrgStockpile{
		Name:         "Fuel Reserve",
		ResourceType: "Hydrogen",
		Quantity:     1000,
	}
	database.DB.Create(&stockpile)

	// Add transaction
	tx := models.StockpileTransaction{
		StockpileID:    stockpile.ID,
		UserID:         1,
		QuantityChange: 500,
		TransactionType: "deposit",
	}
	err := s.CreateStockpileTransaction(&tx)
	if err != nil {
		t.Fatalf("Failed to create transaction: %v", err)
	}

	// Verify quantity
	updated, _ := s.GetStockpile(stockpile.ID)
	if updated.Quantity != 1500 {
		t.Errorf("Expected quantity 1500, got %f", updated.Quantity)
	}
}

func TestOperationSignup(t *testing.T) {
	setupLogisticsTestDB()
	s := NewLogisticsService()

	op := models.Operation{
		Title:       "XenoThreat Defense",
		ScheduledAt: time.Now().Add(24 * time.Hour),
	}
	database.DB.Create(&op)

	participant := models.OperationParticipant{
		OperationID: op.ID,
		UserID:      1,
	}
	err := s.SignupForOperation(&participant)
	if err != nil {
		t.Fatalf("Failed to signup: %v", err)
	}

	// Test double signup
	err = s.SignupForOperation(&participant)
	if err == nil {
		t.Error("Expected error for double signup, got nil")
	}
}
