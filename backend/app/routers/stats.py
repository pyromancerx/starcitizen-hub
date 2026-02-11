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
    
    # Ready ships
    ready_ships = await db.scalar(
        select(func.count())
        .select_from(Ship)
        .where(Ship.status == "ready")
    )

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
    
    # Fleet Readiness calculation
    readiness = 0
    if total_ships > 0:
        readiness = int((ready_ships / total_ships) * 100)
    
    return {
        "fleet_readiness": readiness,
        "total_ships": total_ships or 0,
        "active_operations": active_ops or 0,
        "org_treasury_balance": treasury_balance or 0,
    }

@router.get("/user/{user_id}")
async def get_user_stats(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Fetch statistics for a specific user."""
    from app.models.trade import TradeRun
    from app.models.project import Contribution
    from app.models.event import OperationParticipant
    from app.models.achievement import UserAchievement

    # Total ships
    ships_count = await db.scalar(
        select(func.count()).select_from(Ship).where(Ship.user_id == user_id)
    )

    # Total trade profit
    trade_profit = await db.scalar(
        select(func.sum(TradeRun.profit)).where(TradeRun.user_id == user_id)
    )

    # Total contributions
    total_contributions = await db.scalar(
        select(func.sum(Contribution.amount)).where(Contribution.user_id == user_id)
    )

    # Operations joined
    ops_count = await db.scalar(
        select(func.count()).select_from(OperationParticipant).where(OperationParticipant.user_id == user_id)
    )

    # Achievements earned
    achievements_count = await db.scalar(
        select(func.count()).select_from(UserAchievement).where(UserAchievement.user_id == user_id)
    )

    return {
        "ships_count": ships_count or 0,
        "trade_profit": trade_profit or 0,
        "total_contributions": total_contributions or 0,
        "operations_count": ops_count or 0,
        "achievements_count": achievements_count or 0,
    }
