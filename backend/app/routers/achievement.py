# app/routers/achievement.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.models.achievement import AchievementType, AchievementRarity
from app.schemas.achievement import (
    AchievementCreate,
    AchievementUpdate,
    AchievementResponse,
    AwardAchievementRequest,
    UserAchievementResponse,
    UserAchievementSummary,
    AchievementLeaderboardResponse,
)
from app.services.achievement import AchievementService

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


# === Achievement Management (Admin) ===

@router.post("/", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
async def create_achievement(
    data: AchievementCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Create a new achievement (admin only)."""
    service = AchievementService(db)
    
    # Check if achievement with this name already exists
    existing = await service.get_achievement_by_name(data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Achievement with this name already exists"
        )
    
    achievement = await service.create_achievement(
        data=data,
        created_by_id=current_user.id
    )
    return achievement


@router.get("/", response_model=List[AchievementResponse])
async def get_all_achievements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    active_only: bool = Query(True),
    achievement_type: Optional[AchievementType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """Get all achievements."""
    service = AchievementService(db)
    achievements = await service.get_all_achievements(
        active_only=active_only,
        achievement_type=achievement_type,
        skip=skip,
        limit=limit
    )
    
    # Get earned counts
    result = []
    for achievement in achievements:
        earned_count = len(achievement.user_achievements)
        result.append(AchievementResponse(
            id=achievement.id,
            name=achievement.name,
            description=achievement.description,
            icon=achievement.icon,
            rarity=achievement.rarity,
            achievement_type=achievement.achievement_type,
            criteria=achievement.criteria,
            points=achievement.points,
            is_active=achievement.is_active,
            created_by_id=achievement.created_by_id,
            created_by_name=achievement.created_by.display_name if achievement.created_by else None,
            created_at=achievement.created_at,
            updated_at=achievement.updated_at,
            earned_count=earned_count,
        ))
    
    return result


@router.get("/{achievement_id}", response_model=AchievementResponse)
async def get_achievement(
    achievement_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific achievement."""
    service = AchievementService(db)
    achievement = await service.get_achievement_by_id(achievement_id)
    
    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )
    
    earned_count = len(achievement.user_achievements)
    return AchievementResponse(
        id=achievement.id,
        name=achievement.name,
        description=achievement.description,
        icon=achievement.icon,
        rarity=achievement.rarity,
        achievement_type=achievement.achievement_type,
        criteria=achievement.criteria,
        points=achievement.points,
        is_active=achievement.is_active,
        created_by_id=achievement.created_by_id,
        created_by_name=achievement.created_by.display_name if achievement.created_by else None,
        created_at=achievement.created_at,
        updated_at=achievement.updated_at,
        earned_count=earned_count,
    )


@router.put("/{achievement_id}", response_model=AchievementResponse)
async def update_achievement(
    achievement_id: int,
    data: AchievementUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Update an achievement (admin only)."""
    service = AchievementService(db)
    achievement = await service.get_achievement_by_id(achievement_id)
    
    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )
    
    updated = await service.update_achievement(achievement, data)
    
    earned_count = len(updated.user_achievements)
    return AchievementResponse(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        icon=updated.icon,
        rarity=updated.rarity,
        achievement_type=updated.achievement_type,
        criteria=updated.criteria,
        points=updated.points,
        is_active=updated.is_active,
        created_by_id=updated.created_by_id,
        created_by_name=updated.created_by.display_name if updated.created_by else None,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        earned_count=earned_count,
    )


@router.delete("/{achievement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_achievement(
    achievement_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Delete an achievement (admin only)."""
    service = AchievementService(db)
    achievement = await service.get_achievement_by_id(achievement_id)
    
    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )
    
    await service.delete_achievement(achievement)


# === User Achievement Routes ===

@router.post("/award", response_model=UserAchievementResponse, status_code=status.HTTP_201_CREATED)
async def award_achievement(
    data: AwardAchievementRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_users"))],
):
    """Manually award an achievement to a user (admin only)."""
    service = AchievementService(db)
    
    # Verify achievement exists
    achievement = await service.get_achievement_by_id(data.achievement_id)
    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )
    
    # Check if user already has this achievement
    has_achievement = await service.has_achievement(data.user_id, data.achievement_id)
    if has_achievement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has this achievement"
        )
    
    user_achievement = await service.award_achievement(
        user_id=data.user_id,
        achievement_id=data.achievement_id,
        awarded_by_id=current_user.id,
        award_note=data.award_note
    )
    
    if not user_achievement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to award achievement"
        )
    
    return UserAchievementResponse(
        id=user_achievement.id,
        user_id=user_achievement.user_id,
        achievement_id=user_achievement.achievement_id,
        achievement=AchievementResponse(
            id=achievement.id,
            name=achievement.name,
            description=achievement.description,
            icon=achievement.icon,
            rarity=achievement.rarity,
            achievement_type=achievement.achievement_type,
            criteria=achievement.criteria,
            points=achievement.points,
            is_active=achievement.is_active,
            created_by_id=achievement.created_by_id,
            created_at=achievement.created_at,
            updated_at=achievement.updated_at,
            earned_count=len(achievement.user_achievements) + 1,
        ),
        awarded_by_id=current_user.id,
        awarded_by_name=current_user.display_name,
        award_note=user_achievement.award_note,
        awarded_at=user_achievement.awarded_at,
    )


