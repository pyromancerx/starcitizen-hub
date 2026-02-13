package services

import (
	"testing"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAssetTestDB() {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&models.User{}, &models.Ship{}, &models.Wallet{}, &models.WalletTransaction{}, &models.PersonalInventory{})
	database.DB = db
}

func TestShipManagement(t *testing.T) {
	setupAssetTestDB()
	s := NewAssetService()
	userID := uint(1)

	// Test Create
	ship := models.Ship{
		UserID:   userID,
		ShipType: "Cutlass Black",
		Name:     "Shadow",
	}
	err := s.CreateShip(&ship)
	if err != nil {
		t.Fatalf("Failed to create ship: %v", err)
	}

	// Test List
	ships, err := s.ListShips(userID)
	if err != nil {
		t.Fatalf("Failed to list ships: %v", err)
	}
	if len(ships) != 1 {
		t.Errorf("Expected 1 ship, got %d", len(ships))
	}

	// Test Update
	updates := map[string]interface{}{"status": "damaged"}
	updatedShip, err := s.UpdateShip(userID, ship.ID, updates)
	if err != nil {
		t.Fatalf("Failed to update ship: %v", err)
	}
	if updatedShip.Status != "damaged" {
		t.Errorf("Expected status damaged, got %s", updatedShip.Status)
	}

	// Test Delete
	err = s.DeleteShip(userID, ship.ID)
	if err != nil {
		t.Fatalf("Failed to delete ship: %v", err)
	}
	ships, _ = s.ListShips(userID)
	if len(ships) != 0 {
		t.Errorf("Expected 0 ships, got %d", len(ships))
	}
}

func TestWalletManagement(t *testing.T) {
	setupAssetTestDB()
	s := NewAssetService()
	userID := uint(1)

	// Test Get (should auto-create)
	wallet, err := s.GetWallet(userID)
	if err != nil {
		t.Fatalf("Failed to get wallet: %v", err)
	}
	if wallet.UserID != userID {
		t.Errorf("Expected user ID %d, got %d", userID, wallet.UserID)
	}
	if wallet.BalanceAUEC != 0 {
		t.Errorf("Expected balance 0, got %d", wallet.BalanceAUEC)
	}
}
