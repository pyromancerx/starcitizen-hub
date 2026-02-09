from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.treasury import TransactionType, TransactionStatus

class OrgTransactionBase(BaseModel):
    amount: int
    type: TransactionType
    category: Optional[str] = None
    description: Optional[str] = None
    reference_id: Optional[str] = None

class OrgTransactionCreate(OrgTransactionBase):
    pass

class OrgTransactionResponse(OrgTransactionBase):
    id: int
    wallet_id: int
    status: TransactionStatus
    created_by_id: int
    approved_by_id: Optional[int]
    created_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class OrgWalletResponse(BaseModel):
    id: int
    name: str
    balance: int
    description: Optional[str]
    is_primary: bool

    class Config:
        from_attributes = True
