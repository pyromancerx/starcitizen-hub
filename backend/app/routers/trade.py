# app/routers/trade.py
from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.trade import (
    TradeRunCreate,
    TradeRunUpdate,
    TradeRunResponse,
    PriceReportCreate,
    PriceReportResponse,
    CargoContractCreate,
    CargoContractUpdate,
    CargoContractResponse,
)
from app.services.trade import TradeService

router = APIRouter(prefix="/api/trade", tags=["trade"])


# === Trade Run Endpoints ===

@router.post("/runs", response_model=TradeRunResponse, status_code=status.HTTP_201_CREATED)
async def create_trade_run(
    data: TradeRunCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Log a new trade run."""
    service = TradeService(db)
    trade_run = await service.create_trade_run(current_user.id, data)
    return trade_run


@router.get("/runs", response_model=List[TradeRunResponse])
async def get_my_trade_runs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get the current user's trade runs."""
    service = TradeService(db)
    return await service.get_user_trade_runs(current_user.id, skip=skip, limit=limit)


@router.get("/runs/all", response_model=List[TradeRunResponse])
async def get_all_trade_runs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all trade runs (for leaderboard context)."""
    service = TradeService(db)
    return await service.get_all_trade_runs(skip=skip, limit=limit)


@router.get("/runs/{run_id}", response_model=TradeRunResponse)
async def get_trade_run(
    run_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific trade run."""
    service = TradeService(db)
    trade_run = await service.get_trade_run_by_id(run_id)
    if not trade_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade run not found"
        )
    return trade_run


@router.put("/runs/{run_id}", response_model=TradeRunResponse)
async def update_trade_run(
    run_id: int,
    data: TradeRunUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update a trade run."""
    service = TradeService(db)
    trade_run = await service.get_trade_run_by_id(run_id)
    
    if not trade_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade run not found"
        )
    
    if trade_run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own trade runs"
        )
    
    updated = await service.update_trade_run(trade_run, data)
    return updated


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade_run(
    run_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete a trade run."""
    service = TradeService(db)
    trade_run = await service.get_trade_run_by_id(run_id)
    
    if not trade_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade run not found"
        )
    
    if trade_run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own trade runs"
        )
    
    await service.delete_trade_run(trade_run)


@router.get("/stats/my", response_model=dict)
async def get_my_trade_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the current user's trading statistics."""
    service = TradeService(db)
    return await service.get_user_trade_stats(current_user.id)


@router.get("/leaderboard", response_model=List[dict])
async def get_leaderboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    limit: int = Query(10, ge=1, le=50),
):
    """Get the trading leaderboard."""
    service = TradeService(db)
    return await service.get_leaderboard(limit=limit)


# === Price Report Endpoints ===

@router.post("/prices", response_model=PriceReportResponse, status_code=status.HTTP_201_CREATED)
async def create_price_report(
    data: PriceReportCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Submit a new price report."""
    service = TradeService(db)
    price_report = await service.create_price_report(current_user.id, data)
    return price_report


@router.get("/prices", response_model=List[PriceReportResponse])
async def get_price_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    location: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """Get price reports with optional filtering."""
    service = TradeService(db)
    return await service.get_price_reports(
        location=location,
        commodity=commodity,
        skip=skip,
        limit=limit
    )


@router.get("/prices/location/{location}", response_model=List[PriceReportResponse])
async def get_prices_by_location(
    location: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get latest prices for all commodities at a location."""
    service = TradeService(db)
    return await service.get_latest_prices_by_location(location)


@router.get("/prices/history", response_model=List[PriceReportResponse])
async def get_price_history(
    location: str = Query(..., description="Location name"),
    commodity: str = Query(..., description="Commodity name"),
    days: int = Query(7, ge=1, le=30),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_approved_user)] = None,
):
    """Get price history for a commodity at a location."""
    service = TradeService(db)
    return await service.get_price_history(location, commodity, days)


@router.get("/routes/best", response_model=List[dict])
async def get_best_routes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    limit: int = Query(10, ge=1, le=20),
):
    """Get the best trade routes based on current price data."""
    service = TradeService(db)
    return await service.get_best_routes(limit=limit)


# === Cargo Contract Endpoints ===

@router.post("/contracts", response_model=CargoContractResponse, status_code=status.HTTP_201_CREATED)
async def create_cargo_contract(
    data: CargoContractCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Post a new cargo contract."""
    service = TradeService(db)
    contract = await service.create_cargo_contract(current_user.id, data)
    return contract


@router.get("/contracts/open", response_model=List[CargoContractResponse])
async def get_open_contracts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all open cargo contracts."""
    service = TradeService(db)
    return await service.get_open_contracts(skip=skip, limit=limit)


@router.get("/contracts/my", response_model=List[CargoContractResponse])
async def get_my_contracts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get contracts posted by the current user."""
    service = TradeService(db)
    return await service.get_posted_contracts(current_user.id)


@router.get("/contracts/hauling", response_model=List[CargoContractResponse])
async def get_my_hauling_contracts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get contracts the current user has accepted to haul."""
    service = TradeService(db)
    return await service.get_accepted_contracts(current_user.id)


@router.get("/contracts/{contract_id}", response_model=CargoContractResponse)
async def get_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific cargo contract."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    return contract


@router.post("/contracts/{contract_id}/accept", response_model=CargoContractResponse)
async def accept_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Accept a cargo contract as a hauler."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    try:
        updated = await service.accept_contract(contract, current_user.id)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/contracts/{contract_id}/start", response_model=CargoContractResponse)
async def start_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Mark a contract as in progress. Only the hauler can do this."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    if contract.hauler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the hauler can start the contract"
        )
    
    try:
        updated = await service.start_contract(contract)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/contracts/{contract_id}/complete", response_model=CargoContractResponse)
async def complete_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Complete a cargo contract. Only the poster or hauler can do this."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    if contract.poster_id != current_user.id and contract.hauler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only poster or hauler can complete"
        )
    
    try:
        updated = await service.complete_contract(contract)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/contracts/{contract_id}/cancel", response_model=CargoContractResponse)
async def cancel_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Cancel a cargo contract. Only the poster or hauler can do this."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    try:
        updated = await service.cancel_contract(contract, current_user.id)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/contracts/{contract_id}/dispute", response_model=CargoContractResponse)
async def dispute_contract(
    contract_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Mark a contract as disputed for admin review."""
    service = TradeService(db)
    contract = await service.get_contract_by_id(contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    if contract.poster_id != current_user.id and contract.hauler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only involved parties can dispute"
        )
    
    try:
        updated = await service.dispute_contract(contract)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/hauler/stats", response_model=dict)
async def get_hauler_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get hauling statistics for the current user."""
    service = TradeService(db)
    return await service.get_hauler_stats(current_user.id)
