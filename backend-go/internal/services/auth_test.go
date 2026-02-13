package services

import (
	"testing"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&models.User{}, &models.Role{}, &models.UserRole{})
	database.DB = db
}

func TestRegisterAndLogin(t *testing.T) {
	setupTestDB()
	s := NewAuthService()

	// Test Register
	input := RegisterInput{
		Email:       "test@example.com",
		Password:    "password123",
		DisplayName: "Test User",
		RSIHandle:   "TestHandle",
	}
	user, err := s.Register(input)
	if err != nil {
		t.Fatalf("Failed to register: %v", err)
	}
	if user.Email != input.Email {
		t.Errorf("Expected email %s, got %s", input.Email, user.Email)
	}

	// Test Login
	token, loggedInUser, err := s.Login(LoginInput{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		t.Fatalf("Failed to login: %v", err)
	}
	if token == "" {
		t.Error("Expected token, got empty string")
	}
	if loggedInUser.ID != user.ID {
		t.Errorf("Expected user ID %d, got %d", user.ID, loggedInUser.ID)
	}

	// Test Login with wrong password
	_, _, err = s.Login(LoginInput{
		Email:    input.Email,
		Password: "wrongpassword",
	})
	if err == nil {
		t.Error("Expected error for wrong password, got nil")
	}
}
