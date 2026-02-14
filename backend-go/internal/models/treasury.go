package models

import (
	"time"
)

type OrgTreasury struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;default:'Main Treasury'" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	BalanceAUEC int       `gorm:"default:0" json:"balance_auec"`
	IsPrimary   bool      `gorm:"default:true" json:"is_primary"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TreasuryTransaction struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	TreasuryID   uint      `json:"treasury_id"`
	UserID       uint      `json:"user_id"`
	Amount       int       `json:"amount"`
	Type         string    `gorm:"size:20" json:"type"`     // deposit, withdrawal
	Category     string    `gorm:"size:50" json:"category"` // operation_payout, stockpile_purchase, etc.
	Status       string    `gorm:"size:20;default:'pending'" json:"status"`
	Description  string    `gorm:"type:text" json:"description"`
	ApprovedByID *uint     `json:"approved_by_id"`
	CreatedAt    time.Time `json:"created_at"`
	ProcessedAt  *time.Time `json:"processed_at"`

	User       User `gorm:"foreignKey:UserID" json:"user"`
	ApprovedBy User `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
}
