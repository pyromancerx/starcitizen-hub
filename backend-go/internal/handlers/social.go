package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

type SocialHandler struct {
	socialService *services.SocialService
}

func NewSocialHandler() *SocialHandler {
	return &SocialHandler{
		socialService: services.NewSocialService(),
	}
}

// Forum
func (h *SocialHandler) ListForumCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.socialService.ListForumCategories()
	if err != nil {
		http.Error(w, "Failed to list forum categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *SocialHandler) GetForumCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	category, err := h.socialService.GetForumCategory(uint(id))
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}

func (h *SocialHandler) GetThread(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	thread, err := h.socialService.GetThread(uint(id))
	if err != nil {
		http.Error(w, "Thread not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(thread)
}

func (h *SocialHandler) CreateThread(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var thread models.ForumThread
	if err := json.NewDecoder(r.Body).Decode(&thread); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	thread.AuthorID = userID
	if err := h.socialService.CreateThread(&thread); err != nil {
		http.Error(w, "Failed to create thread", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(thread)
}

func (h *SocialHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var post models.ForumPost
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	post.AuthorID = userID
	if err := h.socialService.CreatePost(&post); err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

// Notifications
func (h *SocialHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	notifications, err := h.socialService.GetUserNotifications(userID, 50)
	if err != nil {
		http.Error(w, "Failed to get notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

func (h *SocialHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.socialService.MarkNotificationRead(userID, uint(id)); err != nil {
		http.Error(w, "Failed to mark as read", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Activity
func (h *SocialHandler) GetActivityFeed(w http.ResponseWriter, r *http.Request) {
	activities, err := h.socialService.GetActivityFeed(50)
	if err != nil {
		http.Error(w, "Failed to get activity feed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"activities": activities,
		"total_count": len(activities),
		"has_more": false,
	})
}

// Messaging
func (h *SocialHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	conversations, err := h.socialService.ListConversations(userID)
	if err != nil {
		http.Error(w, "Failed to list conversations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

func (h *SocialHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	conversation, err := h.socialService.GetConversation(uint(id), userID)
	if err != nil {
		http.Error(w, "Conversation not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversation)
}

func (h *SocialHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var msg models.Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	msg.SenderID = userID
	if err := h.socialService.SendMessage(&msg); err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msg)
}
