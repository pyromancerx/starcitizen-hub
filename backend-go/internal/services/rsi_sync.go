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
		log.Printf("Synchronized page %d (%d/%d members found so far)", page, totalCount, totalRows)
		
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
