# tests/test_models_wallet.py
import pytest
from sqlalchemy import select
from app.models.wallet import Wallet, WalletTransaction
from app.models.user import User


@pytest.mark.asyncio
async def test_create_wallet(db_session):
    """Test creating a wallet for a user."""
    user = User(email="walletowner@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    wallet = Wallet(user_id=user.id, balance_auec=50000)
    db_session.add(wallet)
    await db_session.commit()

    result = await db_session.execute(select(Wallet).where(Wallet.user_id == user.id))
    saved_wallet = result.scalar_one()

    assert saved_wallet.balance_auec == 50000


@pytest.mark.asyncio
async def test_wallet_transaction(db_session):
    """Test recording a wallet transaction."""
    user = User(email="transactor@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    wallet = Wallet(user_id=user.id, balance_auec=100000)
    db_session.add(wallet)
    await db_session.commit()

    transaction = WalletTransaction(
        wallet_id=wallet.id,
        amount=-25000,
        transaction_type="purchase",
        description="Bought mining equipment",
    )
    db_session.add(transaction)
    await db_session.commit()

    result = await db_session.execute(
        select(WalletTransaction).where(WalletTransaction.wallet_id == wallet.id)
    )
    saved_tx = result.scalar_one()

    assert saved_tx.amount == -25000
    assert saved_tx.transaction_type == "purchase"
