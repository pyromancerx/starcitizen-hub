# app/schemas/notification.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.notification import NotificationType, NotificationPriority


class NotificationBase(BaseModel):
    type: NotificationType
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    link: Optional[str] = Field(None, max_length=500)
    data: Optional[dict] = None
    priority: NotificationPriority = NotificationPriority.NORMAL


class NotificationCreate(NotificationBase):
    user_id: int
    triggered_by_id: Optional[int] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    read_at: Optional[datetime] = None
    triggered_by_id: Optional[int] = None
    triggered_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Response for notification list with pagination."""
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int
    has_more: bool


class NotificationPreferenceBase(BaseModel):
    notifications_enabled: bool = True
    enabled_types: Optional[List[NotificationType]] = None
    disabled_types: List[NotificationType] = []


class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass


class NotificationPreferenceUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    enabled_types: Optional[List[NotificationType]] = None
    disabled_types: Optional[List[NotificationType]] = None


class NotificationPreferenceResponse(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = None  # If None, mark all as read


class UnreadCountResponse(BaseModel):
    count: int
    has_unread: bool
