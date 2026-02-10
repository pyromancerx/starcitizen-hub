# app/routers/web.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.templates_config import templates, get_template_context, flash
from app.services.auth import AuthService
from app.services.user import UserService
from app.models.user import User
from app.models.ship import Ship
from app.models.wallet import Wallet
from app.models.inventory import PersonalInventory
from app.schemas.user import UserCreate
from app.web_dependencies import (
    get_current_user_from_cookie,
    require_auth,
    get_user_permissions,
)
from app.config import get_settings

router = APIRouter(tags=["web"])
settings = get_settings()


# Middleware-like function to set user on request state
async def set_request_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Set user on request state for template access."""
    user = await get_current_user_from_cookie(request, db)
    request.state.user = user

    if user:
        permissions = await get_user_permissions(user, db)
        request.state.is_admin = any(
            p.startswith("admin.") for p in permissions
        )
    else:
        request.state.is_admin = False

    return user


# ============================================================
# PUBLIC ROUTES
# ============================================================

@router.get("/", response_class=HTMLResponse)
async def landing_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Public landing page."""
    user = await set_request_user(request, db)

    # Redirect to dashboard if already logged in
    if user:
        return RedirectResponse(url="/dashboard", status_code=303)

    context = get_template_context(request)
    return templates.TemplateResponse("landing.html", context)


@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Login page."""
    user = await set_request_user(request, db)

    if user:
        return RedirectResponse(url="/dashboard", status_code=303)

    context = get_template_context(request)
    return templates.TemplateResponse("auth/login.html", context)


@router.post("/login", response_class=HTMLResponse)
async def login_submit(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    username: Annotated[str, Form()],
    password: Annotated[str, Form()],
):
    """Handle login form submission."""
    user_service = UserService(db)
    auth_service = AuthService()

    user = await user_service.authenticate_user(username, password)
    if not user:
        context = get_template_context(request, error="Invalid email or password")
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Invalid email or password"},
        )

    if not user.is_active:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Your account has been banned"},
        )

    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )

    # Redirect to dashboard with cookie
    response = RedirectResponse(url="/dashboard", status_code=303)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
    )
    return response


@router.get("/register", response_class=HTMLResponse)
async def register_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Registration page."""
    if not settings.allow_registration:
        return RedirectResponse(url="/login", status_code=303)

    user = await set_request_user(request, db)
    if user:
        return RedirectResponse(url="/dashboard", status_code=303)

    context = get_template_context(request)
    return templates.TemplateResponse("auth/register.html", context)


@router.post("/register", response_class=HTMLResponse)
async def register_submit(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    email: Annotated[str, Form()],
    password: Annotated[str, Form()],
    password_confirm: Annotated[str, Form()],
    display_name: Annotated[Optional[str], Form()] = None,
    rsi_handle: Annotated[Optional[str], Form()] = None,
):
    """Handle registration form submission."""
    if not settings.allow_registration:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Registration is disabled"},
        )

    # Validate passwords match
    if password != password_confirm:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Passwords do not match"},
        )

    # Validate password length
    if len(password) < 8:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Password must be at least 8 characters"},
        )

    user_service = UserService(db)

    # Check if email exists
    existing = await user_service.get_user_by_email(email)
    if existing:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": "Email already registered"},
        )

    # Create user
    try:
        user_data = UserCreate(
            email=email,
            password=password,
            display_name=display_name or None,
            rsi_handle=rsi_handle or None,
        )
        user = await user_service.create_user(user_data)

        # Auto-approve if not required
        if not settings.require_approval:
            user.is_approved = True
            await db.commit()

    except Exception as e:
        return templates.TemplateResponse(
            "components/form_error.html",
            {"request": request, "error": f"Registration failed: {str(e)}"},
        )

    # Log the user in
    auth_service = AuthService()
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )

    response = RedirectResponse(url="/dashboard", status_code=303)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
    )
    return response


@router.post("/logout")
async def logout(request: Request):
    """Handle logout."""
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie("access_token")
    return response


# ============================================================
# DASHBOARD ROUTES
# ============================================================

from app.services.operation import OperationService
from app.services.activity import ActivityService

...

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """User dashboard."""
    await set_request_user(request, db)

    # Get stats
    ship_count = await db.scalar(
        select(func.count()).select_from(Ship).where(Ship.user_id == user.id)
    )

    wallet = await db.scalar(
        select(Wallet).where(Wallet.user_id == user.id)
    )
    wallet_balance = wallet.balance_auec if wallet else 0

    inventory_count = await db.scalar(
        select(func.count()).select_from(PersonalInventory).where(PersonalInventory.user_id == user.id)
    )

    stats = {
        "ship_count": ship_count or 0,
        "wallet_balance": wallet_balance,
        "inventory_count": inventory_count or 0,
    }

    # Get recent activity
    activity_service = ActivityService(db)
    recent_activity = await activity_service.get_recent_activities(limit=5)

    # Get upcoming operations
    operation_service = OperationService(db)
    upcoming_operations = await operation_service.get_user_upcoming_operations(user.id)


    context = get_template_context(
        request,
        stats=stats,
        recent_activity=recent_activity,
        upcoming_operations=upcoming_operations,
    )
    return templates.TemplateResponse("dashboard/index.html", context)


@router.get("/profile", response_class=HTMLResponse)
async def profile_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """User profile page."""
    await set_request_user(request, db)

    context = get_template_context(request)
    return templates.TemplateResponse("dashboard/profile.html", context)


@router.put("/profile", response_class=HTMLResponse)
async def update_profile(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
    display_name: Annotated[Optional[str], Form()] = None,
    rsi_handle: Annotated[Optional[str], Form()] = None,
    avatar_url: Annotated[Optional[str], Form()] = None,
):
    """Update user profile."""
    user.display_name = display_name or None
    user.rsi_handle = rsi_handle or None
    user.avatar_url = avatar_url or None

    await db.commit()

    return templates.TemplateResponse(
        "components/form_success.html",
        {"request": request, "message": "Profile updated successfully"},
    )
