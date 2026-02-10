# app/schemas/achievement.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.achievement import AchievementRarity, AchievementType


class AchievementBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    icon: Optional[str] = Field(None, max_length=50)
    rarity: AchievementRarity = AchievementRarity.COMMON
    achievement_type: AchievementType = AchievementType.CUSTOM
    criteria: Optional[dict] = None
    points: int = Field(10, ge=0, le=1000)


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    rarity: Optional[AchievementRarity] = None
    criteria: Optional[dict] = None
    points: Optional[int] = Field(None, ge=0, le=1000)
    is_active: Optional[bool] = None


class AchievementResponse(AchievementBase):
    id: int
    is_active: bool
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    earned_count: int = 0

    class Config:
        from_attributes = True


class UserAchievementBase(BaseModel):
    user_id: int
    achievement_id: int
    award_note: Optional[str] = None


class UserAchievementCreate(UserAchievementBase):
    pass


class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    achievement: AchievementResponse
    awarded_by_id: Optional[int] = None
    awarded_by_name: Optional[str] = None
    award_note: Optional[str] = None
    awarded_at: datetime

    class Config:
        from_attributes = True


class AwardAchievementRequest(BaseModel):
    user_id: int
    achievement_id: int
    award_note: Optional[str] = Field(None, max_length=500)


class UserAchievementSummary(BaseModel):
    """Summary of a user's achievements."""
    total_points: int
    total_achievements: int
    by_rarity: dict  # {"common": 5, "rare": 2, ...}
    recent_achievements: List[UserAchievementResponse]


class AchievementLeaderboardEntry(BaseModel):
    """Entry for achievement leaderboard."""
    user_id: int
    display_name: Optional[str]
    total_points: int
    total_achievements: int
    rank: int


class AchievementLeaderboardResponse(BaseModel):
    entries: List[AchievementLeaderboardEntry]
    total_count: int


class CheckAchievementCriteria(BaseModel):
    """Request to check if user qualifies for achievements."""
    user_id: int
    criteria_type: str  # e.g., "trade_runs", "contracts_completed"
    value: int
