# app/services/inventory.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import PersonalInventory, ItemType
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_item(self, user_id: int, data: InventoryItemCreate) -> PersonalInventory:
        item = PersonalInventory(
            user_id=user_id,
            item_type=data.item_type,
            item_name=data.item_name,
            quantity=data.quantity,
            location=data.location,
            custom_attributes=data.custom_attributes,
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get_item_by_id(self, item_id: int) -> Optional[PersonalInventory]:
        result = await self.db.execute(
            select(PersonalInventory).where(PersonalInventory.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_user_inventory(
        self,
        user_id: int,
        item_type: Optional[ItemType] = None,
        location: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PersonalInventory]:
        query = select(PersonalInventory).where(PersonalInventory.user_id == user_id)
        if item_type:
            query = query.where(PersonalInventory.item_type == item_type)
        if location:
            query = query.where(PersonalInventory.location == location)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_item(
        self, item: PersonalInventory, data: InventoryItemUpdate
    ) -> PersonalInventory:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_item(self, item: PersonalInventory) -> None:
        await self.db.delete(item)
        await self.db.commit()

    async def adjust_quantity(
        self, item: PersonalInventory, quantity_change: int
    ) -> PersonalInventory:
        """Adjust item quantity by the given amount (positive or negative)."""
        new_quantity = item.quantity + quantity_change
        if new_quantity < 0:
            raise ValueError("Quantity cannot be negative")
        item.quantity = new_quantity
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def search_items(
        self,
        user_id: int,
        search_term: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PersonalInventory]:
        """Search items by name (case-insensitive partial match)."""
        result = await self.db.execute(
            select(PersonalInventory)
            .where(
                PersonalInventory.user_id == user_id,
                PersonalInventory.item_name.ilike(f"%{search_term}%"),
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_locations(self, user_id: int) -> List[str]:
        """Get all unique locations for a user's inventory."""
        result = await self.db.execute(
            select(PersonalInventory.location)
            .where(
                PersonalInventory.user_id == user_id,
                PersonalInventory.location.isnot(None),
            )
            .distinct()
        )
        return [row[0] for row in result.all()]

    async def get_items_at_location(
        self,
        user_id: int,
        location: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PersonalInventory]:
        """Get all items at a specific location."""
        result = await self.db.execute(
            select(PersonalInventory)
            .where(
                PersonalInventory.user_id == user_id,
                PersonalInventory.location == location,
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
