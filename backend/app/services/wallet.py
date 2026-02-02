# app/services/wallet.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wallet import Wallet, WalletTransaction
from app.schemas.wallet import WalletTransactionCreate


class WalletService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_wallet(self, user_id: int) -> Wallet:
        """Get a user's wallet, creating one if it doesn't exist."""
        wallet = await self.get_wallet_by_user_id(user_id)
        if not wallet:
            wallet = Wallet(user_id=user_id, balance_auec=0)
            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)
        return wallet

    async def get_wallet_by_user_id(self, user_id: int) -> Optional[Wallet]:
        result = await self.db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_wallet_by_id(self, wallet_id: int) -> Optional[Wallet]:
        result = await self.db.execute(
            select(Wallet).where(Wallet.id == wallet_id)
        )
        return result.scalar_one_or_none()

    async def deposit(
        self,
        wallet: Wallet,
        amount: int,
        transaction_type: str = "deposit",
        description: Optional[str] = None,
    ) -> WalletTransaction:
        """Add funds to a wallet."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")

        wallet.balance_auec += amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        await self.db.refresh(wallet)
        return transaction

    async def withdraw(
        self,
        wallet: Wallet,
        amount: int,
        transaction_type: str = "withdrawal",
        description: Optional[str] = None,
    ) -> WalletTransaction:
        """Remove funds from a wallet."""
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if wallet.balance_auec < amount:
            raise ValueError("Insufficient funds")

        wallet.balance_auec -= amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            amount=-amount,  # Store as negative for withdrawals
            transaction_type=transaction_type,
            description=description,
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        await self.db.refresh(wallet)
        return transaction

    async def transfer(
        self,
        from_wallet: Wallet,
        to_wallet: Wallet,
        amount: int,
        description: Optional[str] = None,
    ) -> tuple[WalletTransaction, WalletTransaction]:
        """Transfer funds between wallets."""
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")
        if from_wallet.balance_auec < amount:
            raise ValueError("Insufficient funds")
        if from_wallet.id == to_wallet.id:
            raise ValueError("Cannot transfer to the same wallet")

        # Debit from sender
        from_wallet.balance_auec -= amount
        from_tx = WalletTransaction(
            wallet_id=from_wallet.id,
            amount=-amount,
            transaction_type="transfer_out",
            description=f"Transfer to wallet {to_wallet.id}: {description or ''}".strip(),
        )
        self.db.add(from_tx)

        # Credit to recipient
        to_wallet.balance_auec += amount
        to_tx = WalletTransaction(
            wallet_id=to_wallet.id,
            amount=amount,
            transaction_type="transfer_in",
            description=f"Transfer from wallet {from_wallet.id}: {description or ''}".strip(),
        )
        self.db.add(to_tx)

        await self.db.commit()
        await self.db.refresh(from_tx)
        await self.db.refresh(to_tx)
        await self.db.refresh(from_wallet)
        await self.db.refresh(to_wallet)

        return from_tx, to_tx

    async def create_transaction(
        self,
        wallet: Wallet,
        data: WalletTransactionCreate,
    ) -> WalletTransaction:
        """Create a transaction with automatic balance update."""
        if data.amount > 0:
            return await self.deposit(
                wallet, data.amount, data.transaction_type, data.description
            )
        elif data.amount < 0:
            return await self.withdraw(
                wallet, abs(data.amount), data.transaction_type, data.description
            )
        else:
            raise ValueError("Transaction amount cannot be zero")

    async def get_transactions(
        self,
        wallet_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[WalletTransaction]:
        """Get transactions for a wallet, ordered by most recent first."""
        result = await self.db.execute(
            select(WalletTransaction)
            .where(WalletTransaction.wallet_id == wallet_id)
            .order_by(WalletTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_transaction_by_id(
        self, transaction_id: int
    ) -> Optional[WalletTransaction]:
        result = await self.db.execute(
            select(WalletTransaction).where(WalletTransaction.id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def get_balance(self, user_id: int) -> int:
        """Get a user's wallet balance."""
        wallet = await self.get_wallet_by_user_id(user_id)
        return wallet.balance_auec if wallet else 0
