package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func CreateShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var ship models.Ship
	if err := json.NewDecoder(r.Body).Decode(&ship); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ship.UserID = userID
	if result := database.DB.Create(&ship); result.Error != nil {
		http.Error(w, "Failed to create ship", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ship)
}

func ListMyShips(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var ships []models.Ship
	database.DB.Where("user_id = ?", userID).Find(&ships)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ships)
}

func UpdateShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	shipIDStr := chi.URLParam(r, "id")
	shipID, _ := strconv.Atoi(shipIDStr)

	var ship models.Ship
	if result := database.DB.Where("id = ? AND user_id = ?", shipID, userID).First(&ship); result.Error != nil {
		http.Error(w, "Ship not found", http.StatusNotFound)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&ship); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	database.DB.Save(&ship)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ship)
}

func DeleteShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	shipIDStr := chi.URLParam(r, "id")
	shipID, _ := strconv.Atoi(shipIDStr)

	if result := database.DB.Where("id = ? AND user_id = ?", shipID, userID).Delete(&models.Ship{}); result.Error != nil {
		http.Error(w, "Failed to delete ship", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func ImportHangarXPLORER(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var hangarData []map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&hangarData); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	importedCount := 0
	for _, pledge := range hangarData {
		insurance, _ := pledge["insurance"].(string)
		items, _ := pledge["items"].([]interface{})

		for _, itemRaw := range items {
			item := itemRaw.(map[string]interface{})
			if item["type"] == "Ship" {
				shipType, _ := item["name"].(string)
				pledgeName, _ := pledge["name"].(string)

				ship := models.Ship{
					UserID:          userID,
					ShipType:        shipType,
					Name:            pledgeName,
					InsuranceStatus: insurance,
					Status:          "ready",
					Notes:           "Imported from HangarXPLORER",
				}
				database.DB.Create(&ship)
				importedCount++
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Successfully imported ships",
		"count":   importedCount,
	})
}
