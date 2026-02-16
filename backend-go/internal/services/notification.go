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
	Contracts struct {
		Email  bool `json:"email"`
		Discord bool `json:"discord"`
		InApp  bool `json:"in_app"`
	} `json:"contracts"`
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

func (s *NotificationService) DispatchDirectMessage(message *models.Message) {
	var conversation models.Conversation
	if err := s.db.Preload("User1").Preload("User2").First(&conversation, message.ConversationID).Error; err != nil {
		return
	}

	recipientID := conversation.User1ID
	if message.SenderID == conversation.User1ID {
		recipientID = conversation.User2ID
	}

	var recipient models.User
	if err := s.db.First(&recipient, recipientID).Error; err != nil {
		return
	}

	var sender models.User
	s.db.First(&sender, message.SenderID)

	var prefs NotificationSettings
	if recipient.NotificationSettings == "" {
		prefs.Messages.InApp = true
	} else {
		json.Unmarshal([]byte(recipient.NotificationSettings), &prefs)
	}

	if prefs.Messages.InApp {
		s.db.Create(&models.Notification{
			UserID:    recipient.ID,
			Type:      "message",
			Title:     "New Direct Transmission",
			Message:   fmt.Sprintf("%s: %s", sender.DisplayName, message.Content),
			Link:      fmt.Sprintf("/messages?user=%d", sender.ID),
			Priority:  "normal",
			TriggeredByID: &sender.ID,
		})
	}

	if prefs.Messages.Email && recipient.Email != "" {
		subject := fmt.Sprintf("New Message from %s", sender.DisplayName)
		body := fmt.Sprintf("<p><strong>%s</strong> sent you a direct transmission:</p><blockquote>%s</blockquote>", sender.DisplayName, message.Content)
		go s.mailService.SendEmail(recipient.Email, subject, body)
	}
}

func (s *NotificationService) DispatchContractAcceptance(contract *models.CargoContract, hauler *models.User) {
	var poster models.User
	if err := s.db.First(&poster, contract.PosterID).Error; err != nil {
		return
	}

	var prefs NotificationSettings
	if poster.NotificationSettings == "" {
		prefs.Contracts.InApp = true
		prefs.Contracts.Email = true
	} else {
		json.Unmarshal([]byte(poster.NotificationSettings), &prefs)
	}

	if prefs.Contracts.InApp {
		s.db.Create(&models.Notification{
			UserID:    poster.ID,
			Type:      "contract_update",
			Title:     "Cargo Contract Accepted",
			Message:   fmt.Sprintf("%s has accepted your contract for %s.", hauler.DisplayName, contract.Commodity),
			Link:      "/trade/contracts",
			Priority:  "high",
			TriggeredByID: &hauler.ID,
		})
	}

	if prefs.Contracts.Email && poster.Email != "" {
		subject := "Your Cargo Contract has been Accepted"
		body := fmt.Sprintf("<p>Citizen <strong>%s</strong> has accepted your logistics contract for <strong>%s</strong>.</p>", hauler.DisplayName, contract.Commodity)
		go s.mailService.SendEmail(poster.Email, subject, body)
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

func (s *NotificationService) AlertAdmins(title string, message string) {
	var adminUsers []models.User
	// Join with roles to find anyone with RoleTierAdmin
	s.db.Joins("JOIN user_roles ON user_roles.user_id = users.id").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.tier = ?", models.RoleTierAdmin).
		Find(&adminUsers)

	for _, admin := range adminUsers {
		notif := models.Notification{
			UserID:    admin.ID,
			Type:      "system_alert",
			Title:     title,
			Message:   message,
			Link:      "/admin/settings",
			Priority:  "critical",
		}
		s.db.Create(&notif)

		// Also try email for critical system alerts
		if admin.Email != "" {
			go s.mailService.SendEmail(admin.Email, "CRITICAL: "+title, "<p>"+message+"</p>")
		}
	}
}
