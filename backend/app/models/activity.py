# app/models/activity.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ActivityType(str, Enum):
    """Types of activities that can be tracked in the feed."""
    MEMBER_JOINED = "member_joined"
    MEMBER_APPROVED = "member_approved"
    OPERATION_CREATED = "operation_created"
    OPERATION_COMPLETED = "operation_completed"
    SHIP_ADDED = "ship_added"
    TRADE_COMPLETED = "trade_completed"
    CONTRACT_POSTED = "contract_posted"
    CONTRACT_COMPLETED = "contract_completed"
    ANNOUNCEMENT_POSTED = "announcement_posted"
    PROJECT_CREATED = "project_created"
    PROJECT_COMPLETED = "project_completed"
    CONTRIBUTION_MADE = "contribution_made"
    ACHIEVEMENT_EARNED = "achievement_earned"
    LFG_POSTED = "lfg_posted"
    PRICE_REPORTED = "price_reported"


class Activity(Base):
    """Activity feed entries tracking org-wide events."""
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ActivityType] = mapped_column(SQLEnum(ActivityType), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Content stored as JSON for flexibility
    content: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    
    # Optional link to related entity
    related_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    related_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship()


class ActivityReaction(Base):
    """Emoji reactions to activities."""
    __tablename__ = "activity_reactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    emoji: Mapped[str] = mapped_column(String(10))  # Store emoji character(s)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
    # Relationships
    activity: Mapped["Activity"] = relationship(back_populates="reactions")


# Add reactions relationship to Activity model
Activity.reactions: Mapped[list["ActivityReaction"]] = relationship(
    back_populates="activity",
    cascade="all, delete-orphan",
    lazy="selectin"
)