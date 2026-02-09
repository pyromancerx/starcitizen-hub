# app/web_dependencies.py
from typing import Annotated, Optional
from fastapi import Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.services.auth import AuthService
from app.services.user import UserService
from app.models.user import User
from app.models.role import Role, UserRole


async def get_current_user_from_cookie(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Get current user from session cookie, return None if not authenticated."""
    token = request.cookies.get("access_token")
    if not token:
        return None

    auth_service = AuthService()
    user_service = UserService(db)

    try:
        payload = auth_service.decode_access_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            return None
    except ValueError:
        return None

    user = await user_service.get_user_by_id(user_id)
    if user is None or not user.is_active:
        return None

    await user_service.update_last_seen(user)
    return user


async def require_auth(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Require authentication, redirect to login if not authenticated."""
    user = await get_current_user_from_cookie(request, db)
    if user is None:
        from fastapi.responses import RedirectResponse
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/login"}
        )
    return user


async def require_approved_user(
    user: Annotated[User, Depends(require_auth)],
) -> User:
    """Require an approved user."""
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending approval")
    return user


async def get_user_permissions(
    user: User,
    db: AsyncSession,
) -> list[str]:
    """Get all permissions for a user from their roles."""
    result = await db.execute(
        select(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    roles = result.scalars().all()

    permissions = set()
    for role in roles:
        if role.permissions:
            permissions.update(role.permissions)

    return list(permissions)


async def check_admin_permission(
    user: Annotated[User, Depends(require_auth)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Check if user has admin permissions."""
    permissions = await get_user_permissions(user, db)
    admin_perms = [
        "admin.manage_users",
        "admin.manage_roles",
        "admin.manage_settings",
    ]
    if not any(p in permissions for p in admin_perms):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_permission(permission: str):
    """Factory for permission-checking dependencies."""
    async def checker(
        user: Annotated[User, Depends(require_auth)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        permissions = await get_user_permissions(user, db)
        if permission not in permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Permission required: {permission}"
            )
        return user
    return checker
