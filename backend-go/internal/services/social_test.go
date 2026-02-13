package services

import (
	"testing"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupSocialTestDB() {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(
		&models.User{}, 
		&models.ForumCategory{}, 
		&models.ForumThread{}, 
		&models.ForumPost{},
		&models.Notification{},
		&models.Activity{},
		&models.Conversation{},
		&models.Message{},
	)
	database.DB = db
}

func TestForum(t *testing.T) {
	setupSocialTestDB()
	s := NewSocialService()

	cat := models.ForumCategory{Name: "General"}
	database.DB.Create(&cat)

	thread := models.ForumThread{
		CategoryID: cat.ID,
		AuthorID:   1,
		Title:      "Welcome",
	}
	err := s.CreateThread(&thread)
	if err != nil {
		t.Fatalf("Failed to create thread: %v", err)
	}

	post := models.ForumPost{
		ThreadID: thread.ID,
		AuthorID: 1,
		Content:  "First post!",
	}
	err = s.CreatePost(&post)
	if err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}

	// Verify
	loadedThread, _ := s.GetThread(thread.ID)
	if loadedThread.Title != "Welcome" {
		t.Errorf("Expected title Welcome, got %s", loadedThread.Title)
	}
	if len(loadedThread.Posts) != 1 {
		t.Errorf("Expected 1 post, got %d", len(loadedThread.Posts))
	}
}

func TestMessaging(t *testing.T) {
	setupSocialTestDB()
	s := NewSocialService()

	conv := models.Conversation{
		User1ID: 1,
		User2ID: 2,
	}
	database.DB.Create(&conv)

	msg := models.Message{
		ConversationID: conv.ID,
		SenderID:       1,
		Content:        "Hello there",
	}
	err := s.SendMessage(&msg)
	if err != nil {
		t.Fatalf("Failed to send message: %v", err)
	}

	// Verify conversation update
	updatedConv, _ := s.GetConversation(conv.ID, 1)
	if updatedConv.LastMessagePreview != "Hello there" {
		t.Errorf("Expected preview 'Hello there', got %s", updatedConv.LastMessagePreview)
	}
}
