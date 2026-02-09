from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class PeerStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    BLOCKED = "blocked"
    UNREACHABLE = "unreachable"

class TradeRequestStatus(str, Enum):
    OPEN = "open"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class PeeredInstance(Base):
    __tablename__ = "peered_instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    base_url: Mapped[str] = mapped_column(String(500), unique=True)
    api_key: Mapped[str] = mapped_column(String(100)) # Shared secret for HMAC
    public_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # For future use
    
    status: Mapped[PeerStatus] = mapped_column(String(50), default=PeerStatus.PENDING)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    federated_events: Mapped[List["FederatedEvent"]] = relationship(back_populates="source_instance", cascade="all, delete-orphan")
    trade_requests: Mapped[List["TradeRequest"]] = relationship(back_populates="source_instance", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class FederatedEvent(Base):
    __tablename__ = "federated_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_instance_id: Mapped[int] = mapped_column(ForeignKey("peered_instances.id", ondelete="CASCADE"), index=True)
    remote_event_id: Mapped[int] = mapped_column(Integer) # ID on the remote system
    
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime)
    event_type: Mapped[str] = mapped_column(String(50))
    
    source_url: Mapped[str] = mapped_column(String(500)) # Direct link to event
    
    source_instance: Mapped["PeeredInstance"] = relationship(back_populates="federated_events")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class TradeRequest(Base):
    __tablename__ = "trade_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_instance_id: Mapped[int] = mapped_column(ForeignKey("peered_instances.id", ondelete="CASCADE"), index=True)
    
    resource_type: Mapped[str] = mapped_column(String(50))
    amount: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20))
    price_per_unit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    status: Mapped[TradeRequestStatus] = mapped_column(String(50), default=TradeRequestStatus.OPEN)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    source_instance: Mapped["PeeredInstance"] = relationship(back_populates="trade_requests")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
