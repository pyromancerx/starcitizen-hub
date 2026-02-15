package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type GameDataService struct {
	DB *gorm.DB
}

func NewGameDataService(db *gorm.DB) *GameDataService {
	return &GameDataService{DB: db}
}

const (
	ItemsDataURL = "https://media.githubusercontent.com/media/StarCitizenWiki/scunpacked-data/master/items.json"
	ShipsDataURL = "https://raw.githubusercontent.com/StarCitizenWiki/scunpacked-data/master/ships.json"
)

// Helper to extract nested string values
func getNestedString(m map[string]interface{}, keys ...string) string {
	var current interface{} = m
	for _, key := range keys {
		if nextMap, ok := current.(map[string]interface{}); ok {
			current = nextMap[key]
		} else {
			return ""
		}
	}
	if s, ok := current.(string); ok {
		return s
	}
	return ""
}

// Helper to extract string with multiple possible keys
func getFirstString(m map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if val, ok := m[key].(string); ok && val != "" {
			return val
		}
	}
	return ""
}

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

	var rawItems []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawItems); err != nil {
		return err
	}

	count := 0
	for _, data := range rawItems {
		itemData, ok := data.(map[string]interface{})
		if !ok { continue }
		
		uuid := getFirstString(itemData, "reference", "UUID", "uuid")
		name := getFirstString(itemData, "name", "Name", "itemName")
		if name == "" || uuid == "" { continue }

		category := getFirstString(itemData, "type", "Category")
		subCategory := getFirstString(itemData, "subType", "SubCategory")
		
		manufacturer := getNestedString(itemData, "stdItem", "Manufacturer", "Name")
		if manufacturer == "" {
			manufacturer = getFirstString(itemData, "manufacturer", "Manufacturer")
		}

		size, _ := itemData["size"].(float64)
		description := getNestedString(itemData, "stdItem", "Description")
		if description == "" {
			description = getFirstString(itemData, "description", "Description")
		}

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
		s.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&item)
		
		count++
	}

	log.Printf("Successfully synchronized %d game items", count)
	return nil
}

func (s *GameDataService) SyncShips() error {
	log.Println("Fetching Ship Manufacturing Index...")
	resp, err := http.Get(ShipsDataURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var rawShips []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawShips); err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	count := 0
	for _, data := range rawShips {
		shipData, ok := data.(map[string]interface{})
		if !ok {
			continue
		}

		uuid := getFirstString(shipData, "UUID", "uuid", "reference")
		name := getFirstString(shipData, "Name", "name")
		className := getFirstString(shipData, "ClassName", "className", "Reference")
		if name == "" || uuid == "" {
			continue
		}

		// Clean up className if it's a full path
		if strings.Contains(className, ".") {
			parts := strings.Split(className, ".")
			className = parts[len(parts)-1]
		}

		manufacturer := getNestedString(shipData, "Manufacturer", "Name")
		if manufacturer == "" {
			manufacturer = getFirstString(shipData, "manufacturer", "Manufacturer")
		}

		shipClass := getFirstString(shipData, "Role", "Career", "type", "ShipClass")
		description := getFirstString(shipData, "Description", "description")

		// Fetch Detailed Layout Data
		var hardpoints string
		var defaultLoadout string
		var detailedStats string

		if className != "" {
			// Try StarCitizenWiki first, then scunpacked/scunpacked-data
			sources := []string{
				"https://raw.githubusercontent.com/StarCitizenWiki/scunpacked-data/master/ships/%s.json",
				"https://raw.githubusercontent.com/scunpacked/scunpacked-data/master/v2/ships/%s.json",
			}

			for _, source := range sources {
				detailURL := fmt.Sprintf(source, strings.ToLower(className))
				dResp, err := client.Get(detailURL)
				if err == nil && dResp.StatusCode == 200 {
					var detail map[string]interface{}
					if err := json.NewDecoder(dResp.Body).Decode(&detail); err == nil {
						// Map detailed hardpoints
						if hpSource, ok := detail["hardpoints"]; ok {
							hpData, _ := json.Marshal(hpSource)
							hardpoints = string(hpData)

							// Generate Default Loadout Map
							defMap := make(map[string]string)
							processHPs(hpSource, defMap)
							defJSON, _ := json.Marshal(defMap)
							defaultLoadout = string(defJSON)
						}

						// Use detailed stats
						statsData, _ := json.Marshal(detail)
						detailedStats = string(statsData)
						dResp.Body.Close()
						break
					}
					dResp.Body.Close()
				}
			}
		}

		if hardpoints == "" {
			// Fallback to basic data
			hpBytes, _ := json.Marshal(shipData["hardpoints"])
			hardpoints = string(hpBytes)
		}
		if detailedStats == "" {
			bsBytes, _ := json.Marshal(shipData)
			detailedStats = string(bsBytes)
		}

		ship := models.ShipModel{
			UUID:           uuid,
			ClassName:      className,
			Name:           name,
			Manufacturer:   manufacturer,
			ShipClass:      shipClass,
			Description:    description,
			Hardpoints:     hardpoints,
			BaseStats:      detailedStats,
			DefaultLoadout: defaultLoadout,
			LastSyncedAt:   time.Now(),
		}

		s.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&ship)

		count++
		if count%10 == 0 || className == "" {
			log.Printf("Synchronized %d/%d vessels (Current: %s, Class: %s)...", count, len(rawShips), name, className)
		}
	}

	log.Printf("Successfully synchronized %d ship models with detailed layouts", count)
	return nil
}

