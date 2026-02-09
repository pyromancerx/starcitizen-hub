from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.trade import ContractStatus

# Trade Run Schemas
class TradeRunBase(BaseModel):
    origin_location: str
    destination_location: str
    commodity: str
    quantity: int = Field(gt=0, description="Quantity in SCU")
    buy_price: int = Field(gt=0, description="Total buy price in aUEC")
    sell_price: int = Field(gt=0, description="Total sell price in aUEC")
    ship_id: Optional[int] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

class TradeRunCreate(TradeRunBase):
    pass

class TradeRunUpdate(BaseModel):
    origin_location: Optional[str] = None
    destination_location: Optional[str] = None
    commodity: Optional[str] = None
    quantity: Optional[int] = None
    buy_price: Optional[int] = None
    sell_price: Optional[int] = None
    ship_id: Optional[int] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

class TradeRunResponse(TradeRunBase):
    id: int
    user_id: int
    profit: int
    created_at: datetime

    class Config:
        from_attributes = True

# Price Report Schemas
class PriceReportBase(BaseModel):
    location: str
    commodity: str
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None

class PriceReportCreate(PriceReportBase):
    pass

class PriceReportResponse(PriceReportBase):
    id: int
    user_id: int
    reported_at: datetime

    class Config:
        from_attributes = True

# Cargo Contract Schemas
class CargoContractBase(BaseModel):
    origin: str
    destination: str
    commodity: str
    quantity: int = Field(gt=0, description="Quantity in SCU")
    payment_amount: int = Field(gt=0, description="Payment in aUEC")
    deadline: Optional[datetime] = None
    description: Optional[str] = None

class CargoContractCreate(CargoContractBase):
    pass

class CargoContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    hauler_id: Optional[int] = None
    completed_at: Optional[datetime] = None

class CargoContractResponse(CargoContractBase):
    id: int
    poster_id: int
    hauler_id: Optional[int] = None
    status: ContractStatus
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
