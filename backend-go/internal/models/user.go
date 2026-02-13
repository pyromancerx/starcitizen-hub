package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Email            string         `gorm:"uniqueIndex;size:255" json:"email"`
	PasswordHash     string         `json:"-"` // Never return password hash
	RSIHandle        string         `gorm:"uniqueIndex;size:100" json:"rsi_handle"`
	DisplayName      string         `gorm:"size:100" json:"display_name"`
	IsActive         bool           `gorm:"default:true" json:"is_active"`
	IsApproved       bool           `gorm:"default:false" json:"is_approved"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Relationships
	Roles []Role `gorm:"many2many:user_roles;" json:"roles"`
}

type Role struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"uniqueIndex;size:100" json:"name"`
	Tier        string `gorm:"size:20" json:"tier"` // recruit, member, officer, admin
	Permissions string `json:"permissions"`         // JSON string of permissions
	IsDefault   bool   `gorm:"default:false" json:"is_default"`
	SortOrder   int    `gorm:"default:0" json:"sort_order"`
}

// UserRole join table is handled automatically by GORM via many2many, 
// but defining it allows for extra fields if needed later.
type UserRole struct {
	UserID uint `gorm:"primaryKey"`
	RoleID uint `gorm:"primaryKey"`
}
