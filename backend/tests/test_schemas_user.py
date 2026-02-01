# tests/test_schemas_user.py
import pytest
from pydantic import ValidationError
from app.schemas.user import UserCreate, UserResponse, UserUpdate


def test_user_create_valid():
    """Test valid user creation schema."""
    user = UserCreate(
        email="test@example.com",
        password="securepassword123",
        rsi_handle="TestPilot",
    )
    assert user.email == "test@example.com"
    assert user.password == "securepassword123"


def test_user_create_invalid_email():
    """Test that invalid email is rejected."""
    with pytest.raises(ValidationError):
        UserCreate(email="not-an-email", password="password123")


def test_user_create_short_password():
    """Test that short password is rejected."""
    with pytest.raises(ValidationError):
        UserCreate(email="test@example.com", password="short")


def test_user_response_excludes_password():
    """Test that password is not in response schema."""
    user = UserResponse(
        id=1,
        email="test@example.com",
        rsi_handle="TestPilot",
        display_name="Test",
        is_active=True,
        is_approved=False,
    )
    assert not hasattr(user, "password_hash")
