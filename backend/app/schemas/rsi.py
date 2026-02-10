# app/schemas/rsi.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RSIVerificationRequestBase(BaseModel):
    rsi_handle: str = Field(..., min_length=3, max_length=100)
    screenshot_url: str = Field(..., min_length=10, max_length=500)


class RSIVerificationRequestCreate(RSIVerificationRequestBase):
    pass


class RSIVerificationRequestReview(BaseModel):
    approved: bool
    admin_notes: Optional[str] = Field(None, max_length=500)


class RSIVerificationRequestResponse(BaseModel):
    id: int
    user_id: int
    rsi_handle: str
    screenshot_url: str
    verification_code: str
    status: str
    admin_notes: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by_id: Optional[int]

    class Config:
        from_attributes = True


class RSIVerificationStatus(BaseModel):
    is_verified: bool
    rsi_handle: Optional[str]
    pending_request: Optional[RSIVerificationRequestResponse]
