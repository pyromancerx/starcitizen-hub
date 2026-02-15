package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

type GameDataHandler struct {
	gameDataService *services.GameDataService
}

func NewGameDataHandler() *GameDataHandler {
	return &GameDataHandler{
		gameDataService: services.NewGameDataService(database.DB),
	}
}

func (h *GameDataHandler) ListShipModels(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	manufacturer := r.URL.Query().Get("manufacturer")
	shipClass := r.URL.Query().Get("class")

	if query != "" || manufacturer != "" || shipClass != "" {
		ships, err := h.gameDataService.SearchShipModels(query, manufacturer, shipClass)
		if err != nil {
			http.Error(w, "Failed to search ship models", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ships)
		return
	}

	models, err := h.gameDataService.ListShipModels()
	if err != nil {
		http.Error(w, "Failed to list ship models", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models)
}

func (h *GameDataHandler) GetShipModel(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	model, err := h.gameDataService.GetShipModel(uint(id))
	if err != nil {
		http.Error(w, "Ship model not found", http.StatusNotFound)
		return
	}

	// Resolve default loadout if it exists
	if model.DefaultLoadout != "" && model.DefaultLoadout != "{}" {
		enriched, err := h.gameDataService.ResolveConfiguration(model.DefaultLoadout)
		if err == nil {
			model.DefaultLoadout = enriched
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(model)
}

func (h *GameDataHandler) SearchItems(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	category := r.URL.Query().Get("category")
	subCategory := r.URL.Query().Get("sub_category")
	sizeStr := r.URL.Query().Get("size")
	size, _ := strconv.Atoi(sizeStr)

	items, err := h.gameDataService.SearchItems(query, category, subCategory, size)
	if err != nil {
		http.Error(w, "Failed to search items", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *GameDataHandler) ImportErkul(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	var req struct {
		ShipModelID uint   `json:"ship_model_id"`
		ErkulJSON   string `json:"erkul_json"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	loadout, err := h.gameDataService.ImportErkulLoadout(userID, req.ShipModelID, req.ErkulJSON)
	if err != nil {
		http.Error(w, "Import failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loadout)
}

func (h *GameDataHandler) ListLoadouts(w http.ResponseWriter, r *http.Request) {
	// List personal and standard issue loadouts
	var loadouts []models.ShipLoadout
	h.gameDataService.DB.Preload("ShipModel").Find(&loadouts)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loadouts)
}

func (h *GameDataHandler) GetLoadout(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var loadout models.ShipLoadout
	if err := h.gameDataService.DB.Preload("ShipModel").First(&loadout, uint(id)).Error; err != nil {
		http.Error(w, "Loadout not found", http.StatusNotFound)
		return
	}

	// Resolve configuration to full items
	if loadout.Configuration != "" && loadout.Configuration != "{}" {
		enriched, err := h.gameDataService.ResolveConfiguration(loadout.Configuration)
		if err == nil {
			loadout.Configuration = enriched
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loadout)
}

func (h *GameDataHandler) CreateLoadout(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var loadout models.ShipLoadout
	if err := json.NewDecoder(r.Body).Decode(&loadout); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	loadout.CreatedByID = userID
	if err := h.gameDataService.DB.Create(&loadout).Error; err != nil {
		http.Error(w, "Failed to create loadout", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loadout)
}

func (h *GameDataHandler) UpdateLoadout(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.gameDataService.DB.Model(&models.ShipLoadout{}).Where("id = ?", uint(id)).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update loadout", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GameDataHandler) DeleteLoadout(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.gameDataService.DB.Delete(&models.ShipLoadout{}, uint(id)).Error; err != nil {
		http.Error(w, "Failed to delete loadout", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *GameDataHandler) GetMissionReadiness(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	report, err := h.gameDataService.CheckMissionReadiness(userID, uint(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

func (h *GameDataHandler) ListManifests(w http.ResponseWriter, r *http.Request) {
	var manifests []models.EquipmentManifest
	h.gameDataService.DB.Find(&manifests)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(manifests)
}

func (h *GameDataHandler) GetManifest(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var manifest models.EquipmentManifest
	if err := h.gameDataService.DB.First(&manifest, uint(id)).Error; err != nil {
		http.Error(w, "Manifest not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(manifest)
}

func (h *GameDataHandler) CreateManifest(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var manifest models.EquipmentManifest
	if err := json.NewDecoder(r.Body).Decode(&manifest); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	manifest.CreatedByID = userID
	if err := h.gameDataService.DB.Create(&manifest).Error; err != nil {
		http.Error(w, "Failed to create manifest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(manifest)
}

func (h *GameDataHandler) UpdateManifest(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.gameDataService.DB.Model(&models.EquipmentManifest{}).Where("id = ?", uint(id)).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update manifest", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GameDataHandler) DeleteManifest(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	if err := h.gameDataService.DB.Delete(&models.EquipmentManifest{}, uint(id)).Error; err != nil {
		http.Error(w, "Failed to delete manifest", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *GameDataHandler) ApplyLoadoutToShip(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	var req struct {
		LoadoutID uint `json:"loadout_id"`
		ShipID    uint `json:"ship_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Fetch the Loadout
	var loadout models.ShipLoadout
	if err := h.gameDataService.DB.First(&loadout, req.LoadoutID).Error; err != nil {
		http.Error(w, "Loadout not found", http.StatusNotFound)
		return
	}

	// 2. Fetch the User's Ship and Verify Ownership
	var ship models.Ship
	if err := h.gameDataService.DB.Where("id = ? AND user_id = ?", req.ShipID, userID).First(&ship).Error; err != nil {
		http.Error(w, "Ship not found or unauthorized", http.StatusForbidden)
		return
	}

	// 3. Apply Configuration
	if err := h.gameDataService.DB.Model(&ship).Update("loadout", loadout.Configuration).Error; err != nil {
		http.Error(w, "Failed to apply blueprint", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
