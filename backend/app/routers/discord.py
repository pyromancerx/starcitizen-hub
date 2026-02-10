# app/routers/discord.py
from typing import Annotated, Optional
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.schemas.discord import (
    DiscordIntegrationCreate,
    DiscordIntegrationResponse,
    DiscordWebhookCreate,
    DiscordWebhookUpdate,
    DiscordWebhookResponse,
    UserDiscordLinkResponse,
    DiscordRoleMappingCreate,
    DiscordRoleMappingResponse,
    DiscordLoginUrlResponse,
    DiscordCallbackRequest,
    DiscordTestWebhookRequest,
    AutoPostSettingsUpdate,
)
from app.services.discord import DiscordService

router = APIRouter(prefix="/api/discord", tags=["discord"])


# === Admin Settings ===

@router.get("/settings", response_model=Optional[DiscordIntegrationResponse])
async def get_discord_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Get Discord integration settings (admin only)."""
    service = DiscordService(db)
    settings = await service.get_integration_settings()
    return settings


@router.post("/settings", response_model=DiscordIntegrationResponse)
async def save_discord_settings(
    data: DiscordIntegrationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Save Discord integration settings (admin only)."""
    service = DiscordService(db)
    settings = await service.save_integration_settings(
        guild_id=data.guild_id,
        webhook_url=data.webhook_url,
        oauth_client_id=data.oauth_client_id,
        oauth_client_secret=data.oauth_client_secret,
        auto_post_settings=data.auto_post_settings,
    )
    return settings


