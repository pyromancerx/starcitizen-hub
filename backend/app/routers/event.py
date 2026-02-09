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

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = EventService(db)
    return await service.create_event(data, current_user.id)

@router.get("/", response_model=List[EventResponse])
async def list_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = EventService(db)
    return await service.get_events(skip, limit)

@router.get("/{event_id}", response_model=EventDetail)
async def get_event(
    event_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = EventService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    signups = await service.get_signups(event_id)
    
    # Construct detail response
    # We rely on Pydantic's from_attributes to handle the mapping from SQLAlchemy model
    # but we need to inject the signups list
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict['signups'] = signups
    return event_dict

@router.post("/{event_id}/signup", response_model=EventSignupResponse)
async def signup_for_event(
    event_id: int,
    data: EventSignupCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = EventService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return await service.signup_user(event_id, current_user.id, data)

@router.delete("/{event_id}/signup", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_signup(
    event_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = EventService(db)
    signup = await service.get_signup(event_id, current_user.id)
    if not signup:
        raise HTTPException(status_code=404, detail="Signup not found")
        
    await service.remove_signup(signup)
