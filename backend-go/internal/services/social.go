package services

import (
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type SocialService struct {
	db *gorm.DB
}

func NewSocialService() *SocialService {
	return &SocialService{
		db: database.DB,
	}
}

// Forum
func (s *SocialService) ListForumCategories() ([]models.ForumCategory, error) {
	var categories []models.ForumCategory
	err := s.db.Order("sort_order asc").Find(&categories).Error
	return categories, err
}

func (s *SocialService) GetForumCategory(id uint) (*models.ForumCategory, error) {
	var category models.ForumCategory
	err := s.db.Preload("Threads.Author").First(&category, id).Error
	return &category, err
}

func (s *SocialService) GetThread(id uint) (*models.ForumThread, error) {
	var thread models.ForumThread
	err := s.db.Preload("Author").Preload("Posts.Author").First(&thread, id).Error
	return &thread, err
}

func (s *SocialService) CreateThread(thread *models.ForumThread) error {
	return s.db.Create(thread).Error
}

func (s *SocialService) CreatePost(post *models.ForumPost) error {
	return s.db.Create(post).Error
}

// Notifications
func (s *SocialService) GetUserNotifications(userID uint, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	err := s.db.Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Find(&notifications).Error
	return notifications, err
}

func (s *SocialService) MarkNotificationRead(userID uint, notificationID uint) error {
	return s.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

// Activity
func (s *SocialService) GetActivityFeed(limit int) ([]models.Activity, error) {
	var activities []models.Activity
	err := s.db.Preload("User").Order("created_at desc").Limit(limit).Find(&activities).Error
	return activities, err
}

// Messaging
func (s *SocialService) ListConversations(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := s.db.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").Preload("User2").
		Order("last_message_at desc").Find(&conversations).Error
	return conversations, err
}

func (s *SocialService) GetConversation(id uint, userID uint) (*models.Conversation, error) {
	var conversation models.Conversation
	err := s.db.Where("id = ? AND (user1_id = ? OR user2_id = ?)", id, userID, userID).
		Preload("User1").Preload("User2").Preload("Messages.Sender").
		First(&conversation).Error
	return &conversation, err
}

func (s *SocialService) SendMessage(msg *models.Message) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
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
	err := s.db.Preload("Author").Order("is_pinned desc, created_at desc").Find(&announcements).Error
	return announcements, err
}

func (s *SocialService) CreateAnnouncement(announcement *models.Announcement) error {
	return s.db.Create(announcement).Error
}

func (s *SocialService) DeleteAnnouncement(id uint) error {
	return s.db.Delete(&models.Announcement{}, id).Error
}
