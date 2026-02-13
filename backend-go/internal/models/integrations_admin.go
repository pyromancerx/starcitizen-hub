package models

import (
	"time"
)

type DiscordIntegration struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	GuildID           string    `gorm:"size:30;uniqueIndex" json:"guild_id"`
	GuildName         string    `gorm:"size:100" json:"guild_name"`
	BotToken          string    `gorm:"size:100" json:"bot_token"`
	BotClientID       string    `gorm:"size:30" json:"bot_client_id"`
	BotClientSecret   string    `gorm:"size:100" json:"bot_client_secret"`
	OAuthEnabled      bool      `gorm:"default:false" json:"oauth_enabled"`
	OAuthClientID     string    `gorm:"size:30" json:"oauth_client_id"`
	OAuthClientSecret string    `gorm:"size:100" json:"oauth_client_secret"`
	WebhookURL        string    `gorm:"size:500" json:"webhook_url"`
	WebhookEnabled    bool      `gorm:"default:false" json:"webhook_enabled"`
	AutoPostSettings  string    `gorm:"type:json" json:"auto_post_settings"`
	RoleSyncEnabled   bool      `gorm:"default:false" json:"role_sync_enabled"`
	IsActive          bool      `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type DiscordWebhook struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"size:100" json:"name"`
	WebhookURL      string    `gorm:"size:500" json:"webhook_url"`
	EventTypes      string    `gorm:"type:json" json:"event_types"`
	MessageTemplate string    `gorm:"type:text" json:"message_template"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserDiscordLink struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	UserID              uint      `gorm:"uniqueIndex" json:"user_id"`
	DiscordID           string    `gorm:"size:30;index" json:"discord_id"`
	DiscordUsername     string    `gorm:"size:100" json:"discord_username"`
	DiscordDiscriminator string    `gorm:"size:10" json:"discord_discriminator"`
	DiscordAvatar       string    `gorm:"size:200" json:"discord_avatar"`
	AccessToken         string    `gorm:"type:text" json:"access_token"`
	RefreshToken        string    `gorm:"type:text" json:"refresh_token"`
	TokenExpiresAt      *time.Time `json:"token_expires_at"`
	GuildJoined         bool      `gorm:"default:false" json:"guild_joined"`
	GuildJoinedAt       *time.Time `json:"guild_joined_at"`
	IsActive            bool      `gorm:"default:true" json:"is_active"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type DiscordRoleMapping struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	DiscordRoleID string    `gorm:"size:30;uniqueIndex" json:"discord_role_id"`
	DiscordRoleName string  `gorm:"size:100" json:"discord_role_name"`
	HubRoleID     uint      `json:"hub_role_id"`
	Priority      int       `gorm:"default:0" json:"priority"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	HubRole Role `gorm:"foreignKey:HubRoleID" json:"-"`
}

type RSIVerificationRequest struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	UserID           uint       `json:"user_id"`
	RSIHandle        string     `gorm:"size:100" json:"rsi_handle"`
	ScreenshotURL    string     `gorm:"size:500" json:"screenshot_url"`
	VerificationCode string     `gorm:"size:50" json:"verification_code"`
	Status           string     `gorm:"size:20;default:'pending'" json:"status"`
	AdminNotes       string     `gorm:"type:text" json:"admin_notes"`
	SubmittedAt      time.Time  `json:"submitted_at"`
	ReviewedAt       *time.Time `json:"reviewed_at"`
	ReviewedByID     *uint      `json:"reviewed_by_id"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

type SystemSetting struct {
	Key         string    `gorm:"primaryKey;size:100" json:"key"`
	Value       string    `gorm:"type:text" json:"value"`
	Description string    `gorm:"size:255" json:"description"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     *uint     `gorm:"index" json:"user_id"`
	Action     string    `gorm:"size:100;index" json:"action"`
	TargetType string    `gorm:"size:50" json:"target_type"`
	TargetID   *uint     `json:"target_id"`
	Details    string    `gorm:"type:json" json:"details"`
	IPAddress  string    `gorm:"size:45" json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
