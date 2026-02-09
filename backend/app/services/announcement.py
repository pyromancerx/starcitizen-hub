from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate

class AnnouncementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_announcement(self, data: AnnouncementCreate, author_id: int) -> Announcement:
        announcement = Announcement(
            title=data.title,
            content=data.content,
            author_id=author_id,
            is_pinned=data.is_pinned,
            is_public=data.is_public,
        )
        self.db.add(announcement)
        await self.db.commit()
        await self.db.refresh(announcement)
        return announcement

    async def get_announcement(self, announcement_id: int) -> Optional[Announcement]:
        result = await self.db.execute(select(Announcement).where(Announcement.id == announcement_id))
        return result.scalar_one_or_none()

    async def get_announcements(
        self, skip: int = 0, limit: int = 20, include_public_only: bool = False
    ) -> List[Announcement]:
        query = select(Announcement).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
        
        if include_public_only:
            query = query.where(Announcement.is_public == True)
            
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_announcement(self, announcement: Announcement, data: AnnouncementUpdate) -> Announcement:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(announcement, field, value)
        
        await self.db.commit()
        await self.db.refresh(announcement)
        return announcement

    async def delete_announcement(self, announcement: Announcement) -> None:
        await self.db.delete(announcement)
        await self.db.commit()
