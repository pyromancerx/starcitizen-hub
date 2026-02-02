# app/routers/stockpile.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.stockpile import ResourceType
from app.schemas.stockpile import (
    StockpileCreate,
    StockpileUpdate,
    StockpileResponse,
    StockpileTransactionCreate,
    StockpileTransactionResponse,
)
from app.services.stockpile import StockpileService

router = APIRouter(prefix="/api/stockpiles", tags=["stockpiles"])


@router.post("/", response_model=StockpileResponse, status_code=status.HTTP_201_CREATED)
async def create_stockpile(
    data: StockpileCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpile = await service.create_stockpile(data)
    return stockpile


@router.get("/", response_model=List[StockpileResponse])
async def list_stockpiles(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    resource_type: Optional[ResourceType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    service = StockpileService(db)
    stockpiles = await service.get_all_stockpiles(resource_type, skip, limit)
    return stockpiles


@router.get("/low-stock", response_model=List[StockpileResponse])
async def get_low_stock(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpiles = await service.get_low_stock_stockpiles()
    return stockpiles


@router.get("/{stockpile_id}", response_model=StockpileResponse)
async def get_stockpile(
    stockpile_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpile = await service.get_stockpile_by_id(stockpile_id)
    if not stockpile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stockpile not found",
        )
    return stockpile


@router.patch("/{stockpile_id}", response_model=StockpileResponse)
async def update_stockpile(
    stockpile_id: int,
    data: StockpileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpile = await service.get_stockpile_by_id(stockpile_id)
    if not stockpile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stockpile not found",
        )
    updated = await service.update_stockpile(stockpile, data)
    return updated


@router.delete("/{stockpile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stockpile(
    stockpile_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpile = await service.get_stockpile_by_id(stockpile_id)
    if not stockpile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stockpile not found",
        )
    await service.delete_stockpile(stockpile)


@router.post(
    "/{stockpile_id}/transactions",
    response_model=StockpileTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction(
    stockpile_id: int,
    data: StockpileTransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = StockpileService(db)
    stockpile = await service.get_stockpile_by_id(stockpile_id)
    if not stockpile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stockpile not found",
        )
    transaction = await service.create_transaction(stockpile, data, current_user.id)
    return transaction


@router.get(
    "/{stockpile_id}/transactions",
    response_model=List[StockpileTransactionResponse],
)
async def list_transactions(
    stockpile_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    service = StockpileService(db)
    stockpile = await service.get_stockpile_by_id(stockpile_id)
    if not stockpile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stockpile not found",
        )
    transactions = await service.get_transactions(stockpile_id, skip, limit)
    return transactions
