# app/schemas/privacy.py
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class PrivacySettingsBase(BaseModel):
    hide_from_leaderboards: bool = False
    hide_trade_activity: bool = False
    hide_achievements: bool = False
    allow_data_export: bool = True


class PrivacySettingsCreate(PrivacySettingsBase):
    pass


class PrivacySettingsResponse(PrivacySettingsBase):
    id: int
    user_id: int
    last_exported_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrivacySettingsUpdate(BaseModel):
    hide_from_leaderboards: Optional[bool] = None
    hide_trade_activity: Optional[bool] = None
    hide_achievements: Optional[bool] = None
    allow_data_export: Optional[bool] = None


class DataExportRequest(BaseModel):
    format: str = "json"  # json or csv


class AccountDeletionRequest(BaseModel):
    reason: Optional[str] = None


class DataExportResponse(BaseModel):
    user_info: Dict[str, Any]
    ships: List[Dict[str, Any]]
    inventory: List[Dict[str, Any]]
    wallet_transactions: List[Dict[str, Any]]
    trade_runs: List[Dict[str, Any]]
    cargo_contracts: List[Dict[str, Any]]
    forum_posts: List[Dict[str, Any]]
    messages: List[Dict[str, Any]]
    achievements: List[Dict[str, Any]]
    notifications: List[Dict[str, Any]]
    activities: List[Dict[str, Any]]
    conversations: List[Dict[str, Any]]
    lfg_posts: List[Dict[str, Any]]
    availability: List[Dict[str, Any]]
    export_date: datetime
    total_records: int

    class Config:
        from_attributes = True


class DeletionStatusResponse(BaseModel):
    deletion_requested: bool
    deletion_scheduled_at: Optional[datetime]
    days_until_deletion: Optional[int]
    message: str
