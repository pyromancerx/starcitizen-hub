# app/models/trade.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ContractStatus(str, Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class TradeRun(Base):
    __tablename__ = "trade_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ship_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ships.id", ondelete="SET NULL"), nullable=True)

    origin_location: Mapped[str] = mapped_column(String(200))
    destination_location: Mapped[str] = mapped_column(String(200))
    commodity: Mapped[str] = mapped_column(String(100))
    quantity: Mapped[float] = mapped_column(Float)  # SCU
    
    buy_price_per_unit: Mapped[float] = mapped_column(Float)
    sell_price_per_unit: Mapped[float] = mapped_column(Float)
    
    # Profit is calculated, but storing it allows for faster queries/stats without re-calc
    profit: Mapped[float] = mapped_column(Float) 
    
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User")
    ship = relationship("Ship")


class PriceReport(Base):
    __tablename__ = "price_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    location: Mapped[str] = mapped_column(String(200), index=True)
    commodity: Mapped[str] = mapped_column(String(100), index=True)
    
    buy_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sell_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")


class CargoContract(Base):
    __tablename__ = "cargo_contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    poster_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    hauler_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    origin_location: Mapped[str] = mapped_column(String(200))
    destination_location: Mapped[str] = mapped_column(String(200))
    commodity: Mapped[str] = mapped_column(String(100))
    quantity: Mapped[float] = mapped_column(Float)
    
    payment_amount: Mapped[int] = mapped_column(Integer)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    status: Mapped[ContractStatus] = mapped_column(SQLEnum(ContractStatus), default=ContractStatus.OPEN, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    poster = relationship("User", foreign_keys=[poster_id], back_populates="posted_contracts")
    hauler = relationship("User", foreign_keys=[hauler_id], back_populates="accepted_contracts")
