# tests/test_models_user.py
import pytest
from sqlalchemy import select
from app.models.user import User


@pytest.mark.asyncio
async def test_create_user(db_session):
    """Test creating a user in the database."""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        rsi_handle="TestPilot",
        display_name="Test Pilot",
    )
    db_session.add(user)
    await db_session.commit()

    result = await db_session.execute(select(User).where(User.email == "test@example.com"))
    saved_user = result.scalar_one()

    assert saved_user.email == "test@example.com"
    assert saved_user.rsi_handle == "TestPilot"
    assert saved_user.is_active is True
    assert saved_user.is_approved is False


@pytest.mark.asyncio
async def test_user_custom_attributes(db_session):
    """Test that custom_attributes JSON field works."""
    user = User(
        email="custom@example.com",
        password_hash="hashed",
        custom_attributes={"timezone": "UTC", "preferred_role": "pilot"},
    )
    db_session.add(user)
    await db_session.commit()

    result = await db_session.execute(select(User).where(User.email == "custom@example.com"))
    saved_user = result.scalar_one()

    assert saved_user.custom_attributes["timezone"] == "UTC"
