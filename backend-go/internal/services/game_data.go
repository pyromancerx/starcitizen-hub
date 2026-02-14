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

type GameDataService struct {
	db *gorm.DB
}

func NewGameDataService(db *gorm.DB) *GameDataService {
	return &GameDataService{db: db}
}

const (
	ItemsDataURL = "https://raw.githubusercontent.com/scunpacked/scunpacked-data/master/v2/items.json"
	ShipsDataURL = "https://raw.githubusercontent.com/scunpacked/scunpacked-data/master/v2/ships.json"
)

// SyncFromCommunityData fetches and updates game data from public community repositories
func (s *GameDataService) SyncFromCommunityData() error {
	log.Println("Initiating High-Fidelity Game Data Sync...")
	
	// 1. Sync Items
	if err := s.SyncItems(); err != nil {
		log.Printf("Item sync failed: %v", err)
	}

	// 2. Sync Ships
	if err := s.SyncShips(); err != nil {
		log.Printf("Ship sync failed: %v", err)
	}

	return nil
}

func (s *GameDataService) SyncItems() error {
	log.Println("Fetching Global Item Registry...")
	resp, err := http.Get(ItemsDataURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var rawItems map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawItems); err != nil {
		return err
	}

	count := 0
	for uuid, data := range rawItems {
		itemData := data.(map[string]interface{})
		
		// Map scunpacked fields to our model
		name, _ := itemData["name"].(string)
		if name == "" { continue }

		category, _ := itemData["type"].(string)
		subCategory, _ := itemData["subType"].(string)
		manufacturer, _ := itemData["manufacturer"].(string)
		size, _ := itemData["size"].(float64)
		description, _ := itemData["description"].(string)

		// Shop mapping (simplistic mapping for prototype)
		var locations []string
		if shops, ok := itemData["shops"].([]interface{}); ok {
			for _, s := range shops {
				shop := s.(map[string]interface{})
				if name, ok := shop["name"].(string); ok {
					locations = append(locations, name)
				}
			}
		}
		locationsBytes, _ := json.Marshal(locations)

		// Marshall stats for storage
		statsBytes, _ := json.Marshal(itemData)

		item := models.GameItem{
			UUID:         uuid,
			Name:         name,
			Category:     category,
			SubCategory:  subCategory,
			Manufacturer: manufacturer,
			Size:         int(size),
			Description:  description,
			Stats:        string(statsBytes),
			Locations:    string(locationsBytes),
			Source:       "scunpacked",
			LastSyncedAt: time.Now(),
		}

		// Upsert
		s.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&item)
		
		count++
	}

	log.Printf("Successfully synchronized %d game items", count)
	return nil
}

func (s *GameDataService) SyncShips() error {
	log.Println("Fetching Ship Manufacturing Data...")
	resp, err := http.Get(ShipsDataURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var rawShips map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawShips); err != nil {
		return err
	}

	count := 0
	for uuid, data := range rawShips {
		shipData := data.(map[string]interface{})
		
		name, _ := shipData["name"].(string)
		if name == "" { continue }

		manufacturer, _ := shipData["manufacturer"].(string)
		shipClass, _ := shipData["type"].(string)
		description, _ := shipData["description"].(string)

		// Map hardpoints
		hardpointsBytes, _ := json.Marshal(shipData["hardpoints"])
		baseStatsBytes, _ := json.Marshal(shipData)

		ship := models.ShipModel{
			UUID:         uuid,
			Name:         name,
			Manufacturer: manufacturer,
			ShipClass:    shipClass,
			Description:  description,
			Hardpoints:   string(hardpointsBytes),
			BaseStats:    string(baseStatsBytes),
			LastSyncedAt: time.Now(),
		}

		s.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&ship)
		
		count++
	}

	log.Printf("Successfully synchronized %d ship models", count)
	return nil
}

// ImportErkulLoadout parses an Erkul export JSON and creates/updates a loadout
func (s *GameDataService) ImportErkulLoadout(userID uint, shipModelID uint, erkulJSON string) (*models.ShipLoadout, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(erkulJSON), &data); err != nil {
		return nil, fmt.Errorf("invalid Erkul JSON: %v", err)
	}

	// In a real Erkul export, components are keyed by slot
	// We'll map these to our local GameItem UUIDs
	config := make(map[string]string)
	
	// Simplified mapping for the prototype
	// We assume Erkul JSON has a 'components' field
	if components, ok := data["components"].(map[string]interface{}); ok {
		for slot, comp := range components {
			compData := comp.(map[string]interface{})
			if name, ok := compData["name"].(string); ok {
				// Search for item in our DB
				var item models.GameItem
				if err := s.db.Where("name = ?", name).First(&item).Error; err == nil {
					config[slot] = item.UUID
				}
			}
		}
	}

	configBytes, _ := json.Marshal(config)

	loadout := &models.ShipLoadout{
		ShipModelID:   shipModelID,
		CreatedByID:   userID,
		Configuration: string(configBytes),
		TemplateName:  "Imported from Erkul",
	}

	if err := s.db.Create(loadout).Error; err != nil {
		return nil, err
	}

	return loadout, nil
}

