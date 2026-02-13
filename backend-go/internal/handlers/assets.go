package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

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

func (h *AssetHandler) ImportHangarXPLORER(w http.ResponseWriter, r *http.Request) {
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
				h.assetService.CreateShip(&ship)
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
