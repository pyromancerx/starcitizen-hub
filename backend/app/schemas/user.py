# app/schemas/user.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    rsi_handle: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


# NEW SCHEMA FOR INVITE
class UserInviteCreate(BaseModel):
    email: EmailStr
    role_id: Optional[int] = None # Optional role to assign


class UserUpdate(BaseModel):
    rsi_handle: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    custom_attributes: Optional[dict] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_approved: bool
    last_seen_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class UserWithRoles(UserResponse):
    roles: list[str] = []
    permissions: list[str] = []

class PasswordUpdateAdmin(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=100)
