package models

import (
	"time"

	"gorm.io/gorm"
)

type ForumCategory struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;uniqueIndex" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	IsPrivate   bool           `gorm:"default:false" json:"is_private"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Threads []ForumThread `gorm:"foreignKey:CategoryID" json:"threads,omitempty"`
}

type ForumThread struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CategoryID uint           `gorm:"index" json:"category_id"`
	AuthorID   uint           `gorm:"index" json:"author_id"`
	Title      string         `gorm:"size:200" json:"title"`
	IsPinned   bool           `gorm:"default:false" json:"is_pinned"`
	IsLocked   bool           `gorm:"default:false" json:"is_locked"`
	ViewCount  int            `gorm:"default:0" json:"view_count"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	Category ForumCategory `gorm:"foreignKey:CategoryID" json:"-"`
	Author   User          `gorm:"foreignKey:AuthorID" json:"author"`
	Posts    []ForumPost   `gorm:"foreignKey:ThreadID" json:"posts,omitempty"`
}

type ForumPost struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ThreadID  uint           `gorm:"index" json:"thread_id"`
	AuthorID  uint           `gorm:"index" json:"author_id"`
	Content   string         `gorm:"type:text" json:"content"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Thread ForumThread `gorm:"foreignKey:ThreadID" json:"-"`
	Author User        `gorm:"foreignKey:AuthorID" json:"author"`
}

type Conversation struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	User1ID             uint      `gorm:"index" json:"user1_id"`
	User2ID             uint      `gorm:"index" json:"user2_id"`
	LastMessageAt       time.Time `gorm:"index" json:"last_message_at"`
	LastMessagePreview  string    `gorm:"size:100" json:"last_message_preview"`
	LastMessageSenderID uint      `json:"last_message_sender_id"`
	UnreadCountUser1    int       `gorm:"default:0" json:"unread_count_user1"`
	UnreadCountUser2    int       `gorm:"default:0" json:"unread_count_user2"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`

	User1    User      `gorm:"foreignKey:User1ID" json:"user1"`
	User2    User      `gorm:"foreignKey:User2ID" json:"user2"`
	Messages []Message `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

type Message struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ConversationID uint      `gorm:"index" json:"conversation_id"`
	SenderID       uint      `gorm:"index" json:"sender_id"`
	Content        string    `gorm:"type:text" json:"content"`
	IsRead         bool      `gorm:"default:false;index" json:"is_read"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time `json:"created_at"`

	Sender User `gorm:"foreignKey:SenderID" json:"sender"`
}

type VoiceChannel struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;uniqueIndex" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	IsPrivate   bool           `gorm:"default:false" json:"is_private"`
	CreatedByID uint           `json:"created_by_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	CreatedBy User `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
}
