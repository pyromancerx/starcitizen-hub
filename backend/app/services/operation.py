# backend/app/services/operation.py
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload # Import selectinload
from app.models.event import Operation, OperationParticipant, OperationStatus
from app.schemas.operation import OperationCreate, OperationUpdate
from app.models.ship import Ship # Import Ship model

class OperationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_operations(self, status: Optional[OperationStatus] = None) -> List[Operation]:
        query = select(Operation).order_by(Operation.scheduled_at.asc())
        if status:
            query = query.where(Operation.status == status)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_operation(self, operation_id: int) -> Optional[Operation]:
        query = select(Operation).where(Operation.id == operation_id).options(
            selectinload(Operation.participants).selectinload(OperationParticipant.user),
            selectinload(Operation.participants).selectinload(OperationParticipant.ship), # Eager load ship
            selectinload(Operation.creator)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_operation(self, data: OperationCreate, user_id: int) -> Operation:
        operation = Operation(
            **data.model_dump(),
            created_by_id=user_id,
            status=OperationStatus.RECRUITING if data.scheduled_at > datetime.utcnow() else OperationStatus.PLANNING
        )
        self.db.add(operation)
        await self.db.flush()
        
        # Track activity
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_operation_created(
            user_id=user_id,
            operation_id=operation.id,
            title=operation.title,
            operation_type=operation.type
        )
        
        return operation

    async def update_operation(self, operation_id: int, data: OperationUpdate) -> Optional[Operation]:
        operation = await self.get_operation(operation_id)
        if not operation:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(operation, key, value)
            
        await self.db.flush()
        return operation

    async def signup_user(self, operation_id: int, user_id: int, ship_id: Optional[int] = None, role_pref: Optional[str] = None):
        # Check if already signed up
        existing = await self.db.execute(
            select(OperationParticipant).where(
                OperationParticipant.operation_id == operation_id,
                OperationParticipant.user_id == user_id
            )
        )
        if existing.scalar_one_or_none():
            return None
            
        participant = OperationParticipant(
            operation_id=operation_id,
            user_id=user_id,
            ship_id=ship_id,
            role_preference=role_pref
        )
        self.db.add(participant)
        await self.db.flush()

        # Notify creator
        operation = await self.get_operation(operation_id)
        from app.services.notification import NotificationService
        from app.models.user import User
        notification_service = NotificationService(self.db)
        
        result = await self.db.execute(select(User).where(User.id == user_id))
        signup_user = result.scalar_one()

        if operation.created_by_id != user_id:
            await notification_service.create_notification(
                user_id=operation.created_by_id,
                notification_type=NotificationType.OP_INVITE, # Or a generic type
                title="New Operation Signup",
                message=f"{signup_user.display_name or f'User {user_id}'} signed up for '{operation.title}'",
                link=f"/events/{operation_id}"
            )

        return participant

    async def cancel_signup(self, operation_id: int, user_id: int):
        """Cancel signup for an operation."""
        await self.db.execute(
            delete(OperationParticipant).where(
                OperationParticipant.operation_id == operation_id,
                OperationParticipant.user_id == user_id
            )
        )
        await self.db.flush()

    async def delete_operation(self, operation_id: int):
        """Delete an operation."""
        await self.db.execute(
            delete(Operation).where(Operation.id == operation_id)
        )
        await self.db.flush()

    async def track_operation_completed(self, user_id: int, operation_id: int, title: str):
        """Track when an operation is completed and notify participants."""
        from app.services.activity import ActivityService
        from app.services.notification import NotificationService
        activity_service = ActivityService(self.db)
        notification_service = NotificationService(self.db)

        await activity_service.track_operation_completed(
            user_id=user_id,
            operation_id=operation_id,
            title=title
        )

        # Notify participants
        operation = await self.get_operation(operation_id)
        for participant in operation.participants:
            if participant.user_id != user_id: # Don't notify the person who completed it
                await notification_service.create_notification(
                    user_id=participant.user_id,
                    notification_type=NotificationType.OP_REMINDER, # Or completion type
                    title="Operation Completed",
                    message=f"The operation '{title}' has been marked as completed. Thank you for your service!",
                    link=f"/events/{operation_id}"
                )

    async def complete_operation(self, operation_id: int, user_id: int) -> Optional[Operation]:
        """Mark an operation as completed and track activity."""
        operation = await self.get_operation(operation_id)
        if not operation:
            return None
        
        operation.status = OperationStatus.COMPLETED
        await self.db.flush()
        
        await self.track_operation_completed(user_id, operation.id, operation.title)
        return operation