type LoadoutStats struct {
	TotalDPS     float64 `json:"total_dps"`
	AlphaDamage  float64 `json:"alpha_damage"`
	TotalShields float64 `json:"total_shields"`
	PowerDraw    float64 `json:"power_draw"`
}

func (s *GameDataService) CalculateLoadoutStats(configJSON string) LoadoutStats {
	var config map[string]string
	json.Unmarshal([]byte(configJSON), &config)

	stats := LoadoutStats{}

	for _, itemUUID := range config {
		var item models.GameItem
		if err := s.db.Where("uuid = ?", itemUUID).First(&item).Error; err == nil {
			var itemStats map[string]interface{}
			json.Unmarshal([]byte(item.Stats), &itemStats)

			// Add weapons DPS
			if dps, ok := itemStats["dps"].(float64); ok {
				stats.TotalDPS += dps
			}
			// Add shield HP
			if hp, ok := itemStats["shield_hp"].(float64); ok {
				stats.TotalShields += hp
			}
			// Add power draw
			if power, ok := itemStats["power_draw"].(float64); ok {
				stats.PowerDraw += power
			}
		}
	}

	return stats
}

type ReadinessReport struct {
	Score        int      `json:"score"`         // 0-100
	IsReady      bool     `json:"is_ready"`
	MissingItems []string `json:"missing_items"`
	Status       string   `json:"status"`        // ready, warning, critical
}

func (s *GameDataService) CheckMissionReadiness(userID uint, operationID uint) (ReadinessReport, error) {
	var op models.Operation
	if err := s.db.Preload("RequiredLoadout").Preload("RequiredManifest").First(&op, operationID).Error; err != nil {
		return ReadinessReport{}, err
	}

	var participant models.OperationParticipant
	if err := s.db.Where("operation_id = ? AND user_id = ?", operationID, userID).First(&participant).Error; err != nil {
		return ReadinessReport{}, fmt.Errorf("user not signed up for operation")
	}

	report := ReadinessReport{Score: 100, IsReady: true, Status: "ready"}

	// 1. Check Ship Loadout (if required)
	if op.RequiredLoadoutID != nil && participant.ShipID != nil {
		var userShip models.Ship
		s.db.First(&userShip, participant.ShipID)
		
		// Simplistic check: does the user ship match the required config?
		if userShip.Loadout != op.RequiredLoadout.Configuration {
			report.Score -= 40
			report.MissingItems = append(report.MissingItems, "Ship Loadout Mismatch")
		}
	}

	// 2. Check Ground Gear (Manifest)
	if op.RequiredManifestID != nil {
		var manifest models.EquipmentManifest
		s.db.First(&manifest, op.RequiredManifestID)
		
		var requiredItems []map[string]interface{}
		json.Unmarshal([]byte(manifest.Items), &requiredItems)

		var userInventory []models.PersonalInventory
		s.db.Where("user_id = ?", userID).Find(&userInventory)

		for _, req := range requiredItems {
			found := false
			itemName, _ := req["name"].(string)
			for _, inv := range userInventory {
				if inv.ItemName == itemName {
					found = true
					break
				}
			}
			if !found {
				report.Score -= 10
				report.MissingItems = append(report.MissingItems, fmt.Sprintf("Missing Equipment: %s", itemName))
			}
		}
	}

	if report.Score < 100 {
		report.IsReady = false
		if report.Score < 60 {
			report.Status = "critical"
		} else {
			report.Status = "warning"
		}
	}

	return report, nil
}

func (s *GameDataService) ListShipModels() ([]models.ShipModel, error) {
	var models []models.ShipModel
	err := s.db.Find(&models).Error
	return models, err
}

func (s *GameDataService) GetShipModel(id uint) (*models.ShipModel, error) {
	var model models.ShipModel
	err := s.db.First(&model, id).Error
	return &model, err
}

func (s *GameDataService) SearchItems(query string, category string) ([]models.GameItem, error) {
	var items []models.GameItem
	db := s.db.Where("name LIKE ?", "%"+query+"%")
	if category != "" {
		db = db.Where("category = ?", category)
	}
	err := db.Limit(50).Find(&items).Error
	return items, err
}
