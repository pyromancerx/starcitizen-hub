# app/models/event.py (Updating to include Operation details)
from datetime import datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, Boolean, JSON # Import JSON
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