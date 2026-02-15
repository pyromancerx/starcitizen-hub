package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"

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

	page := 1
	totalCount := 0
	re := regexp.MustCompile(`href="/citizens/([^"]+)"`)
	foundHandles := make(map[string]bool)

	for {
		apiUrl := "https://robertsspaceindustries.com/api/orgs/getOrgMembers"
		
		payload := map[string]interface{}{
			"symbol":   orgSID.Value,
			"pagesize": 100,
			"page":     page,
		}
		jsonPayload, _ := json.Marshal(payload)

		req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(jsonPayload))
		if err != nil {
			return err
		}
		req.Header.Set("Origin", "https://robertsspaceindustries.com")
		req.Header.Set("Referer", fmt.Sprintf("https://robertsspaceindustries.com/orgs/%s", orgSID.Value))
		req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		
		var result struct {
			Success int         `json:"success"`
			Data    interface{} `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			resp.Body.Close()
			return err
		}
		resp.Body.Close()

		if result.Success != 1 {
			return fmt.Errorf("RSI API reported failure at page %d (Success=%d)", page, result.Success)
		}

		var htmlContent string
		var totalRows int
		switch d := result.Data.(type) {
		case string:
			htmlContent = d
		case map[string]interface{}:
			if h, ok := d["html"].(string); ok {
				htmlContent = h
			}
			if tr, ok := d["totalrows"].(float64); ok {
				totalRows = int(tr)
			}
		}

		if htmlContent == "" {
			break // No more data
		}

		matches := re.FindAllStringSubmatch(htmlContent, -1)
		if len(matches) == 0 {
			break // End of roster
		}

		pageCount := 0
		for _, match := range matches {
			handle := match[1]
			if handle == "" { continue }
			foundHandles[handle] = true

			member := models.KnownRSIMember{
				RSIHandle:    handle,
				LastSyncedAt: time.Now(),
			}

			err := s.db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "rsi_handle"}},
				DoUpdates: clause.AssignmentColumns([]string{"last_synced_at"}),
			}).Create(&member).Error

			if err == nil { 
				pageCount++ 
				// Auto-verify existing users with this handle
				s.db.Model(&models.User{}).Where("rsi_handle = ?", handle).Update("is_rsi_verified", true)
			}
		}

		totalCount += pageCount
		log.Printf("Synchronized page %d (%d/%d members found so far)", page, totalCount, totalRows)
		
		page++
	}

	// Remove members no longer in the RSI roster (optional, or just update verification)
	s.db.Model(&models.User{}).Where("rsi_handle NOT IN (?) AND is_rsi_verified = ?", getKeys(foundHandles), true).Update("is_rsi_verified", false)

	log.Printf("Successfully synchronized %d total RSI members for %s", totalCount, orgSID.Value)
	return nil
}

func getKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (s *RSISyncService) VerifyMember(handle string) (bool, error) {
	// Logic to verify if a specific handle is actually in the org on RSI
	return true, nil
}
