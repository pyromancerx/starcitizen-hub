# app/services/activity.py
from typing import Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy import select, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity import Activity, ActivityType, ActivityReaction
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityReactionCreate


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_activity(
        self,
        activity_type: ActivityType,
        user_id: Optional[int] = None,
        content: dict = None,
        related_id: Optional[int] = None,
        related_type: Optional[str] = None,
    ) -> Activity:
        """Create a new activity entry."""
        activity = Activity(
            type=activity_type,
            user_id=user_id,
            content=content or {},
            related_id=related_id,
            related_type=related_type,
        )
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity

    # === Convenience methods for common activities ===

    async def track_member_joined(self, user_id: int, user_display_name: str) -> Activity:
        """Track when a new member joins."""
        return await self.create_activity(
            activity_type=ActivityType.MEMBER_JOINED,
            user_id=user_id,
            content={"display_name": user_display_name},
        )

    async def track_member_approved(self, user_id: int, approved_by_id: int, user_display_name: str) -> Activity:
        """Track when a member is approved."""
        return await self.create_activity(
            activity_type=ActivityType.MEMBER_APPROVED,
            user_id=user_id,
            content={
                "display_name": user_display_name,
                "approved_by_id": approved_by_id,
            },
        )

    async def track_operation_created(
        self,
        user_id: int,
        operation_id: int,
        title: str,
        operation_type: str,
    ) -> Activity:
        """Track when an operation is created."""
        return await self.create_activity(
            activity_type=ActivityType.OPERATION_CREATED,
            user_id=user_id,
            content={
                "title": title,
                "operation_type": operation_type,
            },
            related_id=operation_id,
            related_type="operation",
        )

    async def track_operation_completed(
        self,
        user_id: int,
        operation_id: int,
        title: str,
    ) -> Activity:
        """Track when an operation is completed."""
        return await self.create_activity(
            activity_type=ActivityType.OPERATION_COMPLETED,
            user_id=user_id,
            content={"title": title},
            related_id=operation_id,
            related_type="operation",
        )

    async def track_ship_added(
        self,
        user_id: int,
        ship_id: int,
        ship_name: str,
        ship_type: str,
    ) -> Activity:
        """Track when a ship is added to the fleet."""
        return await self.create_activity(
            activity_type=ActivityType.SHIP_ADDED,
            user_id=user_id,
            content={
                "ship_name": ship_name,
                "ship_type": ship_type,
            },
            related_id=ship_id,
            related_type="ship",
        )

    async def track_trade_completed(
        self,
        user_id: int,
        trade_id: int,
        commodity: str,
        profit: float,
    ) -> Activity:
        """Track when a trade run is completed."""
        return await self.create_activity(
            activity_type=ActivityType.TRADE_COMPLETED,
            user_id=user_id,
            content={
                "commodity": commodity,
                "profit": profit,
            },
            related_id=trade_id,
            related_type="trade_run",
        )

    async def track_contract_posted(
        self,
        user_id: int,
        contract_id: int,
        origin: str,
        destination: str,
    ) -> Activity:
        """Track when a cargo contract is posted."""
        return await self.create_activity(
            activity_type=ActivityType.CONTRACT_POSTED,
            user_id=user_id,
            content={
                "origin": origin,
                "destination": destination,
            },
            related_id=contract_id,
            related_type="cargo_contract",
        )

    async def track_contract_completed(
        self,
        hauler_id: int,
        contract_id: int,
        origin: str,
        destination: str,
        payment: int,
    ) -> Activity:
        """Track when a cargo contract is completed."""
        return await self.create_activity(
            activity_type=ActivityType.CONTRACT_COMPLETED,
            user_id=hauler_id,
            content={
                "origin": origin,
                "destination": destination,
                "payment": payment,
            },
            related_id=contract_id,
            related_type="cargo_contract",
        )

    async def track_announcement_posted(
        self,
        user_id: int,
        announcement_id: int,
        title: str,
        priority: str,
    ) -> Activity:
        """Track when an announcement is posted."""
        return await self.create_activity(
            activity_type=ActivityType.ANNOUNCEMENT_POSTED,
            user_id=user_id,
            content={
                "title": title,
                "priority": priority,
            },
            related_id=announcement_id,
            related_type="announcement",
        )

    async def track_project_created(
        self,
        user_id: int,
        project_id: int,
        name: str,
    ) -> Activity:
        """Track when a project is created."""
        return await self.create_activity(
            activity_type=ActivityType.PROJECT_CREATED,
            user_id=user_id,
            content={"name": name},
            related_id=project_id,
            related_type="project",
        )

    async def track_project_completed(
        self,
        user_id: int,
        project_id: int,
        name: str,
    ) -> Activity:
        """Track when a project is completed."""
        return await self.create_activity(
            activity_type=ActivityType.PROJECT_COMPLETED,
            user_id=user_id,
            content={"name": name},
            related_id=project_id,
            related_type="project",
        )

    async def track_contribution_made(
        self,
        user_id: int,
        project_id: int,
        project_name: str,
        amount: int,
    ) -> Activity:
        """Track when a contribution is made to a project."""
        return await self.create_activity(
            activity_type=ActivityType.CONTRIBUTION_MADE,
            user_id=user_id,
            content={
                "project_name": project_name,
                "amount": amount,
            },
            related_id=project_id,
            related_type="project",
        )

    async def track_lfg_posted(
        self,
        user_id: int,
        post_id: int,
        ship_type: str,
        activity_type: str,
    ) -> Activity:
        """Track when an LFG post is created."""
        return await self.create_activity(
            activity_type=ActivityType.LFG_POSTED,
            user_id=user_id,
            content={
                "ship_type": ship_type,
                "activity_type": activity_type,
            },
            related_id=post_id,
            related_type="lfg_post",
        )

    async def track_price_reported(
        self,
        user_id: int,
        report_id: int,
        location: str,
        commodity: str,
    ) -> Activity:
        """Track when a price is reported."""
        return await self.create_activity(
            activity_type=ActivityType.PRICE_REPORTED,
            user_id=user_id,
            content={
                "location": location,
                "commodity": commodity,
            },
            related_id=report_id,
            related_type="price_report",
        )

    async def track_fleet_imported(
        self,
        user_id: int,
        count: int,
    ) -> Activity:
        """Track when a user imports their fleet from RSI."""
        return await self.create_activity(
            activity_type=ActivityType.FLEET_IMPORTED,
            user_id=user_id,
            content={"count": count},
        )

    # === Activity Feed Retrieval ===

    async def get_activity_feed(
        self,
        activity_type: Optional[ActivityType] = None,
        user_id: Optional[int] = None,
        since: Optional[datetime] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[List[Activity], int]:
        """Get activity feed with optional filtering. Returns (activities, total_count)."""
        query = select(Activity).order_by(desc(Activity.created_at))
        
        if activity_type:
            query = query.where(Activity.type == activity_type)
        if user_id:
            query = query.where(Activity.user_id == user_id)
        if since:
            query = query.where(Activity.created_at >= since)
        
        # Get total count
        count_query = select(func.count(Activity.id))
        if activity_type:
            count_query = count_query.where(Activity.type == activity_type)
        if user_id:
            count_query = count_query.where(Activity.user_id == user_id)
        if since:
            count_query = count_query.where(Activity.created_at >= since)
        
        result = await self.db.execute(count_query)
        total_count = result.scalar()
        
        # Get activities with user info
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        activities = list(result.scalars().all())
        
        # Load user display names
        user_ids = {a.user_id for a in activities if a.user_id}
        if user_ids:
            user_result = await self.db.execute(
                select(User.id, User.display_name).where(User.id.in_(user_ids))
            )
            user_names = {uid: name for uid, name in user_result.all()}
            
            for activity in activities:
                if activity.user_id:
                    activity.user_display_name = user_names.get(activity.user_id)
        
        return activities, total_count

    async def get_recent_activities(
        self,
        hours: int = 24,
        limit: int = 50,
    ) -> List[Activity]:
        """Get activities from the last N hours."""
        since = datetime.utcnow() - timedelta(hours=hours)
        result = await self.db.execute(
            select(Activity)
            .where(Activity.created_at >= since)
            .order_by(desc(Activity.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_activity_stats(self, days: int = 7) -> dict:
        """Get activity statistics for the last N days."""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Count by type
        result = await self.db.execute(
            select(Activity.type, func.count(Activity.id))
            .where(Activity.created_at >= since)
            .group_by(Activity.type)
        )
        by_type = {t.value: count for t, count in result.all()}
        
        # Count by user
        result = await self.db.execute(
            select(Activity.user_id, func.count(Activity.id))
            .where(
                and_(
                    Activity.created_at >= since,
                    Activity.user_id != None
                )
            )
            .group_by(Activity.user_id)
            .order_by(desc(func.count(Activity.id)))
            .limit(10)
        )
        by_user = result.all()
        
        # Get user display names
        user_ids = [uid for uid, _ in by_user]
        if user_ids:
            user_result = await self.db.execute(
                select(User.id, User.display_name).where(User.id.in_(user_ids))
            )
            user_names = {uid: name for uid, name in user_result.all()}
        else:
            user_names = {}
        
        top_users = [
            {
                "user_id": uid,
                "display_name": user_names.get(uid, f"User {uid}"),
                "activity_count": count
            }
            for uid, count in by_user
        ]
        
        return {
            "period_days": days,
            "total_activities": sum(by_type.values()),
            "by_type": by_type,
            "top_contributors": top_users,
        }

    # === Reaction Methods ===

    async def add_reaction(
        self,
        activity_id: int,
        user_id: int,
        emoji: str,
    ) -> ActivityReaction:
        """Add a reaction to an activity."""
        # Check if user already reacted with this emoji
        result = await self.db.execute(
            select(ActivityReaction).where(
                and_(
                    ActivityReaction.activity_id == activity_id,
                    ActivityReaction.user_id == user_id,
                    ActivityReaction.emoji == emoji
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise ValueError("You have already reacted with this emoji")
        
        reaction = ActivityReaction(
            activity_id=activity_id,
            user_id=user_id,
            emoji=emoji,
        )
        self.db.add(reaction)
        await self.db.commit()
        await self.db.refresh(reaction)
        return reaction

    async def remove_reaction(
        self,
        activity_id: int,
        user_id: int,
        emoji: str,
    ) -> None:
        """Remove a reaction from an activity."""
        result = await self.db.execute(
            select(ActivityReaction).where(
                and_(
                    ActivityReaction.activity_id == activity_id,
                    ActivityReaction.user_id == user_id,
                    ActivityReaction.emoji == emoji
                )
            )
        )
        reaction = result.scalar_one_or_none()
        
        if reaction:
            await self.db.delete(reaction)
            await self.db.commit()

    async def get_reactions(self, activity_id: int) -> List[ActivityReaction]:
        """Get all reactions for an activity."""
        result = await self.db.execute(
            select(ActivityReaction)
            .where(ActivityReaction.activity_id == activity_id)
            .order_by(ActivityReaction.created_at)
        )
        return list(result.scalars().all())

    def get_reaction_summary(self, reactions: List[ActivityReaction]) -> dict:
        """Get a summary of reactions (emoji -> count and users)."""
        summary = defaultdict(lambda: {"count": 0, "users": []})
        
        for reaction in reactions:
            summary[reaction.emoji]["count"] += 1
            summary[reaction.emoji]["users"].append(reaction.user_id)
        
        return dict(summary)
