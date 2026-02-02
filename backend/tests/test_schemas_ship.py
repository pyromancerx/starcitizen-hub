# tests/test_schemas_ship.py
import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError
from app.schemas.ship import ShipCreate, ShipUpdate, ShipResponse


def test_ship_create_valid():
    """Test valid ship creation schema."""
    data = ShipCreate(
        ship_type="Constellation Andromeda",
        name="Spirit of Adventure",
        serial_number="AEGS-001",
        insurance_status="LTI",
        notes="Main exploration vessel",
    )
    assert data.ship_type == "Constellation Andromeda"
    assert data.name == "Spirit of Adventure"
    assert data.insurance_status == "LTI"


def test_ship_create_minimal():
    """Test ship creation with minimal required fields."""
    data = ShipCreate(ship_type="Aurora MR")
    assert data.ship_type == "Aurora MR"
    assert data.name is None
    assert data.serial_number is None
    assert data.loadout is None


def test_ship_create_invalid_empty_type():
    """Test ship creation fails with empty ship_type."""
    with pytest.raises(ValidationError):
        ShipCreate(ship_type="")


def test_ship_create_with_loadout():
    """Test ship creation with loadout data."""
    loadout = {
        "weapons": ["S5 Laser", "S4 Ballistic"],
        "shields": "Military Grade",
        "power_plant": "Industrial S3",
    }
    data = ShipCreate(
        ship_type="Vanguard Warden",
        loadout=loadout,
    )
    assert data.loadout == loadout


def test_ship_create_with_insurance_expiry():
    """Test ship creation with insurance expiry date."""
    expiry = datetime.utcnow() + timedelta(days=90)
    data = ShipCreate(
        ship_type="Hornet",
        insurance_status="3-month",
        insurance_expires_at=expiry,
    )
    assert data.insurance_expires_at == expiry


def test_ship_update():
    """Test ship update schema."""
    data = ShipUpdate(
        name="New Ship Name",
        notes="Updated notes",
    )
    assert data.name == "New Ship Name"
    assert data.notes == "Updated notes"
    assert data.ship_type is None
    assert data.loadout is None


def test_ship_update_all_fields():
    """Test ship update with all fields."""
    data = ShipUpdate(
        ship_type="Freelancer MAX",
        name="Updated Name",
        serial_number="NEW-001",
        insurance_status="6-month",
        loadout={"weapons": ["Updated"]},
        notes="All updated",
        custom_attributes={"key": "value"},
    )
    assert data.ship_type == "Freelancer MAX"
    assert data.name == "Updated Name"
    assert data.insurance_status == "6-month"


def test_ship_response_from_attributes():
    """Test ship response schema from_attributes config."""
    response = ShipResponse(
        id=1,
        user_id=100,
        ship_type="Cutlass Black",
        name="Test Ship",
        created_at=datetime.utcnow(),
    )
    assert response.id == 1
    assert response.user_id == 100
    assert response.ship_type == "Cutlass Black"
