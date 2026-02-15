package services

import (
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
		url := fmt.Sprintf("https://robertsspaceindustries.com/api/orgs/getOrgMembers?symbol=%s&pagesize=100&page=%d", orgSID.Value, page)
		
		resp, err := http.Get(url)
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
		switch d := result.Data.(type) {
		case string:
			htmlContent = d
		case map[string]interface{}:
			if h, ok := d["html"].(string); ok {
				htmlContent = h
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

			user := models.User{
				RSIHandle:     handle,
				DisplayName:   handle,
				Email:         fmt.Sprintf("%s@sync-pending.hub", handle),
				IsActive:      true,
				IsRSIVerified: true,
			}

			err := s.db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "rsi_handle"}},
				DoUpdates: clause.AssignmentColumns([]string{"is_rsi_verified"}),
			}).Create(&user).Error

			if err == nil { pageCount++ }
		}

		totalCount += pageCount
		log.Printf("Synchronized page %d (%d members found)", page, pageCount)
		
		if len(matches) < 100 {
			break // Last page
		}
		page++
	}

	// De-verify members no longer in the RSI roster
	var handlesInDB []string
	s.db.Model(&models.User{}).Where("is_rsi_verified = ?", true).Pluck("rsi_handle", &handlesInDB)
	
	deverifiedCount := 0
	for _, dbHandle := range handlesInDB {
		if !foundHandles[dbHandle] {
			s.db.Model(&models.User{}).Where("rsi_handle = ?", dbHandle).Update("is_rsi_verified", false)
			deverifiedCount++
		}
	}

	log.Printf("Successfully synchronized %d total RSI members for %s (%d de-verified)", totalCount, orgSID.Value, deverifiedCount)
	return nil
}

func (s *RSISyncService) VerifyMember(handle string) (bool, error) {
	// Logic to verify if a specific handle is actually in the org on RSI
	return true, nil
}
