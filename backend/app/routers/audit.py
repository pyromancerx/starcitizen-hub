from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import require_permission
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.schemas.user import UserResponse
from app.services.audit import AuditLogger # Reusing existing service

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.view_audit_log"))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
):
    """Retrieve audit logs with pagination and filtering."""
    service = AuditLogger(db) # Use AuditLogger as a service
    
    logs = await service.get_audit_logs(
        skip=(page - 1) * limit,
        limit=limit,
        user_id=user_id,
        action=action,
        target_type=target_type,
    )
    
    return logs
