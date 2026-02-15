package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
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

const (
	ScUnpackedRepoURL = "https://github.com/StarCitizenWiki/scunpacked-data.git"
	LocalRepoPath     = "data/scunpacked-data"
)

// SyncFromCommunityData fetches and updates game data from public community repositories
func (s *GameDataService) SyncFromCommunityData() error {
	log.Println("Initiating High-Fidelity Game Data Sync...")

	// 1. Ensure local repository is up to date
	if err := s.ensureLocalRepo(); err != nil {
		log.Printf("Failed to update local repo: %v. Falling back to remote sync.", err)
		
		if err := s.SyncItems(); err != nil {
			log.Printf("Remote Item sync failed: %v", err)
		}
		if err := s.SyncShips(); err != nil {
			log.Printf("Remote Ship sync failed: %v", err)
		}
		return nil
	}

	// 2. Sync Items
	if err := s.SyncItemsLocal(); err != nil {
		log.Printf("Local Item sync failed: %v", err)
	}

	// 3. Sync Ships
	if err := s.SyncShipsLocal(); err != nil {
		log.Printf("Local Ship sync failed: %v", err)
	}

	return nil
}

const (
	ItemsDataURL = "https://media.githubusercontent.com/media/StarCitizenWiki/scunpacked-data/master/items.json"
	ShipsDataURL = "https://raw.githubusercontent.com/StarCitizenWiki/scunpacked-data/master/ships.json"
)

func (s *GameDataService) SyncItems() error {
	log.Println("Fetching Global Item Registry (Remote)...")
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

		s.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&item)
		
		count++
	}

	log.Printf("Successfully synchronized %d game items (Remote)", count)
	return nil
}

func (s *GameDataService) SyncShips() error {
	log.Println("Fetching Ship Manufacturing Index (Remote)...")
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
		if !ok { continue }

		uuid := getFirstString(shipData, "UUID", "uuid", "reference")
		name := getFirstString(shipData, "Name", "name")
		className := getFirstString(shipData, "ClassName", "className", "Reference", "class_name")
		if name == "" || uuid == "" { continue }

		if strings.Contains(className, "/") || strings.Contains(className, "\\") {
			className = filepath.Base(strings.ReplaceAll(className, "\\", "/"))
			className = strings.TrimSuffix(className, filepath.Ext(className))
		} else if strings.Contains(className, ".") {
			parts := strings.Split(className, ".")
			className = parts[len(parts)-1]
		}

		manufacturer := getNestedString(shipData, "Manufacturer", "Name")
		if manufacturer == "" {
			manufacturer = getFirstString(shipData, "manufacturer", "Manufacturer")
		}

		shipClass := getFirstString(shipData, "Role", "Career", "type", "ShipClass")
		description := getFirstString(shipData, "Description", "description")

		var hardpoints string
		var defaultLoadout string
		var detailedStats string

		if className != "" {
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
						hpSource := detail["hardpoints"]
						if hpSource == nil {
							hpSource = detail["Loadout"]
						}

						if hpSource != nil {
							enrichedHPs := s.enrichHardpoints(hpSource)
							hpData, _ := json.Marshal(enrichedHPs)
							hardpoints = string(hpData)

							defMap := make(map[string]string)
							s.processHPs(hpSource, defMap)
							defJSON, _ := json.Marshal(defMap)
							defaultLoadout = string(defJSON)
						}

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
	}

	log.Printf("Successfully synchronized %d ship models (Remote)", count)
	return nil
}

func (s *GameDataService) ensureLocalRepo() error {
	if _, err := os.Stat(LocalRepoPath); os.IsNotExist(err) {
		log.Printf("Cloning scunpacked-data repository to %s...", LocalRepoPath)
		if err := os.MkdirAll(filepath.Dir(LocalRepoPath), 0755); err != nil {
			return err
		}
		cmd := exec.Command("git", "clone", "--depth", "1", ScUnpackedRepoURL, LocalRepoPath)
		return cmd.Run()
	}

	log.Println("Updating local scunpacked-data repository...")
	cmd := exec.Command("git", "-C", LocalRepoPath, "pull")
	return cmd.Run()
}

