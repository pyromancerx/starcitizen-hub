# app/schemas/__init__.py
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserWithRoles
from app.schemas.stockpile import (
    StockpileCreate,
    StockpileUpdate,
    StockpileResponse,
    StockpileTransactionCreate,
    StockpileTransactionResponse,
)
from app.schemas.ship import ShipCreate, ShipUpdate, ShipResponse
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryAdjustment,
)
from app.schemas.wallet import (
    WalletResponse,
    WalletTransactionCreate,
    WalletTransactionResponse,
    WalletWithTransactions,
    TransferRequest,
)

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserWithRoles",
    "StockpileCreate", "StockpileUpdate", "StockpileResponse",
    "StockpileTransactionCreate", "StockpileTransactionResponse",
    "ShipCreate", "ShipUpdate", "ShipResponse",
    "InventoryItemCreate", "InventoryItemUpdate", "InventoryItemResponse",
    "InventoryAdjustment",
    "WalletResponse", "WalletTransactionCreate", "WalletTransactionResponse",
    "WalletWithTransactions", "TransferRequest",
]
