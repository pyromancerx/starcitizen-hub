# app/services/achievement.py
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.achievement import (
    Achievement, AchievementRarity, AchievementType, UserAchievement
)
from app.models.user import User
from app.models.trade import TradeRun, CargoContract
from app.models.ship import Ship
from app.models.event import Operation
from app.schemas.achievement import (
    AchievementCreate, AchievementUpdate, AwardAchievementRequest
)
from app.services.notification import NotificationService
from app.models.notification import NotificationType


class AchievementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # === Achievement CRUD ===

    async def create_achievement(
        self,
        data: AchievementCreate,
        created_by_id: Optional[int] = None,
    ) -> Achievement:
        """Create a new achievement."""
        achievement = Achievement(
            name=data.name,
            description=data.description,
            icon=data.icon,
            rarity=data.rarity,
            achievement_type=data.achievement_type,
            criteria=data.criteria,
            points=data.points,
            created_by_id=created_by_id,
            is_active=True,
        )
        self.db.add(achievement)
        await self.db.commit()
        await self.db.refresh(achievement)
        return achievement

    async def get_achievement_by_id(self, achievement_id: int) -> Optional[Achievement]:
        """Get an achievement by ID."""
        result = await self.db.execute(
            select(Achievement).where(Achievement.id == achievement_id)
        )
        return result.scalar_one_or_none()

    async def get_achievement_by_name(self, name: str) -> Optional[Achievement]:
        """Get an achievement by name."""
        result = await self.db.execute(
            select(Achievement).where(Achievement.name == name)
        )
        return result.scalar_one_or_none()

    async def get_all_achievements(
        self,
        active_only: bool = True,
        achievement_type: Optional[AchievementType] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Achievement]:
        """Get all achievements with optional filtering."""
        query = select(Achievement)
        
        if active_only:
            query = query.where(Achievement.is_active == True)
        
        if achievement_type:
            query = query.where(Achievement.achievement_type == achievement_type)
        
        result = await self.db.execute(
            query.order_by(Achievement.points.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def update_achievement(
        self,
        achievement: Achievement,
        data: AchievementUpdate,
    ) -> Achievement:
        """Update an achievement."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(achievement, field, value)
        
        achievement.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(achievement)
        return achievement

    async def delete_achievement(self, achievement: Achievement) -> None:
        """Delete an achievement."""
        await self.db.delete(achievement)
        await self.db.commit()

    # === User Achievement Methods ===

    async def award_achievement(
        self,
        user_id: int,
        achievement_id: int,
        awarded_by_id: Optional[int] = None,
        award_note: Optional[str] = None,
    ) -> Optional[UserAchievement]:
        """Award an achievement to a user."""
        # Check if user already has this achievement
        result = await self.db.execute(
            select(UserAchievement).where(
                and_(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement_id
                )
            )
        )
        if result.scalar_one_or_none():
            return None  # Already earned

        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id,
            awarded_by_id=awarded_by_id,
            award_note=award_note,
        )
        self.db.add(user_achievement)
        await self.db.commit()
        await self.db.refresh(user_achievement)

        # Send notification
        achievement = await self.get_achievement_by_id(achievement_id)
        if achievement:
            notification_service = NotificationService(self.db)
            await notification_service.notify_achievement_unlocked(
                user_id=user_id,
                achievement_id=achievement.id,
                achievement_name=achievement.name,
                achievement_description=achievement.description,
            )

        return user_achievement

    async def check_and_award_achievements(self, user_id: int) -> List[UserAchievement]:
        """Check if user qualifies for any system achievements and award them."""
        awarded = []
        
        # Get all active system achievements
        system_achievements = await self.get_all_achievements(
            active_only=True,
            achievement_type=AchievementType.SYSTEM
        )
        
        for achievement in system_achievements:
            if not achievement.criteria:
                continue
                
            if await self._check_criteria(user_id, achievement.criteria):
                user_achievement = await self.award_achievement(
                    user_id=user_id,
                    achievement_id=achievement.id
                )
                if user_achievement:
                    awarded.append(user_achievement)
        
        return awarded

    async def _check_criteria(self, user_id: int, criteria: dict) -> bool:
        """Check if user meets achievement criteria."""
        for criterion_type, required_value in criteria.items():
            actual_value = await self._get_user_stat(user_id, criterion_type)
            if actual_value < required_value:
                return False
        return True

    async def _get_user_stat(self, user_id: int, stat_type: str) -> int:
        """Get a specific stat for a user."""
        if stat_type == "trade_runs":
            result = await self.db.execute(
                select(func.count(TradeRun.id)).where(TradeRun.user_id == user_id)
            )
            return result.scalar() or 0
        
        elif stat_type == "contracts_completed":
            from app.models.trade import ContractStatus
            result = await self.db.execute(
                select(func.count(CargoContract.id)).where(
                    and_(
                        CargoContract.hauler_id == user_id,
                        CargoContract.status == ContractStatus.COMPLETED
                    )
                )
            )
            return result.scalar() or 0
        
        elif stat_type == "ships_owned":
            result = await self.db.execute(
                select(func.count(Ship.id)).where(Ship.owner_id == user_id)
            )
            return result.scalar() or 0
        
        elif stat_type == "operations_joined":
            from app.models.event import OperationParticipant
            result = await self.db.execute(
                select(func.count(OperationParticipant.id)).where(
                    OperationParticipant.user_id == user_id
                )
            )
            return result.scalar() or 0
        
        elif stat_type == "forum_posts":
            from app.models.forum import ForumPost
            result = await self.db.execute(
                select(func.count(ForumPost.id)).where(ForumPost.author_id == user_id)
            )
            return result.scalar() or 0
        
        elif stat_type == "member_days":
            result = await self.db.execute(
                select(User.created_at).where(User.id == user_id)
            )
            created_at = result.scalar()
            if created_at:
                days = (datetime.utcnow() - created_at).days
                return days
            return 0
        
        return 0

    async def get_user_achievements(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[UserAchievement]:
        """Get all achievements earned by a user."""
        result = await self.db.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.awarded_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def has_achievement(self, user_id: int, achievement_id: int) -> bool:
        """Check if a user has earned a specific achievement."""
        result = await self.db.execute(
            select(UserAchievement).where(
                and_(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement_id
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_user_achievement_summary(self, user_id: int) -> dict:
        """Get achievement summary for a user."""
        # Get all user achievements
        user_achievements = await self.get_user_achievements(user_id)
        
        # Calculate totals
        total_points = sum(ua.achievement.points for ua in user_achievements)
        total_achievements = len(user_achievements)
        
        # Count by rarity
        by_rarity = {"common": 0, "rare": 0, "epic": 0, "legendary": 0}
        for ua in user_achievements:
            rarity = ua.achievement.rarity.value
            by_rarity[rarity] = by_rarity.get(rarity, 0) + 1
        
        return {
            "total_points": total_points,
            "total_achievements": total_achievements,
            "by_rarity": by_rarity,
            "recent_achievements": user_achievements[:5],
        }

    # === Leaderboard ===

    async def get_leaderboard(self, limit: int = 10) -> List[dict]:
        """Get achievement leaderboard."""
        # Get total points and count per user
        result = await self.db.execute(
            select(
                UserAchievement.user_id,
                func.sum(Achievement.points).label("total_points"),
                func.count(UserAchievement.id).label("achievement_count")
            )
            .join(Achievement, UserAchievement.achievement_id == Achievement.id)
            .group_by(UserAchievement.user_id)
            .order_by(func.sum(Achievement.points).desc())
            .limit(limit)
        )
        
        rows = result.all()
        
        # Get user display names
        user_ids = [row[0] for row in rows]
        if user_ids:
            user_result = await self.db.execute(
                select(User.id, User.display_name).where(User.id.in_(user_ids))
            )
            user_names = {uid: name for uid, name in user_result.all()}
        else:
            user_names = {}
        
        leaderboard = []
        for idx, (user_id, total_points, achievement_count) in enumerate(rows, 1):
            leaderboard.append({
                "user_id": user_id,
                "display_name": user_names.get(user_id, f"User {user_id}"),
                "total_points": total_points or 0,
                "total_achievements": achievement_count or 0,
                "rank": idx,
            })
        
        return leaderboard

    # === System Achievements Setup ===

    async def create_default_achievements(self) -> None:
        """Create default system achievements if they don't exist."""
        default_achievements = [
            {
                "name": "First Steps",
                "description": "Complete your first trade run",
                "icon": "🚀",
                "rarity": AchievementRarity.COMMON,
                "criteria": {"trade_runs": 1},
                "points": 10,
            },
            {
                "name": "Trader",
                "description": "Complete 10 trade runs",
                "icon": "💰",
                "rarity": AchievementRarity.COMMON,
                "criteria": {"trade_runs": 10},
                "points": 25,
            },
            {
                "name": "Merchant Prince",
                "description": "Complete 50 trade runs",
                "icon": "👑",
                "rarity": AchievementRarity.RARE,
                "criteria": {"trade_runs": 50},
                "points": 100,
            },
            {
                "name": "Fleet Admiral",
                "description": "Own 5 ships",
                "icon": "⚓",
                "rarity": AchievementRarity.RARE,
                "criteria": {"ships_owned": 5},
                "points": 50,
            },
            {
                "name": "Reliable Hauler",
                "description": "Complete 5 cargo contracts",
                "icon": "📦",
                "rarity": AchievementRarity.COMMON,
                "criteria": {"contracts_completed": 5},
                "points": 25,
            },
            {
                "name": "Operation Veteran",
                "description": "Join 10 operations",
                "icon": "🎯",
                "rarity": AchievementRarity.COMMON,
                "criteria": {"operations_joined": 10},
                "points": 25,
            },
            {
                "name": "Community Voice",
                "description": "Make 20 forum posts",
                "icon": "💬",
                "rarity": AchievementRarity.COMMON,
                "criteria": {"forum_posts": 20},
                "points": 25,
            },
            {
                "name": "Founding Member",
                "description": "Be a member for 30 days",
                "icon": "⭐",
                "rarity": AchievementRarity.EPIC,
                "criteria": {"member_days": 30},
                "points": 75,
            },
            {
                "name": "Legend",
                "description": "Be a member for 365 days",
                "icon": "🏆",
                "rarity": AchievementRarity.LEGENDARY,
                "criteria": {"member_days": 365},
                "points": 500,
            },
        ]
        
        for achievement_data in default_achievements:
            # Check if achievement already exists
            existing = await self.get_achievement_by_name(achievement_data["name"])
            if not existing:
                await self.create_achievement(
                    data=AchievementCreate(**achievement_data),
                    created_by_id=None,  # System created
                )
