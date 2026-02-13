from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, desc, func
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.role import Role, UserRole, RoleTier
from app.models.ship import Ship
from app.models.stockpile import OrgStockpile # Using OrgStockpile
from app.models.treasury import TreasuryTransaction # Assuming this is for org treasury
from app.models.event import Event, EventSignup # For events
from app.models.announcement import Announcement
from app.models.forum import ForumPost # For forum posts
from app.models.trade import CargoContract

from app.schemas.admin import (
    OrgDataExportResponse,
    OrgInfo,
    OrgMember,
    OrgRole,
    OrgShip,
    OrgStockpileItem,
    OrgTreasuryTransaction,
    OrgOperation,
    OrgAnnouncement,
    OrgForumPost,
    OrgCargoContract,
)
from app.schemas.user import UserInviteCreate, UserResponse # Import UserInviteCreate and UserResponse
from app.services.auth import AuthService # Import AuthService
from fastapi import HTTPException, status # Import HTTPException


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def invite_user(self, invite_data: UserInviteCreate, admin_id: int) -> User:
        # Check if user with this email already exists
        existing_user = await self.db.scalar(select(User).where(User.email == invite_data.email))
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")

        # Generate a temporary password (or send invitation link later)
        # For now, let's create a user with a placeholder password
        # In a real app, this would be an invitation flow with a link, not a direct password.
        temporary_password = AuthService.generate_random_password()
        hashed_password = AuthService.get_password_hash(temporary_password)

        new_user = User(
            email=invite_data.email,
            hashed_password=hashed_password,
            is_active=True, # Active but not yet approved or with confirmed email
            is_approved=False, # Requires approval
        )
        self.db.add(new_user)
        await self.db.flush() # Flush to get new_user.id

        # Assign role
        role_to_assign = None
        if invite_data.role_id:
            role_to_assign = await self.db.scalar(select(Role).where(Role.id == invite_data.role_id))
            if not role_to_assign:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified role not found")
        else:
            # Assign a default role if no role_id is provided
            # Assuming there's a default role in your system, e.g., 'member'
            role_to_assign = await self.db.scalar(select(Role).where(Role.is_default == True))
            if not role_to_assign:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No default role configured")
        
        user_role = UserRole(
            user_id=new_user.id,
            role_id=role_to_assign.id,
            granted_by=admin_id,
        )
        self.db.add(user_role)
        
        await self.db.commit()
        await self.db.refresh(new_user)
        
        # In a real application, you would send an email with the temporary password or an invitation link here.
        # For now, we'll just return the user.
        return new_user

    async def export_org_data(self) -> OrgDataExportResponse:
        """
        Exports all relevant data for the single implicit organization (the application instance).
        """
        export_date = datetime.utcnow()
        total_records = 0

        # --- 1. Org Info ---
        # Since there's no explicit Organization model, create a static OrgInfo
        org_info = OrgInfo(
            id=1, # A symbolic ID for the single instance
            name="Star Citizen Hub Instance",
            description="Data export for the entire Star Citizen Hub application instance.",
            created_at=datetime(2023, 1, 1), # A symbolic creation date
        )
        
        # --- 2. Members ---
        members_data: List[OrgMember] = []
        user_results = await self.db.execute(
            select(User, UserRole, Role).outerjoin(UserRole).outerjoin(Role)
        )
        users_with_roles = user_results.all() # (User, UserRole, Role) tuples

        user_roles_map = {}
        for user, user_role, role in users_with_roles:
            if user.id not in user_roles_map:
                user_roles_map[user.id] = {
                    "user": user,
                    "roles": [],
                }
            if role:
                user_roles_map[user.id]["roles"].append(role.name)

        for user_id, data in user_roles_map.items():
            user = data["user"]
            members_data.append(OrgMember(
                id=user.id,
                display_name=user.display_name,
                email=user.email,
                rsi_handle=user.rsi_handle,
                roles=data["roles"],
                joined_at=user.created_at,
            ))
        total_records += len(members_data)

        # --- 3. Roles ---
        roles_data: List[OrgRole] = []
        role_results = await self.db.execute(select(Role).order_by(Role.tier))
        for role in role_results.scalars().all():
            roles_data.append(OrgRole(
                id=role.id,
                name=role.name,
                description=role.description,
                tier=role.tier.value if hasattr(role.tier, 'value') else str(role.tier),
                permissions=role.permissions or [],
            ))
        total_records += len(roles_data)
        
        # --- 4. Ships ---
        ships_data: List[OrgShip] = []
        ship_results = await self.db.execute(select(Ship, User).join(User, Ship.user_id == User.id))
        for ship, owner in ship_results.all():
            ships_data.append(OrgShip(
                id=ship.id,
                name=ship.name,
                manufacturer="Unknown", # Manufacturer not in model
                model=ship.ship_type,
                owner_id=ship.user_id,
                owner_display_name=owner.display_name,
            ))
        total_records += len(ships_data)

        # --- 5. Stockpiles ---
        stockpiles_data: List[OrgStockpileItem] = []
        stockpile_results = await self.db.execute(select(OrgStockpile))
        for item in stockpile_results.scalars().all():
            stockpiles_data.append(OrgStockpileItem(
                id=item.id,
                item_name=item.name,
                quantity=item.quantity,
                location="Organization Inventory", # Default location
                added_by_id=None,
                added_by_display_name="Organization",
                created_at=item.created_at,
            ))
        total_records += len(stockpiles_data)

        # --- 6. Treasury Transactions ---
        treasury_data: List[OrgTreasuryTransaction] = []
        treasury_results = await self.db.execute(select(TreasuryTransaction, User).join(User, TreasuryTransaction.user_id == User.id))
        for tx, user in treasury_results.all():
            treasury_data.append(OrgTreasuryTransaction(
                id=tx.id,
                amount=tx.amount,
                transaction_type=tx.type.value if hasattr(tx.type, 'value') else str(tx.type),
                description=tx.description,
                initiated_by_id=tx.user_id,
                initiated_by_display_name=user.display_name,
                created_at=tx.created_at,
            ))
        total_records += len(treasury_data)

        # --- 7. Operations ---
        operations_data: List[OrgOperation] = []
        operation_results = await self.db.execute(select(Event, User).join(User, Event.organizer_id == User.id))
        for op, created_by_user in operation_results.all():
            # Fetch participants for this operation
            participant_results = await self.db.execute(
                select(User.display_name)
                .join(EventSignup, EventSignup.user_id == User.id)
                .where(EventSignup.event_id == op.id)
            )
            participants = [name for name, in participant_results.all()]

            operations_data.append(OrgOperation(
                id=op.id,
                title=op.title,
                description=op.description,
                operation_type=op.event_type.value if hasattr(op.event_type, 'value') else str(op.event_type),
                scheduled_at=op.start_time,
                status=op.status.value if hasattr(op.status, 'value') else str(op.status),
                created_by_id=op.organizer_id,
                created_by_display_name=created_by_user.display_name,
                participants=participants,
            ))
        total_records += len(operations_data)

        # --- 8. Announcements ---
        announcements_data: List[OrgAnnouncement] = []
        announcement_results = await self.db.execute(select(Announcement, User).join(User, Announcement.author_id == User.id))
        for ann, author in announcement_results.all():
            announcements_data.append(OrgAnnouncement(
                id=ann.id,
                title=ann.title,
                content=ann.content,
                author_id=ann.author_id,
                author_display_name=author.display_name,
                published_at=ann.created_at, # Using created_at
            ))
        total_records += len(announcements_data)

        # --- 9. Forum Posts ---
        forum_posts_data: List[OrgForumPost] = []
        forum_post_results = await self.db.execute(select(ForumPost, User).join(User, ForumPost.author_id == User.id))
        for fp, author in forum_post_results.all():
            forum_posts_data.append(OrgForumPost(
                id=fp.id,
                thread_id=fp.thread_id,
                author_id=fp.author_id,
                author_display_name=author.display_name,
                content=fp.content,
                created_at=fp.created_at,
            ))
        total_records += len(forum_posts_data)

        # --- 10. Cargo Contracts ---
        cargo_contracts_data: List[OrgCargoContract] = []
        # Query all cargo contracts since they belong to the single implicit organization
        PosterUser = aliased(User)
        HaulerUser = aliased(User)

        contract_results = await self.db.execute(
            select(CargoContract, PosterUser.display_name.label("poster_display_name"), HaulerUser.display_name.label("hauler_display_name"))
            .outerjoin(PosterUser, CargoContract.poster_id == PosterUser.id)
            .outerjoin(HaulerUser, CargoContract.hauler_id == HaulerUser.id)
            .order_by(desc(CargoContract.created_at))
        )
        for contract, poster_display_name, hauler_display_name in contract_results.all():
            cargo_contracts_data.append(OrgCargoContract(
                id=contract.id,
                poster_id=contract.poster_id,
                poster_display_name=poster_display_name or f"User {contract.poster_id}",
                hauler_id=contract.hauler_id,
                hauler_display_name=hauler_display_name,
                origin=contract.origin_location,
                destination=contract.destination_location,
                commodity=contract.commodity,
                quantity=contract.quantity,
                payment_amount=contract.payment_amount,
                status=contract.status.value if hasattr(contract.status, 'value') else str(contract.status),
                created_at=contract.created_at,
            ))
        total_records += len(cargo_contracts_data)


        return OrgDataExportResponse(
            org_info=org_info,
            members=members_data,
            roles=roles_data,
            ships=ships_data,
            stockpiles=stockpiles_data,
            treasury_transactions=treasury_data,
            operations=operations_data,
            announcements=announcements_data,
            forum_posts=forum_posts_data,
            cargo_contracts=cargo_contracts_data,
            export_date=export_date,
            total_records=total_records,
        )
