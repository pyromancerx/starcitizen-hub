from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from app.models.federation import PeerStatus, TradeRequestStatus

# --- Peer Schemas ---
class PeeredInstanceBase(BaseModel):
    name: str = Field(..., max_length=200)
    base_url: HttpUrl
    status: PeerStatus = PeerStatus.PENDING

class PeeredInstanceCreate(PeeredInstanceBase):
    api_key: str = Field(..., max_length=100) # Shared secret

class PeeredInstanceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    base_url: Optional[HttpUrl] = None
    status: Optional[PeerStatus] = None
    api_key: Optional[str] = Field(None, max_length=100)

class PeeredInstanceResponse(PeeredInstanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_key: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# --- Federated Event Schemas ---
class FederatedEventBase(BaseModel):
    remote_event_id: int
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    start_time: datetime
    event_type: str = Field(..., max_length=50)
    source_url: str = Field(..., max_length=500)

class FederatedEventCreate(FederatedEventBase):
    pass

class FederatedEventResponse(FederatedEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_instance_id: int
    source_instance: Optional[PeeredInstanceResponse] = None
    created_at: datetime

# --- Trade Request Schemas ---
class TradeRequestBase(BaseModel):
    resource_type: str = Field(..., max_length=50)
    amount: float
    unit: str = Field(..., max_length=20)
    price_per_unit: Optional[float] = None
    status: TradeRequestStatus = TradeRequestStatus.OPEN
    expires_at: Optional[datetime] = None

class TradeRequestCreate(TradeRequestBase):
    pass

class TradeRequestResponse(TradeRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_instance_id: int
    source_instance: Optional[PeeredInstanceResponse] = None
    created_at: datetime
    updated_at: datetime
