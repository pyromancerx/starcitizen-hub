from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.event import EventType, EventStatus, SignupStatus
from app.schemas.user import UserResponse

# --- Signup Schemas ---
class EventSignupBase(BaseModel):
    status: SignupStatus = SignupStatus.PENDING
    role: Optional[str] = Field(None, max_length=100)

class EventSignupCreate(BaseModel):
    role: Optional[str] = Field(None, max_length=100)
    # Status is usually pending or confirmed depending on permissions/logic

class EventSignupUpdate(BaseModel):
    status: Optional[SignupStatus] = None
    role: Optional[str] = Field(None, max_length=100)

class EventSignupResponse(EventSignupBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_id: int
    user: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

# --- Event Schemas ---
class EventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    event_type: EventType = EventType.OTHER
    status: EventStatus = EventStatus.DRAFT
    location: Optional[str] = Field(None, max_length=200)
    max_participants: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = None

    @field_validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time' in values.data and v and v < values.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    location: Optional[str] = Field(None, max_length=200)
    max_participants: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class EventResponse(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organizer_id: int
    organizer: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

class EventDetail(EventResponse):
    signups: List[EventSignupResponse] = []
