# app/schemas/activity.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.activity import ActivityType


class ActivityReactionBase(BaseModel):
    emoji: str


class ActivityReactionCreate(ActivityReactionBase):
    pass


class ActivityReactionResponse(ActivityReactionBase):
    id: int
    user_id: int
    created_at: datetime
    user_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    type: ActivityType
    content: dict = {}
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    user_display_name: Optional[str] = None
    reactions: List[ActivityReactionResponse] = []
    reaction_count: int = 0

    class Config:
        from_attributes = True


class ActivityFeedResponse(BaseModel):
    """Response for activity feed with pagination."""
    activities: List[ActivityResponse]
    total_count: int
    has_more: bool
    next_cursor: Optional[str] = None


class ActivityFilter(BaseModel):
    """Filter parameters for activity feed."""
    type: Optional[ActivityType] = None
    user_id: Optional[int] = None
    since: Optional[datetime] = None
    limit: int = 20
    offset: int = 0
