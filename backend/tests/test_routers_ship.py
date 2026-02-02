# tests/test_routers_ship.py
import pytest
import uuid
from datetime import datetime, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User


@pytest.fixture
async def approved_user(db_session):
    """Create an approved user for testing."""
    unique_email = f"ship-user-{uuid.uuid4()}@example.com"
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
    """Create another user for authorization tests."""
    unique_email = f"other-user-{uuid.uuid4()}@example.com"
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
async def test_create_ship(client):
    """Test creating a ship via API."""
    response = await client.post(
        "/api/ships/",
        json={
            "ship_type": "Constellation Andromeda",
            "name": "Spirit of Adventure",
            "serial_number": "AEGS-TEST-001",
            "insurance_status": "LTI",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ship_type"] == "Constellation Andromeda"
    assert data["name"] == "Spirit of Adventure"
    assert data["insurance_status"] == "LTI"
    assert "id" in data
    assert "user_id" in data


@pytest.mark.asyncio
async def test_list_my_ships(client):
    """Test listing user's ships via API."""
    # Create some ships
    await client.post(
        "/api/ships/",
        json={"ship_type": "Aurora MR", "name": "Ship One"},
    )
    await client.post(
        "/api/ships/",
        json={"ship_type": "Mustang Alpha", "name": "Ship Two"},
    )

    response = await client.get("/api/ships/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    names = [s["name"] for s in data]
    assert "Ship One" in names
    assert "Ship Two" in names


@pytest.mark.asyncio
async def test_filter_ships_by_type(client):
    """Test filtering ships by type."""
    await client.post(
        "/api/ships/",
        json={"ship_type": "Cutlass Black"},
    )
    await client.post(
        "/api/ships/",
        json={"ship_type": "Freelancer"},
    )

    response = await client.get("/api/ships/?ship_type=Cutlass%20Black")
    assert response.status_code == 200
    data = response.json()
    assert all(s["ship_type"] == "Cutlass Black" for s in data)


@pytest.mark.asyncio
async def test_get_ship(client):
    """Test getting a single ship via API."""
    create_response = await client.post(
        "/api/ships/",
        json={"ship_type": "Gladius", "name": "Test Fighter"},
    )
    ship_id = create_response.json()["id"]

    response = await client.get(f"/api/ships/{ship_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Fighter"


@pytest.mark.asyncio
async def test_get_ship_not_found(client):
    """Test getting a non-existent ship."""
    response = await client.get("/api/ships/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_ship(client):
    """Test updating a ship via API."""
    create_response = await client.post(
        "/api/ships/",
        json={"ship_type": "Hornet", "name": "Old Name"},
    )
    ship_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/ships/{ship_id}",
        json={"name": "New Name", "notes": "Updated notes"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["notes"] == "Updated notes"


@pytest.mark.asyncio
async def test_delete_ship(client):
    """Test deleting a ship via API."""
    create_response = await client.post(
        "/api/ships/",
        json={"ship_type": "Buccaneer"},
    )
    ship_id = create_response.json()["id"]

    response = await client.delete(f"/api/ships/{ship_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = await client.get(f"/api/ships/{ship_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_get_expiring_insurance(client):
    """Test the expiring insurance endpoint."""
    # Ship with insurance expiring soon
    expiring_date = (datetime.utcnow() + timedelta(days=10)).isoformat()
    await client.post(
        "/api/ships/",
        json={
            "ship_type": "Sabre",
            "name": "Expiring Ship",
            "insurance_expires_at": expiring_date,
        },
    )

    response = await client.get("/api/ships/expiring-insurance?days=30")
    assert response.status_code == 200
    data = response.json()
    names = [s["name"] for s in data]
    assert "Expiring Ship" in names


@pytest.mark.asyncio
async def test_create_ship_with_loadout(client):
    """Test creating a ship with loadout data."""
    loadout = {
        "weapons": ["S5 Laser", "S4 Ballistic"],
        "shields": "Military Grade",
    }
    response = await client.post(
        "/api/ships/",
        json={
            "ship_type": "Vanguard Warden",
            "name": "Armed Ship",
            "loadout": loadout,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["loadout"] is not None
    assert data["loadout"]["weapons"] == ["S5 Laser", "S4 Ballistic"]


@pytest.mark.asyncio
async def test_pagination(client):
    """Test pagination parameters."""
    # Create several ships
    for i in range(5):
        await client.post(
            "/api/ships/",
            json={"ship_type": f"Ship Type {i}"},
        )

    response = await client.get("/api/ships/?skip=2&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2
