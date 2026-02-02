# tests/test_routers_stockpile.py
import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.models.stockpile import ResourceType


@pytest.fixture
async def approved_user(db_session):
    """Create an approved user for testing."""
    unique_email = f"approved-{uuid.uuid4()}@example.com"
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
async def test_create_stockpile(client):
    """Test creating a stockpile via API."""
    response = await client.post(
        "/api/stockpiles/",
        json={
            "name": "API Test Stockpile",
            "resource_type": "medical",
            "quantity": 100,
            "unit": "units",
            "min_threshold": 20,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Test Stockpile"
    assert data["resource_type"] == "medical"
    assert data["quantity"] == 100


@pytest.mark.asyncio
async def test_list_stockpiles(client):
    """Test listing stockpiles via API."""
    # Create a stockpile first
    await client.post(
        "/api/stockpiles/",
        json={"name": "List Test", "resource_type": "ore"},
    )

    response = await client.get("/api/stockpiles/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    names = [s["name"] for s in data]
    assert "List Test" in names


@pytest.mark.asyncio
async def test_get_stockpile(client):
    """Test getting a single stockpile via API."""
    create_response = await client.post(
        "/api/stockpiles/",
        json={"name": "Get Test", "resource_type": "fuel"},
    )
    stockpile_id = create_response.json()["id"]

    response = await client.get(f"/api/stockpiles/{stockpile_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Get Test"


@pytest.mark.asyncio
async def test_get_stockpile_not_found(client):
    """Test getting a non-existent stockpile."""
    response = await client.get("/api/stockpiles/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_stockpile(client):
    """Test updating a stockpile via API."""
    create_response = await client.post(
        "/api/stockpiles/",
        json={"name": "Update Test", "resource_type": "gas", "quantity": 100},
    )
    stockpile_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/stockpiles/{stockpile_id}",
        json={"quantity": 500, "min_threshold": 100},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 500
    assert data["min_threshold"] == 100


@pytest.mark.asyncio
async def test_delete_stockpile(client):
    """Test deleting a stockpile via API."""
    create_response = await client.post(
        "/api/stockpiles/",
        json={"name": "Delete Test", "resource_type": "salvage"},
    )
    stockpile_id = create_response.json()["id"]

    response = await client.delete(f"/api/stockpiles/{stockpile_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = await client.get(f"/api/stockpiles/{stockpile_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_filter_stockpiles_by_type(client):
    """Test filtering stockpiles by resource type."""
    await client.post(
        "/api/stockpiles/",
        json={"name": "Filter Ore", "resource_type": "ore"},
    )
    await client.post(
        "/api/stockpiles/",
        json={"name": "Filter Gas", "resource_type": "gas"},
    )

    response = await client.get("/api/stockpiles/?resource_type=ore")
    assert response.status_code == 200
    data = response.json()
    names = [s["name"] for s in data]
    assert "Filter Ore" in names
    # Gas should not appear when filtering for ore
    assert all(s["resource_type"] == "ore" for s in data)


@pytest.mark.asyncio
async def test_create_transaction(client):
    """Test creating a transaction via API."""
    create_response = await client.post(
        "/api/stockpiles/",
        json={"name": "Transaction Test", "resource_type": "fuel", "quantity": 1000},
    )
    stockpile_id = create_response.json()["id"]

    response = await client.post(
        f"/api/stockpiles/{stockpile_id}/transactions",
        json={
            "quantity_change": -100,
            "transaction_type": "withdrawal",
            "reason": "Fleet refueling",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["quantity_change"] == -100
    assert data["transaction_type"] == "withdrawal"


@pytest.mark.asyncio
async def test_list_transactions(client):
    """Test listing transactions via API."""
    create_response = await client.post(
        "/api/stockpiles/",
        json={"name": "TX List Test", "resource_type": "weapons", "quantity": 500},
    )
    stockpile_id = create_response.json()["id"]

    # Create some transactions
    await client.post(
        f"/api/stockpiles/{stockpile_id}/transactions",
        json={"quantity_change": 50, "transaction_type": "deposit"},
    )
    await client.post(
        f"/api/stockpiles/{stockpile_id}/transactions",
        json={"quantity_change": -20, "transaction_type": "withdrawal"},
    )

    response = await client.get(f"/api/stockpiles/{stockpile_id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_low_stock_endpoint(client):
    """Test the low stock endpoint."""
    # Create low stock item
    await client.post(
        "/api/stockpiles/",
        json={
            "name": "Low Stock API",
            "resource_type": "medical",
            "quantity": 5,
            "min_threshold": 50,
        },
    )

    response = await client.get("/api/stockpiles/low-stock")
    assert response.status_code == 200
    data = response.json()
    names = [s["name"] for s in data]
    assert "Low Stock API" in names
