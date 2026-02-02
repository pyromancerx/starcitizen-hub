# app/services/ship.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ship import Ship
from app.schemas.ship import ShipCreate, ShipUpdate


class ShipService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_ship(self, user_id: int, data: ShipCreate) -> Ship:
        ship = Ship(
            user_id=user_id,
            ship_type=data.ship_type,
            name=data.name,
            serial_number=data.serial_number,
            insurance_status=data.insurance_status,
            insurance_expires_at=data.insurance_expires_at,
            loadout=data.loadout,
            notes=data.notes,
            custom_attributes=data.custom_attributes,
        )
        self.db.add(ship)
        await self.db.commit()
        await self.db.refresh(ship)
        return ship

    async def get_ship_by_id(self, ship_id: int) -> Optional[Ship]:
        result = await self.db.execute(
            select(Ship).where(Ship.id == ship_id)
        )
        return result.scalar_one_or_none()

    async def get_user_ships(
        self,
        user_id: int,
        ship_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Ship]:
        query = select(Ship).where(Ship.user_id == user_id)
        if ship_type:
            query = query.where(Ship.ship_type == ship_type)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_ship(self, ship: Ship, data: ShipUpdate) -> Ship:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ship, field, value)
        await self.db.commit()
        await self.db.refresh(ship)
        return ship

    async def delete_ship(self, ship: Ship) -> None:
        await self.db.delete(ship)
        await self.db.commit()

    async def get_ships_by_type(
        self,
        ship_type: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Ship]:
        """Get all ships of a specific type across all users."""
        result = await self.db.execute(
            select(Ship)
            .where(Ship.ship_type == ship_type)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_expiring_insurance(
        self,
        user_id: int,
        days_ahead: int = 30,
    ) -> List[Ship]:
        """Get ships with insurance expiring within the given days."""
        from datetime import datetime, timedelta

        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)
        result = await self.db.execute(
            select(Ship).where(
                Ship.user_id == user_id,
                Ship.insurance_expires_at.isnot(None),
                Ship.insurance_expires_at <= cutoff_date,
            )
        )
        return list(result.scalars().all())
