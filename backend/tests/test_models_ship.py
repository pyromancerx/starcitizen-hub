# tests/test_models_ship.py
import pytest
from sqlalchemy import select
from app.models.ship import Ship
from app.models.user import User


@pytest.mark.asyncio
async def test_create_ship(db_session):
    """Test creating a ship for a user."""
    user = User(email="shipowner@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    ship = Ship(
        user_id=user.id,
        ship_type="Constellation Andromeda",
        name="Stellar Wind",
        serial_number="CONNIE-001",
        insurance_status="active",
    )
    db_session.add(ship)
    await db_session.commit()

    result = await db_session.execute(select(Ship).where(Ship.user_id == user.id))
    saved_ship = result.scalar_one()

    assert saved_ship.ship_type == "Constellation Andromeda"
    assert saved_ship.name == "Stellar Wind"
