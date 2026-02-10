# app/schemas/discord.py
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class DiscordIntegrationBase(BaseModel):
    guild_id: Optional[str] = None
    webhook_url: Optional[str] = Field(None, max_length=500)
    webhook_enabled: bool = False
    oauth_enabled: bool = False
    oauth_client_id: Optional[str] = None
    auto_post_settings: Dict[str, bool] = Field(default_factory=dict)
    role_sync_enabled: bool = False


class DiscordIntegrationCreate(DiscordIntegrationBase):
    oauth_client_secret: Optional[str] = None
    bot_token: Optional[str] = None


class DiscordIntegrationResponse(DiscordIntegrationBase):
    id: int
    guild_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiscordWebhookBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    webhook_url: str = Field(..., max_length=500)
    event_types: List[str] = Field(default_factory=list)
    message_template: Optional[str] = None


class DiscordWebhookCreate(DiscordWebhookBase):
    pass


class DiscordWebhookUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    webhook_url: Optional[str] = Field(None, max_length=500)
    event_types: Optional[List[str]] = None
    message_template: Optional[str] = None
    is_active: Optional[bool] = None


class DiscordWebhookResponse(DiscordWebhookBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserDiscordLinkResponse(BaseModel):
    id: int
    user_id: int
    discord_id: str
    discord_username: str
    discord_discriminator: Optional[str] = None
    discord_avatar: Optional[str] = None
    guild_joined: bool
    guild_joined_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DiscordRoleMappingBase(BaseModel):
    hub_role_id: int
    discord_role_id: str = Field(..., max_length=30)
    discord_role_name: str = Field(..., max_length=100)
    sync_direction: str = Field(default="hub_to_discord")


class DiscordRoleMappingCreate(DiscordRoleMappingBase):
    pass


class DiscordRoleMappingResponse(DiscordRoleMappingBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DiscordLoginUrlResponse(BaseModel):
    url: str


class DiscordCallbackRequest(BaseModel):
    code: str
    state: str


class DiscordTestWebhookRequest(BaseModel):
    message: str = "Test webhook from Star Citizen Hub"


class AutoPostSettingsUpdate(BaseModel):
    announcements: Optional[bool] = None
    events: Optional[bool] = None
    trades: Optional[bool] = None
    achievements: Optional[bool] = None
    contracts: Optional[bool] = None
