from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.privacy import UserPrivacy
from app.services.privacy import PrivacyService
from app.database import get_db_session

async def execute_pending_deletions():
    """
    Background task to execute account deletions for users whose grace period has passed.
    """
    async for db in get_db_session():
        service = PrivacyService(db)
        
        # Find users scheduled for deletion where the scheduled time has passed and not yet deleted
        result = await db.execute(
            select(UserPrivacy).where(
                UserPrivacy.deletion_scheduled_at <= datetime.utcnow(),
                UserPrivacy.is_deleted == False
            )
        )
        privacy_records = result.scalars().all()
        
        for privacy in privacy_records:
            print(f"Processing deletion for user ID: {privacy.user_id}")
            try:
                await service.anonymize_user_data(privacy.user_id)
                print(f"Successfully anonymized data for user ID: {privacy.user_id}")
            except Exception as e:
                print(f"Error anonymizing data for user ID {privacy.user_id}: {e}")
                await db.rollback() # Rollback changes for this user if an error occurs
        
