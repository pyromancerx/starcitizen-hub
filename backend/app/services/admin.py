from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import aliased # Moved to top-level imports

from app.models.user import User
from app.models.role import Role, UserRole, RoleTier
from app.models.ship import Ship
from app.models.stockpile import Stockpile, StockpileItem # Assuming these are org stockpiles
from app.models.treasury import TreasuryTransaction # Assuming this is for org treasury
from app.models.event import Operation, OperationParticipant # For operations
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


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

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
        ship_results = await self.db.execute(select(Ship, User).join(User, Ship.owner_id == User.id))
        for ship, owner in ship_results.all():
            ships_data.append(OrgShip(
                id=ship.id,
                name=ship.name,
                manufacturer=ship.manufacturer,
                model=ship.model,
                owner_id=ship.owner_id,
                owner_display_name=owner.display_name,
            ))
        total_records += len(ships_data)

        # --- 5. Stockpiles ---
        stockpiles_data: List[OrgStockpileItem] = []
        stockpile_results = await self.db.execute(select(StockpileItem, User).join(User, StockpileItem.added_by_id == User.id))
        for item, added_by_user in stockpile_results.all():
            stockpiles_data.append(OrgStockpileItem(
                id=item.id,
                item_name=item.item_name,
                quantity=item.quantity,
                location=item.location,
                added_by_id=item.added_by_id,
                added_by_display_name=added_by_user.display_name,
                created_at=item.created_at,
            ))
        total_records += len(stockpiles_data)

        # --- 6. Treasury Transactions ---
        treasury_data: List[OrgTreasuryTransaction] = []
        treasury_results = await self.db.execute(select(TreasuryTransaction, User).join(User, TreasuryTransaction.initiated_by_id == User.id))
        for tx, initiated_by_user in treasury_results.all():
            treasury_data.append(OrgTreasuryTransaction(
                id=tx.id,
                amount=tx.amount,
                transaction_type=tx.transaction_type.value if hasattr(tx.transaction_type, 'value') else str(tx.transaction_type),
                description=tx.description,
                initiated_by_id=tx.initiated_by_id,
                initiated_by_display_name=initiated_by_user.display_name,
                created_at=tx.created_at,
            ))
        total_records += len(treasury_data)

        # --- 7. Operations ---
        operations_data: List[OrgOperation] = []
        operation_results = await self.db.execute(select(Operation, User).join(User, Operation.created_by_id == User.id))
        for op, created_by_user in operation_results.all():
            # Fetch participants for this operation
            participant_results = await self.db.execute(
                select(User.display_name)
                .join(OperationParticipant, OperationParticipant.user_id == User.id)
                .where(OperationParticipant.operation_id == op.id)
            )
            participants = [name for name, in participant_results.all()]

            operations_data.append(OrgOperation(
                id=op.id,
                title=op.title,
                description=op.description,
                operation_type=op.operation_type.value if hasattr(op.operation_type, 'value') else str(op.operation_type),
                scheduled_at=op.scheduled_at,
                status=op.status.value if hasattr(op.status, 'value') else str(op.status),
                created_by_id=op.created_by_id,
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
                published_at=ann.published_at,
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
