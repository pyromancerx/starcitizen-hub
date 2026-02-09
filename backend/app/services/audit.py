from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from app.models.audit import AuditLog


class AuditLogger:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        request: Request,
        action: str,
        target_type: str = None,
        target_id: int = None,
        details: dict = None,
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
