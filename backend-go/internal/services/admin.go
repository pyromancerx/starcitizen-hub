package services

import (
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/utils"
	"gorm.io/gorm"
)

type AdminService struct {
	db *gorm.DB
}

func NewAdminService() *AdminService {
	return &AdminService{
		db: database.DB,
	}
}

// User Management
func (s *AdminService) ListUsers() ([]models.User, error) {
	var users []models.User
	err := s.db.Preload("Roles").Find(&users).Error
	return users, err
}

func (s *AdminService) CreateUser(email string, password string, displayName string, rsiHandle string, isAdmin bool) (*models.User, error) {
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Email:        email,
		PasswordHash: hashedPassword,
		DisplayName:  displayName,
		RSIHandle:    rsiHandle,
		IsActive:     true,
		IsApproved:   true,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	if isAdmin {
		var adminRole models.Role
		if err := s.db.Where("name = ?", "Admin").First(&adminRole).Error; err == nil {
			s.db.Model(&user).Association("Roles").Append(&adminRole)
		}
	}

	return &user, nil
}

func (s *AdminService) UpdateUserStatus(userID uint, isActive bool, isApproved bool) error {
	return s.db.Model(&models.User{}).Where("id = ?", userID).
		Updates(map[string]interface{}{
			"is_active":   isActive,
			"is_approved": isApproved,
		}).Error
}

// RSI Verification
func (s *AdminService) ListRSIVerificationRequests(status string) ([]models.RSIVerificationRequest, error) {
	var requests []models.RSIVerificationRequest
	query := s.db.Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&requests).Error
	return requests, err
}

func (s *AdminService) ProcessRSIVerification(requestID uint, adminID uint, status string, notes string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var req models.RSIVerificationRequest
		if err := tx.First(&req, requestID).Error; err != nil {
			return err
		}

		now := gorm.Expr("CURRENT_TIMESTAMP")
		if err := tx.Model(&req).Updates(map[string]interface{}{
			"status":         status,
			"admin_notes":    notes,
			"reviewed_by_id": adminID,
			"reviewed_at":    now,
		}).Error; err != nil {
			return err
		}

		if status == "approved" {
			return tx.Model(&models.User{}).Where("id = ?", req.UserID).
				Update("is_rsi_verified", true).Error
		}
		return nil
	})
}

// Discord
func (s *AdminService) GetDiscordIntegration() (*models.DiscordIntegration, error) {
	var integration models.DiscordIntegration
	err := s.db.First(&integration).Error
	return &integration, err
}

func (s *AdminService) UpdateDiscordIntegration(integration *models.DiscordIntegration) error {
	return s.db.Save(integration).Error
}

// Settings
func (s *AdminService) GetSettings() ([]models.SystemSetting, error) {
	var settings []models.SystemSetting
	err := s.db.Find(&settings).Error
	return settings, err
}

func (s *AdminService) UpdateSetting(key string, value string) error {
	return s.db.Model(&models.SystemSetting{}).Where("key = ?", key).
		Update("value", value).Error
}

// Stats (extended)
func (s *AdminService) GetDashboardStats() (map[string]interface{}, error) {
	var totalUsers int64
	s.db.Model(&models.User{}).Count(&totalUsers)

	var totalShips int64
	s.db.Model(&models.Ship{}).Count(&totalShips)

	var activeOps int64
	s.db.Model(&models.Operation{}).Where("status IN ?", []string{"recruiting", "planning", "active"}).Count(&activeOps)

	var treasury models.OrgTreasury
	s.db.Where("is_primary = ?", true).First(&treasury)

	return map[string]interface{}{
		"total_users":          totalUsers,
		"total_ships":          totalShips,
		"active_operations":    activeOps,
		"org_treasury_balance": treasury.Balance,
	}, nil
}
