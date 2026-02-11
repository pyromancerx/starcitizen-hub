from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from app.models.treasury import TransactionType, TransactionStatus, TransactionCategory


class WalletBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class WalletCreate(WalletBase):
    is_primary: bool = False


class WalletUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_primary: Optional[bool] = None


class WalletResponse(WalletBase):
    id: int
    balance: int
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreasuryTransactionBase(BaseModel):
    amount: int = Field(..., gt=0)
    type: TransactionType
    category: TransactionCategory = TransactionCategory.OTHER
    description: Optional[str] = Field(None, max_length=500)


class TreasuryTransactionCreate(TreasuryTransactionBase):
    pass


class TreasuryTransactionResponse(TreasuryTransactionBase):
    id: int
    treasury_id: int
    user_id: int
    status: TransactionStatus
    approved_by_id: Optional[int]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class WalletWithTransactions(WalletResponse):
    transactions: List[TreasuryTransactionResponse]


class TransactionFilter(BaseModel):
    type: Optional[TransactionType] = None
    status: Optional[TransactionStatus] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)


class TransactionApproval(BaseModel):
    approved: bool
    notes: Optional[str] = Field(None, max_length=500)


class TreasuryReport(BaseModel):
    period_days: int
    total_income: int
    total_expenses: int
    net_change: int
    by_category: Dict[str, Dict[str, int]]
    daily_history: List[Dict[str, int]]
    transaction_count: int

    class Config:
        from_attributes = True
