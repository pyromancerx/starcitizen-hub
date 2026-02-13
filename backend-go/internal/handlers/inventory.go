package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func ListMyInventory(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var items []models.PersonalInventory
	database.DB.Where("user_id = ?", userID).Find(&items)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func AddInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var item models.PersonalInventory
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item.UserID = userID
	if result := database.DB.Create(&item); result.Error != nil {
		http.Error(w, "Failed to add inventory item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func UpdateInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemIDStr := chi.URLParam(r, "id")
	itemID, _ := strconv.Atoi(itemIDStr)

	var item models.PersonalInventory
	if result := database.DB.Where("id = ? AND user_id = ?", itemID, userID).First(&item); result.Error != nil {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	database.DB.Save(&item)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func DeleteInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemIDStr := chi.URLParam(r, "id")
	itemID, _ := strconv.Atoi(itemIDStr)

	if result := database.DB.Where("id = ? AND user_id = ?", itemID, userID).Delete(&models.PersonalInventory{}); result.Error != nil {
		http.Error(w, "Failed to delete item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
