from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.services.announcement import AnnouncementService

router = APIRouter(prefix="/api/announcements", tags=["announcements"])

@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.post_announcements"))],
):
    service = AnnouncementService(db)
    return await service.create_announcement(data, current_user.id)

@router.get("/", response_model=List[AnnouncementResponse])
async def list_announcements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = AnnouncementService(db)
    return await service.get_announcements(skip, limit)

@router.get("/public", response_model=List[AnnouncementResponse])
async def list_public_announcements(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = AnnouncementService(db)
    return await service.get_announcements(skip, limit, include_public_only=True)

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = AnnouncementService(db)
    announcement = await service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

from app.web_dependencies import get_user_permissions

...

@router.patch("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    user_permissions: Annotated[List[str], Depends(get_user_permissions)],
):
    service = AnnouncementService(db)
    announcement = await service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check permission (author or admin)
    if announcement.author_id != current_user.id and "admin.manage_settings" not in user_permissions:
        raise HTTPException(status_code=403, detail="Not authorized to edit this announcement")

    return await service.update_announcement(announcement, data)

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    user_permissions: Annotated[List[str], Depends(get_user_permissions)],
):
    service = AnnouncementService(db)
    announcement = await service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if announcement.author_id != current_user.id and "admin.manage_settings" not in user_permissions:
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement")

    await service.delete_announcement(announcement)
