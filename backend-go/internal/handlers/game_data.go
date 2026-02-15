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
