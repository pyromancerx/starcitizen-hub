# app/schemas/message.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    is_me: bool = False

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    pass


class ConversationCreate(BaseModel):
    recipient_id: int
    initial_message: str = Field(..., min_length=1, max_length=2000)


class ConversationResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    other_user_id: int
    other_user_name: Optional[str] = None
    other_user_avatar: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    last_message_sender_id: Optional[int] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total_unread: int


class SendMessageRequest(BaseModel):
    recipient_id: int
    content: str = Field(..., min_length=1, max_length=2000)


class MarkReadRequest(BaseModel):
    message_ids: Optional[List[int]] = None  # If None, mark all as read


class UnreadCountResponse(BaseModel):
    total_unread: int
    has_unread: bool
