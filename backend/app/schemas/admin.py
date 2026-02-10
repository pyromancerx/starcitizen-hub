from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class OrgInfo(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

class OrgMember(BaseModel):
    id: int
    display_name: str
    email: str
    rsi_handle: Optional[str]
    roles: List[str] # List of role names
    joined_at: datetime

class OrgRole(BaseModel):
    id: int
    name: str
    description: Optional[str]
    tier: str
    permissions: List[str]

class OrgShip(BaseModel):
    id: int
    name: str
    manufacturer: str
    model: str
    owner_id: int
    owner_display_name: str

class OrgStockpileItem(BaseModel):
    id: int
    item_name: str
    quantity: int
    location: str
    added_by_id: int
    added_by_display_name: str
    created_at: datetime

class OrgTreasuryTransaction(BaseModel):
    id: int
    amount: float
    transaction_type: str
    description: Optional[str]
    initiated_by_id: int
    initiated_by_display_name: str
    created_at: datetime

class OrgOperation(BaseModel):
    id: int
    title: str
    description: Optional[str]
    operation_type: str
    scheduled_at: datetime
    status: str
    created_by_id: int
    created_by_display_name: str
    participants: List[str] # List of participant display names

class OrgAnnouncement(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author_display_name: str
    published_at: datetime

class OrgForumPost(BaseModel):
    id: int
    thread_id: int
    author_id: int
    author_display_name: str
    content: str
    created_at: datetime

class OrgCargoContract(BaseModel):
    id: int
    poster_id: int
    poster_display_name: str
    hauler_id: Optional[int]
    hauler_display_name: Optional[str]
    origin: str
    destination: str
    commodity: str
    quantity: int
    payment_amount: float
    status: str
    created_at: datetime

class OrgDataExportResponse(BaseModel):
    org_info: OrgInfo
    members: List[OrgMember]
    roles: List[OrgRole]
    ships: List[OrgShip]
    stockpiles: List[OrgStockpileItem]
    treasury_transactions: List[OrgTreasuryTransaction]
    operations: List[OrgOperation]
    announcements: List[OrgAnnouncement]
    forum_posts: List[OrgForumPost]
    cargo_contracts: List[OrgCargoContract]
    export_date: datetime
    total_records: int

    class Config:
        from_attributes = True
