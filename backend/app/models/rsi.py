# app/models/rsi.py
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class RSIVerificationRequest(Base):
    __tablename__ = "rsi_verification_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rsi_handle: Mapped[str] = mapped_column(String(100))
    screenshot_url: Mapped[str] = mapped_column(String(500))
    verification_code: Mapped[str] = mapped_column(String(50))
    status: Mapped[VerificationStatus] = mapped_column(
        String(20),
        default=VerificationStatus.PENDING
    )
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reviewed_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(
        back_populates="verification_requests",
        foreign_keys="RSIVerificationRequest.user_id"
    )
    reviewed_by: Mapped[Optional["User"]] = relationship(
        foreign_keys="RSIVerificationRequest.reviewed_by_id"
    )
