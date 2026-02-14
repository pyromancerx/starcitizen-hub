package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
	"gorm.io/gorm"
)

type LogisticsHandler struct {
	logisticsService *services.LogisticsService
}

func NewLogisticsHandler() *LogisticsHandler {
	return &LogisticsHandler{
		logisticsService: services.NewLogisticsService(),
	}
}

func (h *LogisticsHandler) ListStockpiles(w http.ResponseWriter, r *http.Request) {
	stockpiles, err := h.logisticsService.ListStockpiles()
	if err != nil {
		http.Error(w, "Failed to list stockpiles", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stockpiles)
}

func (h *LogisticsHandler) GetStockpile(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	stockpile, err := h.logisticsService.GetStockpile(uint(id))
	if err != nil {
		http.Error(w, "Stockpile not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stockpile)
}

func (h *LogisticsHandler) CreateTradeRun(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var run models.TradeRun
	if err := json.NewDecoder(r.Body).Decode(&run); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	run.UserID = userID
	if err := h.logisticsService.CreateTradeRun(&run); err != nil {
		http.Error(w, "Failed to log trade run", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(run)
}

func (h *LogisticsHandler) ListMyTradeRuns(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	runs, err := h.logisticsService.ListTradeRuns(userID)
	if err != nil {
		http.Error(w, "Failed to list trade runs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(runs)
}

func (h *LogisticsHandler) ListCrewPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.logisticsService.ListCrewPosts()
	if err != nil {
		http.Error(w, "Failed to list crew posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *LogisticsHandler) CreateCrewPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var post models.CrewPost
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	post.UserID = userID
	if err := h.logisticsService.CreateCrewPost(&post); err != nil {
		http.Error(w, "Failed to post crew signal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *LogisticsHandler) ListOperations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query()["status"]
	ops, err := h.logisticsService.ListOperations(status)
	if err != nil {
		http.Error(w, "Failed to list operations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ops)
}

func (h *LogisticsHandler) CreateOperation(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var op models.Operation
	if err := json.NewDecoder(r.Body).Decode(&op); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	op.CreatedByID = userID
	if err := h.logisticsService.CreateOperation(&op); err != nil {
		http.Error(w, "Failed to authorize operation", http.StatusInternalServerError)
		return
	}

	// Track Activity
	h.logisticsService.DB.Create(&models.Activity{
		Type: "MISSION_AUTHORIZED",
		UserID: &userID,
		Content: fmt.Sprintf("authorized a new operation: %s", op.Title),
		CreatedAt: time.Now(),
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(op)
}

func (h *LogisticsHandler) GetOperation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	op, err := h.logisticsService.GetOperation(uint(id))
	if err != nil {
		http.Error(w, "Operation not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(op)
}

func (h *LogisticsHandler) SignupOperation(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	idStr := chi.URLParam(r, "id")
	opID, _ := strconv.ParseUint(idStr, 10, 32)

	var participant models.OperationParticipant
	if err := json.NewDecoder(r.Body).Decode(&participant); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	participant.UserID = userID
	participant.OperationID = uint(opID)

	if err := h.logisticsService.SignupForOperation(&participant); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participant)
}

func (h *LogisticsHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.logisticsService.ListProjects()
	if err != nil {
		http.Error(w, "Failed to list projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func (h *LogisticsHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	project, err := h.logisticsService.GetProject(uint(id))
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *LogisticsHandler) ListCargoContracts(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	contracts, err := h.logisticsService.ListCargoContracts(status)
	if err != nil {
		http.Error(w, "Failed to list contracts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contracts)
}

func (h *LogisticsHandler) CreateCargoContract(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var contract models.CargoContract
	if err := json.NewDecoder(r.Body).Decode(&contract); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	contract.PosterID = userID
	if err := h.logisticsService.CreateCargoContract(&contract); err != nil {
		http.Error(w, "Failed to issue contract", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contract)
}

func (h *LogisticsHandler) GetOperationProcurement(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	analysis, err := h.logisticsService.AnalyzeOperationProcurement(uint(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}

func (h *LogisticsHandler) GetTreasuryAnalytics(w http.ResponseWriter, r *http.Request) {
	analytics, err := h.logisticsService.GetTreasuryAnalytics()
	if err != nil {
		http.Error(w, "Failed to get analytics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analytics)
}

func (h *LogisticsHandler) ListActiveLoans(w http.ResponseWriter, r *http.Request) {
	var loans []models.AssetLoan
	h.logisticsService.DB.Preload("Stockpile").Preload("User").
		Where("status = ?", "active").Find(&loans)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loans)
}

func (h *LogisticsHandler) CreateContribution(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var contrib models.Contribution
	if err := json.NewDecoder(r.Body).Decode(&contrib); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	contrib.UserID = userID
	
	// Process contribution in a transaction
	err := h.logisticsService.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&contrib).Error; err != nil {
			return err
		}

		// Update the goal amount
		return tx.Model(&models.ContributionGoal{}).Where("id = ?", contrib.GoalID).
			UpdateColumn("current_amount", gorm.Expr("current_amount + ?", contrib.Amount)).Error
	})

	if err != nil {
		http.Error(w, "Failed to log contribution", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contrib)
}
