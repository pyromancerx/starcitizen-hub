# app/routers/activity.py
from typing import Annotated, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.activity import ActivityType
from app.schemas.activity import (
    ActivityResponse,
    ActivityFeedResponse,
    ActivityReactionCreate,
    ActivityReactionResponse,
)
from app.services.activity import ActivityService

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/feed", response_model=ActivityFeedResponse)
async def get_activity_feed(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    activity_type: Optional[ActivityType] = Query(None),
    user_id: Optional[int] = Query(None),
    hours: Optional[int] = Query(None, ge=1, le=168),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get the activity feed with optional filtering."""
    service = ActivityService(db)
    
    since = None
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
    
    activities, total_count = await service.get_activity_feed(
        activity_type=activity_type,
        user_id=user_id,
        since=since,
        limit=limit,
        offset=offset,
    )
    
    # Format response
    activity_responses = []
    for activity in activities:
        reactions = await service.get_reactions(activity.id)
        reaction_list = [
            ActivityReactionResponse(
                id=r.id,
                emoji=r.emoji,
                user_id=r.user_id,
                created_at=r.created_at,
                user_display_name=getattr(r.user, 'display_name', None) if hasattr(r, 'user') else None
            )
            for r in reactions
        ]
        
        activity_responses.append(ActivityResponse(
            id=activity.id,
            type=activity.type,
            content=activity.content,
            user_id=activity.user_id,
            related_id=activity.related_id,
            related_type=activity.related_type,
            created_at=activity.created_at,
            user_display_name=getattr(activity, 'user_display_name', None),
            reactions=reaction_list,
            reaction_count=len(reaction_list),
        ))
    
    return ActivityFeedResponse(
        activities=activity_responses,
        total_count=total_count,
        has_more=offset + len(activities) < total_count,
        next_cursor=str(offset + len(activities)) if offset + len(activities) < total_count else None,
    )


@router.get("/recent", response_model=List[ActivityResponse])
async def get_recent_activities(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(50, ge=1, le=100),
):
    """Get recent activities from the last N hours."""
    service = ActivityService(db)
    activities = await service.get_recent_activities(hours=hours, limit=limit)
    
    # Format response with reactions
    activity_responses = []
    for activity in activities:
        reactions = await service.get_reactions(activity.id)
        reaction_list = [
            ActivityReactionResponse(
                id=r.id,
                emoji=r.emoji,
                user_id=r.user_id,
                created_at=r.created_at,
            )
            for r in reactions
        ]
        
        activity_responses.append(ActivityResponse(
            id=activity.id,
            type=activity.type,
            content=activity.content,
            user_id=activity.user_id,
            related_id=activity.related_id,
            related_type=activity.related_type,
            created_at=activity.created_at,
            reactions=reaction_list,
            reaction_count=len(reaction_list),
        ))
    
    return activity_responses


@router.get("/stats", response_model=dict)
async def get_activity_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    days: int = Query(7, ge=1, le=30),
):
    """Get activity statistics for the last N days."""
    service = ActivityService(db)
    return await service.get_activity_stats(days=days)


@router.post("/{activity_id}/react", response_model=ActivityReactionResponse, status_code=status.HTTP_201_CREATED)
async def add_reaction(
    activity_id: int,
    data: ActivityReactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Add a reaction to an activity."""
    service = ActivityService(db)
    
    try:
        reaction = await service.add_reaction(
            activity_id=activity_id,
            user_id=current_user.id,
            emoji=data.emoji,
        )
        return ActivityReactionResponse(
            id=reaction.id,
            emoji=reaction.emoji,
            user_id=reaction.user_id,
            created_at=reaction.created_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{activity_id}/react/{emoji}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    activity_id: int,
    emoji: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Remove a reaction from an activity."""
    service = ActivityService(db)
    await service.remove_reaction(
        activity_id=activity_id,
        user_id=current_user.id,
        emoji=emoji,
    )


@router.get("/types", response_model=List[str])
async def get_activity_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get all available activity types."""
    return [t.value for t in ActivityType]
