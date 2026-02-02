# app/services/stockpile.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.stockpile import OrgStockpile, StockpileTransaction, ResourceType
from app.schemas.stockpile import (
    StockpileCreate,
    StockpileUpdate,
    StockpileTransactionCreate,
)


class StockpileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_stockpile(self, data: StockpileCreate) -> OrgStockpile:
        stockpile = OrgStockpile(
            name=data.name,
            description=data.description,
            resource_type=data.resource_type,
            quantity=data.quantity,
            unit=data.unit,
            min_threshold=data.min_threshold,
            custom_attributes=data.custom_attributes,
        )
        self.db.add(stockpile)
        await self.db.commit()
        await self.db.refresh(stockpile)
        return stockpile

    async def get_stockpile_by_id(self, stockpile_id: int) -> Optional[OrgStockpile]:
        result = await self.db.execute(
            select(OrgStockpile).where(OrgStockpile.id == stockpile_id)
        )
        return result.scalar_one_or_none()

    async def get_all_stockpiles(
        self,
        resource_type: Optional[ResourceType] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[OrgStockpile]:
        query = select(OrgStockpile)
        if resource_type:
            query = query.where(OrgStockpile.resource_type == resource_type)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_stockpile(
        self, stockpile: OrgStockpile, data: StockpileUpdate
    ) -> OrgStockpile:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(stockpile, field, value)
        await self.db.commit()
        await self.db.refresh(stockpile)
        return stockpile

    async def delete_stockpile(self, stockpile: OrgStockpile) -> None:
        await self.db.delete(stockpile)
        await self.db.commit()

    async def create_transaction(
        self,
        stockpile: OrgStockpile,
        data: StockpileTransactionCreate,
        user_id: Optional[int] = None,
    ) -> StockpileTransaction:
        transaction = StockpileTransaction(
            stockpile_id=stockpile.id,
            user_id=user_id,
            quantity_change=data.quantity_change,
            transaction_type=data.transaction_type,
            reason=data.reason,
        )
        self.db.add(transaction)

        # Update stockpile quantity
        stockpile.quantity += data.quantity_change

        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_transactions(
        self,
        stockpile_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[StockpileTransaction]:
        result = await self.db.execute(
            select(StockpileTransaction)
            .where(StockpileTransaction.stockpile_id == stockpile_id)
            .order_by(StockpileTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_low_stock_stockpiles(self) -> List[OrgStockpile]:
        """Get stockpiles where quantity is below min_threshold."""
        result = await self.db.execute(
            select(OrgStockpile).where(
                OrgStockpile.min_threshold.isnot(None),
                OrgStockpile.quantity < OrgStockpile.min_threshold,
            )
        )
        return list(result.scalars().all())
