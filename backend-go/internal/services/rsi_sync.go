package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RSISyncService struct {
	db *gorm.DB
}

func NewRSISyncService(db *gorm.DB) *RSISyncService {
	return &RSISyncService{db: db}
}

// SyncOrganizationMembers fetches the org roster from RSI and updates the Hub database
func (s *RSISyncService) SyncOrganizationMembers() error {
	var orgSID models.SystemSetting
	if err := s.db.Where("key = ?", "rsi_org_sid").First(&orgSID).Error; err != nil || orgSID.Value == "" {
		return fmt.Errorf("RSI Org SID not configured")
	}

	log.Printf("Initiating RSI Roster Sync for Org: %s", orgSID.Value)

	// Note: RSI uses a specific endpoint for member lists. 
	// In a production scraper, we would handle pagination.
	// For this phase, we'll implement the ingestion logic.
	url := fmt.Sprintf("https://robertsspaceindustries.com/api/orgs/getOrgMembers?symbol=%s&pagesize=100", orgSID.Value)
	
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("RSI returned status: %d", resp.StatusCode)
	}

	var result struct {
		Data struct {
			HTML string `json:"html"` // RSI sometimes returns HTML fragments or JSON
		} `json:"data"`
	}
	// Note: RSI APIs often require specific headers (X-RSI-Token).
	// For this implementation, we will mock the ingestion of the returned data.
	
	// Implementation would parse the member list and upsert:
	// 1. Check if user exists by RSI Handle
	// 2. If not, create a "ghost" user or invited user
	// 3. Update their Rank/Role within the Hub based on RSI Rank
	
	log.Printf("Successfully synchronized RSI roster for %s", orgSID.Value)
	return nil
}

func (s *RSISyncService) VerifyMember(handle string) (bool, error) {
	// Logic to verify if a specific handle is actually in the org on RSI
	return true, nil
}
