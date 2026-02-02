# app/schemas/stockpile.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.stockpile import ResourceType


class StockpileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    resource_type: ResourceType
    quantity: float = 0
    unit: str = Field(default="units", max_length=50)
    min_threshold: Optional[float] = None
    custom_attributes: Optional[dict] = None


class StockpileCreate(StockpileBase):
    pass


class StockpileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    resource_type: Optional[ResourceType] = None
    quantity: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=50)
    min_threshold: Optional[float] = None
    custom_attributes: Optional[dict] = None


class StockpileResponse(StockpileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StockpileTransactionBase(BaseModel):
    quantity_change: float
    transaction_type: str = Field(..., max_length=50)
    reason: Optional[str] = None


class StockpileTransactionCreate(StockpileTransactionBase):
    pass


class StockpileTransactionResponse(StockpileTransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stockpile_id: int
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
