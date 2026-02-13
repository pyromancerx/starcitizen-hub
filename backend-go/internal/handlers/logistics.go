package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func ListStockpiles(w http.ResponseWriter, r *http.Request) {
	var stockpiles []models.OrgStockpile
	database.DB.Find(&stockpiles)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stockpiles)
}

func CreateTradeRun(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var run models.TradeRun
	if err := json.NewDecoder(r.Body).Decode(&run); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	run.UserID = userID
	// Basic validation & profit calc could go here
	if result := database.DB.Create(&run); result.Error != nil {
		http.Error(w, "Failed to log trade run", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(run)
}

func ListOperations(w http.ResponseWriter, r *http.Request) {
	var ops []models.Operation
	database.DB.Order("scheduled_at asc").Find(&ops)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ops)
}

func ListProjects(w http.ResponseWriter, r *http.Request) {
	var projects []models.Project
	database.DB.Order("created_at desc").Find(&projects)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}
