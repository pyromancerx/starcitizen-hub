import asyncio
import logging
from sqlalchemy import select
from app.database import async_session
from app.models import Role, RoleTier, User
from app.services.auth import get_password_hash

logger = logging.getLogger(__name__)

async def seed_data():
    """
    Seed initial roles and default admin user if they don't exist.
    """
    async with async_session() as session:
        # 1. Seed Roles
        result = await session.execute(select(Role))
        if not result.scalars().first():
            logger.info("Seeding roles...")
            roles = [
                Role(
                    name="Recruit", 
                    tier=RoleTier.RECRUIT, 
                    permissions=["assets.view", "projects.view"], 
                    is_default=True, 
                    sort_order=0
                ),
                Role(
                    name="Member", 
                    tier=RoleTier.MEMBER, 
                    permissions=[
                        "assets.view", "assets.edit", 
                        "forum.post", 
                        "events.signup",
                        "projects.view", "projects.contribute"
                    ], 
                    sort_order=1
                ),
                Role(
                    name="Officer", 
                    tier=RoleTier.OFFICER, 
                    permissions=[
                        "assets.view", "assets.edit", 
                        "forum.post", "forum.moderate",
                        "events.signup", "events.create", 
                        "announcements.post",
                        "projects.view", "projects.contribute", "projects.create", "projects.manage"
                    ], 
                    sort_order=2
                ),
                Role(
                    name="Admin", 
                    tier=RoleTier.ADMIN, 
                    permissions=["*"], 
                    sort_order=100
                ),
            ]
            session.add_all(roles)
            await session.commit()
            logger.info("Roles seeded.")

        # 2. Check for users
        result = await session.execute(select(User))
        if not result.scalars().first():
            logger.warning("NO USERS FOUND. You should create the first user through the web interface or CLI.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_data())