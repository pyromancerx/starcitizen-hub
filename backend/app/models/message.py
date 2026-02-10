# app/models/message.py
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Conversation(Base):
    """A conversation between two users."""
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Participants (always 2 users for 1-on-1 messaging)
    user1_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user2_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Last message info for quick listing
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    last_message_preview: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_message_sender_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Track unread counts for each participant
    unread_count_user1: Mapped[int] = mapped_column(default=0)
    unread_count_user2: Mapped[int] = mapped_column(default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user1: Mapped["User"] = relationship(foreign_keys=[user1_id], back_populates="conversations_as_user1")
    user2: Mapped["User"] = relationship(foreign_keys=[user2_id], back_populates="conversations_as_user2")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )
    
    # Composite index for efficient lookups
    __table_args__ = (
        Index('ix_conversation_participants', 'user1_id', 'user2_id', unique=True),
    )


class Message(Base):
    """Individual messages within a conversation."""
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        index=True
    )
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    content: Mapped[str] = mapped_column(Text)
    
    # Message status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Soft delete (users can delete messages for themselves)
    deleted_by_sender: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_by_recipient: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
    # Relationships
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(foreign_keys=[sender_id])
