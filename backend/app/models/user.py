# app/models/user.py
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.role import UserRole
    from app.models.notification import Notification, NotificationPreference
    from app.models.achievement import UserAchievement, Achievement
    from app.models.message import Conversation, Message
    from app.models.discord import UserDiscordLink
    from app.models.rsi import RSIVerificationRequest
    from app.models.privacy import UserPrivacy
    from app.models.audit import AuditLog
    from app.models.trade import CargoContract, TradeRun, PriceReport
    from app.models.treasury import OrgTreasury, TreasuryTransaction
    from app.models.ship import Ship
    from app.models.wallet import Wallet
    from app.models.inventory import PersonalInventory
    from app.models.stockpile import StockpileTransaction
    from app.models.project import Project, Task, Contribution
    from app.models.forum import ForumThread, ForumPost
    from app.models.event import Event, EventSignup, Operation, OperationParticipant
    from app.models.activity import Activity
    from app.models.crew import LFGPost, LFGResponse, UserAvailability, CrewLoadout


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
    user_roles: Mapped[list["UserRole"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="UserRole.user_id"
    )
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
        "UserAchievement",
        back_populates="user",
        cascade="all, delete-orphan",
        primaryjoin="User.id == UserAchievement.user_id",
        foreign_keys="UserAchievement.user_id"
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
    privacy: Mapped[Optional["UserPrivacy"]] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    activities: Mapped[list["Activity"]] = relationship(
        "Activity",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    lfg_posts: Mapped[list["LFGPost"]] = relationship(
        "LFGPost",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    lfg_responses: Mapped[list["LFGResponse"]] = relationship(
        "LFGResponse",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    availabilities: Mapped[list["UserAvailability"]] = relationship(
        "UserAvailability",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    crew_loadouts: Mapped[list["CrewLoadout"]] = relationship(
        "CrewLoadout",
        back_populates="creator",
        cascade="all, delete-orphan"
    )

    # Cargo Contracts
    posted_contracts: Mapped[list["CargoContract"]] = relationship(
        "CargoContract",
        back_populates="poster",
        foreign_keys="CargoContract.poster_id",
        cascade="all, delete-orphan"
    )
    accepted_contracts: Mapped[list["CargoContract"]] = relationship(
        "CargoContract",
        back_populates="hauler",
        foreign_keys="CargoContract.hauler_id"
    )
    trade_runs: Mapped[list["TradeRun"]] = relationship(
        "TradeRun",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    price_reports: Mapped[list["PriceReport"]] = relationship(
        "PriceReport",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Other assets
    ships: Mapped[list["Ship"]] = relationship(
        "Ship",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    inventory: Mapped[list["PersonalInventory"]] = relationship(
        "PersonalInventory",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    wallet: Mapped[Optional["Wallet"]] = relationship(
        "Wallet",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    stockpile_transactions: Mapped[list["StockpileTransaction"]] = relationship(
        "StockpileTransaction",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    managed_projects: Mapped[list["Project"]] = relationship(
        "Project",
        back_populates="manager",
        cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="assignee",
        cascade="all, delete-orphan"
    )
    contributions: Mapped[list["Contribution"]] = relationship(
        "Contribution",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    forum_threads: Mapped[list["ForumThread"]] = relationship(
        "ForumThread",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    forum_posts: Mapped[list["ForumPost"]] = relationship(
        "ForumPost",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    organized_events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="organizer",
        cascade="all, delete-orphan"
    )
    event_signups: Mapped[list["EventSignup"]] = relationship(
        "EventSignup",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    created_operations: Mapped[list["Operation"]] = relationship(
        "Operation",
        back_populates="creator",
        cascade="all, delete-orphan"
    )
    operation_participations: Mapped[list["OperationParticipant"]] = relationship(
        "OperationParticipant",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    treasury_transactions: Mapped[list["TreasuryTransaction"]] = relationship(
        "TreasuryTransaction",
        back_populates="user",
        foreign_keys="TreasuryTransaction.user_id",
        cascade="all, delete-orphan"
    )
    approved_treasury_transactions: Mapped[list["TreasuryTransaction"]] = relationship(
        "TreasuryTransaction",
        back_populates="approved_by",
        foreign_keys="TreasuryTransaction.approved_by_id"
    )
    created_achievements: Mapped[list["Achievement"]] = relationship(
        "Achievement",
        back_populates="created_by"
    )
