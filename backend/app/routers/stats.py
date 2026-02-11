from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.ship import Ship
from app.models.event import Operation, OperationStatus
from app.models.treasury import OrgTreasury

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Fetch statistics for the main dashboard."""
    # Total ships in organization
    total_ships = await db.scalar(select(func.count()).select_from(Ship))
    
    # Active/Upcoming Operations
    active_ops = await db.scalar(
        select(func.count())
        .select_from(Operation)
        .where(Operation.status.in_([OperationStatus.RECRUITING, OperationStatus.PLANNING, OperationStatus.ACTIVE]))
    )
    
    # Org Treasury (Primary wallet balance)
    treasury_balance = await db.scalar(
        select(OrgTreasury.balance)
        .where(OrgTreasury.is_primary == True)
    )
    
    # Fleet Readiness (Simulated metric based on total ships)
    # In a real app, this might be calculated from ships with 'ready' status
    readiness = 85 if total_ships > 0 else 0
    
    return {
        "fleet_readiness": readiness,
        "total_ships": total_ships or 0,
        "active_operations": active_ops or 0,
        "org_treasury_balance": treasury_balance or 0,
    }
