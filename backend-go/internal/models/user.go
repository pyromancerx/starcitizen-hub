package models

import (
	"time"

	"gorm.io/gorm"
)

type RoleTier string



const (

	RoleTierRecruit RoleTier = "recruit"

	RoleTierMember  RoleTier = "member"

	RoleTierOfficer RoleTier = "officer"

	RoleTierAdmin   RoleTier = "admin"

	RoleTierCustom  RoleTier = "custom"

)



type User struct {

	ID               uint           `gorm:"primaryKey" json:"id"`

	Email            string         `gorm:"uniqueIndex;size:255" json:"email"`

	PasswordHash     string         `json:"-"`

	RSIHandle        string         `gorm:"uniqueIndex;size:100" json:"rsi_handle"`

	IsRSIVerified    bool           `gorm:"default:false" json:"is_rsi_verified"`

	DisplayName      string         `gorm:"size:100" json:"display_name"`

	AvatarURL        string         `gorm:"size:500" json:"avatar_url"`

	IsActive         bool           `gorm:"default:true" json:"is_active"`

	IsApproved       bool           `gorm:"default:false" json:"is_approved"`

	LastSeenAt       *time.Time     `json:"last_seen_at"`

	CreatedAt        time.Time      `json:"created_at"`

	UpdatedAt        time.Time      `json:"updated_at"`

	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

		CustomAttributes string         `gorm:"type:json" json:"custom_attributes"`

		NotificationSettings string     `gorm:"type:json" json:"notification_settings"`

	

		// Relationships

	

	Roles []Role `gorm:"many2many:user_roles;constraint:OnDelete:CASCADE;" json:"roles"`

}



type Role struct {



	ID          uint     `gorm:"primaryKey" json:"id"`



	Name        string   `gorm:"unique;size:100" json:"name"`



	Tier        RoleTier `gorm:"size:20;default:'custom'" json:"tier"`



	Permissions string   `gorm:"type:json" json:"permissions"` // Stored as JSON array



	IsDefault   bool     `gorm:"default:false" json:"is_default"`



	SortOrder   int      `gorm:"default:0" json:"sort_order"`



}



type UserRole struct {

	ID        uint       `gorm:"primaryKey" json:"id"`

	UserID    uint       `gorm:"index" json:"user_id"`

	RoleID    uint       `gorm:"index" json:"role_id"`

	GrantedBy *uint      `json:"granted_by"`

	GrantedAt time.Time  `gorm:"autoCreateTime" json:"granted_at"`



	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`

	Role Role `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE;" json:"-"`

}
