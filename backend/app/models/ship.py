# app/models/ship.py
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Ship(Base):
    __tablename__ = "ships"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    ship_type: Mapped[str] = mapped_column(String(200))
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    insurance_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    insurance_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    loadout: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ready", server_default="ready")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)
