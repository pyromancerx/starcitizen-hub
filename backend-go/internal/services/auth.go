package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService() *AuthService {
	return &AuthService{
		db: database.DB,
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
	if err := s.db.Where("email = ?", input.Email).First(&user).Error; err != nil {
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
		IsApproved:   false,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	// Assign default roles
	var defaultRoles []models.Role
	s.db.Where("is_default = ?", true).Find(&defaultRoles)
	if len(defaultRoles) > 0 {
		s.db.Model(&user).Association("Roles").Append(defaultRoles)
	}

	return &user, nil
}

func (s *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := s.db.Preload("Roles").First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
