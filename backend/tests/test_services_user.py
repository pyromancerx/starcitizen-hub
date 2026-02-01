# tests/test_services_user.py
import pytest
from sqlalchemy import select
from app.services.user import UserService
from app.models.user import User
from app.schemas.user import UserCreate


@pytest.mark.asyncio
async def test_create_user(db_session):
    """Test creating a user through the service."""
    service = UserService(db_session)
    user_data = UserCreate(
        email="newuser@example.com",
        password="securepassword123",
        rsi_handle="NewPilot",
    )
    user = await service.create_user(user_data)

    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.password_hash != "securepassword123"  # Should be hashed


@pytest.mark.asyncio
async def test_get_user_by_email(db_session):
    """Test finding a user by email."""
    service = UserService(db_session)
    user_data = UserCreate(email="find@example.com", password="password123")
    await service.create_user(user_data)

    found = await service.get_user_by_email("find@example.com")
    assert found is not None
    assert found.email == "find@example.com"


@pytest.mark.asyncio
async def test_authenticate_user_valid(db_session):
    """Test authenticating with valid credentials."""
    service = UserService(db_session)
    user_data = UserCreate(email="auth@example.com", password="correctpassword")
    await service.create_user(user_data)

    user = await service.authenticate_user("auth@example.com", "correctpassword")
    assert user is not None


@pytest.mark.asyncio
async def test_authenticate_user_invalid(db_session):
    """Test authenticating with invalid password."""
    service = UserService(db_session)
    user_data = UserCreate(email="auth2@example.com", password="correctpassword")
    await service.create_user(user_data)

    user = await service.authenticate_user("auth2@example.com", "wrongpassword")
    assert user is None
