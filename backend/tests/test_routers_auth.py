# tests/test_routers_auth.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from tests.conftest import db_session


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_user(client):
    """Test user registration endpoint."""
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "register@example.com",
            "password": "securepassword123",
            "rsi_handle": "RegisterTest",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "register@example.com"
    assert "password" not in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Test that duplicate email is rejected."""
    user_data = {"email": "dupe@example.com", "password": "password123"}
    await client.post("/api/auth/register", json=user_data)
    response = await client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    """Test successful login."""
    # Register first
    await client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    # Login
    response = await client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Test login with wrong password."""
    await client.post(
        "/api/auth/register",
        json={"email": "invalid@example.com", "password": "password123"},
    )
    response = await client.post(
        "/api/auth/login",
        data={"username": "invalid@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
