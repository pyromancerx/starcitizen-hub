# app/models/user.py
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.notification import Notification, NotificationPreference
    from app.models.achievement import UserAchievement
    from app.models.message import Conversation, Message
    from app.models.discord import UserDiscordLink
    from app.models.rsi import RSIVerificationRequest


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    rsi_handle: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    is_rsi_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    # Relationships
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Notification.user_id"
    )
    notification_preference: Mapped[Optional["NotificationPreference"]] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    conversations_as_user1: Mapped[list["Conversation"]] = relationship(
        back_populates="user1",
        foreign_keys="Conversation.user1_id",
        cascade="all, delete-orphan"
    )
    conversations_as_user2: Mapped[list["Conversation"]] = relationship(
        back_populates="user2",
        foreign_keys="Conversation.user2_id",
        cascade="all, delete-orphan"
    )
    discord_link: Mapped[Optional["UserDiscordLink"]] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    verification_requests: Mapped[list["RSIVerificationRequest"]] = relationship(
        back_populates="user",
        foreign_keys="RSIVerificationRequest.user_id",
        cascade="all, delete-orphan"
    )
