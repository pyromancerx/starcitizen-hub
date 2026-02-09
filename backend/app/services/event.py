from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event, EventSignup, SignupStatus
from app.schemas.event import EventCreate, EventUpdate, EventSignupCreate, EventSignupUpdate

class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_event(self, data: EventCreate, organizer_id: int) -> Event:
        event = Event(
            title=data.title,
            description=data.description,
            start_time=data.start_time,
            end_time=data.end_time,
            organizer_id=organizer_id,
            event_type=data.event_type,
            status=data.status,
            location=data.location,
            max_participants=data.max_participants,
            custom_attributes=data.custom_attributes,
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_events(self, skip: int = 0, limit: int = 20) -> List[Event]:
        query = (
            select(Event)
            .options(selectinload(Event.organizer))
            .order_by(Event.start_time.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_event(self, event_id: int) -> Optional[Event]:
        query = (
            select(Event)
            .where(Event.id == event_id)
            .options(selectinload(Event.organizer))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_event(self, event: Event, data: EventUpdate) -> Event:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(event, field, value)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def delete_event(self, event: Event) -> None:
        await self.db.delete(event)
        await self.db.commit()

    # --- Signups ---
    async def signup_user(self, event_id: int, user_id: int, data: EventSignupCreate) -> EventSignup:
        # Check if already signed up
        existing = await self.get_signup(event_id, user_id)
        if existing:
            return existing

        signup = EventSignup(
            event_id=event_id,
            user_id=user_id,
            role=data.role,
            status=SignupStatus.PENDING # Default to pending
        )
        self.db.add(signup)
        await self.db.commit()
        await self.db.refresh(signup)
        return signup

    async def get_signup(self, event_id: int, user_id: int) -> Optional[EventSignup]:
        result = await self.db.execute(
            select(EventSignup).where(
                EventSignup.event_id == event_id,
                EventSignup.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_signups(self, event_id: int) -> List[EventSignup]:
        query = (
            select(EventSignup)
            .where(EventSignup.event_id == event_id)
            .options(selectinload(EventSignup.user))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_signup(self, signup: EventSignup, data: EventSignupUpdate) -> EventSignup:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(signup, field, value)
        await self.db.commit()
        await self.db.refresh(signup)
        return signup

    async def remove_signup(self, signup: EventSignup) -> None:
        await self.db.delete(signup)
        await self.db.commit()
