package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	DB *gorm.DB
}

func NewAuthService() *AuthService {
	return &AuthService{
		DB: database.DB,
	}
}

type LoginInput struct {
	Email    string
	Password string
}

type RegisterInput struct {
	Email       string
	Password    string
	DisplayName string
	RSIHandle   string
}

func (s *AuthService) Login(input LoginInput) (string, *models.User, error) {
	var user models.User
	if err := s.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	if !utils.CheckPasswordHash(input.Password, user.PasswordHash) {
		return "", nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		return "", nil, err
	}

	return token, &user, nil
}

func (s *AuthService) Register(input RegisterInput) (*models.User, error) {
	// 1. Check if public signup is allowed
	var allowSignup models.SystemSetting
	s.DB.Where("key = ?", "allow_public_signup").First(&allowSignup)
	if allowSignup.Value == "false" {
		return nil, errors.New("public registration is currently disabled by command")
	}

	// 2. Check if admin approval is required
	var requireApproval models.SystemSetting
	s.DB.Where("key = ?", "require_admin_approval").First(&requireApproval)
	isApproved := requireApproval.Value == "false"

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Email:        input.Email,
		PasswordHash: hashedPassword,
		DisplayName:  input.DisplayName,
		RSIHandle:    input.RSIHandle,
		IsActive:     true,
		IsApproved:   isApproved,
	}

	// 3. Check for RSI auto-verification
	var knownMember models.KnownRSIMember
	if err := s.DB.Where("rsi_handle = ?", input.RSIHandle).First(&knownMember).Error; err == nil {
		user.IsRSIVerified = true
		// If they are a known RSI member of the org, maybe auto-approve them too?
		user.IsApproved = true
	}

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	// Assign default roles
	var defaultRoles []models.Role
	s.DB.Where("is_default = ?", true).Find(&defaultRoles)
	if len(defaultRoles) > 0 {
		s.DB.Model(&user).Association("Roles").Append(defaultRoles)
	}

	return &user, nil
}

func (s *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := s.DB.Preload("Roles").First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
