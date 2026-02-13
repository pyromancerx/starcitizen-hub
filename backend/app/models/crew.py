# app/models/crew.py
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LFGStatus(str, Enum):
    OPEN = "open"
    FILLED = "filled"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class LFGPost(Base):
    """Looking For Group posts - find crewmates for ships."""
    __tablename__ = "lfg_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    ship_type: Mapped[str] = mapped_column(String(100))
    activity_type: Mapped[str] = mapped_column(String(50))  # mining, cargo, combat, exploration, salvage, social
    looking_for_roles: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # ["pilot", "turret", "engineer"]
    
    scheduled_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_estimate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # in minutes
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[LFGStatus] = mapped_column(SQLEnum(LFGStatus), default=LFGStatus.OPEN, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="lfg_posts")
    responses: Mapped[List["LFGResponse"]] = relationship(back_populates="post", cascade="all, delete-orphan")


class LFGResponse(Base):
    """Responses to LFG posts."""
    __tablename__ = "lfg_responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("lfg_posts.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    role_offered: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post: Mapped["LFGPost"] = relationship(back_populates="responses")
    user: Mapped["User"] = relationship(back_populates="lfg_responses")


class UserAvailability(Base):
    """Weekly availability schedule for users."""
    __tablename__ = "user_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    day_of_week: Mapped[int] = mapped_column(Integer)  # 0=Monday, 6=Sunday
    start_time: Mapped[str] = mapped_column(String(5))  # HH:MM format
    end_time: Mapped[str] = mapped_column(String(5))    # HH:MM format
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="availabilities")


class CrewLoadout(Base):
    """Saved crew configurations for ships."""
    __tablename__ = "crew_loadouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ship_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ships.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Positions: [{"role": "pilot", "user_id": 1}, {"role": "turret", "user_id": 2}]
    positions: Mapped[List[dict]] = mapped_column(JSON, default=list)
    
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)  # Can be used as template for other ships
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator: Mapped["User"] = relationship(foreign_keys="CrewLoadout.created_by_id", back_populates="crew_loadouts")
    ship: Mapped[Optional["Ship"]] = relationship()
