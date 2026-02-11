from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_permission
from app.models.user import User
from app.schemas.role import RoleResponse
from app.services.role import RoleService

router = APIRouter(prefix="/api/roles", tags=["roles"])

@router.get("/", response_model=List[RoleResponse])
async def get_all_roles_api(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_roles"))],
):
    """Retrieve all roles."""
    service = RoleService(db)
    roles = await service.get_all_roles()
    return roles
