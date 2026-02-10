import asyncio
import argparse
import sys
import logging
import getpass
from sqlalchemy import select
from app.database import async_session
from app.models import User, Role, UserRole, RoleTier
from app.services.auth import get_password_hash
from app.tasks.privacy_tasks import execute_pending_deletions # Import the new task

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

async def create_admin(email, password, handle, display_name):
    if not password:
        password = getpass.getpass("Enter password for new admin: ")
        
    async with async_session() as session:
        # Check if user exists
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            logger.error(f"User with email {email} already exists.")
            return

        # Create User
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            rsi_handle=handle,
            display_name=display_name,
            is_active=True,
            is_approved=True
        )
        session.add(user)
        await session.flush() # Get ID

        # Assign Admin Role
        result = await session.db_session.execute(select(Role).where(Role.tier == RoleTier.ADMIN)) # Changed from session.execute to session.db_session.execute
        admin_role = result.scalar_one_or_none()
        
        if not admin_role:
            logger.error("Admin role not found. Please run seed.py first.")
            return

        user_role = UserRole(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        
        await session.commit()
        logger.info(f"Admin user '{display_name}' ({email}) created successfully.")

async def approve_user(email):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.error(f"User with email {email} not found.")
            return
            
        if user.is_approved:
            logger.info(f"User {email} is already approved.")
            return

        user.is_approved = True
        await session.commit()
        logger.info(f"User {email} has been approved.")

async def run_deletion_task():
    """Run the pending account deletion task."""
    logger.info("Running pending account deletion task...")
    await execute_pending_deletions()
    logger.info("Pending account deletion task finished.")

def main():
    parser = argparse.ArgumentParser(description="Star Citizen Hub CLI Management Tool")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # create-admin
    parser_create = subparsers.add_parser("create-admin", help="Create a new superuser")
    parser_create.add_argument("email", help="User email address")
    parser_create.add_argument("handle", help="RSI Handle")
    parser_create.add_argument("--password", help="User password (optional, will prompt if missing)", required=False)
    parser_create.add_argument("--name", help="Display Name", default="Commander")

    # approve-user
    parser_approve = subparsers.add_parser("approve-user", help="Approve a pending user")
    parser_approve.add_argument("email", help="User email address to approve")

    # run-deletions
    parser_delete = subparsers.add_parser("run-deletions", help="Execute pending account deletions")

    args = parser.parse_args()

    if args.command == "create-admin":
        asyncio.run(create_admin(args.email, args.password, args.handle, args.name))
    elif args.command == "approve-user":
        asyncio.run(approve_user(args.email))
    elif args.command == "run-deletions":
        asyncio.run(run_deletion_task())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
