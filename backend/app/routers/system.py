from typing import Annotated, List, Optional
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, get_current_active_user, require_permission
from app.models.user import User
from app.schemas.system import ThemeSettings, SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse # Import new schemas
from app.services.system import SystemService

# Public router for fetching theme
public_router = APIRouter(prefix="/api/system", tags=["system"])
# Admin router for updates
admin_router = APIRouter(prefix="/api/admin/system", tags=["admin-system"])

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@public_router.get("/theme", response_model=ThemeSettings)
async def get_theme(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SystemService(db)
    return await service.get_theme_settings()

@admin_router.put("/theme", response_model=ThemeSettings)
async def update_theme(
    settings: ThemeSettings,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = SystemService(db)
    return await service.update_theme_settings(settings)

@admin_router.post("/upload-logo")
async def upload_logo(
    file: Annotated[UploadFile, File()],
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"logo{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        
    # Update setting
    url = f"/api/uploads/{filename}"
    service = SystemService(db)
    await service.set_setting("logo_url", url, is_public=True)
    
    return {"url": url}

# Serve uploaded files (Simple static serve for now, usually handled by Nginx/Caddy)
# In production Caddy should serve /data/uploads mapped to /api/uploads
@public_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============================================================
# Generic System Settings Management (Admin API)
# ============================================================

@admin_router.get("/settings", response_model=List[SystemSettingResponse])
async def list_all_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
    is_public: Optional[bool] = None,
):
    """List all system settings, optionally filtered by public status."""
    service = SystemService(db)
    settings_list = await service.get_all_settings(is_public=is_public) # Need to create get_all_settings
    return settings_list

@admin_router.get("/settings/{key}", response_model=SystemSettingResponse)
async def get_system_setting(
    key: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Get a specific system setting by key."""
    service = SystemService(db)
    setting = await service.get_setting(key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@admin_router.post("/settings", response_model=SystemSettingResponse, status_code=status.HTTP_201_CREATED)
async def create_system_setting(
    data: SystemSettingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Create a new system setting."""
    service = SystemService(db)
    existing_setting = await service.get_setting(data.key)
    if existing_setting:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")
    
    setting = await service.set_setting(data.key, data.value, data.is_public, data.description)
    return setting

@admin_router.patch("/settings/{key}", response_model=SystemSettingResponse)
async def update_system_setting(
    key: str,
    data: SystemSettingUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Update a specific system setting by key."""
    service = SystemService(db)
    setting = await service.get_setting(key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Update logic (handle optional fields)
    if data.value is not None:
        setting.value = data.value
    if data.description is not None:
        setting.description = data.description
    if data.is_public is not None:
        setting.is_public = data.is_public
    
    await db.commit()
    await db.refresh(setting)
    return setting

@admin_router.delete("/settings/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system_setting(
    key: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Delete a specific system setting by key."""
    service = SystemService(db)
    success = await service.delete_setting(key)
    if not success:
        raise HTTPException(status_code=404, detail="Setting not found")
    return

@admin_router.put("/bulk-settings", response_model=List[SystemSettingResponse])
async def bulk_update_system_settings(
    settings_data: Dict[str, str], # Expects a dict of key-value pairs
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Bulk update multiple system settings."""
    service = SystemService(db)
    updated_settings = await service.bulk_update_settings(settings_data)
    
    # Re-fetch the updated settings to return as SystemSettingResponse list
    settings_response_list = []
    for key in updated_settings.keys():
        setting = await service.get_setting(key)
        if setting:
            settings_response_list.append(SystemSettingResponse(
                key=setting.key,
                value=setting.value,
                description=setting.description,
                is_public=setting.is_public,
                updated_at=setting.updated_at
            ))
    return settings_response_list