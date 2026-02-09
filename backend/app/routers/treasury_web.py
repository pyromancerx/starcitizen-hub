from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templates_config import templates, get_template_context, flash
from app.models.user import User
from app.models.treasury import TransactionType
from app.services.treasury import TreasuryService
from app.schemas.treasury import OrgTransactionCreate
from app.web_dependencies import require_auth, set_request_user, check_permission

router = APIRouter(prefix="/treasury", tags=["treasury"])

@router.get("/", response_class=HTMLResponse)
async def treasury_dashboard(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
):
    """Treasury dashboard."""
    await set_request_user(request, db)
    service = TreasuryService(db)
    
    wallet = await service.get_primary_wallet()
    recent_transactions = await service.get_transactions(wallet.id, limit=10)
    
    # Check if user has permission to manage treasury
    can_manage = any(p == "org.manage_treasury" for p in request.state.user_permissions)
    
    pending_transactions = []
    if can_manage:
        pending_transactions = await service.get_pending_transactions(wallet.id)

    context = get_template_context(
        request,
        wallet=wallet,
        recent_transactions=recent_transactions,
        pending_transactions=pending_transactions,
        can_manage=can_manage
    )
    return templates.TemplateResponse("treasury/index.html", context)

@router.post("/transaction", response_class=HTMLResponse)
async def create_transaction(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)],
    amount: Annotated[int, Form()],
    type: Annotated[str, Form()],
    category: Annotated[str, Form()],
    description: Annotated[Optional[str], Form()] = None,
):
    """Submit a transaction."""
    await set_request_user(request, db)
    service = TreasuryService(db)
    wallet = await service.get_primary_wallet()
    
    try:
        data = OrgTransactionCreate(
            amount=amount,
            type=TransactionType(type),
            category=category,
            description=description
        )
        
        await service.create_transaction(wallet.id, user.id, data)
        flash(request, "Transaction submitted successfully", "success")
        
    except Exception as e:
        flash(request, f"Error: {str(e)}", "error")
        
    return RedirectResponse(url="/treasury", status_code=303)

@router.post("/transaction/{tx_id}/approve", response_class=HTMLResponse)
async def approve_transaction(
    request: Request,
    tx_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_permission("org.manage_treasury"))],
):
    """Approve a transaction."""
    service = TreasuryService(db)
    try:
        await service.approve_transaction(tx_id, user.id)
        flash(request, "Transaction approved", "success")
    except ValueError as e:
        flash(request, str(e), "error")
        
    return RedirectResponse(url="/treasury", status_code=303)

@router.post("/transaction/{tx_id}/reject", response_class=HTMLResponse)
async def reject_transaction(
    request: Request,
    tx_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(check_permission("org.manage_treasury"))],
):
    """Reject a transaction."""
    service = TreasuryService(db)
    await service.reject_transaction(tx_id, user.id)
    flash(request, "Transaction rejected", "info")
        
    return RedirectResponse(url="/treasury", status_code=303)
