package handlers

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

type AdminHandler struct {
	adminService    *services.AdminService
	mailService     *services.MailService
	gameDataService *services.GameDataService
	rsiSyncService  *services.RSISyncService
}

func NewAdminHandler() *AdminHandler {
	adminSvc := services.NewAdminService()
	return &AdminHandler{
		adminService:    adminSvc,
		mailService:     services.NewMailService(adminSvc.DB),
		gameDataService: services.NewGameDataService(adminSvc.DB),
		rsiSyncService:  services.NewRSISyncService(adminSvc.DB),
	}
}

func (h *AdminHandler) SyncRSIMembers(w http.ResponseWriter, r *http.Request) {
	// Trigger sync in background
	go func() {
		if err := h.rsiSyncService.SyncOrganizationMembers(); err != nil {
			log.Printf("Background RSI sync failed: %v", err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "RSI Spectrum synchronization sequence initiated"})
}

func (h *AdminHandler) SyncGameData(w http.ResponseWriter, r *http.Request) {
	// Trigger sync in background
	go func() {
		if err := h.gameDataService.SyncFromCommunityData(); err != nil {
			log.Printf("Background game data sync failed: %v", err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "High-fidelity synchronization sequence initiated"})
}

func (h *AdminHandler) UploadLogo(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB limit
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("logo")
	if err != nil {
		http.Error(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create uploads directory if not exists
	uploadDir := "../uploads"
	os.MkdirAll(uploadDir, 0755)

	// Save file with timestamp to avoid collisions
	filename := strconv.FormatInt(time.Now().Unix(), 10) + "_" + header.Filename
	savePath := filepath.Join(uploadDir, filename)

	out, err := os.Create(savePath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		http.Error(w, "Failed to copy file", http.StatusInternalServerError)
		return
	}

	// Update setting
	logoURL := "/uploads/" + filename
	err = h.adminService.UpdateSetting("logo_url", logoURL)
	if err != nil {
		http.Error(w, "Failed to update setting", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"logo_url": logoURL})
}

func (h *AdminHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.adminService.ListRoles()
	if err != nil {
		http.Error(w, "Failed to list roles", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}

func (h *AdminHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var role models.Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.CreateRole(&role); err != nil {
		http.Error(w, "Failed to create role", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(role)
}

func (h *AdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.UpdateRole(uint(id), updates); err != nil {
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) AssignUserRole(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	userID, _ := strconv.ParseUint(userIDStr, 10, 32)

	var req struct {
		RoleID uint `json:"role_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.AssignRoleToUser(uint(userID), req.RoleID); err != nil {
		http.Error(w, "Failed to assign role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) RemoveUserRole(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	userID, _ := strconv.ParseUint(userIDStr, 10, 32)
	roleIDStr := chi.URLParam(r, "roleId")
	roleID, _ := strconv.ParseUint(roleIDStr, 10, 32)

	if err := h.adminService.RemoveRoleFromUser(uint(userID), uint(roleID)); err != nil {
		http.Error(w, "Failed to remove role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.adminService.GetDashboardStats()
	if err != nil {
		http.Error(w, "Failed to get stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminService.ListUsers()
	if err != nil {
		http.Error(w, "Failed to list users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
		RSIHandle   string `json:"rsi_handle"`
		IsAdmin     bool   `json:"is_admin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.adminService.CreateUser(req.Email, req.Password, req.DisplayName, req.RSIHandle, req.IsAdmin)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AdminHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req struct {
		IsActive   bool `json:"is_active"`
		IsApproved bool `json:"is_approved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.UpdateUserStatus(uint(id), req.IsActive, req.IsApproved); err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) ListRSIRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	requests, err := h.adminService.ListRSIVerificationRequests(status)
	if err != nil {
		http.Error(w, "Failed to list requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

func (h *AdminHandler) ProcessRSIRequest(w http.ResponseWriter, r *http.Request) {
	adminID := r.Context().Value("user_id").(uint)
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.ProcessRSIVerification(uint(id), adminID, req.Status, req.Notes); err != nil {
		http.Error(w, "Failed to process request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) GetDiscordConfig(w http.ResponseWriter, r *http.Request) {
	config, err := h.adminService.GetDiscordIntegration()
	if err != nil {
		http.Error(w, "Discord configuration not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

func (h *AdminHandler) UpdateDiscordConfig(w http.ResponseWriter, r *http.Request) {
	var config models.DiscordIntegration
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.UpdateDiscordIntegration(&config); err != nil {
		http.Error(w, "Failed to update Discord configuration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

func (h *AdminHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.adminService.GetSettings()
	if err != nil {
		http.Error(w, "Failed to get settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *AdminHandler) UpdateSetting(w http.ResponseWriter, r *http.Request) {
	adminID := r.Context().Value("user_id").(uint)
	var req struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.UpdateSetting(req.Key, req.Value); err != nil {
		http.Error(w, "Failed to update setting", http.StatusInternalServerError)
		return
	}

	// Record Audit Log
	h.adminService.DB.Create(&models.AuditLog{
		UserID:     &adminID,
		Action:     "UPDATE_SETTING",
		TargetType: "SYSTEM_SETTING",
		Details:    fmt.Sprintf("Changed %s to %s", req.Key, req.Value),
		IPAddress:  r.RemoteAddr,
	})

	w.WriteHeader(http.StatusNoContent)
}

var AppVersion = "v1.0.0-dev"

func (h *AdminHandler) GetSystemVersion(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"version": AppVersion})
}

func (h *AdminHandler) PerformUpdate(w http.ResponseWriter, r *http.Request) {
	adminID := r.Context().Value("user_id").(uint)
	// Record Audit Log
	h.adminService.DB.Create(&models.AuditLog{
		UserID:     &adminID,
		Action:     "SYSTEM_UPDATE",
		TargetType: "KERNEL",
		Details:    "Initiated remote system upgrade",
		IPAddress:  r.RemoteAddr,
	})

	// Execute the update script
	go func() {
		log.Println("Starting system update...")
		cmd := exec.Command("/bin/bash", "../scripts/update.sh")
		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Update failed: %v\nOutput: %s", err, string(output))
			return
		}
		log.Println("Update completed successfully")
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "Update initiated"})
}

func (h *AdminHandler) CreateBackup(w http.ResponseWriter, r *http.Request) {
	adminID := r.Context().Value("user_id").(uint)
	// Record Audit Log
	h.adminService.DB.Create(&models.AuditLog{
		UserID:     &adminID,
		Action:     "CREATE_BACKUP",
		TargetType: "DATABASE",
		Details:    "Generated cold storage archive",
		IPAddress:  r.RemoteAddr,
	})

	backupFilename := fmt.Sprintf("hub-backup-%d.tar.gz", time.Now().Unix())
	w.Header().Set("Content-Type", "application/gzip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", backupFilename))

	gw := gzip.NewWriter(w)
	defer gw.Close()
	tw := tar.NewWriter(gw)
	defer tw.Close()

	// 1. Add database
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "hub.db"
	}
	if err := addFileToTar(tw, dbPath, "hub.db"); err != nil {
		log.Printf("Failed to add DB to backup: %v", err)
	}

	// 2. Add uploads
	uploadDir := "../uploads"
	filepath.Walk(uploadDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		relPath, _ := filepath.Rel("../", path)
		return addFileToTar(tw, path, relPath)
	})
}

func addFileToTar(tw *tar.Writer, filePath string, tarPath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return err
	}

	header, err := tar.FileInfoHeader(info, "")
	if err != nil {
		return err
	}
	header.Name = tarPath

	if err := tw.WriteHeader(header); err != nil {
		return err
	}

	_, err = io.Copy(tw, file)
	return err
}

func (h *AdminHandler) RestoreBackup(w http.ResponseWriter, r *http.Request) {
	// Restoring is dangerous as it requires stopping DB access
	// In a real product, we'd want a separate orchestrator for this
	http.Error(w, "Restore via UI currently disabled for safety. Use CLI tools.", http.StatusNotImplemented)
}

func (h *AdminHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	logPath := "../logs/backend.log"
	
	file, err := os.Open(logPath)
	if err != nil {
		http.Error(w, "Log file not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// Read last 10KB of logs
	stat, _ := file.Stat()
	size := stat.Size()
	var offset int64 = 0
	if size > 10240 {
		offset = size - 10240
	}
	
	data := make([]byte, size-offset)
	_, err = file.ReadAt(data, offset)
	if err != nil && err != io.EOF {
		http.Error(w, "Failed to read logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(data)
}

func (h *AdminHandler) TestEmail(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var user models.User
	if err := h.adminService.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	subject := "Star Citizen Hub - Test Transmission"
	body := fmt.Sprintf("<h1>Test Transmission Received</h1><p>Greetings %s,</p><p>This is a test email from your Star Citizen Hub to verify SMTP configuration.</p><p>Signal status: <strong>Locked and Secure</strong>.</p>", user.DisplayName)

	if err := h.mailService.SendEmail(user.Email, subject, body); err != nil {
		http.Error(w, "Failed to send test email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "Test transmission sent to " + user.Email})
}

func (h *AdminHandler) UpdateMyNotificationSettings(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	
	var req struct {
		Settings string `json:"notification_settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.adminService.DB.Model(&models.User{}).Where("id = ?", userID).Update("notification_settings", req.Settings).Error; err != nil {
		http.Error(w, "Failed to update notification settings", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	var logs []models.AuditLog
	h.adminService.DB.Preload("User").Order("created_at desc").Limit(100).Find(&logs)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
