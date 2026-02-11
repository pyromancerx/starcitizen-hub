from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user # Assuming this dependency exists
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get current authenticated user's profile."""
    # The get_current_approved_user dependency already fetches and returns the user
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_approved_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current authenticated user's profile."""
    user_service = UserService(db)
    updated_user = await user_service.update_user(current_user, user_data)
    return updated_user
