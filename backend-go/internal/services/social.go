package services

import (
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type SocialService struct {
	DB *gorm.DB
	notificationService *NotificationService
}

func NewSocialService() *SocialService {
	return &SocialService{
		DB: database.DB,
		notificationService: NewNotificationService(database.DB),
	}
}

// Forum
func (s *SocialService) ListForumCategories() ([]models.ForumCategory, error) {
	var categories []models.ForumCategory
	err := s.DB.Order("sort_order asc").Find(&categories).Error
	return categories, err
}

func (s *SocialService) CreateForumCategory(cat *models.ForumCategory) error {
	return s.DB.Create(cat).Error
}

func (s *SocialService) GetForumCategory(id uint) (*models.ForumCategory, error) {
	var category models.ForumCategory
	err := s.DB.Preload("Threads.Author").First(&category, id).Error
	return &category, err
}

func (s *SocialService) GetThread(id uint) (*models.ForumThread, error) {
	var thread models.ForumThread
	err := s.DB.Preload("Author").Preload("Posts.Author").First(&thread, id).Error
	return &thread, err
}

func (s *SocialService) CreateThread(thread *models.ForumThread) error {
	return s.DB.Create(thread).Error
}

func (s *SocialService) CreatePost(post *models.ForumPost) error {
	return s.DB.Create(post).Error
}

// Notifications
func (s *SocialService) GetUserNotifications(userID uint, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	err := s.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Find(&notifications).Error
	return notifications, err
}

func (s *SocialService) MarkNotificationRead(userID uint, notificationID uint) error {
	return s.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

// Activity
func (s *SocialService) GetActivityFeed(limit int) ([]models.Activity, error) {
	var activities []models.Activity
	err := s.DB.Preload("User").Order("created_at desc").Limit(limit).Find(&activities).Error
	return activities, err
}

// Messaging
func (s *SocialService) ListConversations(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := s.DB.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").Preload("User2").
		Order("last_message_at desc").Find(&conversations).Error
	return conversations, err
}

func (s *SocialService) GetConversation(id uint, userID uint) (*models.Conversation, error) {
	var conversation models.Conversation
	err := s.DB.Where("id = ? AND (user1_id = ? OR user2_id = ?)", id, userID, userID).
		Preload("User1").Preload("User2").Preload("Messages.Sender").
		First(&conversation).Error
	return &conversation, err
}

func (s *SocialService) SendMessage(msg *models.Message) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(msg).Error; err != nil {
			return err
		}

		// Update conversation last message preview
		return tx.Model(&models.Conversation{}).Where("id = ?", msg.ConversationID).
			Updates(map[string]interface{}{
				"last_message_at":      msg.CreatedAt,
				"last_message_preview": msg.Content, // Should truncate
				"last_message_sender_id": msg.SenderID,
			}).Error
	})
}

// Announcements
func (s *SocialService) ListAnnouncements() ([]models.Announcement, error) {
	var announcements []models.Announcement
	err := s.DB.Preload("Author").Order("is_pinned desc, created_at desc").Find(&announcements).Error
	return announcements, err
}

func (s *SocialService) CreateAnnouncement(announcement *models.Announcement) error {
	if err := s.DB.Create(announcement).Error; err != nil {
		return err
	}
	
	// Trigger dispatch in background
	go s.notificationService.DispatchAnnouncement(announcement)
	return nil
}

func (s *SocialService) DeleteAnnouncement(id uint) error {
	return s.DB.Delete(&models.Announcement{}, id).Error
}

func (s *SocialService) ListAchievements() ([]models.Achievement, error) {
	var achievements []models.Achievement
	err := s.DB.Where("is_active = ?", true).Order("points desc").Find(&achievements).Error
	return achievements, err
}

type SearchResult struct {
	Type  string      `json:"type"`
	ID    uint        `json:"id"`
	Title string      `json:"title"`
	Sub   string      `json:"sub"`
	Link  string      `json:"link"`
	Tab   string      `json:"tab,omitempty"`
}

func (s *SocialService) UnifiedSearch(query string) ([]SearchResult, error) {
	var results []SearchResult
	searchTerm := "%" + query + "%"

	// 1. Search Users
	var users []models.User
	s.DB.Where("display_name LIKE ? OR rsi_handle LIKE ?", searchTerm, searchTerm).Limit(5).Find(&users)
	for _, u := range users {
		results = append(results, SearchResult{
			Type: "Citizen", ID: u.ID, Title: u.DisplayName, Sub: u.RSIHandle, Link: "/members",
		})
	}

	// 2. Search Ships
	var ships []models.Ship
	s.DB.Where("name LIKE ? OR ship_type LIKE ?", searchTerm, searchTerm).Limit(5).Find(&ships)
	for _, ship := range ships {
		results = append(results, SearchResult{
			Type: "Vessel", ID: ship.ID, Title: ship.Name, Sub: ship.ShipType, Link: "/fleet",
		})
	}

	// 3. Search Operations
	var ops []models.Operation
	s.DB.Where("title LIKE ?", searchTerm).Limit(5).Find(&ops)
	for _, op := range ops {
		results = append(results, SearchResult{
			Type: "Operation", ID: op.ID, Title: op.Title, Sub: op.Status, Link: "/operations",
		})
	}

	// 4. Search Ship Models
	var shipModels []models.ShipModel
	s.DB.Where("name LIKE ? OR manufacturer LIKE ?", searchTerm, searchTerm).Limit(5).Find(&shipModels)
	for _, sm := range shipModels {
		results = append(results, SearchResult{
			Type: "Ship Model", ID: sm.ID, Title: sm.Name, Sub: sm.Manufacturer, Link: "/fleet",
		})
	}

	// 5. Search Game Items
	var items []models.GameItem
	s.DB.Where("name LIKE ? OR manufacturer LIKE ?", searchTerm, searchTerm).Limit(5).Find(&items)
	for _, item := range items {
		results = append(results, SearchResult{
			Type: "Item", ID: item.ID, Title: item.Name, Sub: item.Category + " (" + item.Manufacturer + ")", Link: "/inventory", Tab: "database",
		})
	}

	return results, nil
}
