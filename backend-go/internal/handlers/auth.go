package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
	}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	RSIHandle   string `json:"rsi_handle"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var email, password string

	if r.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}
		email = r.FormValue("username")
		if email == "" {
			email = r.FormValue("email")
		}
		password = r.FormValue("password")
	} else {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		email = req.Email
		password = req.Password
	}

	if email == "" || password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	log.Printf("Login attempt for email: %s (Type: %s)", email, r.Header.Get("Content-Type"))

	token, user, err := h.authService.Login(services.LoginInput{
		Email:    email,
		Password: password,
	})
	if err != nil {
		log.Printf("Login failed for %s: %v", email, err)
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	log.Printf("Login successful for %s (ID: %d)", user.Email, user.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"access_token": token,
		"token_type":   "bearer",
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.authService.Register(services.RegisterInput{
		Email:       req.Email,
		Password:    req.Password,
		DisplayName: req.DisplayName,
		RSIHandle:   req.RSIHandle,
	})
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) GetSetupStatus(w http.ResponseWriter, r *http.Request) {
	var count int64
	// If any user exists, we consider setup complete
	h.authService.DB.Model(&services.User{}).Count(&count)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"needs_setup": count == 0})
}

func (h *AuthHandler) PerformSetup(w http.ResponseWriter, r *http.Request) {
	var count int64
	h.authService.DB.Model(&services.User{}).Count(&count)
	if count > 0 {
		http.Error(w, "Setup already complete", http.StatusForbidden)
		return
	}

	var req struct {
		OrgName     string `json:"org_name"`
		AdminEmail  string `json:"admin_email"`
		AdminPass   string `json:"admin_password"`
		AdminHandle string `json:"admin_handle"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Update Org Name
	h.authService.DB.Model(&services.SystemSetting{}).Where("key = ?", "org_name").Update("value", req.OrgName)

	// 2. Create Admin User
	user, err := h.authService.Register(services.RegisterInput{
		Email:       req.AdminEmail,
		Password:    req.AdminPass,
		DisplayName: "Administrator",
		RSIHandle:   req.AdminHandle,
	})
	if err != nil {
		http.Error(w, "Failed to create admin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Grant Admin Role
	var adminRole services.Role
	h.authService.DB.Where("tier = ?", "admin").First(&adminRole)
	h.authService.DB.Model(&user).Association("Roles").Append(&adminRole)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "Setup complete"})
}
