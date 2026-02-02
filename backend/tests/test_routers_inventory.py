# tests/test_routers_inventory.py
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
    unique_email = f"inv-user-{uuid.uuid4()}@example.com"
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
async def test_create_item(client):
    """Test creating an inventory item via API."""
    response = await client.post(
        "/api/inventory/",
        json={
            "item_type": "gear",
            "item_name": "Pembroke Armor",
            "quantity": 1,
            "location": "Port Olisar",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["item_type"] == "gear"
    assert data["item_name"] == "Pembroke Armor"
    assert data["quantity"] == 1
    assert "id" in data
    assert "user_id" in data


@pytest.mark.asyncio
async def test_list_my_inventory(client):
    """Test listing user's inventory via API."""
    await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Helmet"},
    )
    await client.post(
        "/api/inventory/",
        json={"item_type": "consumable", "item_name": "MedPen"},
    )

    response = await client.get("/api/inventory/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    names = [i["item_name"] for i in data]
    assert "Helmet" in names
    assert "MedPen" in names


@pytest.mark.asyncio
async def test_filter_inventory_by_type(client):
    """Test filtering inventory by type."""
    await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Filter Gear"},
    )
    await client.post(
        "/api/inventory/",
        json={"item_type": "cargo", "item_name": "Filter Cargo"},
    )

    response = await client.get("/api/inventory/?item_type=gear")
    assert response.status_code == 200
    data = response.json()
    assert all(i["item_type"] == "gear" for i in data)


@pytest.mark.asyncio
async def test_filter_inventory_by_location(client):
    """Test filtering inventory by location."""
    await client.post(
        "/api/inventory/",
        json={
            "item_type": "cargo",
            "item_name": "Location Test 1",
            "location": "Lorville",
        },
    )
    await client.post(
        "/api/inventory/",
        json={
            "item_type": "cargo",
            "item_name": "Location Test 2",
            "location": "Area18",
        },
    )

    response = await client.get("/api/inventory/?location=Lorville")
    assert response.status_code == 200
    data = response.json()
    assert all(i["location"] == "Lorville" for i in data)


@pytest.mark.asyncio
async def test_get_item(client):
    """Test getting a single inventory item via API."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "component", "item_name": "Power Plant"},
    )
    item_id = create_response.json()["id"]

    response = await client.get(f"/api/inventory/{item_id}")
    assert response.status_code == 200
    assert response.json()["item_name"] == "Power Plant"


@pytest.mark.asyncio
async def test_get_item_not_found(client):
    """Test getting a non-existent item."""
    response = await client.get("/api/inventory/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_item(client):
    """Test updating an inventory item via API."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Old Name", "quantity": 1},
    )
    item_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/inventory/{item_id}",
        json={"item_name": "New Name", "quantity": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["item_name"] == "New Name"
    assert data["quantity"] == 5


@pytest.mark.asyncio
async def test_delete_item(client):
    """Test deleting an inventory item via API."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "consumable", "item_name": "Delete Me"},
    )
    item_id = create_response.json()["id"]

    response = await client.delete(f"/api/inventory/{item_id}")
    assert response.status_code == 204

    get_response = await client.get(f"/api/inventory/{item_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_adjust_quantity_add(client):
    """Test adding to item quantity via API."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "consumable", "item_name": "MedPen", "quantity": 5},
    )
    item_id = create_response.json()["id"]

    response = await client.post(
        f"/api/inventory/{item_id}/adjust",
        json={"quantity_change": 3},
    )
    assert response.status_code == 200
    assert response.json()["quantity"] == 8


@pytest.mark.asyncio
async def test_adjust_quantity_remove(client):
    """Test removing from item quantity via API."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "consumable", "item_name": "OxyPen", "quantity": 10},
    )
    item_id = create_response.json()["id"]

    response = await client.post(
        f"/api/inventory/{item_id}/adjust",
        json={"quantity_change": -4},
    )
    assert response.status_code == 200
    assert response.json()["quantity"] == 6


@pytest.mark.asyncio
async def test_adjust_quantity_negative_fails(client):
    """Test that adjusting to negative quantity fails."""
    create_response = await client.post(
        "/api/inventory/",
        json={"item_type": "consumable", "item_name": "Grenade", "quantity": 3},
    )
    item_id = create_response.json()["id"]

    response = await client.post(
        f"/api/inventory/{item_id}/adjust",
        json={"quantity_change": -5},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_search_items(client):
    """Test searching items by name."""
    await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Pembroke Helmet"},
    )
    await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Pembroke Suit"},
    )
    await client.post(
        "/api/inventory/",
        json={"item_type": "gear", "item_name": "Tundra Armor"},
    )

    response = await client.get("/api/inventory/search?q=Pembroke")
    assert response.status_code == 200
    data = response.json()
    names = [i["item_name"] for i in data]
    assert "Pembroke Helmet" in names
    assert "Pembroke Suit" in names
    assert "Tundra Armor" not in names


@pytest.mark.asyncio
async def test_get_locations(client):
    """Test getting unique locations."""
    await client.post(
        "/api/inventory/",
        json={
            "item_type": "gear",
            "item_name": "Item 1",
            "location": "Lorville",
        },
    )
    await client.post(
        "/api/inventory/",
        json={
            "item_type": "gear",
            "item_name": "Item 2",
            "location": "Area18",
        },
    )

    response = await client.get("/api/inventory/locations")
    assert response.status_code == 200
    data = response.json()
    assert "Lorville" in data
    assert "Area18" in data


@pytest.mark.asyncio
async def test_pagination(client):
    """Test pagination parameters."""
    for i in range(5):
        await client.post(
            "/api/inventory/",
            json={"item_type": "gear", "item_name": f"Paged Item {i}"},
        )

    response = await client.get("/api/inventory/?skip=2&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2
