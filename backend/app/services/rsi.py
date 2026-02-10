# app/services/rsi.py
import secrets
import string
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.rsi import RSIVerificationRequest, VerificationStatus
from app.models.user import User
from app.services.notification import NotificationService


class RSIService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_verification_code(self) -> str:
        """Generate a unique verification code for RSI handle verification."""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

    async def submit_verification_request(
        self,
        user_id: int,
        rsi_handle: str,
        screenshot_url: str
    ) -> RSIVerificationRequest:
        """Submit a new RSI verification request."""
        # Check for existing pending request
        existing = await self.db.execute(
            select(RSIVerificationRequest)
            .where(
                RSIVerificationRequest.user_id == user_id,
                RSIVerificationRequest.status == VerificationStatus.PENDING
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("You already have a pending verification request")

        # Check if handle is already verified by another user
        verified_user = await self.db.execute(
            select(User)
            .where(
                User.rsi_handle == rsi_handle,
                User.is_rsi_verified == True,
                User.id != user_id
            )
        )
        if verified_user.scalar_one_or_none():
            raise ValueError("This RSI handle is already verified by another user")

        # Generate verification code
        verification_code = self._generate_verification_code()

        # Create request
        request = RSIVerificationRequest(
            user_id=user_id,
            rsi_handle=rsi_handle,
            screenshot_url=screenshot_url,
            verification_code=verification_code,
            status=VerificationStatus.PENDING
        )
        self.db.add(request)
        await self.db.commit()
        await self.db.refresh(request)

        return request

    async def get_verification_status(self, user_id: int) -> dict:
        """Get the RSI verification status for a user."""
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        # Get pending request if any
        pending = await self.db.execute(
            select(RSIVerificationRequest)
            .where(
                RSIVerificationRequest.user_id == user_id,
                RSIVerificationRequest.status == VerificationStatus.PENDING
            )
        )
        pending_request = pending.scalar_one_or_none()

        return {
            "is_verified": user.is_rsi_verified,
            "rsi_handle": user.rsi_handle,
            "pending_request": pending_request
        }

    async def get_pending_requests(self) -> list[RSIVerificationRequest]:
        """Get all pending verification requests (admin only)."""
        result = await self.db.execute(
            select(RSIVerificationRequest)
            .where(RSIVerificationRequest.status == VerificationStatus.PENDING)
            .order_by(RSIVerificationRequest.submitted_at)
        )
        return result.scalars().all()

    async def review_verification_request(
        self,
        request_id: int,
        admin_id: int,
        approved: bool,
        admin_notes: Optional[str] = None
    ) -> RSIVerificationRequest:
        """Review and approve/reject a verification request."""
        request = await self.db.get(RSIVerificationRequest, request_id)
        if not request:
            raise ValueError("Verification request not found")

        if request.status != VerificationStatus.PENDING:
            raise ValueError("Request has already been reviewed")

        request.status = VerificationStatus.APPROVED if approved else VerificationStatus.REJECTED
        request.reviewed_at = datetime.utcnow()
        request.reviewed_by_id = admin_id
        request.admin_notes = admin_notes

        if approved:
            # Update user
            user = await self.db.get(User, request.user_id)
            if user:
                user.rsi_handle = request.rsi_handle
                user.is_rsi_verified = True

            # Send notification
            notification_service = NotificationService(self.db)
            await notification_service.notify_user(
                user_id=request.user_id,
                type="rsi_verified",
                title="RSI Account Verified",
                message=f"Your RSI handle '{request.rsi_handle}' has been verified!",
                link="/profile"
            )
        else:
            # Send rejection notification
            notification_service = NotificationService(self.db)
            await notification_service.notify_user(
                user_id=request.user_id,
                type="rsi_rejected",
                title="RSI Verification Rejected",
                message=f"Your RSI verification request was rejected. Reason: {admin_notes or 'No reason provided'}",
                link="/profile"
            )

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def get_user_rsi_profile(self, user_id: int) -> Optional[dict]:
        """Get public RSI profile information for a user."""
        user = await self.db.get(User, user_id)
        if not user:
            return None

        return {
            "user_id": user.id,
            "display_name": user.display_name,
            "rsi_handle": user.rsi_handle,
            "is_verified": user.is_rsi_verified,
            "rsi_profile_url": f"https://robertsspaceindustries.com/citizens/{user.rsi_handle}" if user.rsi_handle else None
        }
