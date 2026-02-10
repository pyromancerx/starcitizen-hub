# app/models/privacy.py
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserPrivacy(Base):
    """User privacy settings and data export/deletion tracking."""
    __tablename__ = "user_privacy"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    
    # Privacy settings
    hide_from_leaderboards: Mapped[bool] = mapped_column(Boolean, default=False)
    hide_trade_activity: Mapped[bool] = mapped_column(Boolean, default=False)
    hide_achievements: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_data_export: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Data deletion tracking
    deletion_requested_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deletion_scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deletion_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Export tracking
    last_exported_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    user: Mapped["User"] = relationship(back_populates="privacy")
