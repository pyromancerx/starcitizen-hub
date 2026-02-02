# tests/test_services_wallet.py
import pytest
import uuid
from app.services.wallet import WalletService
from app.models.user import User
from app.schemas.wallet import WalletTransactionCreate


@pytest.fixture
async def test_user(db_session):
    """Create a test user for wallet ownership."""
    unique_email = f"wallet-{uuid.uuid4()}@example.com"
    user = User(email=unique_email, password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def other_user(db_session):
    """Create another test user for transfers."""
    unique_email = f"wallet-other-{uuid.uuid4()}@example.com"
    user = User(email=unique_email, password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_get_or_create_wallet(db_session, test_user):
    """Test getting or creating a wallet."""
    service = WalletService(db_session)

    # First call should create the wallet
    wallet1 = await service.get_or_create_wallet(test_user.id)
    assert wallet1.id is not None
    assert wallet1.user_id == test_user.id
    assert wallet1.balance_auec == 0

    # Second call should return the same wallet
    wallet2 = await service.get_or_create_wallet(test_user.id)
    assert wallet2.id == wallet1.id


@pytest.mark.asyncio
async def test_get_wallet_by_user_id(db_session, test_user):
    """Test retrieving a wallet by user ID."""
    service = WalletService(db_session)
    await service.get_or_create_wallet(test_user.id)

    found = await service.get_wallet_by_user_id(test_user.id)
    assert found is not None
    assert found.user_id == test_user.id


@pytest.mark.asyncio
async def test_get_wallet_by_user_id_not_found(db_session):
    """Test retrieving a non-existent wallet."""
    service = WalletService(db_session)
    found = await service.get_wallet_by_user_id(99999)
    assert found is None


@pytest.mark.asyncio
async def test_deposit(db_session, test_user):
    """Test depositing funds."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    tx = await service.deposit(wallet, 1000, "deposit", "Mining earnings")

    assert tx.id is not None
    assert tx.amount == 1000
    assert tx.transaction_type == "deposit"
    assert tx.description == "Mining earnings"

    # Verify balance was updated
    refreshed_wallet = await service.get_wallet_by_id(wallet.id)
    assert refreshed_wallet.balance_auec == 1000


@pytest.mark.asyncio
async def test_deposit_invalid_amount(db_session, test_user):
    """Test that depositing zero or negative amount fails."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    with pytest.raises(ValueError, match="Deposit amount must be positive"):
        await service.deposit(wallet, 0)

    with pytest.raises(ValueError, match="Deposit amount must be positive"):
        await service.deposit(wallet, -100)


@pytest.mark.asyncio
async def test_withdraw(db_session, test_user):
    """Test withdrawing funds."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 1000)

    tx = await service.withdraw(wallet, 300, "withdrawal", "Ship purchase")

    assert tx.id is not None
    assert tx.amount == -300  # Stored as negative
    assert tx.transaction_type == "withdrawal"

    # Verify balance was updated
    refreshed_wallet = await service.get_wallet_by_id(wallet.id)
    assert refreshed_wallet.balance_auec == 700


@pytest.mark.asyncio
async def test_withdraw_insufficient_funds(db_session, test_user):
    """Test withdrawing more than available balance fails."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 500)

    with pytest.raises(ValueError, match="Insufficient funds"):
        await service.withdraw(wallet, 1000)


@pytest.mark.asyncio
async def test_withdraw_invalid_amount(db_session, test_user):
    """Test that withdrawing zero or negative amount fails."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 1000)

    with pytest.raises(ValueError, match="Withdrawal amount must be positive"):
        await service.withdraw(wallet, 0)

    with pytest.raises(ValueError, match="Withdrawal amount must be positive"):
        await service.withdraw(wallet, -100)


@pytest.mark.asyncio
async def test_transfer(db_session, test_user, other_user):
    """Test transferring funds between wallets."""
    service = WalletService(db_session)

    from_wallet = await service.get_or_create_wallet(test_user.id)
    to_wallet = await service.get_or_create_wallet(other_user.id)

    await service.deposit(from_wallet, 1000)

    from_tx, to_tx = await service.transfer(
        from_wallet, to_wallet, 300, "Payment for cargo"
    )

    # Check sender's transaction
    assert from_tx.amount == -300
    assert from_tx.transaction_type == "transfer_out"

    # Check recipient's transaction
    assert to_tx.amount == 300
    assert to_tx.transaction_type == "transfer_in"

    # Verify balances
    from_wallet_refreshed = await service.get_wallet_by_id(from_wallet.id)
    to_wallet_refreshed = await service.get_wallet_by_id(to_wallet.id)
    assert from_wallet_refreshed.balance_auec == 700
    assert to_wallet_refreshed.balance_auec == 300


@pytest.mark.asyncio
async def test_transfer_insufficient_funds(db_session, test_user, other_user):
    """Test transfer with insufficient funds fails."""
    service = WalletService(db_session)

    from_wallet = await service.get_or_create_wallet(test_user.id)
    to_wallet = await service.get_or_create_wallet(other_user.id)
    await service.deposit(from_wallet, 100)

    with pytest.raises(ValueError, match="Insufficient funds"):
        await service.transfer(from_wallet, to_wallet, 500)


@pytest.mark.asyncio
async def test_transfer_to_same_wallet(db_session, test_user):
    """Test transfer to same wallet fails."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 1000)

    with pytest.raises(ValueError, match="Cannot transfer to the same wallet"):
        await service.transfer(wallet, wallet, 100)


@pytest.mark.asyncio
async def test_create_transaction_deposit(db_session, test_user):
    """Test creating a deposit transaction via create_transaction."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    data = WalletTransactionCreate(
        amount=500,
        transaction_type="mission_reward",
        description="Completed delivery mission",
    )
    tx = await service.create_transaction(wallet, data)

    assert tx.amount == 500
    assert tx.transaction_type == "mission_reward"

    refreshed = await service.get_wallet_by_id(wallet.id)
    assert refreshed.balance_auec == 500


@pytest.mark.asyncio
async def test_create_transaction_withdrawal(db_session, test_user):
    """Test creating a withdrawal transaction via create_transaction."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 1000)

    data = WalletTransactionCreate(
        amount=-200,
        transaction_type="repair_cost",
        description="Ship repairs at station",
    )
    tx = await service.create_transaction(wallet, data)

    assert tx.amount == -200
    assert tx.transaction_type == "repair_cost"

    refreshed = await service.get_wallet_by_id(wallet.id)
    assert refreshed.balance_auec == 800


@pytest.mark.asyncio
async def test_create_transaction_zero_fails(db_session, test_user):
    """Test that creating a zero amount transaction fails."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    data = WalletTransactionCreate(
        amount=0,
        transaction_type="invalid",
    )
    with pytest.raises(ValueError, match="Transaction amount cannot be zero"):
        await service.create_transaction(wallet, data)


@pytest.mark.asyncio
async def test_get_transactions(db_session, test_user):
    """Test listing transactions."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    await service.deposit(wallet, 1000, "deposit", "First deposit")
    await service.deposit(wallet, 500, "deposit", "Second deposit")
    await service.withdraw(wallet, 200, "withdrawal", "Purchase")

    transactions = await service.get_transactions(wallet.id)
    assert len(transactions) >= 3

    # Check that we have all transaction types we created
    tx_types = [t.transaction_type for t in transactions]
    assert "deposit" in tx_types
    assert "withdrawal" in tx_types


@pytest.mark.asyncio
async def test_get_transactions_pagination(db_session, test_user):
    """Test transaction pagination."""
    service = WalletService(db_session)
    wallet = await service.get_or_create_wallet(test_user.id)

    for i in range(5):
        await service.deposit(wallet, 100, "deposit", f"Deposit {i}")

    transactions = await service.get_transactions(wallet.id, skip=2, limit=2)
    assert len(transactions) == 2


@pytest.mark.asyncio
async def test_get_balance(db_session, test_user):
    """Test getting balance."""
    service = WalletService(db_session)

    # No wallet yet
    balance = await service.get_balance(test_user.id)
    assert balance == 0

    # Create wallet and add funds
    wallet = await service.get_or_create_wallet(test_user.id)
    await service.deposit(wallet, 1500)

    balance = await service.get_balance(test_user.id)
    assert balance == 1500
