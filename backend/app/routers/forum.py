from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.forum import (
    ForumCategoryCreate, ForumCategoryResponse,
    ForumThreadCreate, ForumThreadResponse, ForumThreadDetail,
    ForumPostCreate, ForumPostResponse,
)
from app.services.forum import ForumService

router = APIRouter(prefix="/api/forum", tags=["forum"])

from app.auth_dependencies import check_permission

# ...

# --- Categories ---
@router.post("/categories", response_model=ForumCategoryResponse)
async def create_category(
    data: ForumCategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_permission("forum.manage"))],
):
    service = ForumService(db)
    return await service.create_category(data)

# ...

# --- Threads ---
@router.post("/categories/{category_id}/threads", response_model=ForumThreadResponse)
async def create_thread(
    category_id: int,
    data: ForumThreadCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_permission("forum.post"))],
):
    service = ForumService(db)
    category = await service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return await service.create_thread(category_id, current_user.id, data)

# ...

# --- Posts ---
@router.post("/threads/{thread_id}/posts", response_model=ForumPostResponse)
async def create_post(
    thread_id: int,
    data: ForumPostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_permission("forum.post"))],
):
    service = ForumService(db)
    thread = await service.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.is_locked:
         # TODO: Allow mods to post in locked threads?
         # if not await has_permission(current_user, "forum.manage", db):
         raise HTTPException(status_code=403, detail="Thread is locked")

    return await service.create_post(thread_id, current_user.id, data)
