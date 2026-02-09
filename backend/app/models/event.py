from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.user import User

class EventType(str, Enum):
    OPERATION = "operation"
    TRAINING = "training"
    MEETING = "meeting"
    SOCIAL = "social"
    OTHER = "other"

class EventStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SignupStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    TENTATIVE = "tentative"
    WAITLIST = "waitlist"

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    event_type: Mapped[EventType] = mapped_column(String(50), default=EventType.OTHER)
    status: Mapped[EventStatus] = mapped_column(String(50), default=EventStatus.DRAFT)
    
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    organizer: Mapped["User"] = relationship("User")
    signups: Mapped[List["EventSignup"]] = relationship(back_populates="event", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class EventSignup(Base):
    __tablename__ = "event_signups"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    status: Mapped[SignupStatus] = mapped_column(String(50), default=SignupStatus.PENDING)
    role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Fighter Pilot", "Medic"
    
    event: Mapped["Event"] = relationship(back_populates="signups")
    user: Mapped["User"] = relationship("User")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
