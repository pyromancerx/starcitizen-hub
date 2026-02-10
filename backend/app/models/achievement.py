# app/models/achievement.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Enum as SQLEnum, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AchievementRarity(str, Enum):
    """Rarity levels for achievements."""
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class AchievementType(str, Enum):
    """Types of achievements based on how they're awarded."""
    SYSTEM = "system"  # Auto-awarded by system
    CUSTOM = "custom"  # Created and awarded manually by admins


class Achievement(Base):
    """Achievement definitions that can be earned by users."""
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(Text)
    
    # Visual elements
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Emoji or icon identifier
    rarity: Mapped[AchievementRarity] = mapped_column(
        SQLEnum(AchievementRarity), 
        default=AchievementRarity.COMMON
    )
    
    # Achievement type
    achievement_type: Mapped[AchievementType] = mapped_column(
        SQLEnum(AchievementType),
        default=AchievementType.CUSTOM
    )
    
    # For system achievements: criteria for auto-award
    # Example: {"trade_runs": 10}, {"contracts_completed": 5}, {"member_days": 30}
    criteria: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Point value for achievement
    points: Mapped[int] = mapped_column(Integer, default=10)
    
    # Who created this achievement (null = system)
    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    created_by: Mapped[Optional["User"]] = relationship()
    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement",
        cascade="all, delete-orphan"
    )


class UserAchievement(Base):
    """Records of achievements earned by users."""
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"),
        index=True
    )
    
    # Who awarded this (null = system auto-award)
    awarded_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Optional note when awarding
    award_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    awarded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id], back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")
    awarded_by: Mapped[Optional["User"]] = relationship(foreign_keys=[awarded_by_id])
