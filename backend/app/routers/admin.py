# app/routers/admin.py
from typing import Annotated, Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.templates_config import templates, get_template_context
from app.models.user import User
from app.models.role import Role, UserRole, RoleTier
from app.models.audit import AuditLog
from app.services.audit import AuditLogger
from app.web_dependencies import (
    check_admin_permission,
    get_user_permissions,
)
from app.config import get_settings
from app.schemas.user import UserInviteCreate, UserResponse
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


async def set_admin_request(
    request: Request,
    user: User,
    db: AsyncSession,
):
    """Set admin user on request state."""
    request.state.user = user
    permissions = await get_user_permissions(user, db)
    request.state.is_admin = True


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.post("/invite-user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    invite_data: UserInviteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Invite a new user by email and assign an optional role."""
    admin_service = AdminService(db)
    new_user = await admin_service.invite_user(invite_data, admin.id)
    return new_user

@router.get("/members_json", response_model=List[UserResponse]) # New JSON endpoint
async def list_all_members_json(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(check_admin_permission)],
):
    """List all users as JSON (admin only)."""
    query = select(User).order_by(User.display_name.asc())
    result = await db.execute(query)
    users = result.scalars().all()
    return users # FastAPI will convert list of User models to List[UserResponse]

@router.get("/users", response_class=HTMLResponse)
async def users_list(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_admin_permission)],
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    """List all users with optional filtering."""
    await set_admin_request(request, user, db)

    query = select(User).order_by(User.created_at.desc())

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_term),
                User.display_name.ilike(search_term),
                User.rsi_handle.ilike(search_term),
            )
        )

    if status == "pending":
        query = query.where(User.is_approved == False, User.is_active == True)
    elif status == "approved":
        query = query.where(User.is_approved == True, User.is_active == True)
    elif status == "banned":
        query = query.where(User.is_active == False)

    result = await db.execute(query)
    users = result.scalars().all()

    # Check if this is an HTMX request for partial update
    if request.headers.get("HX-Request"):
        return templates.TemplateResponse(
            "admin/partials/users_table.html",
            {"request": request, "users": users},
        )

    context = get_template_context(
        request,
        users=users,
        search=search,
        status=status,
    )
    return templates.TemplateResponse("admin/users.html", context)


@router.post("/users/{user_id}/approve", response_class=HTMLResponse)
async def approve_user(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Approve a pending user."""
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_approved = True
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="user.approve", 
        target_type="user", 
        target_id=user_id,
        details={"admin_id": admin.id}
    )
    
    await db.commit()
    await db.refresh(target_user)

    return templates.TemplateResponse(
        "admin/partials/users_table.html",
        {"request": request, "users": [target_user]},
    )


@router.post("/users/{user_id}/ban", response_class=HTMLResponse)
async def ban_user(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Ban a user."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = False
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="user.ban", 
        target_type="user", 
        target_id=user_id
    )
    
    await db.commit()
    await db.refresh(target_user)

    return templates.TemplateResponse(
        "admin/partials/users_table.html",
        {"request": request, "users": [target_user]},
    )


@router.post("/users/{user_id}/unban", response_class=HTMLResponse)
async def unban_user(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Unban a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = True
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="user.unban", 
        target_type="user", 
        target_id=user_id
    )
    
    await db.commit()
    await db.refresh(target_user)

    return templates.TemplateResponse(
        "admin/partials/users_table.html",
        {"request": request, "users": [target_user]},
    )


@router.get("/users/{user_id}/roles", response_class=HTMLResponse)
async def user_roles_modal(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Show modal for managing user roles."""
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all roles
    roles_result = await db.execute(select(Role).order_by(Role.sort_order))
    all_roles = roles_result.scalars().all()

    # Get user's current roles
    user_roles_result = await db.execute(
        select(UserRole.role_id).where(UserRole.user_id == user_id)
    )
    user_role_ids = [r for r in user_roles_result.scalars().all()]

    return templates.TemplateResponse(
        "admin/partials/user_roles_modal.html",
        {
            "request": request,
            "user": target_user,
            "all_roles": all_roles,
            "user_role_ids": user_role_ids,
        },
    )


@router.put("/users/{user_id}/roles", response_class=HTMLResponse)
async def update_user_roles(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
    roles: Annotated[List[int], Form()] = [],
):
    """Update user's roles."""
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove existing roles
    await db.execute(
        select(UserRole).where(UserRole.user_id == user_id)
    )
    existing = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id)
    )
    for ur in existing.scalars().all():
        await db.delete(ur)

    # Add new roles
    for role_id in roles:
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            granted_by=admin.id,
        )
        db.add(user_role)

    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="user.update_roles", 
        target_type="user", 
        target_id=user_id,
        details={"roles": roles}
    )

    await db.commit()

    # Return empty to close modal
    return HTMLResponse("")


