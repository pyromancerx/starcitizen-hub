# app/models/treasury.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"

class TransactionCategory(str, Enum):
    OPERATION_PAYOUT = "operation_payout"
    STOCKPILE_PURCHASE = "stockpile_purchase"
    DONATION = "donation"
    TAX = "tax"
    OTHER = "other"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class OrgTreasury(Base):
    __tablename__ = "org_treasury"

    id: Mapped[int] = mapped_column(primary_key=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class TreasuryTransaction(Base):
    __tablename__ = "treasury_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    treasury_id: Mapped[int] = mapped_column(ForeignKey("org_treasury.id"), default=1) # Assuming single treasury for now
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) # Who initiated/requested
    
    amount: Mapped[int] = mapped_column(Integer) # Positive for deposit, negative for withdrawal? Or separate type?
    # Let's use type to determine direction. Amount always positive.
    
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType))
    category: Mapped[TransactionCategory] = mapped_column(SQLEnum(TransactionCategory))
    status: Mapped[TransactionStatus] = mapped_column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    approved_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    approved_by: Mapped["User"] = relationship(foreign_keys=[approved_by_id])
