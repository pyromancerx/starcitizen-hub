# app/services/discord.py
import aiohttp
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.discord import (
    DiscordIntegration, DiscordWebhook, UserDiscordLink, DiscordRoleMapping
)
from app.models.user import User
from app.models.role import Role


class DiscordService:
    """Service for Discord integration features."""
    
    DISCORD_API_BASE = "https://discord.com/api/v10"
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_integration_settings(self) -> Optional[DiscordIntegration]:
        """Get Discord integration settings."""
        result = await self.db.execute(
            select(DiscordIntegration).where(DiscordIntegration.is_active == True)
        )
        return result.scalar_one_or_none()

    async def save_integration_settings(
        self,
        guild_id: Optional[str] = None,
        webhook_url: Optional[str] = None,
        oauth_client_id: Optional[str] = None,
        oauth_client_secret: Optional[str] = None,
        auto_post_settings: Optional[dict] = None,
    ) -> DiscordIntegration:
        """Save or update Discord integration settings."""
        settings = await self.get_integration_settings()
        
        if not settings:
            settings = DiscordIntegration()
            self.db.add(settings)
        
        if guild_id is not None:
            settings.guild_id = guild_id
        if webhook_url is not None:
            settings.webhook_url = webhook_url
            settings.webhook_enabled = bool(webhook_url)
        if oauth_client_id is not None:
            settings.oauth_client_id = oauth_client_id
        if oauth_client_secret is not None:
            settings.oauth_client_secret = oauth_client_secret
        if auto_post_settings is not None:
            settings.auto_post_settings = auto_post_settings
        
        await self.db.commit()
        await self.db.refresh(settings)
        return settings

    async def get_user_discord_link(self, user_id: int) -> Optional[UserDiscordLink]:
        """Get Discord link for a user."""
        result = await self.db.execute(
            select(UserDiscordLink).where(
                UserDiscordLink.user_id == user_id,
                UserDiscordLink.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def link_discord_account(
        self,
        user_id: int,
        discord_id: str,
        discord_username: str,
        discord_discriminator: Optional[str] = None,
        discord_avatar: Optional[str] = None,
        access_token: Optional[str] = None,
        refresh_token: Optional[str] = None,
        token_expires_at: Optional[datetime] = None,
    ) -> UserDiscordLink:
        """Link a Discord account to a user."""
        # Check if link already exists
        existing = await self.get_user_discord_link(user_id)
        if existing:
            # Update existing
            existing.discord_id = discord_id
            existing.discord_username = discord_username
            existing.discord_discriminator = discord_discriminator
            existing.discord_avatar = discord_avatar
            if access_token:
                existing.access_token = access_token
            if refresh_token:
                existing.refresh_token = refresh_token
            if token_expires_at:
                existing.token_expires_at = token_expires_at
            existing.is_active = True
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        
        # Create new link
        link = UserDiscordLink(
            user_id=user_id,
            discord_id=discord_id,
            discord_username=discord_username,
            discord_discriminator=discord_discriminator,
            discord_avatar=discord_avatar,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expires_at=token_expires_at,
        )
        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        return link

    async def unlink_discord_account(self, user_id: int) -> bool:
        """Unlink Discord account from user."""
        link = await self.get_user_discord_link(user_id)
        if link:
            link.is_active = False
            await self.db.commit()
            return True
        return False

    async def post_to_webhook(
        self,
        webhook_url: str,
        content: Optional[str] = None,
        embeds: Optional[List[dict]] = None,
        username: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> bool:
        """Post a message to a Discord webhook."""
        payload = {}
        
        if content:
            payload["content"] = content
        if embeds:
            payload["embeds"] = embeds
        if username:
            payload["username"] = username
        if avatar_url:
            payload["avatar_url"] = avatar_url
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    return response.status in (200, 204)
        except Exception as e:
            print(f"Error posting to Discord webhook: {e}")
            return False

    async def post_announcement(self, title: str, content: str, author_name: str) -> bool:
        """Post an announcement to Discord."""
        settings = await self.get_integration_settings()
        if not settings or not settings.webhook_enabled or not settings.webhook_url:
            return False
        
        # Check if announcements should be auto-posted
        if not settings.auto_post_settings.get("announcements", False):
            return False
        
        embed = {
            "title": title,
            "description": content[:4000] if len(content) > 4000 else content,
            "color": 0x5865F2,  # Discord blurple
            "footer": {
                "text": f"Posted by {author_name}"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.post_to_webhook(
            webhook_url=settings.webhook_url,
            content="📢 **New Announcement**",
            embeds=[embed],
            username="Star Citizen Hub",
        )

    async def post_event(self, event_title: str, event_type: str, scheduled_at: str) -> bool:
        """Post an event to Discord."""
        settings = await self.get_integration_settings()
        if not settings or not settings.webhook_enabled or not settings.webhook_url:
            return False
        
        if not settings.auto_post_settings.get("events", False):
            return False
        
        embed = {
            "title": f"🎯 New Operation: {event_title}",
            "description": f"Type: {event_type}\nScheduled: {scheduled_at}",
            "color": 0x57F287,  # Green
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.post_to_webhook(
            webhook_url=settings.webhook_url,
            embeds=[embed],
            username="Star Citizen Hub",
        )

    async def post_trade(self, commodity: str, profit: int, trader_name: str) -> bool:
        """Post a trade completion to Discord (opt-in)."""
        settings = await self.get_integration_settings()
        if not settings or not settings.webhook_enabled or not settings.webhook_url:
            return False
        
        if not settings.auto_post_settings.get("trades", False):
            return False
        
        embed = {
            "title": "💰 Trade Completed",
            "description": f"**{trader_name}** traded **{commodity}** for **{profit:,} aUEC** profit!",
            "color": 0xFEE75C,  # Yellow
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.post_to_webhook(
            webhook_url=settings.webhook_url,
            embeds=[embed],
            username="Star Citizen Hub",
        )

    async def post_achievement(self, achievement_name: str, user_name: str, rarity: str) -> bool:
        """Post an achievement unlock to Discord."""
        settings = await self.get_integration_settings()
        if not settings or not settings.webhook_enabled or not settings.webhook_url:
            return False
        
        if not settings.auto_post_settings.get("achievements", False):
            return False
        
        rarity_colors = {
            "common": 0x95A5A6,
            "rare": 0x3498DB,
            "epic": 0x9B59B6,
            "legendary": 0xF1C40F,
        }
        
        embed = {
            "title": f"🏆 Achievement Unlocked: {achievement_name}",
            "description": f"Congratulations to **{user_name}** for earning the **{achievement_name}** achievement!",
            "color": rarity_colors.get(rarity.lower(), 0x95A5A6),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.post_to_webhook(
            webhook_url=settings.webhook_url,
            embeds=[embed],
            username="Star Citizen Hub",
        )

    async def sync_user_roles(self, user_id: int) -> bool:
        """Sync user roles to Discord."""
        # Get user
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        # Get Discord link
        discord_link = await self.get_user_discord_link(user_id)
        if not discord_link:
            return False
        
        # Get integration settings
        settings = await self.get_integration_settings()
        if not settings or not settings.guild_id or not settings.bot_token:
            return False
        
        # Get role mappings
        result = await self.db.execute(
            select(DiscordRoleMapping).where(
                DiscordRoleMapping.is_active == True
            )
        )
        role_mappings = result.scalars().all()
        
        if not role_mappings:
            return False
        
        # Get user's hub roles
        user_role_ids = {role.id for role in user.roles}
        
        # Determine which Discord roles to add
        discord_roles_to_add = []
        for mapping in role_mappings:
            if mapping.hub_role_id in user_role_ids:
                discord_roles_to_add.append(mapping.discord_role_id)
        
        if not discord_roles_to_add:
            return True
        
        # Add roles via Discord API
        try:
            async with aiohttp.ClientSession() as session:
                for role_id in discord_roles_to_add:
                    url = f"{self.DISCORD_API_BASE}/guilds/{settings.guild_id}/members/{discord_link.discord_id}/roles/{role_id}"
                    headers = {
                        "Authorization": f"Bot {settings.bot_token}",
                        "Content-Type": "application/json"
                    }
                    async with session.put(url, headers=headers) as response:
                        if response.status not in (200, 204):
                            print(f"Failed to add role {role_id}: {response.status}")
        except Exception as e:
            print(f"Error syncing Discord roles: {e}")
            return False
        
        return True

    async def get_discord_login_url(self, redirect_uri: str, state: str) -> Optional[str]:
        """Generate Discord OAuth login URL."""
        settings = await self.get_integration_settings()
        if not settings or not settings.oauth_client_id:
            return None
        
        scopes = "identify guilds.join"
        return (
            f"https://discord.com/api/oauth2/authorize?"
            f"client_id={settings.oauth_client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes.replace(' ', '%20')}&"
            f"state={state}"
        )

    async def exchange_code_for_tokens(
        self,
        code: str,
        redirect_uri: str,
    ) -> Optional[Dict]:
        """Exchange OAuth code for access tokens."""
        settings = await self.get_integration_settings()
        if not settings or not settings.oauth_client_id or not settings.oauth_client_secret:
            return None
        
        data = {
            "client_id": settings.oauth_client_id,
            "client_secret": settings.oauth_client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.DISCORD_API_BASE}/oauth2/token",
                    data=data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        print(f"Token exchange failed: {response.status}")
                        return None
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return None

    async def get_discord_user_info(self, access_token: str) -> Optional[Dict]:
        """Get Discord user info from access token."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.DISCORD_API_BASE}/users/@me",
                    headers={"Authorization": f"Bearer {access_token}"}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return None
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None

    async def add_user_to_guild(
        self,
        access_token: str,
        user_id: str,
    ) -> bool:
        """Add a user to the configured Discord guild."""
        settings = await self.get_integration_settings()
        if not settings or not settings.guild_id or not settings.bot_token:
            return False
        
        url = f"{self.DISCORD_API_BASE}/guilds/{settings.guild_id}/members/{user_id}"
        headers = {
            "Authorization": f"Bot {settings.bot_token}",
            "Content-Type": "application/json"
        }
        data = {
            "access_token": access_token
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.put(url, json=data, headers=headers) as response:
                    return response.status in (200, 201, 204)
        except Exception as e:
            print(f"Error adding user to guild: {e}")
            return False

    async def get_role_mapping(self, mapping_id: int) -> Optional[DiscordRoleMapping]:
        """Get a single Discord role mapping by ID."""
        result = await self.db.execute(
            select(DiscordRoleMapping).where(DiscordRoleMapping.id == mapping_id)
        )
        return result.scalar_one_or_none()

    async def update_role_mapping(
        self, mapping_id: int, data: "DiscordRoleMappingUpdate"
    ) -> Optional[DiscordRoleMapping]:
        """Update an existing Discord role mapping."""
        mapping = await self.get_role_mapping(mapping_id)
        if not mapping:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(mapping, key, value)
        
        await self.db.commit()
        await self.db.refresh(mapping)
        return mapping

    async def delete_role_mapping(self, mapping_id: int) -> bool:
        """Delete a Discord role mapping."""
        mapping = await self.get_role_mapping(mapping_id)
        if mapping:
            await self.db.delete(mapping)
            await self.db.commit()
            return True
        return False
