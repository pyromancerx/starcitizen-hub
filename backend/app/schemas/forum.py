from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

# --- Post Schemas ---
class ForumPostBase(BaseModel):
    content: str

class ForumPostCreate(ForumPostBase):
    pass

class ForumPostUpdate(BaseModel):
    content: Optional[str] = None

class ForumPostResponse(ForumPostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_id: int
    author_id: int
    author: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

# --- Thread Schemas ---
class ForumThreadBase(BaseModel):
    title: str = Field(..., max_length=200)
    is_pinned: bool = False
    is_locked: bool = False

class ForumThreadCreate(ForumThreadBase):
    content: str # Initial post content

class ForumThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None

class ForumThreadResponse(ForumThreadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    author_id: int
    view_count: int
    author: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime
    # We might want to include the latest post or post count here in a real app

class ForumThreadDetail(ForumThreadResponse):
    posts: List[ForumPostResponse] = []

# --- Category Schemas ---
class ForumCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: int = 0
    is_private: bool = False

class ForumCategoryCreate(ForumCategoryBase):
    pass

class ForumCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = None
    is_private: Optional[bool] = None

class ForumCategoryResponse(ForumCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
