package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type DiscordService struct {
	db *gorm.DB
}

func NewDiscordService(db *gorm.DB) *DiscordService {
	return &DiscordService{db: db}
}

type DiscordWebhookPayload struct {
	Content string `json:"content,omitempty"`
	Embeds  []DiscordEmbed `json:"embeds,omitempty"`
}

type DiscordEmbed struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Color       int    `json:"color,omitempty"`
	URL         string `json:"url,omitempty"`
}

func (s *DiscordService) SendWebhookMessage(payload DiscordWebhookPayload) error {
	var integration models.DiscordIntegration
	if err := s.db.Where("webhook_enabled = ?", true).First(&integration).Error; err != nil {
		return fmt.Errorf("discord webhook not configured or enabled")
	}

	if integration.WebhookURL == "" {
		return fmt.Errorf("discord webhook URL is empty")
	}

	body, _ := json.Marshal(payload)
	resp, err := http.Post(integration.WebhookURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("discord returned error status: %d", resp.StatusCode)
	}

	return nil
}

func (s *DiscordService) RelayAnnouncement(announcement *models.Announcement) error {
	payload := DiscordWebhookPayload{
		Embeds: []DiscordEmbed{
			{
				Title:       "📢 Hub Announcement: " + announcement.Title,
				Description: announcement.Content,
				Color:       0x66fcf1, // Hub Blue
			},
		},
	}
	return s.SendWebhookMessage(payload)
}

func (s *DiscordService) RelayOperation(op *models.Operation) error {
	payload := DiscordWebhookPayload{
		Embeds: []DiscordEmbed{
			{
				Title:       "🚀 New Operation Authorized: " + op.Title,
				Description: fmt.Sprintf("**Type:** %s\n**Deployment:** %s\n\n%s", op.Type, op.ScheduledAt.Format("2006-01-02 15:04 MST"), op.Description),
				Color:       0xffae00, // Tactical Orange
			},
		},
	}
	return s.SendWebhookMessage(payload)
}
