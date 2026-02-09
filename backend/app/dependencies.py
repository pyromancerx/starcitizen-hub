# app/dependencies.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.services.auth import AuthService
from app.services.user import UserService
from app.models.user import User
from app.models.role import Role, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    auth_service = AuthService()
    user_service = UserService(db)

    try:
        payload = auth_service.decode_access_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    await user_service.update_last_seen(user)
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_approved_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User not approved")
    return current_user

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
            # Handle "*" admin permission
            if "*" in role.permissions:
                return ["*"]
            permissions.update(role.permissions)

    return list(permissions)

def check_permission(required_permission: str):
    async def dependency(
        user: Annotated[User, Depends(get_current_approved_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ):
        permissions = await get_user_permissions(user, db)
        if "*" in permissions:
            return user
        if required_permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {required_permission}",
            )
        return user
    return dependency
