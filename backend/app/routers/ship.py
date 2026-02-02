# app/routers/ship.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.ship import ShipCreate, ShipUpdate, ShipResponse
from app.services.ship import ShipService

router = APIRouter(prefix="/api/ships", tags=["ships"])


@router.post("/", response_model=ShipResponse, status_code=status.HTTP_201_CREATED)
async def create_ship(
    data: ShipCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Create a new ship for the current user."""
    service = ShipService(db)
    ship = await service.create_ship(current_user.id, data)
    return ship


@router.get("/", response_model=List[ShipResponse])
async def list_my_ships(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    ship_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all ships owned by the current user."""
    service = ShipService(db)
    ships = await service.get_user_ships(current_user.id, ship_type, skip, limit)
    return ships


@router.get("/expiring-insurance", response_model=List[ShipResponse])
async def get_expiring_insurance(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    days: int = Query(30, ge=1, le=365),
):
    """Get ships with insurance expiring within the given number of days."""
    service = ShipService(db)
    ships = await service.get_expiring_insurance(current_user.id, days)
    return ships


@router.get("/{ship_id}", response_model=ShipResponse)
async def get_ship(
    ship_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific ship by ID."""
    service = ShipService(db)
    ship = await service.get_ship_by_id(ship_id)
    if not ship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ship not found",
        )
    # Users can only access their own ships
    if ship.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this ship",
        )
    return ship


@router.patch("/{ship_id}", response_model=ShipResponse)
async def update_ship(
    ship_id: int,
    data: ShipUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update a ship."""
    service = ShipService(db)
    ship = await service.get_ship_by_id(ship_id)
    if not ship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ship not found",
        )
    if ship.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this ship",
        )
    updated = await service.update_ship(ship, data)
    return updated


@router.delete("/{ship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ship(
    ship_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete a ship."""
    service = ShipService(db)
    ship = await service.get_ship_by_id(ship_id)
    if not ship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ship not found",
        )
    if ship.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this ship",
        )
    await service.delete_ship(ship)