@router.put("/settings/auto-post", response_model=DiscordIntegrationResponse)
async def update_auto_post_settings(
    data: AutoPostSettingsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Update auto-post settings (admin only)."""
    service = DiscordService(db)
    settings = await service.get_integration_settings()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discord integration not configured"
        )
    
    # Update only provided settings
    new_settings = dict(settings.auto_post_settings or {})
    if data.announcements is not None:
        new_settings["announcements"] = data.announcements
    if data.events is not None:
        new_settings["events"] = data.events
    if data.trades is not None:
        new_settings["trades"] = data.trades
    if data.achievements is not None:
        new_settings["achievements"] = data.achievements
    if data.contracts is not None:
        new_settings["contracts"] = data.contracts
    
    settings = await service.save_integration_settings(
        auto_post_settings=new_settings
    )
    return settings


# === Webhooks ===

@router.post("/webhooks", response_model=DiscordWebhookResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    data: DiscordWebhookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Create a Discord webhook (admin only)."""
    from app.models.discord import DiscordWebhook
    
    webhook = DiscordWebhook(
        name=data.name,
        webhook_url=data.webhook_url,
        event_types=data.event_types,
        message_template=data.message_template,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook


@router.get("/webhooks", response_model=list[DiscordWebhookResponse])
async def list_webhooks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """List all Discord webhooks (admin only)."""
    from sqlalchemy import select
    from app.models.discord import DiscordWebhook
    
    result = await db.execute(
        select(DiscordWebhook).where(DiscordWebhook.is_active == True)
    )
    return list(result.scalars().all())


@router.post("/webhooks/{webhook_id}/test")
async def test_webhook(
    webhook_id: int,
    data: DiscordTestWebhookRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Test a Discord webhook (admin only)."""
    from sqlalchemy import select
    from app.models.discord import DiscordWebhook
    
    result = await db.execute(
        select(DiscordWebhook).where(DiscordWebhook.id == webhook_id)
    )
    webhook = result.scalar_one_or_none()
    
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found"
        )
    
    service = DiscordService(db)
    success = await service.post_to_webhook(
        webhook_url=webhook.webhook_url,
        content=data.message,
        username="Star Citizen Hub Test"
    )
    
    if success:
        return {"message": "Test message sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test message"
        )


# === User OAuth/Login ===

@router.get("/login-url", response_model=DiscordLoginUrlResponse)
async def get_discord_login_url(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get Discord OAuth login URL."""
    service = DiscordService(db)
    
    # Generate state token
    state = secrets.token_urlsafe(32)
    
    # Store state in session or cache (simplified - should use proper cache)
    # For now, we'll just return the URL
    
    redirect_uri = str(request.base_url).rstrip('/') + "/api/discord/callback"
    url = await service.get_discord_login_url(redirect_uri, state)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discord OAuth not configured"
        )
    
    return DiscordLoginUrlResponse(url=url)


@router.post("/callback")
async def discord_callback(
    data: DiscordCallbackRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Handle Discord OAuth callback."""
    from datetime import datetime, timedelta
    
    service = DiscordService(db)
    
    # Exchange code for tokens
    tokens = await service.exchange_code_for_tokens(
        code=data.code,
        redirect_uri="http://localhost:8000/api/discord/callback"  # Should be dynamic
    )
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Discord"
        )
    
    # Get Discord user info
    user_info = await service.get_discord_user_info(tokens["access_token"])
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get Discord user info"
        )
    
    # Calculate token expiration
    expires_in = tokens.get("expires_in", 3600)
    token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    
    # Link Discord account
    discord_link = await service.link_discord_account(
        user_id=current_user.id,
        discord_id=user_info["id"],
        discord_username=user_info["username"],
        discord_discriminator=user_info.get("discriminator"),
        discord_avatar=user_info.get("avatar"),
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_expires_at=token_expires_at,
    )
    
    # Try to add user to guild
    guild_added = await service.add_user_to_guild(
        access_token=tokens["access_token"],
        user_id=user_info["id"]
    )
    
    if guild_added:
        discord_link.guild_joined = True
        discord_link.guild_joined_at = datetime.utcnow()
        await db.commit()
    
    # Sync roles
    await service.sync_user_roles(current_user.id)
    
    return UserDiscordLinkResponse(
        id=discord_link.id,
        user_id=discord_link.user_id,
        discord_id=discord_link.discord_id,
        discord_username=discord_link.discord_username,
        discord_discriminator=discord_link.discord_discriminator,
        discord_avatar=discord_link.discord_avatar,
        guild_joined=discord_link.guild_joined,
        guild_joined_at=discord_link.guild_joined_at,
        created_at=discord_link.created_at,
    )


@router.get("/my-link", response_model=Optional[UserDiscordLinkResponse])
async def get_my_discord_link(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get current user's Discord link."""
    service = DiscordService(db)
    link = await service.get_user_discord_link(current_user.id)
    return link


@router.delete("/my-link", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_discord(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Unlink Discord account."""
    service = DiscordService(db)
    success = await service.unlink_discord_account(current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discord account not linked"
        )


# === Role Mappings ===

@router.post("/role-mappings", response_model=DiscordRoleMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_role_mapping(
    data: DiscordRoleMappingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_roles"))],
):
    """Create a Discord role mapping (admin only)."""
    from app.models.discord import DiscordRoleMapping
    
    mapping = DiscordRoleMapping(
        hub_role_id=data.hub_role_id,
        discord_role_id=data.discord_role_id,
        discord_role_name=data.discord_role_name,
        sync_direction=data.sync_direction,
    )
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)
    return mapping


@router.get("/role-mappings", response_model=list[DiscordRoleMappingResponse])
async def list_role_mappings(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_roles"))],
):
    """List all Discord role mappings (admin only)."""
    from sqlalchemy import select
    from app.models.discord import DiscordRoleMapping
    
    result = await db.execute(
        select(DiscordRoleMapping).where(DiscordRoleMapping.is_active == True)
    )
    return list(result.scalars().all())


@router.post("/sync-roles/{user_id}")
async def sync_user_roles(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_users"))],
):
    """Manually sync a user's roles to Discord (admin only)."""
    service = DiscordService(db)
    success = await service.sync_user_roles(user_id)
    
    if success:
        return {"message": "Roles synced successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to sync roles"
        )


@router.post("/sync-my-roles")
async def sync_my_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Sync current user's roles to Discord."""
    service = DiscordService(db)
    success = await service.sync_user_roles(current_user.id)
    
    if success:
        return {"message": "Roles synced successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to sync roles. Make sure your Discord account is linked."
        )
