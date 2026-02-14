package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 5120 // 5KB for WebRTC signals
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	ID   uint
	Conn *websocket.Conn
	Hub  *SignalingHub
	Send chan []byte
}

type SignalingHub struct {
	clients    map[uint]*Client
	rooms      map[string]map[uint]*Client // channel_id or conv_id -> clients
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

func NewSignalingHub() *SignalingHub {
	return &SignalingHub{
		clients:    make(map[uint]*Client),
		rooms:      make(map[string]map[uint]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *SignalingHub) broadcastRoomState(roomID string) {
	clients, ok := h.rooms[roomID]
	if !ok {
		return
	}

	userIDs := make([]uint, 0, len(clients))
	for id := range clients {
		userIDs = append(userIDs, id)
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"type":     "room-presence",
		"room_id":  roomID,
		"user_ids": userIDs,
	})

	for _, client := range clients {
		client.Send <- msg
	}
}

func (h *SignalingHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
				// Remove from all rooms and notify
				for roomID, clients := range h.rooms {
					if _, ok := clients[client.ID]; ok {
						delete(clients, client.ID)
						
						// Notify remaining users in room
						hMsg, _ := json.Marshal(map[string]interface{}{
							"type": "user-left",
							"room_id": roomID,
							"user_id": client.ID,
						})
						for _, remainingClient := range clients {
							select {
							case remainingClient.Send <- hMsg:
							default:
							}
						}

						if len(clients) == 0 {
							delete(h.rooms, roomID)
						} else {
							h.broadcastRoomState(roomID)
						}
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

type SocialHandler struct {
	socialService *services.SocialService
	hub           *SignalingHub
}

func NewSocialHandler() *SocialHandler {
	hub := NewSignalingHub()
	go hub.Run()
	return &SocialHandler{
		socialService: services.NewSocialService(),
		hub:           hub,
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

func (h *SocialHandler) CreateForumCategory(w http.ResponseWriter, r *http.Request) {
	var cat models.ForumCategory
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.socialService.CreateForumCategory(&cat); err != nil {
		http.Error(w, "Failed to create channel", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cat)
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

// Announcements
func (h *SocialHandler) ListAnnouncements(w http.ResponseWriter, r *http.Request) {
	announcements, err := h.socialService.ListAnnouncements()
	if err != nil {
		http.Error(w, "Failed to list announcements", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(announcements)
}

// Voice Channels
func (h *SocialHandler) ListVoiceChannels(w http.ResponseWriter, r *http.Request) {
	var channels []models.VoiceChannel
	if err := h.socialService.DB.Find(&channels).Error; err != nil {
		http.Error(w, "Failed to list voice channels", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(channels)
}

func (h *SocialHandler) CreateVoiceChannel(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	// Check if user is Admin or Officer
	var user models.User
	if err := h.socialService.DB.Preload("Roles").First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	isAuthorized := false
	for _, role := range user.Roles {
		if role.Tier == models.RoleTierAdmin || role.Tier == models.RoleTierOfficer {
			isAuthorized = true
			break
		}
	}

	if !isAuthorized {
		http.Error(w, "Unauthorized: Requires Admin or Officer rank", http.StatusForbidden)
		return
	}
	
	var channel models.VoiceChannel
	if err := json.NewDecoder(r.Body).Decode(&channel); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	channel.CreatedByID = userID
	if err := h.socialService.DB.Create(&channel).Error; err != nil {
		http.Error(w, "Failed to create voice channel", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(channel)
}

func (h *SocialHandler) DeleteVoiceChannel(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	var user models.User
	if err := h.socialService.DB.Preload("Roles").First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	isAuthorized := false
	for _, role := range user.Roles {
		if role.Tier == models.RoleTierAdmin || role.Tier == models.RoleTierOfficer {
			isAuthorized = true
			break
		}
	}

	if !isAuthorized {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.socialService.DB.Delete(&models.VoiceChannel{}, id).Error; err != nil {
		http.Error(w, "Failed to delete voice channel", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Signaling WebSocket
func (h *SocialHandler) HandleSignaling(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}

	client := &Client{
		ID:   userID,
		Conn: conn,
		Hub:  h.hub,
		Send: make(chan []byte, 256),
	}
	client.Hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()
	
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { 
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil 
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// Routing logic:
		// target_id: direct message
		// room_id: room broadcast
		// type: offer, answer, ice-candidate, join, leave
		
		targetID, hasTarget := msg["target_id"].(float64)
		roomID, hasRoom := msg["room_id"].(string)

		if hasTarget {
			c.Hub.mu.Lock()
			if target, ok := c.Hub.clients[uint(targetID)]; ok {
				msg["sender_id"] = c.ID
				data, _ := json.Marshal(msg)
				target.Send <- data
			}
			c.Hub.mu.Unlock()
		} else if hasRoom {
			c.Hub.mu.Lock()
			if msg["type"] == "join" {
				if _, ok := c.Hub.rooms[roomID]; !ok {
					c.Hub.rooms[roomID] = make(map[uint]*Client)
				}
				c.Hub.rooms[roomID][c.ID] = c
				// Notify others in room
				hMsg, _ := json.Marshal(map[string]interface{}{
					"type": "user-joined",
					"room_id": roomID,
					"user_id": c.ID,
				})
				for cid, client := range c.Hub.rooms[roomID] {
					if cid != c.ID {
						client.Send <- hMsg
					}
				}
				c.Hub.broadcastRoomState(roomID)
			} else if msg["type"] == "leave" {
				if room, ok := c.Hub.rooms[roomID]; ok {
					delete(room, c.ID)
					hMsg, _ := json.Marshal(map[string]interface{}{
						"type": "user-left",
						"room_id": roomID,
						"user_id": c.ID,
					})
					for _, client := range room {
						client.Send <- hMsg
					}
					c.Hub.broadcastRoomState(roomID)
				}
			} else {
				// Broadcast to room except self
				if room, ok := c.Hub.rooms[roomID]; ok {
					msg["sender_id"] = c.ID
					data, _ := json.Marshal(msg)
					for cid, client := range room {
						if cid != c.ID {
							client.Send <- data
						}
					}
				}
			}
			c.Hub.mu.Unlock()
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.WriteMessage(websocket.TextMessage, message)
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *SocialHandler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var announcement models.Announcement
	if err := json.NewDecoder(r.Body).Decode(&announcement); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	announcement.AuthorID = userID
	if err := h.socialService.CreateAnnouncement(&announcement); err != nil {
		http.Error(w, "Failed to create announcement", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(announcement)
}

func (h *SocialHandler) DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.socialService.DeleteAnnouncement(uint(id)); err != nil {
		http.Error(w, "Failed to delete announcement", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *SocialHandler) GlobalSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if len(query) < 2 {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	results, err := h.socialService.UnifiedSearch(query)
	if err != nil {
		http.Error(w, "Search failure", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func (h *SocialHandler) SubmitRSIVerification(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	var req struct {
		RSIHandle     string `json:"rsi_handle"`
		ScreenshotURL string `json:"screenshot_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	verification := models.RSIVerificationRequest{
		UserID:        userID,
		RSIHandle:     req.RSIHandle,
		ScreenshotURL: req.ScreenshotURL,
		Status:        "pending",
		SubmittedAt:   time.Now(),
	}

	if err := h.socialService.DB.Create(&verification).Error; err != nil {
		http.Error(w, "Failed to submit request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(verification)
}

func (h *SocialHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	// Fetch active members with their roles
	if err := h.socialService.DB.Preload("Roles").Where("is_active = ?", true).Order("display_name asc").Find(&users).Error; err != nil {
		http.Error(w, "Failed to retrieve personnel records", http.StatusInternalServerError)
		return
	}

	// In a real product, we would map this to a "PublicProfile" DTO to hide sensitive fields
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *SocialHandler) ListAchievements(w http.ResponseWriter, r *http.Request) {
	achievements, err := h.socialService.ListAchievements()
	if err != nil {
		http.Error(w, "Failed to list achievements", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(achievements)
}

func (h *SocialHandler) AwardAchievement(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID        uint   `json:"user_id"`
		AchievementID uint   `json:"achievement_id"`
		AwardNote     string `json:"award_note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	award := models.UserAchievement{
		UserID:        req.UserID,
		AchievementID: req.AchievementID,
		AwardNote:     req.AwardNote,
		AwardedAt:     time.Now(),
	}

	if err := h.socialService.DB.Create(&award).Error; err != nil {
		http.Error(w, "Failed to award merit", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(award)
}

func (h *SocialHandler) ListFederation(w http.ResponseWriter, r *http.Request) {
	var entities []models.FederationEntity
	if err := h.socialService.DB.Order("status asc, name asc").Find(&entities).Error; err != nil {
		http.Error(w, "Failed to retrieve federation data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entities)
}

func (h *SocialHandler) CreateFederationEntity(w http.ResponseWriter, r *http.Request) {
	var entity models.FederationEntity
	if err := json.NewDecoder(r.Body).Decode(&entity); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.socialService.DB.Create(&entity).Error; err != nil {
		http.Error(w, "Failed to create federation record", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entity)
}
