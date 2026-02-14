package models

import (
	"time"

	"gorm.io/gorm"
)

type OrgStockpile struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Name             string         `gorm:"size:200;index" json:"name"`
	Description      string         `gorm:"type:text" json:"description"`
	ResourceType     string         `gorm:"size:50" json:"resource_type"`
	Quantity         float64        `gorm:"default:0" json:"quantity"`
	Unit             string         `gorm:"size:50;default:'units'" json:"unit"`
	MinThreshold     float64        `json:"min_threshold"`
	CustomAttributes string         `gorm:"type:json" json:"custom_attributes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	Transactions []StockpileTransaction `gorm:"foreignKey:StockpileID" json:"transactions,omitempty"`
}

type StockpileTransaction struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	StockpileID     uint      `gorm:"index" json:"stockpile_id"`
	UserID          uint      `gorm:"index" json:"user_id"`
	QuantityChange  float64   `json:"quantity_change"`
	TransactionType string    `gorm:"size:50" json:"transaction_type"`
	Reason          string    `gorm:"type:text" json:"reason"`
	CreatedAt       time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type TradeRun struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	UserID              uint      `gorm:"index" json:"user_id"`
	ShipID              uint      `gorm:"index" json:"ship_id"`
	OriginLocation      string    `gorm:"size:200" json:"origin_location"`
	DestinationLocation string    `gorm:"size:200" json:"destination_location"`
	Commodity           string    `gorm:"size:100" json:"commodity"`
	Quantity            float64   `json:"quantity"`
	BuyPricePerUnit     float64   `json:"buy_price_per_unit"`
	SellPricePerUnit    float64   `json:"sell_price_per_unit"`
	Profit              float64   `json:"profit"`
	CompletedAt         time.Time `json:"completed_at"`
	Notes               string    `gorm:"type:text" json:"notes"`
	CreatedAt           time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
	Ship Ship `gorm:"foreignKey:ShipID" json:"-"`
}

type CargoContract struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	PosterID            uint      `gorm:"index" json:"poster_id"`
	HaulerID            *uint     `gorm:"index" json:"hauler_id"`
	OriginLocation      string    `gorm:"size:200" json:"origin_location"`
	DestinationLocation string    `gorm:"size:200" json:"destination_location"`
	Commodity           string    `gorm:"size:100" json:"commodity"`
	Quantity            float64   `json:"quantity"`
	PaymentAmount       int       `json:"payment_amount"`
	Deadline            *time.Time `json:"deadline"`
	Status              string    `gorm:"size:50;index;default:'open'" json:"status"`
	CreatedAt           time.Time `json:"created_at"`
	CompletedAt         *time.Time `json:"completed_at"`

	Poster User `gorm:"foreignKey:PosterID" json:"-"`
	Hauler User `gorm:"foreignKey:HaulerID" json:"-"`
}

type AssetLoan struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	StockpileID    uint           `gorm:"index" json:"stockpile_id"`
	UserID         uint           `gorm:"index" json:"user_id"`
	OperationID    *uint          `gorm:"index" json:"operation_id"`
	Quantity       float64        `json:"quantity"`
	Status         string         `gorm:"size:50;default:'active'" json:"status"` // active, returned, lost, damaged
	LoanedAt       time.Time      `json:"loaned_at"`
	DueAt          *time.Time     `json:"due_at"`
	ReturnedAt     *time.Time     `json:"returned_at"`
	Notes          string         `gorm:"type:text" json:"notes"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Stockpile      OrgStockpile   `gorm:"foreignKey:StockpileID" json:"stockpile"`
	User           User           `gorm:"foreignKey:UserID" json:"user"`
}
