from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from sqlalchemy import select, func, desc, and_
from app.models.audit import AuditLog
from app.models.user import User

class AuditLogger:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        request: Request,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[dict] = None,
    ):
        """Log an admin action."""
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = request.state.user.id
        
        ip_address = request.client.host if request.client else None

        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
        )
        self.db.add(log_entry)
        # We don't commit here to allow the caller to commit as part of their transaction
        # or we can commit if we want it to be independent. 
        # Usually it's better to commit with the transaction.
    
    async def get_audit_logs(
        self,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
    ) -> List[AuditLog]:
        """Retrieve audit logs with pagination and filtering."""
        query = select(AuditLog).order_by(AuditLog.created_at.desc())

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if target_type:
            query = query.where(AuditLog.target_type == target_type)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
