package models

import (
	"time"

	"gorm.io/gorm"
)

type Ship struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	UserID             uint           `gorm:"index:idx_user_external,unique" json:"user_id"`
	ExternalID         string         `gorm:"size:100;index:idx_user_external,unique" json:"external_id"` // e.g., pledge_id
	ShipType           string         `gorm:"size:200" json:"ship_type"`
	Name               string         `gorm:"size:200" json:"name"`
	SerialNumber       string         `gorm:"size:100" json:"serial_number"`
	InsuranceStatus    string         `gorm:"size:50" json:"insurance_status"`
	InsuranceExpiresAt *time.Time     `json:"insurance_expires_at"`
	Loadout            string         `gorm:"type:json" json:"loadout"` // JSON string
	Notes              string         `gorm:"type:text" json:"notes"`
	Status             string         `gorm:"size:50;default:'ready'" json:"status"`
	CustomAttributes   string         `gorm:"type:json" json:"custom_attributes"` // JSON string
	LastSyncedAt       *time.Time     `json:"last_synced_at"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type PersonalInventory struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UserID           uint           `gorm:"index" json:"user_id"`
	ItemType         string         `gorm:"size:50" json:"item_type"` // gear, component, cargo, consumable
	ItemName         string         `gorm:"size:200" json:"item_name"`
	Quantity         int            `gorm:"default:1" json:"quantity"`
	Location         string         `gorm:"size:200" json:"location"`
	CustomAttributes string         `gorm:"type:json" json:"custom_attributes"` // JSON string
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type Wallet struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"uniqueIndex" json:"user_id"`
	BalanceAUEC   int       `gorm:"default:0" json:"balance_auec"`
	LastUpdatedAt time.Time `json:"last_updated_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type WalletTransaction struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	WalletID        uint      `gorm:"index" json:"wallet_id"`
	Amount          int       `json:"amount"`
	TransactionType string    `gorm:"size:50" json:"transaction_type"` // deposit, withdrawal, transfer_in, transfer_out, contract_escrow, etc.
	Description     string    `gorm:"type:text" json:"description"`
	CreatedAt       time.Time `json:"created_at"`

	Wallet Wallet `gorm:"foreignKey:WalletID" json:"-"`
}

type PlayerBase struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UserID           uint           `gorm:"index" json:"user_id"`
	Name             string         `gorm:"size:200" json:"name"`
	Planet           string         `gorm:"size:100" json:"planet"`
	Coordinates      string         `gorm:"size:200" json:"coordinates"` // e.g., X, Y, Z or OMT
	Capabilities     string         `gorm:"type:json" json:"capabilities"` // Mining, Refining, Defense, etc.
	Inventory        string         `gorm:"type:json" json:"inventory"`
	PrivacySettings  string         `gorm:"type:json" json:"privacy_settings"` // controls what org sees
	Status           string         `gorm:"size:50;default:'active'" json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
