# tests/test_services_auth.py
import pytest
from app.services.auth import AuthService, verify_password, get_password_hash


def test_password_hashing():
    """Test that passwords are hashed correctly."""
    password = "mysecretpassword"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    """Test JWT token creation."""
    auth = AuthService()
    token = auth.create_access_token(data={"sub": "user@example.com", "user_id": 1})

    assert token is not None
    assert len(token) > 0


def test_decode_access_token():
    """Test JWT token decoding."""
    auth = AuthService()
    token = auth.create_access_token(data={"sub": "user@example.com", "user_id": 1})
    payload = auth.decode_access_token(token)

    assert payload["sub"] == "user@example.com"
    assert payload["user_id"] == 1


def test_decode_invalid_token():
    """Test that invalid tokens raise an error."""
    auth = AuthService()

    with pytest.raises(Exception):
        auth.decode_access_token("invalid.token.here")
