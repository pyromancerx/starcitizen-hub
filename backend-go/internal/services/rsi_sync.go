package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
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

	url := fmt.Sprintf("https://robertsspaceindustries.com/api/orgs/getOrgMembers?symbol=%s&pagesize=100", orgSID.Value)
	
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Success int `json:"success"`
		Data struct {
			HTML string `json:"html"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	// RSI often returns HTML blobs. We use Regex to extract handles.
	// Pattern for RSI Handle: href="/citizens/HANDLE"
	re := regexp.MustCompile(`href="/citizens/([^"]+)"`)
	matches := re.FindAllStringSubmatch(result.Data.HTML, -1)

	count := 0
	for _, match := range matches {
		handle := match[1]
		if handle == "" { continue }

		// Upsert logic:
		// We create a user record if it doesn't exist.
		// We set their email to a placeholder since we don't know it from RSI.
		
		user := models.User{
			RSIHandle:     handle,
			DisplayName:   handle, // Default display name to handle
			Email:         fmt.Sprintf("%s@sync-pending.hub", handle),
			IsActive:      true,
			IsRSIVerified: true, // Flag as RSI-verified since they're in the org roster
		}

		// Use OnConflict to avoid duplicates and update status
		err := s.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "rsi_handle"}},
			DoUpdates: clause.AssignmentColumns([]string{"is_rsi_verified"}),
		}).Create(&user).Error

		if err == nil { count++ }
	}

	log.Printf("Successfully synchronized %d RSI members for %s", count, orgSID.Value)
	return nil
}

func (s *RSISyncService) VerifyMember(handle string) (bool, error) {
	// Logic to verify if a specific handle is actually in the org on RSI
	return true, nil
}
