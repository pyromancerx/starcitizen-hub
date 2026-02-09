# tests/test_routers_web.py
import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.models.user import User
from app.services.auth import AuthService


@pytest.fixture
async def client(db_session):
    """Create a test client without authentication."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session):
    """Create a test user."""
    unique_email = f"web-user-{uuid.uuid4()}@example.com"
    from app.services.auth import get_password_hash
    user = User(
        email=unique_email,
        password_hash=get_password_hash("password123"),
        display_name="Test User",
        is_active=True,
        is_approved=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_client(db_session, test_user):
    """Create a test client with authentication cookie."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Create access token
    auth_service = AuthService()
    token = auth_service.create_access_token(
        data={"sub": test_user.email, "user_id": test_user.id}
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        cookies={"access_token": token}
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ============================================================
# PUBLIC PAGE TESTS
# ============================================================

@pytest.mark.asyncio
async def test_landing_page(client):
    """Test landing page loads for unauthenticated users."""
    response = await client.get("/")
    assert response.status_code == 200
    assert "Star Citizen Hub" in response.text


@pytest.mark.asyncio
async def test_landing_redirects_when_authenticated(auth_client):
    """Test landing page redirects to dashboard when authenticated."""
    response = await auth_client.get("/", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/dashboard"


@pytest.mark.asyncio
async def test_login_page(client):
    """Test login page loads."""
    response = await client.get("/login")
    assert response.status_code == 200
    assert "Sign in" in response.text


@pytest.mark.asyncio
async def test_register_page(client):
    """Test register page loads."""
    response = await client.get("/register")
    assert response.status_code == 200
    assert "Join" in response.text or "Create Account" in response.text


# ============================================================
# AUTH TESTS
# ============================================================

@pytest.mark.asyncio
async def test_login_success(client, test_user):
    """Test successful login."""
    response = await client.post(
        "/login",
        data={"username": test_user.email, "password": "password123"},
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert response.headers["location"] == "/dashboard"
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = await client.post(
        "/login",
        data={"username": "nonexistent@example.com", "password": "wrongpass"},
    )
    assert response.status_code == 200
    assert "Invalid" in response.text or "error" in response.text.lower()


@pytest.mark.asyncio
async def test_register_success(client, db_session):
    """Test successful registration."""
    unique_email = f"newuser-{uuid.uuid4()}@example.com"
    response = await client.post(
        "/register",
        data={
            "email": unique_email,
            "password": "securepass123",
            "password_confirm": "securepass123",
            "display_name": "New User",
        },
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert response.headers["location"] == "/dashboard"
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_register_password_mismatch(client):
    """Test registration with mismatched passwords."""
    response = await client.post(
        "/register",
        data={
            "email": "test@example.com",
            "password": "password123",
            "password_confirm": "different123",
        },
    )
    assert response.status_code == 200
    assert "match" in response.text.lower()


@pytest.mark.asyncio
async def test_logout(auth_client):
    """Test logout clears cookie."""
    response = await auth_client.post("/logout", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/"


# ============================================================
# DASHBOARD TESTS
# ============================================================

@pytest.mark.asyncio
async def test_dashboard_requires_auth(client):
    """Test dashboard redirects to login when not authenticated."""
    response = await client.get("/dashboard", follow_redirects=False)
    # Should redirect to login
    assert response.status_code in [303, 307]


@pytest.mark.asyncio
async def test_dashboard_loads(auth_client):
    """Test dashboard loads for authenticated users."""
    response = await auth_client.get("/dashboard")
    assert response.status_code == 200
    assert "Welcome" in response.text or "Dashboard" in response.text


@pytest.mark.asyncio
async def test_profile_page(auth_client):
    """Test profile page loads."""
    response = await auth_client.get("/profile")
    assert response.status_code == 200
    assert "Profile" in response.text


@pytest.mark.asyncio
async def test_update_profile(auth_client, test_user, db_session):
    """Test updating profile."""
    response = await auth_client.put(
        "/profile",
        data={
            "display_name": "Updated Name",
            "rsi_handle": "UpdatedHandle",
        },
    )
    assert response.status_code == 200
    assert "success" in response.text.lower() or "updated" in response.text.lower()
