# app/routers/privacy.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.privacy import (
    PrivacySettingsResponse,
    PrivacySettingsUpdate,
    DataExportRequest,
    AccountDeletionRequest,
    DeletionStatusResponse,
)
from app.services.privacy import PrivacyService
import json
import zipfile
import io


router = APIRouter(prefix="/api/privacy", tags=["privacy"])


@router.get("/settings", response_model=PrivacySettingsResponse)
async def get_privacy_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current user's privacy settings."""
    service = PrivacyService(db)
    settings = await service.get_or_create_privacy_settings(current_user.id)
    return settings


@router.put("/settings", response_model=PrivacySettingsResponse)
async def update_privacy_settings(
    data: PrivacySettingsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update privacy settings."""
    service = PrivacyService(db)
    settings = await service.update_privacy_settings(current_user.id, data)
    return settings


@router.post("/export")
async def export_data(
    request: DataExportRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Export all personal data (GDPR data portability)."""
    service = PrivacyService(db)
    
    # Check if data export is allowed
    settings = await service.get_or_create_privacy_settings(current_user.id)
    if not settings.allow_data_export:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data export is disabled for this account"
        )
    
    # Export data
    data = await service.export_user_data(current_user.id)
    
    if request.format == "csv":
        # Return CSV format
        csv_files = service.convert_to_csv(data)
        
        # Create ZIP file with all CSVs
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in csv_files.items():
                zip_file.writestr(f"{filename}.csv", content)
            # Add metadata JSON
            zip_file.writestr("export_metadata.json", json.dumps({
                "user_id": current_user.id,
                "export_date": data["export_date"],
                "total_records": data["total_records"],
                "format": "csv"
            }, indent=2))
        
        zip_buffer.seek(0)
        return PlainTextResponse(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=user_data_export_{current_user.id}.zip"
            }
        )
    else:
        # Return JSON format
        return JSONResponse(
            content=data,
            headers={
                "Content-Disposition": f"attachment; filename=user_data_export_{current_user.id}.json"
            }
        )


@router.post("/delete-account", response_model=DeletionStatusResponse)
async def request_account_deletion(
    request: AccountDeletionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Request account deletion (GDPR right to be forgotten).
    
    Account will be scheduled for deletion after 30 days grace period.
    """
    service = PrivacyService(db)
    
    # Check if already requested
    status = await service.get_deletion_status(current_user.id)
    if status["deletion_requested"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion already requested"
        )
    
    await service.request_account_deletion(current_user.id, request.reason)
    return await service.get_deletion_status(current_user.id)


@router.post("/cancel-deletion", response_model=DeletionStatusResponse)
async def cancel_account_deletion(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Cancel a pending account deletion request."""
    service = PrivacyService(db)
    
    # Check if deletion is pending
    status = await service.get_deletion_status(current_user.id)
    if not status["deletion_requested"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No deletion request pending"
        )
    
    await service.cancel_deletion_request(current_user.id)
    return await service.get_deletion_status(current_user.id)


@router.get("/deletion-status", response_model=DeletionStatusResponse)
async def get_deletion_status(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get account deletion status."""
    service = PrivacyService(db)
    return await service.get_deletion_status(current_user.id)