func (s *GameDataService) SyncItemsLocal() error {
	log.Println("Processing Global Item Registry from local files...")
	itemsPath := filepath.Join(LocalRepoPath, "items.json")
	data, err := ioutil.ReadFile(itemsPath)
	if err != nil {
		return err
	}

	var rawItems []interface{}
	if err := json.Unmarshal(data, &rawItems); err != nil {
		return err
	}

	count := 0
	for _, data := range rawItems {
		itemData, ok := data.(map[string]interface{})
		if !ok {
			continue
		}

		uuid := getFirstString(itemData, "reference", "UUID", "uuid")
		name := getFirstString(itemData, "name", "Name", "itemName")
		if name == "" || uuid == "" {
			continue
		}

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

		// Shop mapping
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
			Source:       "scunpacked-local",
			LastSyncedAt: time.Now(),
		}

		s.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "uuid"}},
			UpdateAll: true,
		}).Create(&item)

		count++
	}

	log.Printf("Successfully synchronized %d game items from local storage", count)
	return nil
}

func (s *GameDataService) SyncShipsLocal() error {
	log.Println("Processing Ship Manufacturing Index from local files...")
	shipsPath := filepath.Join(LocalRepoPath, "ships.json")
	data, err := ioutil.ReadFile(shipsPath)
	if err != nil {
		return err
	}

	var rawShips []interface{}
	if err := json.Unmarshal(data, &rawShips); err != nil {
		return err
	}

	count := 0
	for _, data := range rawShips {
		shipData, ok := data.(map[string]interface{})
		if !ok {
			continue
		}

		uuid := getFirstString(shipData, "UUID", "uuid", "reference")
		name := getFirstString(shipData, "Name", "name")
		className := getFirstString(shipData, "ClassName", "className", "Reference", "class_name")
		if name == "" || uuid == "" {
			continue
		}

		if strings.Contains(className, "/") || strings.Contains(className, "\\") {
			className = filepath.Base(strings.ReplaceAll(className, "\\", "/"))
			className = strings.TrimSuffix(className, filepath.Ext(className))
		} else if strings.Contains(className, ".") {
			parts := strings.Split(className, ".")
			className = parts[len(parts)-1]
		}

		manufacturer := getNestedString(shipData, "Manufacturer", "Name")
		if manufacturer == "" {
			manufacturer = getFirstString(shipData, "manufacturer", "Manufacturer")
		}

		shipClass := getFirstString(shipData, "Role", "Career", "type", "ShipClass")
		description := getFirstString(shipData, "Description", "description")

		var hardpoints string
		var defaultLoadout string
		var detailedStats string

		if className != "" {
			detailPath := filepath.Join(LocalRepoPath, "ships", strings.ToLower(className)+".json")
			detailData, err := ioutil.ReadFile(detailPath)
			if err == nil {
				var detail map[string]interface{}
				if err := json.Unmarshal(detailData, &detail); err == nil {
					hpSource := detail["hardpoints"]
					if hpSource == nil {
						hpSource = detail["Loadout"]
					}

					if hpSource != nil {
						enrichedHPs := s.enrichHardpoints(hpSource)
						hpData, _ := json.Marshal(enrichedHPs)
						hardpoints = string(hpData)

						defMap := make(map[string]string)
						s.processHPs(hpSource, defMap)
						defJSON, _ := json.Marshal(defMap)
						defaultLoadout = string(defJSON)
					}

					statsData, _ := json.Marshal(detail)
					detailedStats = string(statsData)
				}
			}
		}

		if hardpoints == "" {
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
		if count%50 == 0 {
			log.Printf("Synchronized %d vessels (Current: %s)...", count, name)
		}
	}

	log.Printf("Successfully synchronized %d ship models from local storage", count)
	return nil
}

func (s *GameDataService) processHPs(hpSource interface{}, defMap map[string]string) {
	switch hps := hpSource.(type) {
	case []interface{}:
		for _, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				hpName := getFirstString(hp, "HardpointName", "name", "Name", "hardpointName")
				
				// Prioritize UUID for matching with GameItem
				installed := getFirstString(hp, "UUID", "uuid", "installedItem", "InstalledItem", "ClassName", "className")
				
				if hpName != "" && installed != "" && installed != "<= PLACEHOLDER =>" {
					defMap[hpName] = installed
				}
				
				// Handle recursive loadouts (common in ship files)
				if subLoadout, ok := hp["Loadout"].([]interface{}); ok {
					s.processHPs(subLoadout, defMap)
				}
			}
		}
	case map[string]interface{}:
		for hpName, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				installed := getFirstString(hp, "UUID", "uuid", "installedItem", "InstalledItem", "ClassName", "className")
				if installed != "" && installed != "<= PLACEHOLDER =>" {
					defMap[hpName] = installed
				}
				
				if subLoadout, ok := hp["Loadout"].([]interface{}); ok {
					s.processHPs(subLoadout, defMap)
				}
			}
		}
	}
}

