package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type LogisticsService struct {
	DB             *gorm.DB
	discordService *DiscordService
}

func NewLogisticsService() *LogisticsService {
	return &LogisticsService{
		DB:             database.DB,
		discordService: NewDiscordService(database.DB),
	}
}

// Stockpiles
func (s *LogisticsService) ListStockpiles() ([]models.OrgStockpile, error) {
	var stockpiles []models.OrgStockpile
	err := s.DB.Find(&stockpiles).Error
	return stockpiles, err
}

func (s *LogisticsService) GetStockpile(id uint) (*models.OrgStockpile, error) {
	var stockpile models.OrgStockpile
	err := s.DB.Preload("Transactions").First(&stockpile, id).Error
	return &stockpile, err
}

func (s *LogisticsService) CreateStockpileTransaction(tx *models.StockpileTransaction) error {
	return s.DB.Transaction(func(dbTx *gorm.DB) error {
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
	return s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create the associated Event
		event := models.Event{
			Title:       op.Title,
			Description: op.Description,
			StartTime:   op.ScheduledAt,
			Type:        "Operation",
			CreatedByID: op.CreatedByID,
		}
		if err := tx.Create(&event).Error; err != nil {
			return err
		}

		// 2. Link Event to Operation and Create Operation
		op.EventID = &event.ID
		if err := tx.Create(op).Error; err != nil {
			return err
		}

		// Trigger Discord Relay (in background)
		go func() {
			s.discordService.RelayOperation(op)
		}()

		return nil
	})
}

// Operations
func (s *LogisticsService) ListOperations(status []string) ([]models.Operation, error) {
	var ops []models.Operation
	query := s.DB.Order("scheduled_at asc")
	if len(status) > 0 {
		query = query.Where("status IN ?", status)
	}
	err := query.Find(&ops).Error
	return ops, err
}

func (s *LogisticsService) GetOperation(id uint) (*models.Operation, error) {
	var op models.Operation
	err := s.DB.Preload("Participants.User").Preload("Participants.Ship").First(&op, id).Error
	return &op, err
}

func (s *LogisticsService) SignupForOperation(participant *models.OperationParticipant) error {
	// Check if already signed up
	var count int64
	s.DB.Model(&models.OperationParticipant{}).
		Where("operation_id = ? AND user_id = ?", participant.OperationID, participant.UserID).
		Count(&count)
	if count > 0 {
		return errors.New("already signed up for this operation")
	}

	return s.DB.Create(participant).Error
}

// Projects
func (s *LogisticsService) ListProjects() ([]models.Project, error) {
	var projects []models.Project
	err := s.DB.Order("created_at desc").Find(&projects).Error
	return projects, err
}

func (s *LogisticsService) GetProject(id uint) (*models.Project, error) {
	var project models.Project
	err := s.DB.Preload("Phases.Tasks").Preload("ContributionGoals.Contributions").First(&project, id).Error
	return &project, err
}

// Trade
func (s *LogisticsService) CreateTradeRun(run *models.TradeRun) error {
	return s.DB.Create(run).Error
}

func (s *LogisticsService) ListTradeRuns(userID uint) ([]models.TradeRun, error) {
	var runs []models.TradeRun
	err := s.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&runs).Error
	return runs, err
}

// Crew Finder
func (s *LogisticsService) CreateCrewPost(post *models.CrewPost) error {
	return s.DB.Create(post).Error
}

func (s *LogisticsService) ListCrewPosts() ([]models.CrewPost, error) {
	var posts []models.CrewPost
	err := s.DB.Preload("User").Preload("Ship").Where("status = ?", "active").Order("created_at desc").Find(&posts).Error
	return posts, err
}

func (s *LogisticsService) ListCargoContracts(status string) ([]models.CargoContract, error) {
	var contracts []models.CargoContract
	query := s.DB
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&contracts).Error
	return contracts, err
}

func (s *LogisticsService) CreateCargoContract(contract *models.CargoContract) error {
	return s.DB.Create(contract).Error
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
	s.DB.Table("org_treasuries").Select("SUM(balance_auec)").Row().Scan(&analytics.TotalCredits)
	
	// Total profit from Trade Runs
	s.DB.Table("trade_runs").Select("SUM(profit)").Row().Scan(&analytics.TotalTradeProfit)
	
	// Active contracts
	var contractCount int64
	s.DB.Model(&models.CargoContract{}).Where("status = ?", "open").Count(&contractCount)
	analytics.ActiveContracts = int(contractCount)

	return analytics, nil
}
