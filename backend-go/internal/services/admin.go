package services

import (
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/utils"
	"gorm.io/gorm"
)

type AdminService struct {
	DB *gorm.DB
}

func NewAdminService() *AdminService {
	return &AdminService{
		DB: database.DB,
	}
}

// User Management
func (s *AdminService) ListUsers() ([]models.User, error) {
	var users []models.User
	err := s.DB.Preload("Roles").Find(&users).Error
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

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	if isAdmin {
		var adminRole models.Role
		if err := s.DB.Where("name = ?", "Admin").First(&adminRole).Error; err == nil {
			s.DB.Model(&user).Association("Roles").Append(&adminRole)
		}
	}

	return &user, nil
}

func (s *AdminService) UpdateUserStatus(userID uint, isActive bool, isApproved bool) error {
	return s.DB.Model(&models.User{}).Where("id = ?", userID).
		Updates(map[string]interface{}{
			"is_active":   isActive,
			"is_approved": isApproved,
		}).Error
}

// Role Management
func (s *AdminService) ListRoles() ([]models.Role, error) {
	var roles []models.Role
	err := s.DB.Order("sort_order asc").Find(&roles).Error
	return roles, err
}

func (s *AdminService) CreateRole(role *models.Role) error {
	return s.DB.Create(role).Error
}

func (s *AdminService) UpdateRole(id uint, updates map[string]interface{}) error {
	return s.DB.Model(&models.Role{}).Where("id = ?", id).Updates(updates).Error
}

func (s *AdminService) AssignRoleToUser(userID uint, roleID uint) error {
	var user models.User
	var role models.Role
	if err := s.DB.First(&user, userID).Error; err != nil {
		return err
	}
	if err := s.DB.First(&role, roleID).Error; err != nil {
		return err
	}
	return s.DB.Model(&user).Association("Roles").Append(&role)
}

func (s *AdminService) RemoveRoleFromUser(userID uint, roleID uint) error {
	var user models.User
	var role models.Role
	if err := s.DB.First(&user, userID).Error; err != nil {
		return err
	}
	if err := s.DB.First(&role, roleID).Error; err != nil {
		return err
	}
	return s.DB.Model(&user).Association("Roles").Delete(&role)
}

// RSI Verification
func (s *AdminService) ListRSIVerificationRequests(status string) ([]models.RSIVerificationRequest, error) {
	var requests []models.RSIVerificationRequest
	query := s.DB.Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&requests).Error
	return requests, err
}

func (s *AdminService) ProcessRSIVerification(requestID uint, adminID uint, status string, notes string) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
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
	err := s.DB.First(&integration).Error
	return &integration, err
}

func (s *AdminService) UpdateDiscordIntegration(integration *models.DiscordIntegration) error {
	return s.DB.Save(integration).Error
}

// Settings
func (s *AdminService) GetSettings() ([]models.SystemSetting, error) {
	var settings []models.SystemSetting
	err := s.DB.Find(&settings).Error
	return settings, err
}

func (s *AdminService) UpdateSetting(key string, value string) error {
	var setting models.SystemSetting
	err := s.DB.Where("key = ?", key).First(&setting).Error
	if err != nil {
		// Create if not exists
		setting = models.SystemSetting{Key: key, Value: value}
		return s.DB.Create(&setting).Error
	}
	// Update if exists
	return s.DB.Model(&setting).Update("value", value).Error
}

// Stats (extended)
func (s *AdminService) GetDashboardStats() (map[string]interface{}, error) {
	var totalUsers int64
	s.DB.Model(&models.User{}).Count(&totalUsers)

	var totalShips int64
	s.DB.Model(&models.Ship{}).Count(&totalShips)

	var readyShips int64
	s.DB.Model(&models.Ship{}).Where("status = ?", "ready").Count(&readyShips)

	fleetReadiness := 0
	if totalShips > 0 {
		fleetReadiness = int((float64(readyShips) / float64(totalShips)) * 100)
	}

	var activeOps int64
	s.DB.Model(&models.Operation{}).Where("status IN ?", []string{"recruiting", "planning", "active"}).Count(&activeOps)

	var treasury models.OrgTreasury
	var balance int = 0
	if err := s.DB.First(&treasury).Error; err == nil {
		balance = treasury.BalanceAUEC
	}

	return map[string]interface{}{
		"total_users":          totalUsers,
		"total_ships":          totalShips,
		"active_operations":    activeOps,
		"org_treasury_balance": balance,
		"fleet_readiness":      fleetReadiness,
	}, nil
}
