# app/services/treasury.py
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.treasury import OrgTreasury, TreasuryTransaction, TransactionStatus, TransactionType, TransactionCategory
from app.schemas.treasury import TreasuryTransactionCreate


class TreasuryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_wallets(self) -> List[OrgTreasury]:
        """Get all organization wallets."""
        result = await self.db.execute(
            select(OrgTreasury).order_by(OrgTreasury.is_primary.desc(), OrgTreasury.name)
        )
        return result.scalars().all()

    async def get_wallet(self, wallet_id: int) -> Optional[OrgTreasury]:
        """Get a specific wallet by ID."""
        return await self.db.get(OrgTreasury, wallet_id)

    async def get_primary_wallet(self) -> OrgTreasury:
        """Get the primary organization wallet."""
        result = await self.db.execute(
            select(OrgTreasury).where(OrgTreasury.is_primary == True)
        )
        wallet = result.scalar_one_or_none()
        
        if not wallet:
            # Create default primary wallet if none exists
            wallet = OrgTreasury(
                name="Main Treasury",
                is_primary=True,
                balance=0
            )
            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)
            
        return wallet

    async def create_wallet(self, name: str, description: Optional[str] = None, is_primary: bool = False) -> OrgTreasury:
        """Create a new organization wallet."""
        wallet = OrgTreasury(
            name=name,
            description=description,
            is_primary=is_primary,
            balance=0
        )
        self.db.add(wallet)
        await self.db.commit()
        await self.db.refresh(wallet)
        return wallet

    async def update_wallet(
        self, 
        wallet_id: int, 
        name: Optional[str] = None, 
        description: Optional[str] = None, 
        is_primary: Optional[bool] = None # NEW: is_primary parameter
    ) -> OrgTreasury:
        """Update wallet name, description, and primary status."""
        wallet = await self.db.get(OrgTreasury, wallet_id)
        if not wallet:
            raise ValueError("Wallet not found")
        
        if name:
            wallet.name = name
        if description is not None:
            wallet.description = description
        
        # NEW: Handle is_primary flag
        if is_primary is not None:
            if is_primary:
                # Unmark current primary wallet if another one is set as primary
                current_primary = await self.db.scalar(
                    select(OrgTreasury).where(OrgTreasury.is_primary == True, OrgTreasury.id != wallet_id)
                )
                if current_primary:
                    current_primary.is_primary = False
            wallet.is_primary = is_primary
            
        await self.db.commit()
        await self.db.refresh(wallet)
        return wallet

    async def delete_wallet(self, wallet_id: int) -> bool:
        """Delete a wallet if it's empty and has no pending transactions."""
        wallet = await self.db.get(OrgTreasury, wallet_id)
        if not wallet:
            raise ValueError("Wallet not found")
        
        if wallet.balance != 0:
            raise ValueError("Cannot delete wallet with non-zero balance")
        
        # Check for pending transactions
        pending = await self.db.execute(
            select(TreasuryTransaction)
            .where(
                TreasuryTransaction.treasury_id == wallet_id,
                TreasuryTransaction.status == TransactionStatus.PENDING
            )
        )
        if pending.scalar_one_or_none():
            raise ValueError("Cannot delete wallet with pending transactions")
        
        await self.db.delete(wallet)
        await self.db.commit()
        return True

    async def create_transaction(
        self, 
        treasury_id: int, 
        user_id: int, 
        data: TreasuryTransactionCreate
    ) -> TreasuryTransaction:
        """Create a new transaction request."""
        wallet = await self.db.get(OrgTreasury, treasury_id)
        if not wallet:
            raise ValueError("Wallet not found")
        
        # Auto-approve deposits, require approval for withdrawals
        status = TransactionStatus.APPROVED if data.type == TransactionType.DEPOSIT else TransactionStatus.PENDING
        
        transaction = TreasuryTransaction(
            treasury_id=treasury_id,
            user_id=user_id,
            amount=data.amount,
            type=data.type,
            category=data.category,
            status=status,
            description=data.description
        )
        
        if status == TransactionStatus.APPROVED:
            transaction.processed_at = func.now()
            # Update balance immediately for deposits
            wallet.balance += data.amount
            
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def approve_transaction(self, transaction_id: int, approver_id: int) -> TreasuryTransaction:
        """Approve a pending transaction (withdrawal)."""
        transaction = await self.db.get(TreasuryTransaction, transaction_id)
        if not transaction:
            raise ValueError("Transaction not found")
        if transaction.status != TransactionStatus.PENDING:
            raise ValueError("Transaction is not pending")
            
        wallet = await self.db.get(OrgTreasury, transaction.treasury_id)
        
        if transaction.type == TransactionType.WITHDRAWAL:
            if wallet.balance < transaction.amount:
                raise ValueError("Insufficient funds")
            wallet.balance -= transaction.amount
            
        transaction.status = TransactionStatus.APPROVED
        transaction.approved_by_id = approver_id
        transaction.processed_at = func.now()
        
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def reject_transaction(self, transaction_id: int, user_id: int) -> TreasuryTransaction:
        """Reject a pending transaction."""
        transaction = await self.db.get(TreasuryTransaction, transaction_id)
        if not transaction:
            raise ValueError("Transaction not found")
        if transaction.status != TransactionStatus.PENDING:
            raise ValueError("Transaction is not pending")
            
        transaction.status = TransactionStatus.REJECTED
        transaction.approved_by_id = user_id
        transaction.processed_at = func.now()
        
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_transactions(
        self, 
        treasury_id: int, 
        limit: int = 50, 
        offset: int = 0,
        type_filter: Optional[TransactionType] = None,
        status_filter: Optional[TransactionStatus] = None
    ) -> List[TreasuryTransaction]:
        """Get transaction history for a wallet."""
        query = select(TreasuryTransaction).where(TreasuryTransaction.treasury_id == treasury_id)
        
        if type_filter:
            query = query.where(TreasuryTransaction.type == type_filter)
        if status_filter:
            query = query.where(TreasuryTransaction.status == status_filter)
            
        query = query.order_by(desc(TreasuryTransaction.created_at)).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pending_transactions(self, treasury_id: Optional[int] = None) -> List[TreasuryTransaction]:
        """Get pending transactions requiring approval."""
        query = select(TreasuryTransaction).where(TreasuryTransaction.status == TransactionStatus.PENDING)
        
        if treasury_id:
            query = query.where(TreasuryTransaction.treasury_id == treasury_id)
            
        query = query.order_by(TreasuryTransaction.created_at)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_report(
        self, 
        treasury_id: int, 
        days: int = 30
    ) -> Dict:
        """Generate financial report for a wallet."""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Get total income and expenses
        result = await self.db.execute(
            select(
                TreasuryTransaction.type,
                TreasuryTransaction.category,
                func.sum(TreasuryTransaction.amount).label("total")
            )
            .where(
                TreasuryTransaction.treasury_id == treasury_id,
                TreasuryTransaction.status == TransactionStatus.APPROVED,
                TreasuryTransaction.created_at >= since
            )
            .group_by(TreasuryTransaction.type, TreasuryTransaction.category)
        )
        
        breakdown = result.all()
        
        income = sum(row.total for row in breakdown if row.type == TransactionType.DEPOSIT)
        expenses = sum(row.total for row in breakdown if row.type == TransactionType.WITHDRAWAL)
        
        # Category breakdown
        by_category = {}
        for row in breakdown:
            cat = row.category.value if hasattr(row.category, 'value') else str(row.category)
            if cat not in by_category:
                by_category[cat] = {"income": 0, "expenses": 0}
            if row.type == TransactionType.DEPOSIT:
                by_category[cat]["income"] = row.total
            else:
                by_category[cat]["expenses"] = row.total
        
        # Get balance history (daily snapshots)
        history_result = await self.db.execute(
            select(
                func.date(TreasuryTransaction.created_at).label("date"),
                func.sum(
                    func.case(
                        (TreasuryTransaction.type == TransactionType.DEPOSIT, TreasuryTransaction.amount),
                        (TreasuryTransaction.type == TransactionType.WITHDRAWAL, -TreasuryTransaction.amount),
                        else_=0
                    )
                ).label("daily_change")
            )
            .where(
                TreasuryTransaction.treasury_id == treasury_id,
                TreasuryTransaction.status == TransactionStatus.APPROVED,
                TreasuryTransaction.created_at >= since
            )
            .group_by(func.date(TreasuryTransaction.created_at))
            .order_by(func.date(TreasuryTransaction.created_at))
        )
        
        history = history_result.all()
        
        return {
            "period_days": days,
            "total_income": income,
            "total_expenses": expenses,
            "net_change": income - expenses,
            "by_category": by_category,
            "daily_history": [{"date": str(row.date), "change": row.daily_change} for row in history],
            "transaction_count": len(breakdown)
        }