func (s *GameDataService) enrichHardpoints(hpSource interface{}) interface{} {
	switch hps := hpSource.(type) {
	case []interface{}:
		for i, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				// Enrich this hardpoint
				uuid := getFirstString(hp, "UUID", "uuid", "installedItem", "InstalledItem", "ClassName", "className")
				if uuid != "" && uuid != "<= PLACEHOLDER =>" {
					var item models.GameItem
					if err := s.DB.Where("uuid = ?", uuid).First(&item).Error; err == nil {
						hp["databaseItem"] = item
					}
				}

				// Recurse
				if subLoadout, ok := hp["Loadout"]; ok {
					hp["Loadout"] = s.enrichHardpoints(subLoadout)
				}
				hps[i] = hp
			}
		}
		return hps
	case map[string]interface{}:
		for key, hpRaw := range hps {
			if hp, ok := hpRaw.(map[string]interface{}); ok {
				uuid := getFirstString(hp, "UUID", "uuid", "installedItem", "InstalledItem", "ClassName", "className")
				if uuid != "" && uuid != "<= PLACEHOLDER =>" {
					var item models.GameItem
					if err := s.DB.Where("uuid = ?", uuid).First(&item).Error; err == nil {
						hp["databaseItem"] = item
					}
				}

				if subLoadout, ok := hp["Loadout"]; ok {
					hp["Loadout"] = s.enrichHardpoints(subLoadout)
				}
				hps[key] = hp
			}
		}
		return hps
	}
	return hpSource
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

func (s *GameDataService) ResolveConfiguration(configJSON string) (string, error) {
	var config map[string]interface{}
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return configJSON, err
	}

	enrichedConfig := make(map[string]interface{})
	for slot, val := range config {
		var itemUUID string
		switch v := val.(type) {
		case string:
			itemUUID = v
		case map[string]interface{}:
			if uuid, ok := v["uuid"].(string); ok {
				itemUUID = uuid
			} else {
				enrichedConfig[slot] = v
				continue
			}
		default:
			continue
		}

		var item models.GameItem
		if err := s.DB.Where("uuid = ?", itemUUID).First(&item).Error; err == nil {
			enrichedConfig[slot] = item
		} else {
			// If not found, keep the original value (might be a class name or something we haven't synced)
			enrichedConfig[slot] = val
		}
	}

	enrichedJSON, _ := json.Marshal(enrichedConfig)
	return string(enrichedJSON), nil
}

func (s *GameDataService) GetShipModel(id uint) (*models.ShipModel, error) {
	var model models.ShipModel
	err := s.DB.First(&model, id).Error
	return &model, err
}

func (s *GameDataService) SearchShipModels(query string, manufacturer string, shipClass string) ([]models.ShipModel, error) {
	var ships []models.ShipModel
	db := s.DB.Where("name NOT LIKE ?", "%<= PLACEHOLDER =>%")

	if query != "" {
		words := strings.Fields(query)
		for _, word := range words {
			searchTerm := "%" + word + "%"
			db = db.Where("(name LIKE ? OR manufacturer LIKE ? OR class_name LIKE ?)", searchTerm, searchTerm, searchTerm)
		}
	}

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
	db := s.DB.Where("name NOT LIKE ?", "%<= PLACEHOLDER =>%")

	if query != "" {
		words := strings.Fields(query)
		for _, word := range words {
			searchTerm := "%" + word + "%"
			db = db.Where("(name LIKE ? OR manufacturer LIKE ? OR sub_category LIKE ?)", searchTerm, searchTerm, searchTerm)
		}
	}

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
