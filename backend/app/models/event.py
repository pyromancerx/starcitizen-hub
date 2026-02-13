# app/models/event.py (Updating to include Operation details)
from datetime import datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, Boolean, JSON, func # Import JSON and func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User

class OperationType(str, Enum):
    MINING = "mining"
    CARGO = "cargo"
    COMBAT = "combat"
    EXPLORATION = "exploration"
    SOCIAL = "social"
    SALVAGE = "salvage"
    OTHER = "other"

class OperationStatus(str, Enum):
    PLANNING = "planning"
    RECRUITING = "recruiting"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventType(str, Enum):
    MINING = "mining"
    CARGO = "cargo"
    COMBAT = "combat"
    EXPLORATION = "exploration"
    SOCIAL = "social"
    OTHER = "other"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class SignupStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    WAITLISTED = "waitlisted"
    CANCELLED = "cancelled"

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    event_type: Mapped[EventType] = mapped_column(SQLEnum(EventType), default=EventType.OTHER)
    status: Mapped[EventStatus] = mapped_column(SQLEnum(EventStatus), default=EventStatus.DRAFT)
    
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    organizer = relationship("User")
    signups = relationship("EventSignup", back_populates="event", cascade="all, delete-orphan")

class EventSignup(Base):
    __tablename__ = "event_signups"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    status: Mapped[SignupStatus] = mapped_column(SQLEnum(SignupStatus), default=SignupStatus.PENDING)
    role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    event = relationship("Event", back_populates="signups")
    user = relationship("User")

class Operation(Base):
    __tablename__ = "operations"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text)
    type: Mapped[OperationType] = mapped_column(SQLEnum(OperationType), default=OperationType.OTHER)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    estimated_duration: Mapped[Optional[int]] = mapped_column(Integer)  # In minutes
    status: Mapped[OperationStatus] = mapped_column(SQLEnum(OperationStatus), default=OperationStatus.PLANNING)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer)
    requirements: Mapped[Optional[str]] = mapped_column(Text)
    required_roles: Mapped[List[str]] = mapped_column(JSON, default=list) # New field
    required_ship_types: Mapped[List[str]] = mapped_column(JSON, default=list) # New field
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator: Mapped["User"] = relationship()
    participants: Mapped[List["OperationParticipant"]] = relationship(back_populates="operation")

class OperationParticipant(Base):
    __tablename__ = "operation_participants"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    operation_id: Mapped[int] = mapped_column(ForeignKey("operations.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    ship_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ships.id"), nullable=True)
    role_preference: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="signed_up")  # signed_up, confirmed, waitlisted
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    operation: Mapped["Operation"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship()
    # ship: Mapped[Optional["Ship"]] = relationship() # Need to check ship model