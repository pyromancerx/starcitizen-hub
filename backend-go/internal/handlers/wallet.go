package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func GetMyWallet(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var wallet models.Wallet

	result := database.DB.Where("user_id = ?", userID).First(&wallet)
	if result.Error != nil {
		// Create wallet if doesn't exist
		wallet = models.Wallet{UserID: userID, BalanceAUEC: 0}
		database.DB.Create(&wallet)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

func GetWalletTransactions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	var wallet models.Wallet
	database.DB.Where("user_id = ?", userID).First(&wallet)

	var transactions []models.WalletTransaction
	database.DB.Where("wallet_id = ?", wallet.ID).Order("created_at desc").Limit(50).Find(&transactions)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}