# ============================================================
# ROLE MANAGEMENT
# ============================================================

@router.get("/roles", response_class=HTMLResponse)
async def roles_list(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_admin_permission)],
):
    """List all roles."""
    await set_admin_request(request, user, db)

    result = await db.execute(select(Role).order_by(Role.sort_order))
    roles = result.scalars().all()

    context = get_template_context(request, roles=roles)
    return templates.TemplateResponse("admin/roles.html", context)


@router.get("/roles/new", response_class=HTMLResponse)
async def new_role_modal(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Show modal for creating a new role."""
    return templates.TemplateResponse(
        "admin/partials/role_modal.html",
        {"request": request, "role": None},
    )


@router.post("/roles", response_class=HTMLResponse)
async def create_role(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
    name: Annotated[str, Form()],
    tier: Annotated[str, Form()] = "custom",
    permissions: Annotated[List[str], Form()] = [],
    is_default: Annotated[bool, Form()] = False,
    sort_order: Annotated[int, Form()] = 0,
):
    """Create a new role."""
    # Check for duplicate name
    existing = await db.execute(select(Role).where(Role.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role name already exists")

    # If setting as default, remove default from others
    if is_default:
        await db.execute(
            select(Role).where(Role.is_default == True)
        )
        default_roles = await db.execute(select(Role).where(Role.is_default == True))
        for role in default_roles.scalars().all():
            role.is_default = False

    role = Role(
        name=name,
        tier=RoleTier(tier),
        permissions=permissions,
        is_default=is_default,
        sort_order=sort_order,
    )
    db.add(role)
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="role.create", 
        target_type="role", 
        details={"name": name, "tier": tier}
    )
    
    await db.commit()

    # Return updated roles list
    result = await db.execute(select(Role).order_by(Role.sort_order))
    roles = result.scalars().all()

    return templates.TemplateResponse(
        "admin/roles.html",
        get_template_context(request, roles=roles),
    )


@router.get("/roles/{role_id}/edit", response_class=HTMLResponse)
async def edit_role_modal(
    request: Request,
    role_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Show modal for editing a role."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    return templates.TemplateResponse(
        "admin/partials/role_modal.html",
        {"request": request, "role": role},
    )


@router.put("/roles/{role_id}", response_class=HTMLResponse)
async def update_role(
    request: Request,
    role_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
    name: Annotated[str, Form()],
    tier: Annotated[str, Form()] = "custom",
    permissions: Annotated[List[str], Form()] = [],
    is_default: Annotated[bool, Form()] = False,
    sort_order: Annotated[int, Form()] = 0,
):
    """Update a role."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check for duplicate name (excluding self)
    existing = await db.execute(
        select(Role).where(Role.name == name, Role.id != role_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role name already exists")

    # If setting as default, remove default from others
    if is_default and not role.is_default:
        default_roles = await db.execute(select(Role).where(Role.is_default == True))
        for r in default_roles.scalars().all():
            r.is_default = False

    role.name = name
    role.tier = RoleTier(tier)
    role.permissions = permissions
    role.is_default = is_default
    role.sort_order = sort_order

    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="role.update", 
        target_type="role", 
        target_id=role_id,
        details={"name": name}
    )

    await db.commit()

    # Return updated roles list
    result = await db.execute(select(Role).order_by(Role.sort_order))
    roles = result.scalars().all()

    return templates.TemplateResponse(
        "admin/roles.html",
        get_template_context(request, roles=roles),
    )


@router.delete("/roles/{role_id}", response_class=HTMLResponse)
async def delete_role(
    request: Request,
    role_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
):
    """Delete a role."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default role")

    await db.delete(role)
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="role.delete", 
        target_type="role", 
        target_id=role_id,
        details={"name": role.name}
    )
    
    await db.commit()

    # Return empty response to remove from DOM
    return HTMLResponse("")


# ============================================================
# AUDIT LOG
# ============================================================

@router.get("/audit", response_class=HTMLResponse)
async def audit_log(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_admin_permission)],
    page: int = 1,
):
    """View audit log."""
    await set_admin_request(request, user, db)
    
    limit = 50
    offset = (page - 1) * limit
    
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Resolve users
    # In a real app we'd join, but simple lazy load or pre-fetch is fine for now
    
    context = get_template_context(request, logs=logs, page=page)
    return templates.TemplateResponse("admin/audit.html", context)


# ============================================================
# SETTINGS
# ============================================================

@router.get("/settings", response_class=HTMLResponse)
async def settings_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_admin_permission)],
):
    """Instance settings page."""
    await set_admin_request(request, user, db)

    # Get stats
    total_users = await db.scalar(select(func.count()).select_from(User))
    pending_users = await db.scalar(
        select(func.count()).select_from(User)
        .where(User.is_approved == False, User.is_active == True)
    )

    # Active in last 24 hours
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    active_today = await db.scalar(
        select(func.count()).select_from(User)
        .where(User.last_seen_at >= yesterday)
    )

    stats = {
        "total_users": total_users or 0,
        "pending_users": pending_users or 0,
        "active_today": active_today or 0,
    }

    context = get_template_context(
        request,
        settings=settings,
        stats=stats,
    )
    return templates.TemplateResponse("admin/settings.html", context)


from app.services.system import SystemService

...

@router.put("/settings", response_class=HTMLResponse)
async def update_settings(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
    instance_name: Annotated[str, Form()],
    allow_registration: Annotated[bool, Form()] = False,
    require_approval: Annotated[bool, Form()] = False,
):
    """Update instance settings."""
    system_service = SystemService(db)
    settings_to_update = {
        "instance_name": instance_name,
        "allow_registration": allow_registration,
        "require_approval": require_approval,
    }
    await system_service.bulk_update_settings(settings_to_update)
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, 
        action="settings.update", 
        target_type="system", 
        details=settings_to_update
    )
    await db.commit()

    return templates.TemplateResponse(
        "components/form_success.html",
        {
            "request": request,
            "message": "Settings updated successfully.",
        },
    )


# ============================================================
# ORG DATA EXPORT
# ============================================================

@router.get("/export/org-data", response_class=JSONResponse)
async def get_org_data_export(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(check_admin_permission)],
    request: Request, # Add Request dependency for audit log
):
    """Export all organization data (admin only)."""
    admin_service = AdminService(db)
    org_data = await admin_service.export_org_data()
    
    # Audit Log
    logger = AuditLogger(db)
    await logger.log(
        request, # Use the injected Request object
        action="org.export_data", 
        target_type="system", 
        target_id=1, # Symbolic ID for the instance
        details={"admin_id": admin.id, "total_records": org_data.total_records}
    )
    
    return JSONResponse(
        content=org_data.model_dump(),
        headers={
            "Content-Disposition": f"attachment; filename=org_data_export_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
        }
    )
