package services

import (
	"errors"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type AssetService struct {
	DB *gorm.DB
}

func NewAssetService() *AssetService {
	return &AssetService{
		DB: database.DB,
	}
}

// Ships
func (s *AssetService) ListShips(userID uint) ([]models.Ship, error) {
	var ships []models.Ship
	if err := s.DB.Where("user_id = ?", userID).Find(&ships).Error; err != nil {
		return nil, err
	}

	// Dynamic linking to master database
	for i := range ships {
		if ships[i].Loadout == "" || ships[i].Loadout == "{}" || ships[i].Loadout == "null" {
			var model models.ShipModel
			targetType := ships[i].ShipType
			
			// 1. Exact Match
			err := s.DB.Where("name = ?", targetType).First(&model).Error
			
			// 2. Try adding manufacturer prefix if missing (common in user lists)
			if err != nil {
				err = s.DB.Where("name LIKE ?", "%"+targetType).First(&model).Error
			}
			
			// 3. Try partial name match (e.g., "Cutlass Black" -> "Drake Cutlass Black")
			if err != nil {
				err = s.DB.Where("? LIKE '%' || name || '%'", targetType).First(&model).Error
			}

			if err == nil {
				ships[i].Loadout = model.DefaultLoadout
			}
		}
	}

	return ships, nil
}

func (s *AssetService) CreateShip(ship *models.Ship) error {
	return s.DB.Create(ship).Error
}

func (s *AssetService) UpdateShip(userID uint, shipID uint, updates map[string]interface{}) (*models.Ship, error) {
	var ship models.Ship
	if err := s.DB.Where("id = ? AND user_id = ?", shipID, userID).First(&ship).Error; err != nil {
		return nil, err
	}

	if err := s.DB.Model(&ship).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &ship, nil
}

func (s *AssetService) DeleteShip(userID uint, shipID uint) error {
	result := s.DB.Where("id = ? AND user_id = ?", shipID, userID).Delete(&models.Ship{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("ship not found")
	}
	return nil
}

// Wallet
func (s *AssetService) GetWallet(userID uint) (*models.Wallet, error) {
	var wallet models.Wallet
	err := s.DB.Where("user_id = ?", userID).First(&wallet).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		wallet = models.Wallet{UserID: userID, BalanceAUEC: 0}
		if err := s.DB.Create(&wallet).Error; err != nil {
			return nil, err
		}
		return &wallet, nil
	}
	return &wallet, err
}

func (s *AssetService) GetWalletTransactions(walletID uint, limit int) ([]models.WalletTransaction, error) {
	var transactions []models.WalletTransaction
	err := s.DB.Where("wallet_id = ?", walletID).Order("created_at desc").Limit(limit).Find(&transactions).Error
	return transactions, err
}

func (s *AssetService) ProcessWalletTransaction(userID uint, amount int, description string, txType string) (*models.WalletTransaction, error) {
	var transaction models.WalletTransaction
	
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var wallet models.Wallet
		if err := tx.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				wallet = models.Wallet{UserID: userID, BalanceAUEC: 0}
				if err := tx.Create(&wallet).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		// Check sufficient funds for withdrawal
		if amount < 0 && wallet.BalanceAUEC + amount < 0 {
			return errors.New("insufficient funds")
		}

		wallet.BalanceAUEC += amount
		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		transaction = models.WalletTransaction{
			WalletID:        wallet.ID,
			Amount:          amount,
			Description:     description,
			TransactionType: txType,
		}
		
		return tx.Create(&transaction).Error
	})

	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// Inventory
func (s *AssetService) ListInventory(userID uint) ([]models.PersonalInventory, error) {
	var items []models.PersonalInventory
	err := s.DB.Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (s *AssetService) AddInventoryItem(item *models.PersonalInventory) error {
	return s.DB.Create(item).Error
}

func (s *AssetService) UpdateInventoryItem(userID uint, itemID uint, updates map[string]interface{}) (*models.PersonalInventory, error) {
	var item models.PersonalInventory
	if err := s.DB.Where("id = ? AND user_id = ?", itemID, userID).First(&item).Error; err != nil {
		return nil, err
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

func (s *AssetService) DeleteInventoryItem(userID uint, itemID uint) error {
	result := s.DB.Where("id = ? AND user_id = ?", itemID, userID).Delete(&models.PersonalInventory{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("item not found")
	}
	return nil
}
