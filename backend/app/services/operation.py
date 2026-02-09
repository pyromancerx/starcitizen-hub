# backend/app/services/operation.py
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.event import Operation, OperationParticipant, OperationStatus
from app.schemas.operation import OperationCreate, OperationUpdate

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
        result = await self.db.execute(
            select(Operation).where(Operation.id == operation_id)
        )
        return result.scalar_one_or_none()

    async def create_operation(self, data: OperationCreate, user_id: int) -> Operation:
        operation = Operation(
            **data.model_dump(),
            created_by_id=user_id,
            status=OperationStatus.RECRUITING if data.scheduled_at > datetime.utcnow() else OperationStatus.PLANNING
        )
        self.db.add(operation)
        await self.db.flush()
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
        return participant
