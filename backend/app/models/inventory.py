# app/models/inventory.py
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ItemType(str, Enum):
    GEAR = "gear"
    COMPONENT = "component"
    CARGO = "cargo"
    CONSUMABLE = "consumable"


class PersonalInventory(Base):
    __tablename__ = "personal_inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    item_type: Mapped[ItemType] = mapped_column(String(50))
    item_name: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    user: Mapped["User"] = relationship(back_populates="inventory")
