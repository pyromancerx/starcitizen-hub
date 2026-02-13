package models

import (
	"time"

	"gorm.io/gorm"
)

type Ship struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	UserID             uint           `gorm:"index" json:"user_id"`
	ShipType           string         `gorm:"size:200" json:"ship_type"`
	Name               string         `gorm:"size:200" json:"name"`
	SerialNumber       string         `gorm:"size:100" json:"serial_number"`
	InsuranceStatus    string         `gorm:"size:50" json:"insurance_status"`
	InsuranceExpiresAt *time.Time     `json:"insurance_expires_at"`
	Loadout            string         `gorm:"type:json" json:"loadout"` // JSON string
	Notes              string         `gorm:"type:text" json:"notes"`
	Status             string         `gorm:"size:50;default:'ready'" json:"status"`
	CustomAttributes   string         `gorm:"type:json" json:"custom_attributes"` // JSON string
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
