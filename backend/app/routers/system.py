from typing import Annotated, List
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, get_current_active_user, require_permission
from app.models.user import User
from app.schemas.system import ThemeSettings
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
