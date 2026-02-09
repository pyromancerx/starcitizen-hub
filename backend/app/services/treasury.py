from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.treasury import OrgWallet, OrgTransaction, TransactionStatus, TransactionType
from app.schemas.treasury import OrgTransactionCreate

class TreasuryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_primary_wallet(self) -> OrgWallet:
        """Get the primary organization wallet."""
        result = await self.db.execute(
            select(OrgWallet).where(OrgWallet.is_primary == True)
        )
        wallet = result.scalar_one_or_none()
        
        if not wallet:
            # Create default primary wallet if none exists
            wallet = OrgWallet(
                name="Main Treasury",
                is_primary=True,
                balance=0
            )
            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)
            
        return wallet

    async def create_transaction(
        self, 
        wallet_id: int, 
        user_id: int, 
        data: OrgTransactionCreate
    ) -> OrgTransaction:
        """Create a new transaction request."""
        # Auto-approve deposits, require approval for withdrawals
        status = TransactionStatus.APPROVED if data.type == TransactionType.DEPOSIT else TransactionStatus.PENDING
        
        transaction = OrgTransaction(
            wallet_id=wallet_id,
            amount=data.amount,
            type=data.type,
            category=data.category,
            description=data.description,
            reference_id=data.reference_id,
            status=status,
            created_by_id=user_id
        )
        
        if status == TransactionStatus.APPROVED:
            transaction.approved_at = func.now()
            # Update balance immediately for deposits
            wallet = await self.db.get(OrgWallet, wallet_id)
            wallet.balance += data.amount
            
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def approve_transaction(self, transaction_id: int, approver_id: int) -> OrgTransaction:
        """Approve a pending transaction (withdrawal)."""
        transaction = await self.db.get(OrgTransaction, transaction_id)
        if not transaction or transaction.status != TransactionStatus.PENDING:
            return None
            
        wallet = await self.db.get(OrgWallet, transaction.wallet_id)
        
        if transaction.type == TransactionType.WITHDRAWAL:
            if wallet.balance < transaction.amount:
                raise ValueError("Insufficient funds")
            wallet.balance -= transaction.amount
            
        transaction.status = TransactionStatus.APPROVED
        transaction.approved_by_id = approver_id
        transaction.approved_at = func.now()
        
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def reject_transaction(self, transaction_id: int, user_id: int) -> OrgTransaction:
        """Reject a pending transaction."""
        transaction = await self.db.get(OrgTransaction, transaction_id)
        if not transaction or transaction.status != TransactionStatus.PENDING:
            return None
            
        transaction.status = TransactionStatus.REJECTED
        # We could reuse approved_by_id for rejected_by or add a new column
        # For simplicity reusing it to know who acted on it
        transaction.approved_by_id = user_id 
        
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_transactions(
        self, 
        wallet_id: int, 
        limit: int = 20, 
        offset: int = 0
    ) -> List[OrgTransaction]:
        """Get transaction history."""
        query = (
            select(OrgTransaction)
            .where(OrgTransaction.wallet_id == wallet_id)
            .order_by(desc(OrgTransaction.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pending_transactions(self, wallet_id: int) -> List[OrgTransaction]:
        """Get pending transactions requiring approval."""
        query = (
            select(OrgTransaction)
            .where(
                OrgTransaction.wallet_id == wallet_id,
                OrgTransaction.status == TransactionStatus.PENDING
            )
            .order_by(OrgTransaction.created_at)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
