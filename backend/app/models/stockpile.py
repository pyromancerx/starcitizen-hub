# app/models/stockpile.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, JSON, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ResourceType(str, Enum):
    ORE = "ore"
    GAS = "gas"
    FUEL = "fuel"
    MEDICAL = "medical"
    FOOD = "food"
    COMPONENTS = "components"
    WEAPONS = "weapons"
    ARMOR = "armor"
    SALVAGE = "salvage"
    OTHER = "other"


class OrgStockpile(Base):
    __tablename__ = "org_stockpiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[ResourceType] = mapped_column(String(50))
    quantity: Mapped[float] = mapped_column(Float, default=0)
    unit: Mapped[str] = mapped_column(String(50), default="units")
    min_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    transactions: Mapped[list["StockpileTransaction"]] = relationship(back_populates="stockpile", cascade="all, delete-orphan")


class StockpileTransaction(Base):
    __tablename__ = "stockpile_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    stockpile_id: Mapped[int] = mapped_column(ForeignKey("org_stockpiles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    quantity_change: Mapped[float] = mapped_column(Float)
    transaction_type: Mapped[str] = mapped_column(String(50))
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    stockpile: Mapped["OrgStockpile"] = relationship(back_populates="transactions")
    user: Mapped[Optional["User"]] = relationship()
