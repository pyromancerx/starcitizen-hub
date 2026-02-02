# app/schemas/wallet.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class WalletBase(BaseModel):
    balance_auec: int = Field(default=0, ge=0)


class WalletCreate(WalletBase):
    pass


class WalletResponse(WalletBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    last_updated_at: Optional[datetime] = None


class WalletTransactionBase(BaseModel):
    amount: int = Field(..., description="Positive for credits, negative for debits")
    transaction_type: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)


class WalletTransactionCreate(WalletTransactionBase):
    pass


class WalletTransactionResponse(WalletTransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_id: int
    created_at: Optional[datetime] = None


class WalletWithTransactions(WalletResponse):
    """Wallet with recent transactions included."""
    recent_transactions: List[WalletTransactionResponse] = []


class TransferRequest(BaseModel):
    """Request to transfer funds to another user."""
    recipient_user_id: int = Field(..., gt=0)
    amount: int = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=500)
