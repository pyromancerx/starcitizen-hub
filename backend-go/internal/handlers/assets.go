package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

type AssetHandler struct {
	assetService *services.AssetService
}

func NewAssetHandler() *AssetHandler {
	return &AssetHandler{
		assetService: services.NewAssetService(),
	}
}

func (h *AssetHandler) CreateShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var ship models.Ship
	if err := json.NewDecoder(r.Body).Decode(&ship); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ship.UserID = userID
	if err := h.assetService.CreateShip(&ship); err != nil {
		http.Error(w, "Failed to create ship: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Track Activity
	h.assetService.DB.Create(&models.Activity{
		Type: "SHIP_COMMISSIONED",
		UserID: &userID,
		Content: fmt.Sprintf("commissioned a new %s: %s", ship.ShipType, ship.Name),
		CreatedAt: time.Now(),
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ship)
}

func (h *AssetHandler) ListMyShips(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	ships, err := h.assetService.ListShips(userID)
	if err != nil {
		http.Error(w, "Failed to list ships: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ships)
}

func (h *AssetHandler) UpdateShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	shipIDStr := chi.URLParam(r, "id")
	shipID, _ := strconv.ParseUint(shipIDStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ship, err := h.assetService.UpdateShip(userID, uint(shipID), updates)
	if err != nil {
		http.Error(w, "Failed to update ship: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ship)
}

func (h *AssetHandler) DeleteShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	shipIDStr := chi.URLParam(r, "id")
	shipID, _ := strconv.ParseUint(shipIDStr, 10, 32)

	if err := h.assetService.DeleteShip(userID, uint(shipID)); err != nil {
		http.Error(w, "Failed to delete ship: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}

func (h *AssetHandler) ImportHangarXPLORER(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var rawData interface{}
	if err := json.NewDecoder(r.Body).Decode(&rawData); err != nil {
		log.Printf("Import failed: invalid JSON format: %v", err)
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	importedCount := 0
	
	processEntry := func(entry map[string]interface{}) {
		// Case 1: HangarXPLORER nested structure (pledge with items)
		if items, ok := entry["items"].([]interface{}); ok {
			insurance := getString(entry, "insurance")
			pledgeName := getString(entry, "name")

			for _, itemRaw := range items {
				item, ok := itemRaw.(map[string]interface{})
				if !ok { continue }
				
				if item["type"] == "Ship" {
					shipType := getString(item, "name")
					ship := models.Ship{
						UserID:          userID,
						ShipType:        shipType,
						Name:            pledgeName,
						InsuranceStatus: insurance,
						Status:          "ready",
						Notes:           "Imported from HangarXPLORER",
					}
					if err := h.assetService.CreateShip(&ship); err == nil {
						importedCount++
					}
				}
			}
			return
		}

		// Case 2: Flat list (like the user provided or simple custom list)
		shipType := getString(entry, "ship_name")
		if shipType == "" {
			shipType = getString(entry, "ship_type")
		}
		if shipType == "" {
			shipType = getString(entry, "name")
		}

		if shipType != "" {
			// Determine insurance
			insurance := getString(entry, "insurance")
			if insurance == "" {
				if lti, ok := entry["lti"].(bool); ok && lti {
					insurance = "LTI"
				} else {
					insurance = "Standard"
				}
			}

			customName := getString(entry, "custom_name")
			if customName == "" {
				customName = getString(entry, "pledge_name")
			}
			if customName == "" {
				customName = shipType
			}

			ship := models.Ship{
				UserID:          userID,
				ShipType:        shipType,
				Name:            customName,
				InsuranceStatus: insurance,
				Status:          "ready",
				Notes:           "Imported from fleet list",
			}
			if err := h.assetService.CreateShip(&ship); err == nil {
				importedCount++
			}
		}
	}

	// Handle different JSON structures
	switch data := rawData.(type) {
	case []interface{}:
		for _, entryRaw := range data {
			if entry, ok := entryRaw.(map[string]interface{}); ok {
				processEntry(entry)
			}
		}
	case map[string]interface{}:
		// Single ship or object-wrapped list
		if list, ok := data["ships"].([]interface{}); ok {
			for _, entryRaw := range list {
				if entry, ok := entryRaw.(map[string]interface{}); ok {
					processEntry(entry)
				}
			}
		} else {
			// Process as single entry
			processEntry(data)
		}
	}

	log.Printf("User %d imported %d vessels", userID, importedCount)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": fmt.Sprintf("Successfully synchronized %d vessels with your fleet registry.", importedCount),
		"count":   importedCount,
	})
}

// Wallet
func (h *AssetHandler) GetMyWallet(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	wallet, err := h.assetService.GetWallet(userID)
	if err != nil {
		http.Error(w, "Failed to get wallet: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

func (h *AssetHandler) GetWalletTransactions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	wallet, err := h.assetService.GetWallet(userID)
	if err != nil {
		http.Error(w, "Failed to get wallet: "+err.Error(), http.StatusInternalServerError)
		return
	}

	transactions, err := h.assetService.GetWalletTransactions(wallet.ID, 50)
	if err != nil {
		http.Error(w, "Failed to get transactions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

// Inventory
func (h *AssetHandler) ListMyInventory(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	items, err := h.assetService.ListInventory(userID)
	if err != nil {
		http.Error(w, "Failed to list inventory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *AssetHandler) AddInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var item models.PersonalInventory
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item.UserID = userID
	if err := h.assetService.AddInventoryItem(&item); err != nil {
		http.Error(w, "Failed to add item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *AssetHandler) UpdateInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemIDStr := chi.URLParam(r, "id")
	itemID, _ := strconv.ParseUint(itemIDStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item, err := h.assetService.UpdateInventoryItem(userID, uint(itemID), updates)
	if err != nil {
		http.Error(w, "Failed to update item: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *AssetHandler) DeleteInventoryItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemIDStr := chi.URLParam(r, "id")
	itemID, _ := strconv.ParseUint(itemIDStr, 10, 32)

	if err := h.assetService.DeleteInventoryItem(userID, uint(itemID)); err != nil {
		http.Error(w, "Failed to delete item: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Player Bases
func (h *AssetHandler) ListMyBases(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var bases []models.PlayerBase
	if err := h.assetService.DB.Where("user_id = ?", userID).Find(&bases).Error; err != nil {
		http.Error(w, "Failed to list bases", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bases)
}

func (h *AssetHandler) CreateBase(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var base models.PlayerBase
	if err := json.NewDecoder(r.Body).Decode(&base); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	base.UserID = userID
	if err := h.assetService.DB.Create(&base).Error; err != nil {
		http.Error(w, "Failed to create base", http.StatusInternalServerError)
		return
	}

	// Track Activity
	h.assetService.DB.Create(&models.Activity{
		Type: "BASE_ESTABLISHED",
		UserID: &userID,
		Content: fmt.Sprintf("established a new planetary outpost: %s on %s", base.Name, base.Planet),
		CreatedAt: time.Now(),
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(base)
}

func (h *AssetHandler) ListOrgBases(w http.ResponseWriter, r *http.Request) {
	var bases []models.PlayerBase
	// Simple privacy filter for the prototype: only show bases that aren't marked as purely private
	// In a real implementation, we'd parse the privacy_settings JSON
	if err := h.assetService.DB.Preload("User").Find(&bases).Error; err != nil {
		http.Error(w, "Failed to list org bases", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bases)
}

func (h *AssetHandler) UpdateBase(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	baseIDStr := chi.URLParam(r, "id")
	baseID, _ := strconv.ParseUint(baseIDStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.assetService.DB.Model(&models.PlayerBase{}).
		Where("id = ? AND user_id = ?", uint(baseID), userID).
		Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update base", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AssetHandler) DeleteBase(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	baseIDStr := chi.URLParam(r, "id")
	baseID, _ := strconv.ParseUint(baseIDStr, 10, 32)

	if err := h.assetService.DB.Where("id = ? AND user_id = ?", uint(baseID), userID).
		Delete(&models.PlayerBase{}).Error; err != nil {
		http.Error(w, "Failed to delete base", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