@router.post("/check", response_model=List[UserAchievementResponse])
async def check_achievements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Check if current user qualifies for any system achievements."""
    service = AchievementService(db)
    awarded = await service.check_and_award_achievements(current_user.id)
    
    result = []
    for ua in awarded:
        achievement = ua.achievement
        result.append(UserAchievementResponse(
            id=ua.id,
            user_id=ua.user_id,
            achievement_id=ua.achievement_id,
            achievement=AchievementResponse(
                id=achievement.id,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                rarity=achievement.rarity,
                achievement_type=achievement.achievement_type,
                criteria=achievement.criteria,
                points=achievement.points,
                is_active=achievement.is_active,
                created_by_id=achievement.created_by_id,
                created_at=achievement.created_at,
                updated_at=achievement.updated_at,
                earned_count=len(achievement.user_achievements),
            ),
            awarded_by_id=None,
            awarded_by_name=None,
            award_note=None,
            awarded_at=ua.awarded_at,
        ))
    
    return result


@router.get("/my/achievements", response_model=List[UserAchievementResponse])
async def get_my_achievements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get current user's achievements."""
    service = AchievementService(db)
    user_achievements = await service.get_user_achievements(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    result = []
    for ua in user_achievements:
        achievement = ua.achievement
        awarded_by_name = ua.awarded_by.display_name if ua.awarded_by else None
        result.append(UserAchievementResponse(
            id=ua.id,
            user_id=ua.user_id,
            achievement_id=ua.achievement_id,
            achievement=AchievementResponse(
                id=achievement.id,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                rarity=achievement.rarity,
                achievement_type=achievement.achievement_type,
                criteria=achievement.criteria,
                points=achievement.points,
                is_active=achievement.is_active,
                created_by_id=achievement.created_by_id,
                created_at=achievement.created_at,
                updated_at=achievement.updated_at,
                earned_count=len(achievement.user_achievements),
            ),
            awarded_by_id=ua.awarded_by_id,
            awarded_by_name=awarded_by_name,
            award_note=ua.award_note,
            awarded_at=ua.awarded_at,
        ))
    
    return result


@router.get("/my/summary", response_model=UserAchievementSummary)
async def get_my_achievement_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get achievement summary for current user."""
    service = AchievementService(db)
    summary = await service.get_user_achievement_summary(current_user.id)
    
    # Format recent achievements
    recent_formatted = []
    for ua in summary["recent_achievements"]:
        achievement = ua.achievement
        awarded_by_name = ua.awarded_by.display_name if ua.awarded_by else None
        recent_formatted.append(UserAchievementResponse(
            id=ua.id,
            user_id=ua.user_id,
            achievement_id=ua.achievement_id,
            achievement=AchievementResponse(
                id=achievement.id,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                rarity=achievement.rarity,
                achievement_type=achievement.achievement_type,
                criteria=achievement.criteria,
                points=achievement.points,
                is_active=achievement.is_active,
                created_by_id=achievement.created_by_id,
                created_at=achievement.created_at,
                updated_at=achievement.updated_at,
                earned_count=len(achievement.user_achievements),
            ),
            awarded_by_id=ua.awarded_by_id,
            awarded_by_name=awarded_by_name,
            award_note=ua.award_note,
            awarded_at=ua.awarded_at,
        ))
    
    return UserAchievementSummary(
        total_points=summary["total_points"],
        total_achievements=summary["total_achievements"],
        by_rarity=summary["by_rarity"],
        recent_achievements=recent_formatted,
    )


@router.get("/user/{user_id}", response_model=List[UserAchievementResponse])
async def get_user_achievements(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get achievements for a specific user."""
    service = AchievementService(db)
    user_achievements = await service.get_user_achievements(
        user_id=user_id,
        skip=skip,
        limit=limit
    )
    
    result = []
    for ua in user_achievements:
        achievement = ua.achievement
        awarded_by_name = ua.awarded_by.display_name if ua.awarded_by else None
        result.append(UserAchievementResponse(
            id=ua.id,
            user_id=ua.user_id,
            achievement_id=ua.achievement_id,
            achievement=AchievementResponse(
                id=achievement.id,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                rarity=achievement.rarity,
                achievement_type=achievement.achievement_type,
                criteria=achievement.criteria,
                points=achievement.points,
                is_active=achievement.is_active,
                created_by_id=achievement.created_by_id,
                created_at=achievement.created_at,
                updated_at=achievement.updated_at,
                earned_count=len(achievement.user_achievements),
            ),
            awarded_by_id=ua.awarded_by_id,
            awarded_by_name=awarded_by_name,
            award_note=ua.award_note,
            awarded_at=ua.awarded_at,
        ))
    
    return result


# === Leaderboard ===

@router.get("/leaderboard/top", response_model=AchievementLeaderboardResponse)
async def get_achievement_leaderboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    limit: int = Query(10, ge=1, le=50),
):
    """Get achievement leaderboard."""
    service = AchievementService(db)
    leaderboard = await service.get_leaderboard(limit=limit)
    
    from app.schemas.achievement import AchievementLeaderboardEntry
    entries = [
        AchievementLeaderboardEntry(
            user_id=entry["user_id"],
            display_name=entry["display_name"],
            total_points=entry["total_points"],
            total_achievements=entry["total_achievements"],
            rank=entry["rank"]
        )
        for entry in leaderboard
    ]
    
    return AchievementLeaderboardResponse(
        entries=entries,
        total_count=len(entries)
    )


# === Setup ===

@router.post("/setup/defaults", status_code=status.HTTP_201_CREATED)
async def setup_default_achievements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    """Create default system achievements (admin only)."""
    service = AchievementService(db)
    await service.create_default_achievements()
    return {"message": "Default achievements created successfully"}