func processHPs(hpSource interface{}, defMap map[string]string) {
	switch hps := hpSource.(type) {
	case []interface{}:
		for _, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				hpName := getFirstString(hp, "name", "Name")
				installed := getFirstString(hp, "installedItem", "InstalledItem")
				if hpName != "" && installed != "" {
					defMap[hpName] = installed
				}
			}
		}
	case map[string]interface{}:
		for hpName, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				installed := getFirstString(hp, "installedItem", "InstalledItem")
				if installed != "" {
					defMap[hpName] = installed
				}
			}
		}
	}
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
				if err := s.DB.Where("name = ?", name).First(&item).Error; err == nil {
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

	if err := s.DB.Create(loadout).Error; err != nil {
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
		if err := s.DB.Where("uuid = ?", itemUUID).First(&item).Error; err == nil {
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
	if err := s.DB.Preload("RequiredLoadout").Preload("RequiredManifest").First(&op, operationID).Error; err != nil {
		return ReadinessReport{}, err
	}

	var participant models.OperationParticipant
	if err := s.DB.Where("operation_id = ? AND user_id = ?", operationID, userID).First(&participant).Error; err != nil {
		return ReadinessReport{}, fmt.Errorf("user not signed up for operation")
	}

	report := ReadinessReport{Score: 100, IsReady: true, Status: "ready"}

	// 1. Check Ship Loadout (if required)
	if op.RequiredLoadoutID != nil && participant.ShipID != nil {
		var userShip models.Ship
		s.DB.First(&userShip, participant.ShipID)
		
		// Simplistic check: does the user ship match the required config?
		if userShip.Loadout != op.RequiredLoadout.Configuration {
			report.Score -= 40
			report.MissingItems = append(report.MissingItems, "Ship Loadout Mismatch")
		}
	}

	// 2. Check Ground Gear (Manifest)
	if op.RequiredManifestID != nil {
		var manifest models.EquipmentManifest
		s.DB.First(&manifest, op.RequiredManifestID)
		
		var requiredItems []map[string]interface{}
		json.Unmarshal([]byte(manifest.Items), &requiredItems)

		var userInventory []models.PersonalInventory
		s.DB.Where("user_id = ?", userID).Find(&userInventory)

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
	err := s.DB.Find(&models).Error
	return models, err
}

func (s *GameDataService) GetShipModel(id uint) (*models.ShipModel, error) {
	var model models.ShipModel
	err := s.DB.First(&model, id).Error
	return &model, err
}

func (s *GameDataService) SearchShipModels(query string, manufacturer string, shipClass string) ([]models.ShipModel, error) {
	var ships []models.ShipModel
	db := s.DB.Where("name LIKE ?", "%"+query+"%").Where("name NOT LIKE ?", "%<= PLACEHOLDER =>%")
	if manufacturer != "" {
		db = db.Where("manufacturer LIKE ?", "%"+manufacturer+"%")
	}
	if shipClass != "" {
		db = db.Where("ship_class LIKE ?", "%"+shipClass+"%")
	}
	err := db.Limit(50).Find(&ships).Error
	return ships, err
}

func (s *GameDataService) SearchItems(query string, category string, subCategory string, size int) ([]models.GameItem, error) {
	var items []models.GameItem
	db := s.DB.Where("name LIKE ?", "%"+query+"%").Where("name NOT LIKE ?", "%<= PLACEHOLDER =>%")
	if category != "" {
		if strings.Contains(category, ",") {
			cats := strings.Split(category, ",")
			db = db.Where("category IN ?", cats)
		} else {
			db = db.Where("category LIKE ?", "%"+category+"%")
		}
	}
	if subCategory != "" {
		db = db.Where("sub_category LIKE ?", "%"+subCategory+"%")
	}
	if size > 0 {
		db = db.Where("size = ?", size)
	}
	err := db.Limit(50).Find(&items).Error
	return items, err
}
