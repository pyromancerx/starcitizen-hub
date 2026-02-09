from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str
    is_pinned: bool = False
    is_public: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_public: Optional[bool] = None

class AnnouncementResponse(AnnouncementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
