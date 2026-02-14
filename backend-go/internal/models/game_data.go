package models

import (
	"time"

	"gorm.io/gorm"
)

type GameItem struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UUID             string         `gorm:"size:100;uniqueIndex" json:"uuid"`
	Name             string         `gorm:"size:255;index" json:"name"`
	Category         string         `gorm:"size:100;index" json:"category"` // e.g., Weapon, Shield, PowerPlant, Armor, Undersuit
	SubCategory      string         `gorm:"size:100" json:"sub_category"`    // e.g., Laser Repeater, Grade A, Medium
	Manufacturer     string         `gorm:"size:100;index" json:"manufacturer"`
	Size             int            `gorm:"default:0" json:"size"`
	Grade            string         `gorm:"size:10" json:"grade"`
	Description      string         `gorm:"type:text" json:"description"`
	BasePrice        float64        `json:"base_price"`
	Stats            string         `gorm:"type:json" json:"stats"`     // Detailed attributes (DPS, HP, Alpha, etc.)
	Locations        string         `gorm:"type:json" json:"locations"` // Where to buy (from Item Finder)
	Source           string         `gorm:"size:50" json:"source"`      // Erkul, ItemFinder, etc.
	LastSyncedAt     time.Time      `json:"last_synced_at"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type ShipModel struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UUID             string         `gorm:"size:100;uniqueIndex" json:"uuid"`
	Name             string         `gorm:"size:255;uniqueIndex" json:"name"`
	Manufacturer     string         `gorm:"size:100;index" json:"manufacturer"`
	Description      string         `gorm:"type:text" json:"description"`
	ShipClass        string         `gorm:"size:100" json:"ship_class"` // e.g., Fighter, Industrial, Capital
	Mass             float64        `json:"mass"`
	CargoCapacity    float64        `json:"cargo_capacity"`
	Hardpoints       string         `gorm:"type:json" json:"hardpoints"` // Mapping of slots to sizes/types
	BaseStats        string         `gorm:"type:json" json:"base_stats"` // Hull HP, SCM speed, etc.
	LastSyncedAt     time.Time      `json:"last_synced_at"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type ShipLoadout struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	ShipID           *uint          `gorm:"index" json:"ship_id"` // Link to a personal ship (optional for templates)
	OperationID      *uint          `gorm:"index" json:"operation_id"` // Link to a specific mission (optional)
	TemplateName     string         `gorm:"size:200" json:"template_name"` // For standard issue templates
	ShipModelID      uint           `gorm:"index" json:"ship_model_id"`
	CreatedByID      uint           `json:"created_by_id"`
	Configuration    string         `gorm:"type:json" json:"configuration"` // Map of hardpoint_uuid -> game_item_uuid
	Notes            string         `gorm:"type:text" json:"notes"`
	IsStandardIssue  bool           `gorm:"default:false" json:"is_standard_issue"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	ShipModel ShipModel `gorm:"foreignKey:ShipModelID" json:"ship_model"`
	CreatedBy User      `gorm:"foreignKey:CreatedByID" json:"created_by"`
}

type EquipmentManifest struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Name             string         `gorm:"size:200" json:"name"`
	Description      string         `gorm:"type:text" json:"description"`
	Items            string         `gorm:"type:json" json:"items"` // JSON array of {game_item_uuid, quantity}
	CreatedByID      uint           `json:"created_by_id"`
	IsStandardIssue  bool           `gorm:"default:false" json:"is_standard_issue"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	CreatedBy User `gorm:"foreignKey:CreatedByID" json:"created_by"`
}
