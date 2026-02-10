# app/services/privacy.py
import json
import csv
import io
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.privacy import UserPrivacy
from app.models.user import User
from app.models.ship import Ship
from app.models.inventory import PersonalInventory
from app.models.wallet import Wallet, WalletTransaction
from app.models.trade import TradeRun, CargoContract
from app.models.forum import ForumPost
from app.models.message import Message, Conversation
from app.models.achievement import UserAchievement
from app.models.notification import Notification
from app.models.activity import Activity
from app.models.crew import LFGPost, UserAvailability
from app.schemas.privacy import PrivacySettingsUpdate


class PrivacyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_privacy_settings(self, user_id: int) -> UserPrivacy:
        """Get or create privacy settings for a user."""
        result = await self.db.execute(
            select(UserPrivacy).where(UserPrivacy.user_id == user_id)
        )
        privacy = result.scalar_one_or_none()
        
        if not privacy:
            privacy = UserPrivacy(user_id=user_id)
            self.db.add(privacy)
            await self.db.commit()
            await self.db.refresh(privacy)
        
        return privacy

    async def update_privacy_settings(
        self, 
        user_id: int, 
        data: PrivacySettingsUpdate
    ) -> UserPrivacy:
        """Update user privacy settings."""
        privacy = await self.get_or_create_privacy_settings(user_id)
        
        if data.hide_from_leaderboards is not None:
            privacy.hide_from_leaderboards = data.hide_from_leaderboards
        if data.hide_trade_activity is not None:
            privacy.hide_trade_activity = data.hide_trade_activity
        if data.hide_achievements is not None:
            privacy.hide_achievements = data.hide_achievements
        if data.allow_data_export is not None:
            privacy.allow_data_export = data.allow_data_export
        
        await self.db.commit()
        await self.db.refresh(privacy)
        return privacy

    async def export_user_data(self, user_id: int) -> Dict[str, Any]:
        """Export all user data for GDPR compliance."""
        # Get user info
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        export_data = {
            "user_info": {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "rsi_handle": user.rsi_handle,
                "is_rsi_verified": user.is_rsi_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
            },
            "ships": [],
            "inventory": [],
            "wallet_transactions": [],
            "trade_runs": [],
            "cargo_contracts": [],
            "forum_posts": [],
            "messages": [],
            "achievements": [],
            "notifications": [],
            "activities": [],
            "conversations": [],
            "lfg_posts": [],
            "availability": [],
            "export_date": datetime.utcnow().isoformat(),
            "total_records": 0
        }
        
        # Ships
        ships_result = await self.db.execute(
            select(Ship).where(Ship.user_id == user_id)
        )
        for ship in ships_result.scalars():
            export_data["ships"].append({
                "id": ship.id,
                "name": ship.name,
                "manufacturer": ship.manufacturer,
                "model": ship.model,
                "created_at": ship.created_at.isoformat() if ship.created_at else None,
            })
        
        # Inventory
        inv_result = await self.db.execute(
            select(PersonalInventory).where(PersonalInventory.user_id == user_id)
        )
        for item in inv_result.scalars():
            export_data["inventory"].append({
                "id": item.id,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "location": item.location,
            })
        
        # Wallet and transactions
        wallet_result = await self.db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            tx_result = await self.db.execute(
                select(WalletTransaction)
                .where(WalletTransaction.wallet_id == wallet.id)
                .order_by(desc(WalletTransaction.created_at))
            )
            for tx in tx_result.scalars():
                export_data["wallet_transactions"].append({
                    "id": tx.id,
                    "amount": tx.amount,
                    "type": tx.transaction_type,
                    "description": tx.description,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None,
                })
        
        # Trade runs
        trade_result = await self.db.execute(
            select(TradeRun).where(TradeRun.user_id == user_id)
        )
        for trade in trade_result.scalars():
            export_data["trade_runs"].append({
                "id": trade.id,
                "origin": trade.origin_location,
                "destination": trade.destination_location,
                "commodity": trade.commodity,
                "quantity": trade.quantity,
                "profit": trade.profit,
                "completed_at": trade.completed_at.isoformat() if trade.completed_at else None,
            })
        
        # Cargo contracts
        contracts_result = await self.db.execute(
            select(CargoContract).where(
                (CargoContract.poster_id == user_id) | (CargoContract.hauler_id == user_id)
            )
        )
        for contract in contracts_result.scalars():
            export_data["cargo_contracts"].append({
                "id": contract.id,
                "role": "poster" if contract.poster_id == user_id else "hauler",
                "origin": contract.origin,
                "destination": contract.destination,
                "payment": contract.payment_amount,
                "status": contract.status.value if hasattr(contract.status, 'value') else str(contract.status),
            })
        
        # Forum posts
        posts_result = await self.db.execute(
            select(ForumPost).where(ForumPost.author_id == user_id)
        )
        for post in posts_result.scalars():
            export_data["forum_posts"].append({
                "id": post.id,
                "content": post.content,
                "created_at": post.created_at.isoformat() if post.created_at else None,
            })
        
        # Messages (only user's sent messages)
        messages_result = await self.db.execute(
            select(Message).where(Message.sender_id == user_id)
        )
        for msg in messages_result.scalars():
            export_data["messages"].append({
                "id": msg.id,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            })
        
        # Conversations
        conv_result = await self.db.execute(
            select(Conversation).where(
                (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
            )
        )
        for conv in conv_result.scalars():
            export_data["conversations"].append({
                "id": conv.id,
                "other_user_id": conv.user2_id if conv.user1_id == user_id else conv.user1_id,
                "created_at": conv.created_at.isoformat() if conv.created_at else None,
            })
        
        # Achievements
        ach_result = await self.db.execute(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        )
        for ach in ach_result.scalars():
            export_data["achievements"].append({
                "id": ach.id,
                "achievement_id": ach.achievement_id,
                "awarded_at": ach.awarded_at.isoformat() if ach.awarded_at else None,
            })
        
        # Notifications
        notif_result = await self.db.execute(
            select(Notification).where(Notification.user_id == user_id)
        )
        for notif in notif_result.scalars():
            export_data["notifications"].append({
                "id": notif.id,
                "type": notif.type.value if hasattr(notif.type, 'value') else str(notif.type),
                "title": notif.title,
                "message": notif.message,
                "created_at": notif.created_at.isoformat() if notif.created_at else None,
            })
        
        # Activities
        activity_result = await self.db.execute(
            select(Activity).where(Activity.user_id == user_id)
        )
        for activity in activity_result.scalars():
            export_data["activities"].append({
                "id": activity.id,
                "type": activity.type.value if hasattr(activity.type, 'value') else str(activity.type),
                "created_at": activity.created_at.isoformat() if activity.created_at else None,
            })
        
        # LFG Posts
        lfg_result = await self.db.execute(
            select(LFGPost).where(LFGPost.user_id == user_id)
        )
        for lfg in lfg_result.scalars():
            export_data["lfg_posts"].append({
                "id": lfg.id,
                "ship_type": lfg.ship_type,
                "activity_type": lfg.activity_type,
                "created_at": lfg.created_at.isoformat() if lfg.created_at else None,
            })
        
        # Availability
        avail_result = await self.db.execute(
            select(UserAvailability).where(UserAvailability.user_id == user_id)
        )
        for avail in avail_result.scalars():
            export_data["availability"].append({
                "id": avail.id,
                "day_of_week": avail.day_of_week,
                "start_time": avail.start_time,
                "end_time": avail.end_time,
            })
        
        # Calculate total
        export_data["total_records"] = sum(len(v) for v in export_data.values() if isinstance(v, list))
        
        # Update last_exported_at
        privacy = await self.get_or_create_privacy_settings(user_id)
        privacy.last_exported_at = datetime.utcnow()
        await self.db.commit()
        
        return export_data

    def convert_to_csv(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Convert JSON export data to CSV format."""
        csv_files = {}
        
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 0:
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=value[0].keys())
                writer.writeheader()
                writer.writerows(value)
                csv_files[key] = output.getvalue()
            elif isinstance(value, dict):
                # Handle nested dict (like user_info)
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=value.keys())
                writer.writeheader()
                writer.writerow(value)
                csv_files[key] = output.getvalue()
        
        return csv_files

    async def request_account_deletion(self, user_id: int, reason: Optional[str] = None) -> UserPrivacy:
        """Request account deletion (GDPR right to be forgotten)."""
        privacy = await self.get_or_create_privacy_settings(user_id)
        
        # Schedule deletion for 30 days later (grace period)
        privacy.deletion_requested_at = datetime.utcnow()
        privacy.deletion_scheduled_at = datetime.utcnow() + timedelta(days=30)
        privacy.deletion_reason = reason
        
        await self.db.commit()
        await self.db.refresh(privacy)
        return privacy

    async def cancel_deletion_request(self, user_id: int) -> UserPrivacy:
        """Cancel a pending deletion request."""
        privacy = await self.get_or_create_privacy_settings(user_id)
        
        privacy.deletion_requested_at = None
        privacy.deletion_scheduled_at = None
        privacy.deletion_reason = None
        
        await self.db.commit()
        await self.db.refresh(privacy)
        return privacy

    async def get_deletion_status(self, user_id: int) -> Dict[str, Any]:
        """Get account deletion status."""
        privacy = await self.get_or_create_privacy_settings(user_id)
        
        if not privacy.deletion_requested_at:
            return {
                "deletion_requested": False,
                "deletion_scheduled_at": None,
                "days_until_deletion": None,
                "message": "No deletion request pending"
            }
        
        days_remaining = None
        if privacy.deletion_scheduled_at:
            days_remaining = (privacy.deletion_scheduled_at - datetime.utcnow()).days
            if days_remaining < 0:
                days_remaining = 0
        
        return {
            "deletion_requested": True,
            "deletion_scheduled_at": privacy.deletion_scheduled_at.isoformat() if privacy.deletion_scheduled_at else None,
            "days_until_deletion": days_remaining,
            "message": f"Account scheduled for deletion in {days_remaining} days"
        }

    async def check_privacy_settings(self, user_id: int, setting_name: str) -> bool:
        """Check a specific privacy setting for a user."""
        privacy = await self.get_or_create_privacy_settings(user_id)
        return getattr(privacy, setting_name, False)
