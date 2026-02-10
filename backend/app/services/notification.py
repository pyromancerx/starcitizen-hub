# app/services/notification.py
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, desc, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import (
    Notification, NotificationType, NotificationPriority,
    NotificationPreference
)
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate, NotificationPreferenceCreate, NotificationPreferenceUpdate
)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: Optional[str] = None,
        data: Optional[dict] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        triggered_by_id: Optional[int] = None,
    ) -> Optional[Notification]:
        """Create a new notification if the user hasn't disabled this type."""
        # Check if user has disabled this notification type
        if not await self._is_notification_enabled(user_id, notification_type):
            return None
        
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
            data=data,
            priority=priority,
            triggered_by_id=triggered_by_id,
            is_read=False,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def _is_notification_enabled(
        self,
        user_id: int,
        notification_type: NotificationType
    ) -> bool:
        """Check if a notification type is enabled for a user."""
        result = await self.db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        pref = result.scalar_one_or_none()
        
        if not pref:
            # No preferences set, all notifications enabled by default
            return True
        
        if not pref.notifications_enabled:
            # Notifications globally disabled
            return False
        
        # Check if this specific type is disabled
        if pref.disabled_types and notification_type.value in pref.disabled_types:
            return False
        
        # If enabled_types is specified, only those types are allowed
        if pref.enabled_types and notification_type.value not in pref.enabled_types:
            return False
        
        return True

    # === Convenience methods for common notifications ===

    async def notify_mention(
        self,
        user_id: int,
        mentioned_by_id: int,
        mentioned_by_name: str,
        context: str,
        link: str,
    ) -> Optional[Notification]:
        """Notify user they were mentioned."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.MENTION,
            title="You were mentioned",
            message=f"{mentioned_by_name} mentioned you in {context}",
            link=link,
            triggered_by_id=mentioned_by_id,
        )

    async def notify_op_invite(
        self,
        user_id: int,
        invited_by_id: int,
        invited_by_name: str,
        operation_title: str,
        operation_id: int,
    ) -> Optional[Notification]:
        """Notify user of an operation invitation."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.OP_INVITE,
            title="Operation Invitation",
            message=f"{invited_by_name} invited you to: {operation_title}",
            link=f"/events/{operation_id}",
            data={"operation_id": operation_id, "operation_title": operation_title},
            triggered_by_id=invited_by_id,
        )

    async def notify_op_reminder(
        self,
        user_id: int,
        operation_title: str,
        operation_id: int,
        minutes_until_start: int,
    ) -> Optional[Notification]:
        """Remind user of an upcoming operation."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.OP_REMINDER,
            title="Operation Starting Soon",
            message=f"'{operation_title}' starts in {minutes_until_start} minutes",
            link=f"/events/{operation_id}",
            data={"operation_id": operation_id, "minutes_until": minutes_until_start},
            priority=NotificationPriority.HIGH if minutes_until_start <= 15 else NotificationPriority.NORMAL,
        )

    async def notify_op_cancelled(
        self,
        user_id: int,
        cancelled_by_id: int,
        cancelled_by_name: str,
        operation_title: str,
    ) -> Optional[Notification]:
        """Notify user that an operation was cancelled."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.OP_CANCELLED,
            title="Operation Cancelled",
            message=f"'{operation_title}' was cancelled by {cancelled_by_name}",
            priority=NotificationPriority.HIGH,
            triggered_by_id=cancelled_by_id,
        )

    async def notify_approval_required(
        self,
        admin_user_id: int,
        new_user_name: str,
        new_user_id: int,
    ) -> Optional[Notification]:
        """Notify admin that a user needs approval."""
        return await self.create_notification(
            user_id=admin_user_id,
            notification_type=NotificationType.APPROVAL_REQUIRED,
            title="Approval Required",
            message=f"{new_user_name} is waiting for approval",
            link="/admin",
            data={"new_user_id": new_user_id, "new_user_name": new_user_name},
            priority=NotificationPriority.HIGH,
        )

    async def notify_user_approved(
        self,
        user_id: int,
        approved_by_name: str,
    ) -> Optional[Notification]:
        """Notify user they were approved."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.USER_APPROVED,
            title="Welcome to the Organization!",
            message=f"You have been approved by {approved_by_name}",
            priority=NotificationPriority.HIGH,
        )

    async def notify_contract_accepted(
        self,
        poster_id: int,
        hauler_name: str,
        hauler_id: int,
        contract_origin: str,
        contract_destination: str,
        contract_id: int,
    ) -> Optional[Notification]:
        """Notify contract poster that someone accepted their contract."""
        return await self.create_notification(
            user_id=poster_id,
            notification_type=NotificationType.CONTRACT_ACCEPTED,
            title="Contract Accepted",
            message=f"{hauler_name} accepted your contract: {contract_origin} → {contract_destination}",
            link=f"/contracts/{contract_id}",
            data={"contract_id": contract_id, "hauler_id": hauler_id},
            triggered_by_id=hauler_id,
        )

    async def notify_contract_completed(
        self,
        user_id: int,
        contract_origin: str,
        contract_destination: str,
        payment: int,
        contract_id: int,
    ) -> Optional[Notification]:
        """Notify user that their contract was completed."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.CONTRACT_COMPLETED,
            title="Contract Completed",
            message=f"Your contract from {contract_origin} to {contract_destination} was completed (+{payment} aUEC)",
            link=f"/contracts/{contract_id}",
            data={"contract_id": contract_id, "payment": payment},
        )

    async def notify_lfg_response(
        self,
        poster_id: int,
        responder_name: str,
        responder_id: int,
        ship_type: str,
        post_id: int,
    ) -> Optional[Notification]:
        """Notify LFG poster that someone responded."""
        return await self.create_notification(
            user_id=poster_id,
            notification_type=NotificationType.LFG_RESPONSE,
            title="Crew Response",
            message=f"{responder_name} responded to your LFG for {ship_type}",
            link=f"/crew-finder",
            data={"post_id": post_id, "responder_id": responder_id},
            triggered_by_id=responder_id,
        )

    async def notify_achievement_unlocked(
        self,
        user_id: int,
        achievement_name: str,
        achievement_description: str,
        achievement_id: int,
    ) -> Optional[Notification]:
        """Notify user of unlocked achievement."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.ACHIEVEMENT_UNLOCKED,
            title="Achievement Unlocked!",
            message=f"{achievement_name}: {achievement_description}",
            link=f"/profile",
            data={"achievement_id": achievement_id, "achievement_name": achievement_name},
            priority=NotificationPriority.HIGH,
        )

    # === Notification Retrieval ===

    async def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Notification], int, int]:
        """Get notifications for a user. Returns (notifications, unread_count, total_count)."""
        # Get total unread count
        unread_result = await self.db.execute(
            select(func.count(Notification.id))
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                )
            )
        )
        unread_count = unread_result.scalar()
        
        # Get total count
        total_result = await self.db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id)
        )
        total_count = total_result.scalar()
        
        # Get notifications
        query = select(Notification).where(
            Notification.user_id == user_id
        ).order_by(desc(Notification.created_at))
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        result = await self.db.execute(
            query.offset(offset).limit(limit)
        )
        notifications = list(result.scalars().all())
        
        # Load triggered_by user names
        triggered_by_ids = {n.triggered_by_id for n in notifications if n.triggered_by_id}
        if triggered_by_ids:
            user_result = await self.db.execute(
                select(User.id, User.display_name).where(User.id.in_(triggered_by_ids))
            )
            user_names = {uid: name for uid, name in user_result.all()}
            
            for notification in notifications:
                if notification.triggered_by_id:
                    notification.triggered_by_name = user_names.get(notification.triggered_by_id)
        
        return notifications, unread_count, total_count

    async def get_notification_by_id(
        self,
        notification_id: int,
        user_id: int,
    ) -> Optional[Notification]:
        """Get a specific notification if it belongs to the user."""
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def mark_as_read(
        self,
        notification: Notification,
    ) -> Notification:
        """Mark a notification as read."""
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all unread notifications as read. Returns count of updated notifications."""
        result = await self.db.execute(
            update(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                )
            )
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount

    async def delete_notification(
        self,
        notification: Notification,
    ) -> None:
        """Delete a notification."""
        await self.db.delete(notification)
        await self.db.commit()

    async def delete_all_read(self, user_id: int) -> int:
        """Delete all read notifications for a user. Returns count deleted."""
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == True
                )
            )
        )
        notifications = result.scalars().all()
        
        for notification in notifications:
            await self.db.delete(notification)
        
        await self.db.commit()
        return len(notifications)

    # === Preferences ===

    async def get_or_create_preferences(
        self,
        user_id: int,
    ) -> NotificationPreference:
        """Get or create notification preferences for a user."""
        result = await self.db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        pref = result.scalar_one_or_none()
        
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                notifications_enabled=True,
                disabled_types=[],
            )
            self.db.add(pref)
            await self.db.commit()
            await self.db.refresh(pref)
        
        return pref

    async def update_preferences(
        self,
        user_id: int,
        data: NotificationPreferenceUpdate,
    ) -> NotificationPreference:
        """Update notification preferences."""
        pref = await self.get_or_create_preferences(user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pref, field, value)
        
        await self.db.commit()
        await self.db.refresh(pref)
        return pref

    async def enable_notification_type(
        self,
        user_id: int,
        notification_type: NotificationType,
    ) -> NotificationPreference:
        """Enable a specific notification type."""
        pref = await self.get_or_create_preferences(user_id)
        
        if pref.disabled_types and notification_type.value in pref.disabled_types:
            pref.disabled_types.remove(notification_type.value)
        
        await self.db.commit()
        await self.db.refresh(pref)
        return pref

    async def disable_notification_type(
        self,
        user_id: int,
        notification_type: NotificationType,
    ) -> NotificationPreference:
        """Disable a specific notification type."""
        pref = await self.get_or_create_preferences(user_id)
        
        if not pref.disabled_types:
            pref.disabled_types = []
        
        if notification_type.value not in pref.disabled_types:
            pref.disabled_types.append(notification_type.value)
        
        await self.db.commit()
        await self.db.refresh(pref)
        return pref

    # === Cleanup ===

    async def cleanup_old_notifications(self, days: int = 30) -> int:
        """Delete notifications older than N days. Returns count deleted."""
        cutoff = datetime.utcnow() - datetime.timedelta(days=days)
        
        result = await self.db.execute(
            select(Notification).where(Notification.created_at < cutoff)
        )
        old_notifications = result.scalars().all()
        
        for notification in old_notifications:
            await self.db.delete(notification)
        
        await self.db.commit()
        return len(old_notifications)
