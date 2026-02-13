package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type LogisticsService struct {
	db *gorm.DB
}

func NewLogisticsService() *LogisticsService {
	return &LogisticsService{
		db: database.DB,
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
