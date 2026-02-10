# app/models/discord.py
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, JSON, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DiscordIntegration(Base):
    """Discord integration settings for the instance."""
    __tablename__ = "discord_integrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Guild/Server settings
    guild_id: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, unique=True)
    guild_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Bot settings
    bot_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bot_client_id: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    bot_client_secret: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # OAuth settings
    oauth_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    oauth_client_id: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    oauth_client_secret: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Webhook settings
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    webhook_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Auto-post settings (JSON: {"announcements": true, "events": true, etc.})
    auto_post_settings: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Role sync settings
    role_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )


class DiscordWebhook(Base):
    """Configured Discord webhooks for different channels/events."""
    __tablename__ = "discord_webhooks"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    name: Mapped[str] = mapped_column(String(100))
    webhook_url: Mapped[str] = mapped_column(String(500))
    
    # Event types this webhook handles
    # announcements, events, trades, contracts, achievements, etc.
    event_types: Mapped[list] = mapped_column(JSON, default=list)
    
    # Message format template
    message_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )


class UserDiscordLink(Base):
    """Links between hub users and Discord accounts."""
    __tablename__ = "user_discord_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True
    )
    
    # Discord user info
    discord_id: Mapped[str] = mapped_column(String(30), index=True)
    discord_username: Mapped[str] = mapped_column(String(100))
    discord_discriminator: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    discord_avatar: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # OAuth tokens
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Joined guild?
    guild_joined: Mapped[bool] = mapped_column(Boolean, default=False)
    guild_joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="discord_link")


class DiscordRoleMapping(Base):
    """Maps hub roles to Discord roles."""
    __tablename__ = "discord_role_mappings"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    hub_role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        index=True
    )
    
    discord_role_id: Mapped[str] = mapped_column(String(30))
    discord_role_name: Mapped[str] = mapped_column(String(100))
    
    # Sync direction: hub_to_discord, discord_to_hub, bidirectional
    sync_direction: Mapped[str] = mapped_column(String(20), default="hub_to_discord")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    
    # Relationships
    hub_role: Mapped["Role"] = relationship()
