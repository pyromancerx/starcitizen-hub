# app/routers/operation_web.py
from typing import Annotated, Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.templates_config import templates, get_template_context, flash
from app.models.user import User
from app.models.event import Operation, OperationType, OperationStatus, OperationParticipant
from app.models.ship import Ship
from app.services.operation import OperationService
from app.web_dependencies import require_auth, set_request_user

router = APIRouter(prefix="/operations", tags=["operations-web"])

@router.get("/", response_class=HTMLResponse)
async def list_operations(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """List all operations."""
    await set_request_user(request, db)
    
    service = OperationService(db)
    operations = await service.get_operations()
    
    context = get_template_context(
        request,
        operations=operations,
        OperationStatus=OperationStatus,
        OperationType=OperationType
    )
    return templates.TemplateResponse("operations/index.html", context)

@router.get("/new", response_class=HTMLResponse)
async def new_operation_page(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """Page to create a new operation."""
    await set_request_user(request, db)
    
    context = get_template_context(
        request,
        operation_types=OperationType,
    )
    return templates.TemplateResponse("operations/create.html", context)

@router.post("/new")
async def create_operation(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
    title: Annotated[str, Form()],
    type: Annotated[OperationType, Form()],
    scheduled_at: Annotated[str, Form()],
    description: Annotated[Optional[str], Form()] = None,
    estimated_duration: Annotated[Optional[int], Form()] = None,
    max_participants: Annotated[Optional[int], Form()] = None,
    requirements: Annotated[Optional[str], Form()] = None,
):
    """Handle operation creation."""
    from app.schemas.operation import OperationCreate
    
    # Parse datetime
    dt = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
    
    data = OperationCreate(
        title=title,
        type=type,
        scheduled_at=dt,
        description=description,
        estimated_duration=estimated_duration,
        max_participants=max_participants,
        requirements=requirements
    )
    
    service = OperationService(db)
    operation = await service.create_operation(data, user.id)
    
    flash(request, "Operation created successfully", "success")
    return RedirectResponse(url=f"/operations/{operation.id}", status_code=303)

@router.get("/{operation_id}", response_class=HTMLResponse)
async def operation_detail(
    operation_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """Operation detail page."""
    await set_request_user(request, db)
    
    service = OperationService(db)
    operation = await service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Get user's ships for signup
    ships_result = await db.execute(select(Ship).where(Ship.user_id == user.id))
    user_ships = ships_result.scalars().all()
    
    # Check if user is already signed up
    is_signed_up = any(p.user_id == user.id for p in operation.participants)
    
    context = get_template_context(
        request,
        operation=operation,
        user_ships=user_ships,
        is_signed_up=is_signed_up,
        OperationStatus=OperationStatus,
        OperationType=OperationType
    )
    return templates.TemplateResponse("operations/detail.html", context)

@router.post("/{operation_id}/signup")
async def signup_operation(
    operation_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
    ship_id: Annotated[Optional[int], Form()] = None,
    role_preference: Annotated[Optional[str], Form()] = None,
):
    """Sign up for an operation."""
    from app.schemas.operation import OperationSignupCreate
    
    data = OperationSignupCreate(
        ship_id=ship_id,
        role_preference=role_preference
    )
    
    service = OperationService(db)
    await service.signup_user(operation_id, user.id, data)
    
    flash(request, "Signed up for operation", "success")
    return RedirectResponse(url=f"/operations/{operation_id}", status_code=303)

@router.post("/{operation_id}/cancel")
async def cancel_signup(
    operation_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """Cancel signup for an operation."""
    service = OperationService(db)
    await service.cancel_signup(operation_id, user.id)
    
    flash(request, "Cancelled signup", "info")
    return RedirectResponse(url=f"/operations/{operation_id}", status_code=303)
