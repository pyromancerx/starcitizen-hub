# app/schemas/crew.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.crew import LFGStatus


# === LFG Post Schemas ===

class LFGPostBase(BaseModel):
    ship_type: str = Field(..., min_length=1, max_length=100)
    activity_type: str = Field(..., min_length=1, max_length=50)
    looking_for_roles: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None
    duration_estimate: Optional[int] = Field(None, ge=15, le=480, description="Duration in minutes")
    notes: Optional[str] = Field(None, max_length=1000)


class LFGPostCreate(LFGPostBase):
    expires_hours: Optional[int] = Field(24, ge=1, le=168, description="Hours until post expires")


class LFGPostUpdate(BaseModel):
    status: Optional[LFGStatus] = None
    scheduled_time: Optional[datetime] = None
    notes: Optional[str] = None


class LFGResponseSchema(BaseModel):
    id: int
    user_id: int
    role_offered: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    user_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class LFGPostResponse(LFGPostBase):
    id: int
    user_id: int
    status: LFGStatus
    created_at: datetime
    expires_at: Optional[datetime] = None
    response_count: int = 0
    responses: List[LFGResponseSchema] = []
    user_display_name: Optional[str] = None

    class Config:
        from_attributes = True


# === LFG Response Schemas ===

class LFGResponseCreate(BaseModel):
    role_offered: Optional[str] = Field(None, max_length=50)
    message: Optional[str] = Field(None, max_length=500)


# === Availability Schemas ===

class UserAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM format
    end_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")    # HH:MM format
    timezone: str = Field("UTC", max_length=50)
    is_active: bool = True


class UserAvailabilityCreate(UserAvailabilityBase):
    pass


class UserAvailabilityUpdate(BaseModel):
    start_time: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class UserAvailabilityResponse(UserAvailabilityBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class AvailabilityOverlap(BaseModel):
    """Represents overlapping availability between users."""
    user_id: int
    display_name: Optional[str]
    day_of_week: int
    day_name: str
    start_time: str
    end_time: str
    overlap_start: str
    overlap_end: str
    overlap_minutes: int


class SessionSuggestion(BaseModel):
    """Suggested play session based on availability overlaps."""
    suggested_start: datetime
    suggested_end: datetime
    available_users: List[dict]
    participant_count: int


# === Crew Loadout Schemas ===

class CrewPosition(BaseModel):
    role: str = Field(..., min_length=1, max_length=50)
    user_id: Optional[int] = None
    user_display_name: Optional[str] = None


class CrewLoadoutBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ship_id: Optional[int] = None
    positions: List[CrewPosition] = []
    is_template: bool = False


class CrewLoadoutCreate(CrewLoadoutBase):
    pass


class CrewLoadoutUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    positions: Optional[List[CrewPosition]] = None
    is_template: Optional[bool] = None
    is_active: Optional[bool] = None


class CrewLoadoutResponse(CrewLoadoutBase):
    id: int
    created_by_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    ship_name: Optional[str] = None

    class Config:
        from_attributes = True


class CrewLoadoutQuickDeploy(BaseModel):
    """Request to quick-deploy a loadout with optional substitutions."""
    substitutions: Optional[dict] = Field(None, description="{position_index: user_id}")
