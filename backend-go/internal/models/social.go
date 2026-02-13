package models

import (
	"time"
)

type Notification struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"index" json:"user_id"`
	Type          string    `gorm:"size:50;index" json:"type"`
	Title         string    `gorm:"size:200" json:"title"`
	Message       string    `gorm:"type:text" json:"message"`
	Link          string    `gorm:"size:500" json:"link"`
	Data          string    `gorm:"type:json" json:"data"`
	Priority      string    `gorm:"size:20;default:'normal'" json:"priority"`
	IsRead        bool      `gorm:"default:false;index" json:"is_read"`
	ReadAt        *time.Time `json:"read_at"`
	TriggeredByID *uint     `json:"triggered_by_id"`
	CreatedAt     time.Time `gorm:"index" json:"created_at"`

	User        User `gorm:"foreignKey:UserID" json:"-"`
	TriggeredBy User `gorm:"foreignKey:TriggeredByID" json:"triggered_by,omitempty"`
}

type Activity struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Type        string    `gorm:"size:50;index" json:"type"`
	UserID      *uint     `gorm:"index" json:"user_id"`
	Content     string    `gorm:"type:json" json:"content"`
	RelatedID   *uint     `json:"related_id"`
	RelatedType string    `gorm:"size:50" json:"related_type"`
	CreatedAt   time.Time `gorm:"index" json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type Achievement struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"size:100;uniqueIndex" json:"name"`
	Description     string    `gorm:"type:text" json:"description"`
	Icon            string    `gorm:"size:50" json:"icon"`
	Rarity          string    `gorm:"size:20;default:'common'" json:"rarity"`
	AchievementType string    `gorm:"size:20;default:'custom'" json:"achievement_type"`
	Criteria        string    `gorm:"type:json" json:"criteria"`
	Points          int       `gorm:"default:10" json:"points"`
	CreatedByID     *uint     `json:"created_by_id"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserAchievement struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"index" json:"user_id"`
	AchievementID uint      `gorm:"index" json:"achievement_id"`
	AwardedByID   *uint     `json:"awarded_by_id"`
	AwardNote     string    `gorm:"type:text" json:"award_note"`
	AwardedAt     time.Time `json:"awarded_at"`

	User        User        `gorm:"foreignKey:UserID" json:"-"`
	Achievement Achievement `gorm:"foreignKey:AchievementID" json:"achievement"`
}

type Announcement struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:200" json:"title"`
	Content     string    `gorm:"type:text" json:"content"`
	AuthorID    uint      `json:"author_id"`
	IsPublic    bool      `gorm:"default:true" json:"is_public"`
	IsPinned    bool      `gorm:"default:false" json:"is_pinned"`
	Category    string    `gorm:"size:50" json:"category"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Author User `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
}
