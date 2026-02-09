# app/routers/member_web.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.templates_config import templates, get_template_context
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.ship import Ship
from app.web_dependencies import require_auth, get_current_user_from_cookie, get_user_permissions

router = APIRouter(prefix="/members", tags=["members"])

async def set_request_user(request: Request, db: AsyncSession):
    user = await get_current_user_from_cookie(request, db)
    request.state.user = user
    if user:
        permissions = await get_user_permissions(user, db)
        request.state.is_admin = any(p.startswith("admin.") for p in permissions)
    else:
        request.state.is_admin = False
    return user

@router.get("/", response_class=HTMLResponse)
async def member_directory(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
    search: Optional[str] = None,
    role_id: Optional[int] = None,
):
    """Member directory list."""
    await set_request_user(request, db)
    
    # Base query for approved users
    query = select(User).where(User.is_approved == True).order_by(User.display_name.asc())
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.display_name.ilike(search_term),
                User.rsi_handle.ilike(search_term)
            )
        )
        
    if role_id:
        query = query.join(User.user_roles).where(UserRole.role_id == role_id)
    
    # Load roles
    query = query.options(selectinload(User.user_roles).selectinload(UserRole.role))
    
    result = await db.execute(query)
    members = result.scalars().all()
    
    # Get all roles for filter
    roles_result = await db.execute(select(Role).order_by(Role.name))
    roles = roles_result.scalars().all()
    
    context = get_template_context(
        request,
        members=members,
        roles=roles,
        search=search,
        selected_role_id=role_id
    )
    return templates.TemplateResponse("members/index.html", context)

@router.get("/{user_id}", response_class=HTMLResponse)
async def member_profile(
    user_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """Public member profile page."""
    await set_request_user(request, db)
    
    # Get member with roles and ships
    query = (
        select(User)
        .where(User.id == user_id, User.is_approved == True)
        .options(
            selectinload(User.user_roles).selectinload(UserRole.role)
        )
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()
    
    if not member:
        return HTMLResponse("Member not found", status_code=404)
    
    # Get ships
    ships_result = await db.execute(select(Ship).where(Ship.user_id == user_id))
    ships = ships_result.scalars().all()
    
    context = get_template_context(
        request,
        member=member,
        ships=ships
    )
    return templates.TemplateResponse("members/profile.html", context)
