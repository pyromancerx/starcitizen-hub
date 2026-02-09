from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventDetail,
    EventSignupCreate, EventSignupUpdate, EventSignupResponse
)
from app.services.event import EventService

router = APIRouter(prefix="/api/events", tags=["events"])

from app.auth_dependencies import check_permission

# ...

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_permission("events.create"))],
):
    service = EventService(db)
    return await service.create_event(data, current_user.id)

# ...

@router.post("/{event_id}/signup", response_model=EventSignupResponse)
async def signup_for_event(
    event_id: int,
    data: EventSignupCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_permission("events.signup"))],
):
    service = EventService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return await service.signup_user(event_id, current_user.id, data)

# ...
