# app/routers/crew.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.crew import (
    LFGPostCreate,
    LFGPostUpdate,
    LFGPostResponse,
    LFGResponseCreate,
    LFGResponseSchema,
    UserAvailabilityCreate,
    UserAvailabilityUpdate,
    UserAvailabilityResponse,
    AvailabilityOverlap,
    SessionSuggestion,
    CrewLoadoutCreate,
    CrewLoadoutUpdate,
    CrewLoadoutResponse,
    CrewLoadoutQuickDeploy,
)
from app.services.crew import CrewService

router = APIRouter(prefix="/api/crew", tags=["crew"])


# === LFG Post Endpoints ===

@router.post("/lfg", response_model=LFGPostResponse, status_code=status.HTTP_201_CREATED)
async def create_lfg_post(
    data: LFGPostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Create a new LFG post."""
    service = CrewService(db)
    post = await service.create_lfg_post(current_user.id, data)
    return post


@router.get("/lfg", response_model=List[LFGPostResponse])
async def get_lfg_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    activity_type: Optional[str] = Query(None),
    ship_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get open LFG posts with optional filtering."""
    service = CrewService(db)
    # First, expire old posts
    await service.expire_old_posts()
    # Then get open posts
    return await service.get_open_lfg_posts(
        activity_type=activity_type,
        ship_type=ship_type,
        skip=skip,
        limit=limit
    )


@router.get("/lfg/my", response_model=List[LFGPostResponse])
async def get_my_lfg_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get LFG posts created by the current user."""
    service = CrewService(db)
    return await service.get_user_lfg_posts(current_user.id, skip=skip, limit=limit)


@router.get("/lfg/{post_id}", response_model=LFGPostResponse)
async def get_lfg_post(
    post_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific LFG post."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    return post


@router.put("/lfg/{post_id}", response_model=LFGPostResponse)
async def update_lfg_post(
    post_id: int,
    data: LFGPostUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update an LFG post."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own posts"
        )
    
    updated = await service.update_lfg_post(post, data)
    return updated


@router.post("/lfg/{post_id}/filled", response_model=LFGPostResponse)
async def mark_post_filled(
    post_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Mark an LFG post as filled."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only mark your own posts as filled"
        )
    
    updated = await service.mark_post_filled(post)
    return updated


@router.post("/lfg/{post_id}/cancel", response_model=LFGPostResponse)
async def cancel_lfg_post(
    post_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Cancel an LFG post."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only cancel your own posts"
        )
    
    updated = await service.cancel_lfg_post(post)
    return updated


@router.get("/lfg/stats/overview", response_model=dict)
async def get_lfg_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get LFG statistics."""
    service = CrewService(db)
    return await service.get_lfg_stats()


# === LFG Response Endpoints ===

@router.post("/lfg/{post_id}/respond", response_model=LFGResponseSchema, status_code=status.HTTP_201_CREATED)
async def respond_to_lfg(
    post_id: int,
    data: LFGResponseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Respond to an LFG post."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    if post.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot respond to your own post"
        )
    
    try:
        response = await service.create_lfg_response(post_id, current_user.id, data)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/lfg/{post_id}/responses", response_model=List[LFGResponseSchema])
async def get_post_responses(
    post_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get responses to an LFG post."""
    service = CrewService(db)
    post = await service.get_lfg_post_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LFG post not found"
        )
    
    # Only post creator can see responses
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the post creator can view responses"
        )
    
    return await service.get_post_responses(post_id)


# === Availability Endpoints ===

@router.post("/availability", response_model=UserAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def set_availability(
    data: UserAvailabilityCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Set availability for a day."""
    service = CrewService(db)
    availability = await service.set_availability(current_user.id, data)
    return availability


@router.get("/availability/my", response_model=List[UserAvailabilityResponse])
async def get_my_availability(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the current user's availability."""
    service = CrewService(db)
    return await service.get_user_availability(current_user.id)


@router.put("/availability/{availability_id}", response_model=UserAvailabilityResponse)
async def update_availability(
    availability_id: int,
    data: UserAvailabilityUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update an availability slot."""
    service = CrewService(db)
    availability = await service.get_availability_by_id(availability_id)
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found"
        )
    
    if availability.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own availability"
        )
    
    updated = await service.update_availability(availability, data)
    return updated


@router.delete("/availability/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(
    availability_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete an availability slot."""
    service = CrewService(db)
    availability = await service.get_availability_by_id(availability_id)
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found"
        )
    
    if availability.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own availability"
        )
    
    await service.delete_availability(availability)


@router.get("/availability/overlaps", response_model=List[AvailabilityOverlap])
async def get_availability_overlaps(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Find overlapping availability with other users."""
    service = CrewService(db)
    overlaps = await service.get_overlapping_availability(current_user.id)
    return overlaps


@router.get("/availability/suggestions", response_model=List[SessionSuggestion])
async def get_session_suggestions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    min_participants: int = Query(2, ge=2, le=10),
    min_duration: int = Query(60, ge=30, le=240),
):
    """Get suggested play session times based on availability overlaps."""
    service = CrewService(db)
    suggestions = await service.suggest_session_times(
        current_user.id,
        min_participants=min_participants,
        min_duration_minutes=min_duration
    )
    return suggestions


# === Crew Loadout Endpoints ===

@router.post("/loadouts", response_model=CrewLoadoutResponse, status_code=status.HTTP_201_CREATED)
async def create_loadout(
    data: CrewLoadoutCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Create a new crew loadout."""
    service = CrewService(db)
    loadout = await service.create_loadout(current_user.id, data)
    return loadout


@router.get("/loadouts", response_model=List[CrewLoadoutResponse])
async def get_my_loadouts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get the current user's crew loadouts."""
    service = CrewService(db)
    return await service.get_user_loadouts(current_user.id, skip=skip, limit=limit)


@router.get("/loadouts/templates", response_model=List[CrewLoadoutResponse])
async def get_loadout_templates(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
):
    """Get crew loadout templates."""
    service = CrewService(db)
    return await service.get_templates(skip=skip, limit=limit)


@router.get("/loadouts/{loadout_id}", response_model=CrewLoadoutResponse)
async def get_loadout(
    loadout_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific crew loadout."""
    service = CrewService(db)
    loadout = await service.get_loadout_by_id(loadout_id)
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found"
        )
    
    return loadout


@router.put("/loadouts/{loadout_id}", response_model=CrewLoadoutResponse)
async def update_loadout(
    loadout_id: int,
    data: CrewLoadoutUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update a crew loadout."""
    service = CrewService(db)
    loadout = await service.get_loadout_by_id(loadout_id)
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found"
        )
    
    if loadout.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own loadouts"
        )
    
    updated = await service.update_loadout(loadout, data)
    return updated


@router.delete("/loadouts/{loadout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loadout(
    loadout_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete a crew loadout."""
    service = CrewService(db)
    loadout = await service.get_loadout_by_id(loadout_id)
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found"
        )
    
    if loadout.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own loadouts"
        )
    
    await service.delete_loadout(loadout)


@router.post("/loadouts/{loadout_id}/duplicate", response_model=CrewLoadoutResponse)
async def duplicate_loadout(
    loadout_id: int,
    new_name: str = Query(..., min_length=1, max_length=100),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_approved_user)] = None,
):
    """Duplicate a crew loadout."""
    service = CrewService(db)
    loadout = await service.get_loadout_by_id(loadout_id)
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found"
        )
    
    new_loadout = await service.duplicate_loadout(loadout, new_name, current_user.id)
    return new_loadout


@router.post("/loadouts/{loadout_id}/deploy", response_model=CrewLoadoutResponse)
async def quick_deploy_loadout(
    loadout_id: int,
    data: CrewLoadoutQuickDeploy,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Quick-deploy a crew loadout with optional substitutions."""
    service = CrewService(db)
    loadout = await service.get_loadout_by_id(loadout_id)
    
    if not loadout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loadout not found"
        )
    
    deployed = await service.quick_deploy_loadout(
        loadout,
        substitutions=data.substitutions
    )
    return deployed
