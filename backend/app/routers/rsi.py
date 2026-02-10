# app/routers/rsi.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_permissions
from app.models.user import User
from app.schemas.rsi import (
    RSIVerificationRequestCreate,
    RSIVerificationRequestResponse,
    RSIVerificationRequestReview,
    RSIVerificationStatus
)
from app.services.rsi import RSIService


rsi_router = APIRouter(prefix="/api/rsi", tags=["RSI Integration"])


@rsi_router.post("/verify", response_model=RSIVerificationRequestResponse)
async def submit_verification_request(
    request: RSIVerificationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an RSI verification request."""
    service = RSIService(db)
    try:
        result = await service.submit_verification_request(
            user_id=current_user.id,
            rsi_handle=request.rsi_handle,
            screenshot_url=request.screenshot_url
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@rsi_router.get("/status", response_model=RSIVerificationStatus)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's RSI verification status."""
    service = RSIService(db)
    status_data = await service.get_verification_status(current_user.id)
    return RSIVerificationStatus(
        is_verified=status_data["is_verified"],
        rsi_handle=status_data["rsi_handle"],
        pending_request=status_data["pending_request"]
    )


@rsi_router.get("/profile/{user_id}")
async def get_user_rsi_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public RSI profile information."""
    service = RSIService(db)
    profile = await service.get_user_rsi_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile


# Admin endpoints
@rsi_router.get("/admin/pending", response_model=List[RSIVerificationRequestResponse])
async def get_pending_requests(
    current_user: User = Depends(require_permissions(["admin.manage_users"])),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending verification requests (admin only)."""
    service = RSIService(db)
    requests = await service.get_pending_requests()
    return requests


@rsi_router.post("/admin/review/{request_id}", response_model=RSIVerificationRequestResponse)
async def review_verification_request(
    request_id: int,
    review: RSIVerificationRequestReview,
    current_user: User = Depends(require_permissions(["admin.manage_users"])),
    db: AsyncSession = Depends(get_db)
):
    """Review and approve/reject a verification request (admin only)."""
    service = RSIService(db)
    try:
        result = await service.review_verification_request(
            request_id=request_id,
            admin_id=current_user.id,
            approved=review.approved,
            admin_notes=review.admin_notes
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
