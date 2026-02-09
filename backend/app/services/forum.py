from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.forum import ForumCategory, ForumThread, ForumPost
from app.schemas.forum import (
    ForumCategoryCreate, ForumCategoryUpdate,
    ForumThreadCreate, ForumThreadUpdate,
    ForumPostCreate, ForumPostUpdate
)

class ForumService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Categories ---
    async def create_category(self, data: ForumCategoryCreate) -> ForumCategory:
        category = ForumCategory(**data.model_dump())
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_categories(self) -> List[ForumCategory]:
        result = await self.db.execute(
            select(ForumCategory).order_by(ForumCategory.sort_order.asc())
        )
        return list(result.scalars().all())
    
    async def get_category(self, category_id: int) -> Optional[ForumCategory]:
        result = await self.db.execute(select(ForumCategory).where(ForumCategory.id == category_id))
        return result.scalar_one_or_none()

    async def update_category(self, category: ForumCategory, data: ForumCategoryUpdate) -> ForumCategory:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self.db.commit()
        await self.db.refresh(category)
        return category
        
    async def delete_category(self, category: ForumCategory) -> None:
        await self.db.delete(category)
        await self.db.commit()

    # --- Threads ---
    async def create_thread(self, category_id: int, author_id: int, data: ForumThreadCreate) -> ForumThread:
        # Create thread
        thread = ForumThread(
            category_id=category_id,
            author_id=author_id,
            title=data.title,
            is_pinned=data.is_pinned,
            is_locked=data.is_locked,
        )
        self.db.add(thread)
        await self.db.flush() # Get ID for thread

        # Create first post
        post = ForumPost(
            thread_id=thread.id,
            author_id=author_id,
            content=data.content
        )
        self.db.add(post)
        
        await self.db.commit()
        await self.db.refresh(thread)
        return thread

    async def get_threads(self, category_id: int, skip: int = 0, limit: int = 20) -> List[ForumThread]:
        query = (
            select(ForumThread)
            .where(ForumThread.category_id == category_id)
            .options(selectinload(ForumThread.author))
            .order_by(ForumThread.is_pinned.desc(), ForumThread.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_thread(self, thread_id: int) -> Optional[ForumThread]:
        query = (
            select(ForumThread)
            .where(ForumThread.id == thread_id)
            .options(selectinload(ForumThread.author))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def increment_view_count(self, thread: ForumThread):
        thread.view_count += 1
        await self.db.commit()
        await self.db.refresh(thread)

    # --- Posts ---
    async def create_post(self, thread_id: int, author_id: int, data: ForumPostCreate) -> ForumPost:
        post = ForumPost(
            thread_id=thread_id,
            author_id=author_id,
            content=data.content
        )
        self.db.add(post)
        
        # Update thread updated_at
        thread = await self.get_thread(thread_id)
        if thread:
            thread.updated_at = func.now()

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def get_posts(self, thread_id: int, skip: int = 0, limit: int = 20) -> List[ForumPost]:
        query = (
            select(ForumPost)
            .where(ForumPost.thread_id == thread_id)
            .options(selectinload(ForumPost.author))
            .order_by(ForumPost.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
