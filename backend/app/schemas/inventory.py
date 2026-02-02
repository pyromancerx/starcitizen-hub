# app/schemas/inventory.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.inventory import ItemType


class InventoryItemBase(BaseModel):
    item_type: ItemType
    item_name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(default=1, ge=0)
    location: Optional[str] = Field(None, max_length=200)
    custom_attributes: Optional[dict] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    item_type: Optional[ItemType] = None
    item_name: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=200)
    custom_attributes: Optional[dict] = None


class InventoryItemResponse(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: Optional[datetime] = None


class InventoryAdjustment(BaseModel):
    """Schema for adjusting item quantity."""
    quantity_change: int = Field(..., description="Positive to add, negative to remove")
    reason: Optional[str] = Field(None, max_length=500)
