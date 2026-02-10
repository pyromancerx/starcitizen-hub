# backend/app/schemas/operation.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field # Import Field
from app.models.event import OperationType, OperationStatus

class OperationBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: OperationType = OperationType.OTHER
    scheduled_at: datetime
    estimated_duration: Optional[int] = None
    max_participants: Optional[int] = None
    requirements: Optional[str] = None
    required_roles: Optional[List[str]] = Field(default_factory=list) # New field
    required_ship_types: Optional[List[str]] = Field(default_factory=list) # New field

class OperationCreate(OperationBase):
    pass

class OperationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[OperationType] = None
    scheduled_at: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    status: Optional[OperationStatus] = None
    max_participants: Optional[int] = None
    requirements: Optional[str] = None
    required_roles: Optional[List[str]] = None # New field
    required_ship_types: Optional[List[str]] = None # New field

class ParticipantResponse(BaseModel):
    id: int
    user_id: int
    display_name: str
    ship_name: Optional[str] = None
    role_preference: Optional[str] = None
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True

class OperationResponse(OperationBase):
    id: int
    status: OperationStatus
    created_by_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
