# app/services/crew.py
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import select, desc, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.crew import (
    LFGPost, LFGResponse, LFGStatus,
    UserAvailability, CrewLoadout
)
from app.models.user import User
from app.schemas.crew import (
    LFGPostCreate, LFGPostUpdate, LFGResponseCreate,
    UserAvailabilityCreate, UserAvailabilityUpdate,
    CrewLoadoutCreate, CrewLoadoutUpdate
)


class CrewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # === LFG Post Methods ===

    async def create_lfg_post(
        self,
        user_id: int,
        data: LFGPostCreate,
    ) -> LFGPost:
        """Create a new LFG post and track activity."""
        expires_at = None
        if data.expires_hours:
            expires_at = datetime.utcnow() + timedelta(hours=data.expires_hours)
        
        post = LFGPost(
            user_id=user_id,
            ship_type=data.ship_type,
            activity_type=data.activity_type,
            looking_for_roles=data.looking_for_roles,
            scheduled_time=data.scheduled_time,
            duration_estimate=data.duration_estimate,
            notes=data.notes,
            status=LFGStatus.OPEN,
            expires_at=expires_at,
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        
        # Track activity
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_lfg_posted(
            user_id=user_id,
            post_id=post.id,
            ship_type=post.ship_type,
            activity_type=post.activity_type
        )
        
        return post

    async def get_lfg_post_by_id(self, post_id: int) -> Optional[LFGPost]:
        result = await self.db.execute(
            select(LFGPost).where(LFGPost.id == post_id)
        )
        return result.scalar_one_or_none()

    async def get_open_lfg_posts(
        self,
        activity_type: Optional[str] = None,
        ship_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[LFGPost]:
        """Get open LFG posts with optional filtering."""
        query = select(LFGPost).where(LFGPost.status == LFGStatus.OPEN)
        
        # Filter out expired posts
        query = query.where(
            or_(
                LFGPost.expires_at == None,
                LFGPost.expires_at > datetime.utcnow()
            )
        )
        
        if activity_type:
            query = query.where(LFGPost.activity_type == activity_type)
        if ship_type:
            query = query.where(LFGPost.ship_type.ilike(f"%{ship_type}%"))
        
        result = await self.db.execute(
            query.order_by(desc(LFGPost.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_lfg_posts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[LFGPost]:
        """Get LFG posts created by a user."""
        result = await self.db.execute(
            select(LFGPost)
            .where(LFGPost.user_id == user_id)
            .order_by(desc(LFGPost.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_lfg_post(
        self,
        post: LFGPost,
        data: LFGPostUpdate,
    ) -> LFGPost:
        """Update an LFG post."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(post, field, value)
        
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def mark_post_filled(self, post: LFGPost) -> LFGPost:
        """Mark an LFG post as filled."""
        post.status = LFGStatus.FILLED
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def cancel_lfg_post(self, post: LFGPost) -> LFGPost:
        """Cancel an LFG post."""
        post.status = LFGStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def expire_old_posts(self) -> int:
        """Mark expired posts as expired. Returns count of expired posts."""
        result = await self.db.execute(
            select(LFGPost)
            .where(
                and_(
                    LFGPost.status == LFGStatus.OPEN,
                    LFGPost.expires_at != None,
                    LFGPost.expires_at <= datetime.utcnow()
                )
            )
        )
        expired_posts = result.scalars().all()
        
        for post in expired_posts:
            post.status = LFGStatus.EXPIRED
        
        if expired_posts:
            await self.db.commit()
        
        return len(expired_posts)

    async def get_lfg_stats(self) -> dict:
        """Get LFG statistics."""
        # Open posts count
        result = await self.db.execute(
            select(func.count(LFGPost.id))
            .where(LFGPost.status == LFGStatus.OPEN)
        )
        open_count = result.scalar() or 0

        # Posts by activity type
        result = await self.db.execute(
            select(LFGPost.activity_type, func.count(LFGPost.id))
            .where(LFGPost.status == LFGStatus.OPEN)
            .group_by(LFGPost.activity_type)
        )
        by_activity = {row[0]: row[1] for row in result.all()}

        return {
            "open_posts": open_count,
            "by_activity_type": by_activity,
        }

    # === LFG Response Methods ===

    async def create_lfg_response(
        self,
        post_id: int,
        user_id: int,
        data: LFGResponseCreate,
    ) -> LFGResponse:
        """Create a response to an LFG post."""
        # Check if user already responded
        result = await self.db.execute(
            select(LFGResponse).where(
                and_(
                    LFGResponse.post_id == post_id,
                    LFGResponse.user_id == user_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError("You have already responded to this post")
        
        response = LFGResponse(
            post_id=post_id,
            user_id=user_id,
            role_offered=data.role_offered,
            message=data.message,
        )
        self.db.add(response)
        await self.db.commit()
        await self.db.refresh(response)
        return response

    async def get_post_responses(self, post_id: int) -> List[LFGResponse]:
        """Get all responses for an LFG post."""
        result = await self.db.execute(
            select(LFGResponse)
            .where(LFGResponse.post_id == post_id)
            .order_by(LFGResponse.created_at)
        )
        return list(result.scalars().all())

    async def delete_lfg_response(self, response: LFGResponse) -> None:
        """Delete an LFG response."""
        await self.db.delete(response)
        await self.db.commit()

    # === Availability Methods ===

    async def set_availability(
        self,
        user_id: int,
        data: UserAvailabilityCreate,
    ) -> UserAvailability:
        """Set or update availability for a day."""
        # Check if availability already exists for this day
        result = await self.db.execute(
            select(UserAvailability).where(
                and_(
                    UserAvailability.user_id == user_id,
                    UserAvailability.day_of_week == data.day_of_week
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing
            existing.start_time = data.start_time
            existing.end_time = data.end_time
            existing.timezone = data.timezone
            existing.is_active = data.is_active
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            # Create new
            availability = UserAvailability(
                user_id=user_id,
                day_of_week=data.day_of_week,
                start_time=data.start_time,
                end_time=data.end_time,
                timezone=data.timezone,
                is_active=data.is_active,
            )
            self.db.add(availability)
            await self.db.commit()
            await self.db.refresh(availability)
            return availability

    async def get_user_availability(
        self,
        user_id: int,
    ) -> List[UserAvailability]:
        """Get all availability slots for a user."""
        result = await self.db.execute(
            select(UserAvailability)
            .where(
                and_(
                    UserAvailability.user_id == user_id,
                    UserAvailability.is_active == True
                )
            )
            .order_by(UserAvailability.day_of_week)
        )
        return list(result.scalars().all())

    async def get_availability_by_id(
        self,
        availability_id: int,
    ) -> Optional[UserAvailability]:
        result = await self.db.execute(
            select(UserAvailability).where(UserAvailability.id == availability_id)
        )
        return result.scalar_one_or_none()

    async def update_availability(
        self,
        availability: UserAvailability,
        data: UserAvailabilityUpdate,
    ) -> UserAvailability:
        """Update an availability slot."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(availability, field, value)
        
        await self.db.commit()
        await self.db.refresh(availability)
        return availability

    async def delete_availability(self, availability: UserAvailability) -> None:
        """Delete an availability slot."""
        await self.db.delete(availability)
        await self.db.commit()

    async def get_overlapping_availability(
        self,
        user_id: int,
        other_user_ids: Optional[List[int]] = None,
    ) -> List[dict]:
        """Find overlapping availability between users."""
        from app.models.user import User
        
        # Get current user's availability
        my_availability = await self.get_user_availability(user_id)
        
        if not my_availability:
            return []
        
        # Get other users to compare with
        if other_user_ids:
            query = select(UserAvailability, User).join(
                User, UserAvailability.user_id == User.id
            ).where(
                and_(
                    UserAvailability.user_id.in_(other_user_ids),
                    UserAvailability.is_active == True
                )
            )
        else:
            # Get all org members (excluding self)
            query = select(UserAvailability, User).join(
                User, UserAvailability.user_id == User.id
            ).where(
                and_(
                    UserAvailability.user_id != user_id,
                    UserAvailability.is_active == True
                )
            )
        
        result = await self.db.execute(query)
        other_availability = result.all()
        
        overlaps = []
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        for my_slot in my_availability:
            for other_slot, other_user in other_availability:
                if my_slot.day_of_week == other_slot.day_of_week:
                    # Convert times to minutes for comparison
                    my_start = self._time_to_minutes(my_slot.start_time)
                    my_end = self._time_to_minutes(my_slot.end_time)
                    other_start = self._time_to_minutes(other_slot.start_time)
                    other_end = self._time_to_minutes(other_slot.end_time)
                    
                    # Find overlap
                    overlap_start = max(my_start, other_start)
                    overlap_end = min(my_end, other_end)
                    
                    if overlap_start < overlap_end:
                        overlaps.append({
                            "user_id": other_user.id,
                            "display_name": other_user.display_name or f"User {other_user.id}",
                            "day_of_week": my_slot.day_of_week,
                            "day_name": day_names[my_slot.day_of_week],
                            "start_time": my_slot.start_time,
                            "end_time": my_slot.end_time,
                            "overlap_start": self._minutes_to_time(overlap_start),
                            "overlap_end": self._minutes_to_time(overlap_end),
                            "overlap_minutes": overlap_end - overlap_start,
                        })
        
        # Sort by overlap duration (longest first)
        overlaps.sort(key=lambda x: x["overlap_minutes"], reverse=True)
        return overlaps

    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight."""
        hours, minutes = map(int, time_str.split(":"))
        return hours * 60 + minutes

    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to HH:MM."""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"

    async def suggest_session_times(
        self,
        user_id: int,
        min_participants: int = 2,
        min_duration_minutes: int = 60,
    ) -> List[dict]:
        """Suggest play session times based on availability overlaps."""
        overlaps = await self.get_overlapping_availability(user_id)
        
        # Group by day and time slot
        suggestions = []
        day_groups = {}
        
        for overlap in overlaps:
            key = (overlap["day_of_week"], overlap["overlap_start"], overlap["overlap_end"])
            if key not in day_groups:
                day_groups[key] = []
            day_groups[key].append(overlap)
        
        for (day, start, end), users in day_groups.items():
            if len(users) >= min_participants - 1:  # -1 because current user is implied
                duration = self._time_to_minutes(end) - self._time_to_minutes(start)
                if duration >= min_duration_minutes:
                    suggestions.append({
                        "day_of_week": day,
                        "day_name": users[0]["day_name"],
                        "start_time": start,
                        "end_time": end,
                        "duration_minutes": duration,
                        "available_users": [
                            {"user_id": u["user_id"], "display_name": u["display_name"]}
                            for u in users
                        ],
                        "participant_count": len(users) + 1,  # +1 for current user
                    })
        
        # Sort by participant count (most first), then by duration
        suggestions.sort(key=lambda x: (-x["participant_count"], -x["duration_minutes"]))
        return suggestions[:10]  # Return top 10 suggestions

    # === Crew Loadout Methods ===

    async def create_loadout(
        self,
        created_by_id: int,
        data: CrewLoadoutCreate,
    ) -> CrewLoadout:
        """Create a new crew loadout."""
        loadout = CrewLoadout(
            name=data.name,
            created_by_id=created_by_id,
            ship_id=data.ship_id,
            positions=[p.model_dump() for p in data.positions],
            is_template=data.is_template,
            is_active=True,
        )
        self.db.add(loadout)
        await self.db.commit()
        await self.db.refresh(loadout)
        return loadout

    async def get_loadout_by_id(self, loadout_id: int) -> Optional[CrewLoadout]:
        result = await self.db.execute(
            select(CrewLoadout).where(CrewLoadout.id == loadout_id)
        )
        return result.scalar_one_or_none()

    async def get_user_loadouts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[CrewLoadout]:
        """Get loadouts created by a user."""
        result = await self.db.execute(
            select(CrewLoadout)
            .where(
                and_(
                    CrewLoadout.created_by_id == user_id,
                    CrewLoadout.is_active == True
                )
            )
            .order_by(desc(CrewLoadout.updated_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_templates(self, skip: int = 0, limit: int = 20) -> List[CrewLoadout]:
        """Get loadout templates."""
        result = await self.db.execute(
            select(CrewLoadout)
            .where(
                and_(
                    CrewLoadout.is_template == True,
                    CrewLoadout.is_active == True
                )
            )
            .order_by(desc(CrewLoadout.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_loadout(
        self,
        loadout: CrewLoadout,
        data: CrewLoadoutUpdate,
    ) -> CrewLoadout:
        """Update a crew loadout."""
        update_data = data.model_dump(exclude_unset=True)
        
        # Handle positions separately to convert Pydantic models
        if "positions" in update_data and update_data["positions"] is not None:
            update_data["positions"] = [p.model_dump() for p in update_data["positions"]]
        
        for field, value in update_data.items():
            setattr(loadout, field, value)
        
        loadout.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(loadout)
        return loadout

    async def delete_loadout(self, loadout: CrewLoadout) -> None:
        """Soft delete a crew loadout."""
        loadout.is_active = False
        await self.db.commit()

    async def duplicate_loadout(
        self,
        loadout: CrewLoadout,
        new_name: str,
        created_by_id: int,
    ) -> CrewLoadout:
        """Duplicate a loadout with a new name."""
        new_loadout = CrewLoadout(
            name=new_name,
            created_by_id=created_by_id,
            ship_id=loadout.ship_id,
            positions=loadout.positions.copy(),
            is_template=False,
            is_active=True,
        )
        self.db.add(new_loadout)
        await self.db.commit()
        await self.db.refresh(new_loadout)
        return new_loadout

    async def quick_deploy_loadout(
        self,
        loadout: CrewLoadout,
        substitutions: Optional[dict] = None,
    ) -> CrewLoadout:
        """Create a deployed instance of a loadout with optional substitutions."""
        positions = loadout.positions.copy()
        
        # Apply substitutions
        if substitutions:
            for position_index, user_id in substitutions.items():
                idx = int(position_index)
                if 0 <= idx < len(positions):
                    positions[idx]["user_id"] = user_id
        
        deployed = CrewLoadout(
            name=f"{loadout.name} (Deployed)",
            created_by_id=loadout.created_by_id,
            ship_id=loadout.ship_id,
            positions=positions,
            is_template=False,
            is_active=True,
        )
        self.db.add(deployed)
        await self.db.commit()
        await self.db.refresh(deployed)
        return deployed
