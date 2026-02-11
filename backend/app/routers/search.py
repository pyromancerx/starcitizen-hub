from typing import Annotated, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.ship import Ship
from app.models.project import Project
from app.models.forum import ForumThread

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/")
async def global_search(
    q: Annotated[str, Query(min_length=2)],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Global search across multiple entities."""
    results = {
        "members": [],
        "ships": [],
        "projects": [],
        "threads": []
    }

    # Search Members
    user_query = select(User).where(
        or_(
            User.display_name.ilike(f"%{q}%"),
            User.rsi_handle.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%")
        )
    ).limit(5)
    user_result = await db.execute(user_query)
    for u in user_result.scalars().all():
        results["members"].append({
            "id": u.id,
            "title": u.display_name or u.email,
            "subtitle": u.rsi_handle,
            "link": f"/members?id={u.id}" # Personnel page
        })

    # Search Ships
    ship_query = select(Ship).where(
        or_(
            Ship.name.ilike(f"%{q}%"),
            Ship.ship_type.ilike(f"%{q}%")
        )
    ).limit(5)
    ship_result = await db.execute(ship_query)
    for s in ship_result.scalars().all():
        results["ships"].append({
            "id": s.id,
            "title": s.name or s.ship_type,
            "subtitle": s.ship_type if s.name else None,
            "link": f"/fleet?id={s.id}"
        })

    # Search Projects
    project_query = select(Project).where(Project.title.ilike(f"%{q}%")).limit(5)
    project_result = await db.execute(project_query)
    for p in project_result.scalars().all():
        results["projects"].append({
            "id": p.id,
            "title": p.title,
            "subtitle": p.status,
            "link": f"/projects/{p.id}"
        })

    # Search Forum Threads
    thread_query = select(ForumThread).where(ForumThread.title.ilike(f"%{q}%")).limit(5)
    thread_result = await db.execute(thread_query)
    for t in thread_result.scalars().all():
        results["threads"].append({
            "id": t.id,
            "title": t.title,
            "subtitle": "Forum Thread",
            "link": f"/forum/threads/{t.id}"
        })

    return results
