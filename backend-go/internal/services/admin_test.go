package services

import (
	"testing"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAdminTestDB() {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(
		&models.User{}, 
		&models.RSIVerificationRequest{},
		&models.SystemSetting{},
		&models.DiscordIntegration{},
		&models.OrgTreasury{},
		&models.Ship{},
		&models.Operation{},
	)
	database.DB = db
}

func TestAdminUserManagement(t *testing.T) {
	setupAdminTestDB()
	s := NewAdminService()

	user := models.User{Email: "admin@test.com", IsApproved: false}
	database.DB.Create(&user)

	err := s.UpdateUserStatus(user.ID, true, true)
	if err != nil {
		t.Fatalf("Failed to update user: %v", err)
	}

	var updated models.User
	database.DB.First(&updated, user.ID)
	if !updated.IsApproved {
		t.Error("Expected user to be approved")
	}
}

func TestRSIVerification(t *testing.T) {
	setupAdminTestDB()
	s := NewAdminService()

	user := models.User{Email: "user@test.com", IsRSIVerified: false}
	database.DB.Create(&user)

	req := models.RSIVerificationRequest{
		UserID:    user.ID,
		RSIHandle: "TestPilot",
		Status:    "pending",
	}
	database.DB.Create(&req)

	err := s.ProcessRSIVerification(req.ID, 999, "approved", "Looks good")
	if err != nil {
		t.Fatalf("Failed to process RSI request: %v", err)
	}

	var updatedUser models.User
	database.DB.First(&updatedUser, user.ID)
	if !updatedUser.IsRSIVerified {
		t.Error("Expected user to be RSI verified")
	}
}
