# tests/test_routers_wallet.py
import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User


@pytest.fixture
async def approved_user(db_session):
    """Create an approved user for testing."""
    unique_email = f"wallet-api-{uuid.uuid4()}@example.com"
    user = User(
        email=unique_email,
        password_hash="hash",
        is_active=True,
        is_approved=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def other_user(db_session):
    """Create another user for transfer tests."""
    unique_email = f"wallet-other-api-{uuid.uuid4()}@example.com"
    user = User(
        email=unique_email,
        password_hash="hash",
        is_active=True,
        is_approved=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def client(db_session, approved_user):
    async def override_get_db():
        yield db_session

    async def override_get_current_approved_user():
        return approved_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_approved_user] = override_get_current_approved_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_my_wallet(client):
    """Test getting the current user's wallet."""
    response = await client.get("/api/wallet/")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "user_id" in data
    assert data["balance_auec"] == 0


@pytest.mark.asyncio
async def test_get_balance(client):
    """Test getting wallet balance."""
    response = await client.get("/api/wallet/balance")
    assert response.status_code == 200
    data = response.json()
    assert "balance_auec" in data
    assert data["balance_auec"] == 0


@pytest.mark.asyncio
async def test_deposit(client):
    """Test depositing funds."""
    response = await client.post(
        "/api/wallet/deposit?amount=1000&description=Mining%20earnings"
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 1000
    assert data["transaction_type"] == "deposit"

    # Verify balance
    balance_response = await client.get("/api/wallet/balance")
    assert balance_response.json()["balance_auec"] == 1000


@pytest.mark.asyncio
async def test_deposit_invalid_amount(client):
    """Test deposit with invalid amount."""
    response = await client.post("/api/wallet/deposit?amount=0")
    assert response.status_code == 422  # Validation error for amount <= 0

    response = await client.post("/api/wallet/deposit?amount=-100")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_withdraw(client):
    """Test withdrawing funds."""
    # First deposit some funds
    await client.post("/api/wallet/deposit?amount=1000")

    response = await client.post(
        "/api/wallet/withdraw?amount=300&description=Ship%20purchase"
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == -300
    assert data["transaction_type"] == "withdrawal"

    # Verify balance
    balance_response = await client.get("/api/wallet/balance")
    assert balance_response.json()["balance_auec"] == 700


@pytest.mark.asyncio
async def test_withdraw_insufficient_funds(client):
    """Test withdrawal with insufficient funds."""
    response = await client.post("/api/wallet/withdraw?amount=1000")
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


@pytest.mark.asyncio
async def test_transfer(client, other_user):
    """Test transferring funds to another user."""
    # First deposit some funds
    await client.post("/api/wallet/deposit?amount=1000")

    response = await client.post(
        "/api/wallet/transfer",
        json={
            "recipient_user_id": other_user.id,
            "amount": 300,
            "description": "Payment for cargo",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == -300
    assert data["transaction_type"] == "transfer_out"

    # Verify sender's balance
    balance_response = await client.get("/api/wallet/balance")
    assert balance_response.json()["balance_auec"] == 700


@pytest.mark.asyncio
async def test_transfer_insufficient_funds(client, other_user):
    """Test transfer with insufficient funds."""
    response = await client.post(
        "/api/wallet/transfer",
        json={
            "recipient_user_id": other_user.id,
            "amount": 1000,
        },
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_transaction_deposit(client):
    """Test creating a deposit transaction."""
    response = await client.post(
        "/api/wallet/transactions",
        json={
            "amount": 500,
            "transaction_type": "mission_reward",
            "description": "Completed mission",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 500
    assert data["transaction_type"] == "mission_reward"


@pytest.mark.asyncio
async def test_create_transaction_withdrawal(client):
    """Test creating a withdrawal transaction."""
    # First deposit
    await client.post(
        "/api/wallet/transactions",
        json={"amount": 1000, "transaction_type": "deposit"},
    )

    response = await client.post(
        "/api/wallet/transactions",
        json={
            "amount": -200,
            "transaction_type": "repair_cost",
            "description": "Ship repairs",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == -200
    assert data["transaction_type"] == "repair_cost"


@pytest.mark.asyncio
async def test_create_transaction_zero_fails(client):
    """Test that zero amount transaction fails."""
    response = await client.post(
        "/api/wallet/transactions",
        json={"amount": 0, "transaction_type": "invalid"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_transactions(client):
    """Test listing transactions."""
    # Create some transactions
    await client.post(
        "/api/wallet/transactions",
        json={"amount": 1000, "transaction_type": "deposit"},
    )
    await client.post(
        "/api/wallet/transactions",
        json={"amount": 500, "transaction_type": "deposit"},
    )
    await client.post(
        "/api/wallet/transactions",
        json={"amount": -200, "transaction_type": "withdrawal"},
    )

    response = await client.get("/api/wallet/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_list_transactions_pagination(client):
    """Test transaction pagination."""
    # Create several transactions
    for i in range(5):
        await client.post(
            "/api/wallet/transactions",
            json={"amount": 100, "transaction_type": "deposit"},
        )

    response = await client.get("/api/wallet/transactions?skip=2&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_transaction(client):
    """Test getting a specific transaction."""
    create_response = await client.post(
        "/api/wallet/transactions",
        json={"amount": 500, "transaction_type": "deposit"},
    )
    tx_id = create_response.json()["id"]

    response = await client.get(f"/api/wallet/transactions/{tx_id}")
    assert response.status_code == 200
    assert response.json()["amount"] == 500


@pytest.mark.asyncio
async def test_get_transaction_not_found(client):
    """Test getting a non-existent transaction."""
    response = await client.get("/api/wallet/transactions/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_wallet_with_transactions(client):
    """Test getting wallet with recent transactions."""
    # Create some transactions
    await client.post(
        "/api/wallet/transactions",
        json={"amount": 1000, "transaction_type": "deposit"},
    )
    await client.post(
        "/api/wallet/transactions",
        json={"amount": -200, "transaction_type": "withdrawal"},
    )

    response = await client.get("/api/wallet/details?transaction_limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["balance_auec"] == 800
    assert "recent_transactions" in data
    assert len(data["recent_transactions"]) >= 2
