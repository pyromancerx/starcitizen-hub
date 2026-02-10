# app/models/notification.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class NotificationType(str, Enum):
    """Types of notifications that can be sent to users."""
    # Social
    MENTION = "mention"
    MESSAGE_RECEIVED = "message_received"
    
    # Operations
    OP_INVITE = "op_invite"
    OP_REMINDER = "op_reminder"
    OP_CANCELLED = "op_cancelled"
    OP_STARTING_SOON = "op_starting_soon"
    
    # Membership
    APPROVAL_REQUIRED = "approval_required"
    USER_APPROVED = "user_approved"
    USER_REJECTED = "user_rejected"
    
    # Contracts
    CONTRACT_ACCEPTED = "contract_accepted"
    CONTRACT_COMPLETED = "contract_completed"
    CONTRACT_CANCELLED = "contract_cancelled"
    CONTRACT_DISPUTED = "contract_disputed"
    
    # Crew
    LFG_RESPONSE = "lfg_response"
    CREW_LOADOUT_ASSIGNED = "crew_loadout_assigned"
    
    # Achievements
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    
    # System
    SYSTEM_ANNOUNCEMENT = "system_announcement"


class NotificationPriority(str, Enum):
    """Priority levels for notifications."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class Notification(Base):
    """User notifications for in-app alerts."""
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    type: Mapped[NotificationType] = mapped_column(SQLEnum(NotificationType), index=True)
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    
    # Optional link to navigate when clicked
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Additional data stored as JSON
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Priority level
    priority: Mapped[NotificationPriority] = mapped_column(
        SQLEnum(NotificationPriority), 
        default=NotificationPriority.NORMAL
    )
    
    # Read status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Who/what triggered this notification
    triggered_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id], back_populates="notifications")
    triggered_by: Mapped[Optional["User"]] = relationship(foreign_keys=[triggered_by_id])


class NotificationPreference(Base):
    """User preferences for notification types."""
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        index=True,
        unique=True
    )
    
    # Store enabled notification types as JSON array
    # If null, all types are enabled (default behavior)
    enabled_types: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Store disabled notification types as JSON array
    disabled_types: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    
    # Global toggle
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="notification_preference")
