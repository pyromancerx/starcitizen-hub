package services

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type NotificationSettings struct {
	Announcements struct {
		Email  bool `json:"email"`
		Discord bool `json:"discord"`
		InApp  bool `json:"in_app"`
	} `json:"announcements"`
	Messages struct {
		Email  bool `json:"email"`
		Discord bool `json:"discord"`
		InApp  bool `json:"in_app"`
	} `json:"messages"`
}

type NotificationService struct {
	db             *gorm.DB
	mailService    *MailService
	discordService *DiscordService
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{
		db:             db,
		mailService:    NewMailService(db),
		discordService: NewDiscordService(db),
	}
}

func (s *NotificationService) DispatchAnnouncement(announcement *models.Announcement) {
	// 1. Send to Discord Relay (Global)
	go func() {
		if err := s.discordService.RelayAnnouncement(announcement); err != nil {
			log.Printf("Discord announcement relay failed: %v", err)
		}
	}()

	var users []models.User
	if err := s.db.Find(&users).Error; err != nil {
		log.Printf("Failed to fetch users for announcement dispatch: %v", err)
		return
	}

	for _, user := range users {
		var prefs NotificationSettings
		// Load default if empty
		if user.NotificationSettings == "" {
			prefs.Announcements.InApp = true
			prefs.Announcements.Email = true
		} else {
			json.Unmarshal([]byte(user.NotificationSettings), &prefs)
		}

		// 1. In-App Notification
		if prefs.Announcements.InApp {
			notif := models.Notification{
				UserID:    user.ID,
				Type:      "announcement",
				Title:     "New Organization Announcement",
				Message:   announcement.Title,
				Link:      "/",
				Priority:  "high",
			}
			s.db.Create(&notif)
		}

		// 2. Email Delivery
		if prefs.Announcements.Email && user.Email != "" {
			subject := fmt.Sprintf("Nova Corp Hub - %s", announcement.Title)
			body := fmt.Sprintf("<h2>%s</h2><p>%s</p><hr><p>View this transmission at the Hub interface.</p>", 
				announcement.Title, announcement.Content)
			
			go func(email string) {
				if err := s.mailService.SendEmail(email, subject, body); err != nil {
					log.Printf("Failed to send announcement email to %s: %v", email, err)
				}
			}(user.Email)
		}

		// 3. Discord (Placeholder for future Discord integration)
		if prefs.Announcements.Discord {
			// Discord logic would go here
		}
	}
}
