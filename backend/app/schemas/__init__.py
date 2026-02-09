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
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
)
from app.schemas.forum import (
    ForumCategoryCreate, ForumCategoryUpdate, ForumCategoryResponse,
    ForumThreadCreate, ForumThreadUpdate, ForumThreadResponse, ForumThreadDetail,
    ForumPostCreate, ForumPostUpdate, ForumPostResponse,
)
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventDetail,
    EventSignupCreate, EventSignupUpdate, EventSignupResponse,
)
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetail,
    ProjectPhaseCreate, ProjectPhaseUpdate, ProjectPhaseResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    ContributionGoalCreate, ContributionGoalUpdate, ContributionGoalResponse,
    ContributionCreate, ContributionResponse
)
from app.schemas.federation import (
    PeeredInstanceCreate, PeeredInstanceUpdate, PeeredInstanceResponse,
    FederatedEventCreate, FederatedEventResponse,
    TradeRequestCreate, TradeRequestResponse
)
from app.schemas.system import (
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse, ThemeSettings
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
    "AnnouncementCreate", "AnnouncementUpdate", "AnnouncementResponse",
    "ForumCategoryCreate", "ForumCategoryUpdate", "ForumCategoryResponse",
    "ForumThreadCreate", "ForumThreadUpdate", "ForumThreadResponse", "ForumThreadDetail",
    "ForumPostCreate", "ForumPostUpdate", "ForumPostResponse",
    "EventCreate", "EventUpdate", "EventResponse", "EventDetail",
    "EventSignupCreate", "EventSignupUpdate", "EventSignupResponse",
    "ProjectCreate", "ProjectUpdate", "ProjectResponse", "ProjectDetail",
    "ProjectPhaseCreate", "ProjectPhaseUpdate", "ProjectPhaseResponse",
    "TaskCreate", "TaskUpdate", "TaskResponse",
    "ContributionGoalCreate", "ContributionGoalUpdate", "ContributionGoalResponse",
    "ContributionCreate", "ContributionResponse",
    "PeeredInstanceCreate", "PeeredInstanceUpdate", "PeeredInstanceResponse",
    "FederatedEventCreate", "FederatedEventResponse",
    "TradeRequestCreate", "TradeRequestResponse",
    "SystemSettingCreate", "SystemSettingUpdate", "SystemSettingResponse", "ThemeSettings",
]