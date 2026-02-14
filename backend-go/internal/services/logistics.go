package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type LogisticsService struct {
	db             *gorm.DB
	discordService *DiscordService
}

func NewLogisticsService() *LogisticsService {
	return &LogisticsService{
		db:             database.DB,
		discordService: NewDiscordService(database.DB),
	}
}

// Stockpiles
func (s *LogisticsService) ListStockpiles() ([]models.OrgStockpile, error) {
	var stockpiles []models.OrgStockpile
	err := s.db.Find(&stockpiles).Error
	return stockpiles, err
}

func (s *LogisticsService) GetStockpile(id uint) (*models.OrgStockpile, error) {
	var stockpile models.OrgStockpile
	err := s.db.Preload("Transactions").First(&stockpile, id).Error
	return &stockpile, err
}

func (s *LogisticsService) CreateStockpileTransaction(tx *models.StockpileTransaction) error {
	return s.db.Transaction(func(dbTx *gorm.DB) error {
		if err := dbTx.Create(tx).Error; err != nil {
			return err
		}

		// Update stockpile quantity
		return dbTx.Model(&models.OrgStockpile{}).Where("id = ?", tx.StockpileID).
			UpdateColumn("quantity", gorm.Expr("quantity + ?", tx.QuantityChange)).Error
	})
}

// Operations
func (s *LogisticsService) CreateOperation(op *models.Operation) error {
	if err := s.db.Create(op).Error; err != nil {
		return err
	}

	// Trigger Discord Relay
	go func() {
		s.discordService.RelayOperation(op)
	}()

	return nil
}

// Operations
func (s *LogisticsService) ListOperations(status []string) ([]models.Operation, error) {
	var ops []models.Operation
	query := s.db.Order("scheduled_at asc")
	if len(status) > 0 {
		query = query.Where("status IN ?", status)
	}
	err := query.Find(&ops).Error
	return ops, err
}

func (s *LogisticsService) GetOperation(id uint) (*models.Operation, error) {
	var op models.Operation
	err := s.db.Preload("Participants.User").Preload("Participants.Ship").First(&op, id).Error
	return &op, err
}

func (s *LogisticsService) SignupForOperation(participant *models.OperationParticipant) error {
	// Check if already signed up
	var count int64
	s.db.Model(&models.OperationParticipant{}).
		Where("operation_id = ? AND user_id = ?", participant.OperationID, participant.UserID).
		Count(&count)
	if count > 0 {
		return errors.New("already signed up for this operation")
	}

	return s.db.Create(participant).Error
}

// Projects
func (s *LogisticsService) ListProjects() ([]models.Project, error) {
	var projects []models.Project
	err := s.db.Order("created_at desc").Find(&projects).Error
	return projects, err
}

func (s *LogisticsService) GetProject(id uint) (*models.Project, error) {
	var project models.Project
	err := s.db.Preload("Phases.Tasks").Preload("ContributionGoals.Contributions").First(&project, id).Error
	return &project, err
}

// Trade
func (s *LogisticsService) CreateTradeRun(run *models.TradeRun) error {
	return s.db.Create(run).Error
}

func (s *LogisticsService) ListCargoContracts(status string) ([]models.CargoContract, error) {
	var contracts []models.CargoContract
	query := s.db
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&contracts).Error
	return contracts, err
}

type ProcurementRequirement struct {
	ItemName      string  `json:"item_name"`
	RequiredQty   float64 `json:"required_qty"`
	StockpileQty  float64 `json:"stockpile_qty"`
	Shortfall     float64 `json:"shortfall"`
	IsMet         bool    `json:"is_met"`
}

func (s *LogisticsService) AnalyzeOperationProcurement(opID uint) ([]ProcurementRequirement, error) {
	var op models.Operation
	if err := s.db.Preload("RequiredManifest").First(&op, opID).Error; err != nil {
		return nil, err
	}

	if op.RequiredManifest == nil {
		return []ProcurementRequirement{}, nil
	}

	var reqItems []map[string]interface{}
	json.Unmarshal([]byte(op.RequiredManifest.Items), &reqItems)

	var analysis []ProcurementRequirement
	for _, req := range reqItems {
		name, _ := req["name"].(string)
		qty, _ := req["quantity"].(float64)

		var stockpile models.OrgStockpile
		s.db.Where("name = ?", name).First(&stockpile)

		shortfall := qty - stockpile.Quantity
		if shortfall < 0 {
			shortfall = 0
		}

		analysis = append(analysis, ProcurementRequirement{
			ItemName:     name,
			RequiredQty:  qty,
			StockpileQty: stockpile.Quantity,
			Shortfall:    shortfall,
			IsMet:        stockpile.Quantity >= qty,
		})
	}

	return analysis, nil
}

type TreasuryAnalytics struct {
	TotalCredits      int     `json:"total_credits"`
	TotalTradeProfit  float64 `json:"total_trade_profit"`
	ActiveContracts   int     `json:"active_contracts"`
	RecentSpending    int     `json:"recent_spending"`
}

func (s *LogisticsService) GetTreasuryAnalytics() (TreasuryAnalytics, error) {
	var analytics TreasuryAnalytics
	
	// Total credits from Org Treasury
	s.db.Table("org_treasuries").Select("SUM(balance_auec)").Row().Scan(&analytics.TotalCredits)
	
	// Total profit from Trade Runs
	s.db.Table("trade_runs").Select("SUM(profit)").Row().Scan(&analytics.TotalTradeProfit)
	
	// Active contracts
	var contractCount int64
	s.db.Model(&models.CargoContract{}).Where("status = ?", "open").Count(&contractCount)
	analytics.ActiveContracts = int(contractCount)

	return analytics, nil
}
