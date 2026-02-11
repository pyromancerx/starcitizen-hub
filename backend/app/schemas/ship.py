# app/schemas/ship.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ShipBase(BaseModel):
    ship_type: str = Field(..., min_length=1, max_length=200)
    name: Optional[str] = Field(None, max_length=200)
    serial_number: Optional[str] = Field(None, max_length=100)
    insurance_status: Optional[str] = Field(None, max_length=50)
    insurance_expires_at: Optional[datetime] = None
    loadout: Optional[dict] = None
    notes: Optional[str] = None
    status: str = Field("ready", max_length=50)
    custom_attributes: Optional[dict] = None


class ShipCreate(ShipBase):
    pass


class ShipUpdate(BaseModel):
    ship_type: Optional[str] = Field(None, min_length=1, max_length=200)
    name: Optional[str] = Field(None, max_length=200)
    serial_number: Optional[str] = Field(None, max_length=100)
    insurance_status: Optional[str] = Field(None, max_length=50)
    insurance_expires_at: Optional[datetime] = None
    loadout: Optional[dict] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    custom_attributes: Optional[dict] = None


class ShipResponse(ShipBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: Optional[datetime] = None
