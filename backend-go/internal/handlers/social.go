package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func ListForumCategories(w http.ResponseWriter, r *http.Request) {
	var categories []models.ForumCategory
	database.DB.Order("sort_order asc").Find(&categories)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var notifications []models.Notification
	database.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifications)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

func GetActivityFeed(w http.ResponseWriter, r *http.Request) {
	var activities []models.Activity
	database.DB.Preload("User").Order("created_at desc").Limit(50).Find(&activities)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"activities": activities,
		"total_count": len(activities), // Placeholder for real count
		"has_more": false,
	})
}
