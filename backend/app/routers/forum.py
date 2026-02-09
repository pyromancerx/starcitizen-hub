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

# --- Categories ---
@router.post("/categories", response_model=ForumCategoryResponse)
async def create_category(
    data: ForumCategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    # TODO: Admin check
    service = ForumService(db)
    return await service.create_category(data)

@router.get("/categories", response_model=List[ForumCategoryResponse])
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ForumService(db)
    return await service.get_categories()

# --- Threads ---
@router.post("/categories/{category_id}/threads", response_model=ForumThreadResponse)
async def create_thread(
    category_id: int,
    data: ForumThreadCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ForumService(db)
    category = await service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return await service.create_thread(category_id, current_user.id, data)

@router.get("/categories/{category_id}/threads", response_model=List[ForumThreadResponse])
async def list_threads(
    category_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
):
    service = ForumService(db)
    return await service.get_threads(category_id, skip, limit)

@router.get("/threads/{thread_id}", response_model=ForumThreadDetail)
async def get_thread_detail(
    thread_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ForumService(db)
    thread = await service.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    await service.increment_view_count(thread)
    
    # Fetch posts
    posts = await service.get_posts(thread_id, limit=100) # Simple pagination for now
    
    # Construct response manually to combine thread + posts
    # (Pydantic models with from_attributes=True handle the SQLAlchemy objects)
    return ForumThreadDetail(
        id=thread.id,
        category_id=thread.category_id,
        author_id=thread.author_id,
        title=thread.title,
        is_pinned=thread.is_pinned,
        is_locked=thread.is_locked,
        view_count=thread.view_count,
        author=thread.author,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        posts=posts
    )

# --- Posts ---
@router.post("/threads/{thread_id}/posts", response_model=ForumPostResponse)
async def create_post(
    thread_id: int,
    data: ForumPostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ForumService(db)
    thread = await service.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.is_locked:
         raise HTTPException(status_code=403, detail="Thread is locked")

    return await service.create_post(thread_id, current_user.id, data)
