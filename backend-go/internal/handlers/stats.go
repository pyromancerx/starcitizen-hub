package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	var totalShips int64
	database.DB.Model(&models.Ship{}).Count(&totalShips)

	var readyShips int64
	database.DB.Model(&models.Ship{}).Where("status = ?", "ready").Count(&readyShips)

	var activeOps int64
	database.DB.Model(&models.Operation{}).Where("status IN ?", []string{"recruiting", "planning", "active"}).Count(&activeOps)

	var treasury models.OrgTreasury
	database.DB.Where("is_primary = ?", true).First(&treasury)

	readiness := 0
	if totalShips > 0 {
		readiness = int((float64(readyShips) / float64(totalShips)) * 100)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"fleet_readiness":      readiness,
		"total_ships":          totalShips,
		"active_operations":    activeOps,
		"org_treasury_balance": treasury.Balance,
	})
}
