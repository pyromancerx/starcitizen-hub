from typing import Annotated, List
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.role import Role, UserRole

# Define available permissions
class Permissions:
    # Asset Management
    ASSETS_VIEW = "assets.view"
    ASSETS_EDIT = "assets.edit"
    ASSETS_DELETE = "assets.delete"
    
    # Forum
    FORUM_READ = "forum.read"
    FORUM_POST = "forum.post"
    FORUM_MODERATE = "forum.moderate"
    
    # Events
    EVENTS_VIEW = "events.view"
    EVENTS_CREATE = "events.create"
    EVENTS_SIGNUP = "events.signup"
    
    # Admin
    ADMIN_ACCESS = "admin.access"
    
    # Wildcard
    ALL = "*"

async def get_user_permissions(user: User, db: AsyncSession) -> List[str]:
    """Fetch all permissions for a user based on their roles."""
    query = (
        select(Role.permissions)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    result = await db.execute(query)
    permission_lists = result.scalars().all()
    
    # Flatten and deduplicate
    permissions = set()
    for plist in permission_lists:
        for p in plist:
            permissions.add(p)
            
    return list(permissions)

def check_permission(required_permission: str):
    """Dependency factory to check if user has a specific permission."""
    async def _checker(
        user: Annotated[User, Depends(get_current_approved_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        user_permissions = await get_user_permissions(user, db)
        
        if Permissions.ALL in user_permissions:
            return user
            
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {required_permission}"
            )
        return user
    return _checker

# Helper for multiple permissions (OR logic)
def check_any_permission(required_permissions: List[str]):
    async def _checker(
        user: Annotated[User, Depends(get_current_approved_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        user_permissions = await get_user_permissions(user, db)
        
        if Permissions.ALL in user_permissions:
            return user
            
        for perm in required_permissions:
            if perm in user_permissions:
                return user
                
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing one of required permissions: {required_permissions}"
        )
    return _checker
