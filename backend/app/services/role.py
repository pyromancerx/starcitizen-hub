from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.role import Role

class RoleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_roles(self) -> List[Role]:
        """Retrieve all roles."""
        result = await self.db.execute(select(Role).order_by(Role.sort_order))
        return result.scalars().all()
