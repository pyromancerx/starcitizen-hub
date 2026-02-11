import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import async_session
from app.models import Role, RoleTier, User
from app.models.ship import Ship
from app.models.announcement import Announcement
from app.models.trade import PriceReport, TradeRun
from app.models.crew import LFGPost, LFGStatus
from app.models.project import Project
from app.models.wallet import Wallet
from app.services.auth import get_password_hash

logger = logging.getLogger(__name__)

async def seed_data():
    """
    Seed initial roles and sample data if the database is empty.
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

        # 2. Seed Sample Users (if no users exist)
        result = await session.execute(select(User))
        if not result.scalars().first():
            logger.info("Seeding sample users...")
            
            # Fetch admin role
            result = await session.execute(select(Role).where(Role.tier == RoleTier.ADMIN))
            admin_role = result.scalar_one()
            
            # Fetch member role
            result = await session.execute(select(Role).where(Role.tier == RoleTier.MEMBER))
            member_role = result.scalar_one()

            sample_users = [
                User(
                    email="admin@example.com",
                    display_name="Commander Shepard",
                    hashed_password=get_password_hash("password123"),
                    is_active=True,
                    is_approved=True,
                ),
                User(
                    email="pilot@example.com",
                    display_name="Joker",
                    hashed_password=get_password_hash("password123"),
                    is_active=True,
                    is_approved=True,
                ),
                User(
                    email="trader@example.com",
                    display_name="Han Solo",
                    hashed_password=get_password_hash("password123"),
                    is_active=True,
                    is_approved=True,
                )
            ]
            session.add_all(sample_users)
            await session.commit()
            
            for user in sample_users:
                await session.refresh(user)
                # Assign roles
                from app.models.role import UserRole
                role_to_assign = admin_role if user.email == "admin@example.com" else member_role
                user_role = UserRole(user_id=user.id, role_id=role_to_assign.id)
                session.add(user_role)
                
                # Create wallets
                wallet = Wallet(user_id=user.id, balance_auec=1000000 if user.email == "admin@example.com" else 50000)
                session.add(wallet)
                
            await session.commit()
            logger.info("Sample users and wallets seeded.")

            # 3. Seed Sample Ships
            logger.info("Seeding sample ships...")
            admin_user = sample_users[0]
            pilot_user = sample_users[1]
            
            sample_ships = [
                Ship(user_id=admin_user.id, ship_type="Carrack", name="Normandy SR-2", insurance_status="LTI"),
                Ship(user_id=pilot_user.id, ship_type="MSR", name="Millennium Falcon", insurance_status="6 Months"),
                Ship(user_id=pilot_user.id, ship_type="Arrow", name="Blue Leader", insurance_status="LTI"),
            ]
            session.add_all(sample_ships)
            
            # 4. Seed Sample Announcements
            logger.info("Seeding sample announcements...")
            announcements = [
                Announcement(
                    author_id=admin_user.id, 
                    title="Welcome to the Hub", 
                    content="Welcome to our new organization platform! Please verify your RSI handle.",
                    priority="important"
                ),
                Announcement(
                    author_id=admin_user.id, 
                    title="Upcoming Operation: XenoThreat", 
                    content="We are preparing for the upcoming XenoThreat event. Check the calendar for details.",
                    priority="critical"
                )
            ]
            session.add_all(announcements)

            # 5. Seed Sample Price Reports
            logger.info("Seeding sample price reports...")
            trader_user = sample_users[2]
            price_reports = [
                PriceReport(user_id=trader_user.id, location="New Babbage", commodity="Laranite", buy_price=28.5, sell_price=31.2),
                PriceReport(user_id=trader_user.id, location="Port Tressler", commodity="Laranite", buy_price=None, sell_price=34.5),
                PriceReport(user_id=trader_user.id, location="Area18", commodity="Medical Supplies", buy_price=15.2, sell_price=18.5),
            ]
            session.add_all(price_reports)

            # 6. Seed Sample Trade Runs
            logger.info("Seeding sample trade runs...")
            trade_runs = [
                TradeRun(
                    user_id=trader_user.id,
                    origin_location="New Babbage",
                    destination_location="Port Tressler",
                    commodity="Laranite",
                    quantity=100,
                    buy_price_per_unit=28.5,
                    sell_price_per_unit=34.5,
                    profit=600,
                    completed_at=datetime.utcnow() - timedelta(hours=2)
                )
            ]
            session.add_all(trade_runs)

            # 7. Seed Sample LFG Posts
            logger.info("Seeding sample LFG posts...")
            lfg_posts = [
                LFGPost(
                    user_id=pilot_user.id,
                    ship_type="Hammerhead",
                    activity_type="Combat",
                    looking_for_roles=["Turret Gunner", "Engineer"],
                    notes="Doing some ERTs, need gunners!",
                    status=LFGStatus.OPEN,
                    expires_at=datetime.utcnow() + timedelta(hours=4)
                )
            ]
            session.add_all(lfg_posts)

            # 8. Seed Sample Projects
            logger.info("Seeding sample projects...")
            projects = [
                Project(
                    title="Fleet Expansion",
                    description="Gathering funds for a Kraken.",
                    status="active",
                    manager_id=admin_user.id,
                )
            ]
            session.add_all(projects)

            await session.commit()
            logger.info("Sample data seeded successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_data())
