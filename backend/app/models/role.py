# app/models/role.py
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.discord import DiscordRoleMapping


class RoleTier(str, Enum):
    RECRUIT = "recruit"
    MEMBER = "member"
    OFFICER = "officer"
    ADMIN = "admin"
    CUSTOM = "custom"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    tier: Mapped[RoleTier] = mapped_column(String(20), default=RoleTier.CUSTOM)
    permissions: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    user_roles: Mapped[List["UserRole"]] = relationship(back_populates="role")
    discord_mappings: Mapped[List["DiscordRoleMapping"]] = relationship(back_populates="hub_role", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), index=True)
    granted_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    role: Mapped["Role"] = relationship(back_populates="user_roles")
    user: Mapped["User"] = relationship(foreign_keys="UserRole.user_id", back_populates="user_roles")
    granter: Mapped[Optional["User"]] = relationship(foreign_keys="UserRole.granted_by")
