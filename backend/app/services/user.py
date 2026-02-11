# app/services/user.py
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.auth import get_password_hash, verify_password


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            rsi_handle=user_data.rsi_handle,
            display_name=user_data.display_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def update_user(self, user: User, user_data: UserUpdate) -> User:
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_last_seen(self, user: User) -> None:
        from datetime import datetime, timezone
        user.last_seen_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def change_password_admin(self, user: User, new_password: str) -> User:
        """Admin-initiated password change for a user."""
        user.password_hash = get_password_hash(new_password)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def approve_user(self, user: User) -> User:
        """Approve a pending user."""
        user.is_approved = True
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def set_user_active_status(self, user: User, is_active: bool) -> User:
        """Set a user's active status (activate/deactivate)."""
        user.is_active = is_active
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user: User) -> None:
        """Permanently delete a user."""
        await self.db.delete(user)
        await self.db.commit()
