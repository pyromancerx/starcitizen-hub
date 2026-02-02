# tests/test_services_ship.py
import pytest
import uuid
from datetime import datetime, timedelta
from app.services.ship import ShipService
from app.models.user import User
from app.schemas.ship import ShipCreate, ShipUpdate


@pytest.fixture
async def test_user(db_session):
    """Create a test user for ship ownership."""
    unique_email = f"shipowner-{uuid.uuid4()}@example.com"
    user = User(email=unique_email, password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_create_ship(db_session, test_user):
    """Test creating a ship through the service."""
    service = ShipService(db_session)
    data = ShipCreate(
        ship_type="Constellation Andromeda",
        name="Spirit of Fire",
        serial_number="AEGS-001",
        insurance_status="LTI",
        notes="Main exploration vessel",
    )
    ship = await service.create_ship(test_user.id, data)

    assert ship.id is not None
    assert ship.user_id == test_user.id
    assert ship.ship_type == "Constellation Andromeda"
    assert ship.name == "Spirit of Fire"
    assert ship.serial_number == "AEGS-001"


@pytest.mark.asyncio
async def test_get_ship_by_id(db_session, test_user):
    """Test retrieving a ship by ID."""
    service = ShipService(db_session)
    data = ShipCreate(ship_type="Aurora MR", name="Starter")
    created = await service.create_ship(test_user.id, data)

    found = await service.get_ship_by_id(created.id)
    assert found is not None
    assert found.ship_type == "Aurora MR"
    assert found.name == "Starter"


@pytest.mark.asyncio
async def test_get_ship_by_id_not_found(db_session):
    """Test retrieving a non-existent ship."""
    service = ShipService(db_session)
    found = await service.get_ship_by_id(99999)
    assert found is None


@pytest.mark.asyncio
async def test_get_user_ships(db_session, test_user):
    """Test listing all ships for a user."""
    service = ShipService(db_session)
    await service.create_ship(
        test_user.id, ShipCreate(ship_type="Cutlass Black")
    )
    await service.create_ship(
        test_user.id, ShipCreate(ship_type="Caterpillar")
    )

    ships = await service.get_user_ships(test_user.id)
    ship_types = [s.ship_type for s in ships]
    assert "Cutlass Black" in ship_types
    assert "Caterpillar" in ship_types


@pytest.mark.asyncio
async def test_get_user_ships_filter_by_type(db_session, test_user):
    """Test filtering user ships by ship type."""
    service = ShipService(db_session)
    await service.create_ship(
        test_user.id, ShipCreate(ship_type="Freelancer MAX")
    )
    await service.create_ship(
        test_user.id, ShipCreate(ship_type="Prospector")
    )

    ships = await service.get_user_ships(test_user.id, ship_type="Freelancer MAX")
    assert len(ships) >= 1
    assert all(s.ship_type == "Freelancer MAX" for s in ships)


@pytest.mark.asyncio
async def test_update_ship(db_session, test_user):
    """Test updating a ship."""
    service = ShipService(db_session)
    data = ShipCreate(
        ship_type="Gladius",
        name="Unnamed",
        insurance_status="3-month",
    )
    ship = await service.create_ship(test_user.id, data)

    update_data = ShipUpdate(
        name="Shadow Hunter",
        insurance_status="LTI",
        notes="Light fighter for escort missions",
    )
    updated = await service.update_ship(ship, update_data)

    assert updated.name == "Shadow Hunter"
    assert updated.insurance_status == "LTI"
    assert updated.notes == "Light fighter for escort missions"


@pytest.mark.asyncio
async def test_delete_ship(db_session, test_user):
    """Test deleting a ship."""
    service = ShipService(db_session)
    data = ShipCreate(ship_type="Buccaneer")
    ship = await service.create_ship(test_user.id, data)
    ship_id = ship.id

    await service.delete_ship(ship)

    found = await service.get_ship_by_id(ship_id)
    assert found is None


@pytest.mark.asyncio
async def test_get_expiring_insurance(db_session, test_user):
    """Test finding ships with expiring insurance."""
    service = ShipService(db_session)

    # Ship with insurance expiring soon
    expiring_date = datetime.utcnow() + timedelta(days=15)
    await service.create_ship(
        test_user.id,
        ShipCreate(
            ship_type="Hornet",
            name="Expiring Soon",
            insurance_expires_at=expiring_date,
        ),
    )

    # Ship with insurance expiring later
    future_date = datetime.utcnow() + timedelta(days=60)
    await service.create_ship(
        test_user.id,
        ShipCreate(
            ship_type="Sabre",
            name="Expires Later",
            insurance_expires_at=future_date,
        ),
    )

    # Ship with no insurance expiration
    await service.create_ship(
        test_user.id,
        ShipCreate(ship_type="Avenger Titan", name="LTI Ship"),
    )

    expiring = await service.get_expiring_insurance(test_user.id, days_ahead=30)
    names = [s.name for s in expiring]
    assert "Expiring Soon" in names
    assert "Expires Later" not in names
    assert "LTI Ship" not in names


@pytest.mark.asyncio
async def test_ship_with_loadout(db_session, test_user):
    """Test creating a ship with loadout data."""
    service = ShipService(db_session)
    loadout = {
        "weapons": ["S5 Laser Cannon", "S4 Ballistic Gatling"],
        "shields": ["XL Shield Generator"],
        "power_plant": "Military-Grade S3",
    }
    data = ShipCreate(
        ship_type="Vanguard Warden",
        name="Heavy Hitter",
        loadout=loadout,
    )
    ship = await service.create_ship(test_user.id, data)

    assert ship.loadout is not None
    assert ship.loadout["weapons"] == ["S5 Laser Cannon", "S4 Ballistic Gatling"]
    assert ship.loadout["power_plant"] == "Military-Grade S3"


@pytest.mark.asyncio
async def test_ship_custom_attributes(db_session, test_user):
    """Test creating a ship with custom attributes."""
    service = ShipService(db_session)
    custom = {
        "skin": "Pirate Edition",
        "org_role": "Flagship",
        "crew_capacity": 5,
    }
    data = ShipCreate(
        ship_type="Hammerhead",
        name="Iron Wall",
        custom_attributes=custom,
    )
    ship = await service.create_ship(test_user.id, data)

    assert ship.custom_attributes is not None
    assert ship.custom_attributes["skin"] == "Pirate Edition"
    assert ship.custom_attributes["crew_capacity"] == 5
