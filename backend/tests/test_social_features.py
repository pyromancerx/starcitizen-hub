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

@pytest.fixture
async def auth_token(client):
    # Register and login
    await client.post(
        "/api/auth/register",
        json={"email": "social@test.com", "password": "password123", "rsi_handle": "SocialTest"}
    )
    # Approve user (hack: direct DB manipulation would be better but this is an integration test)
    # Actually, we need to bypass approval or approve the user in the DB.
    # For now, let's just use the login endpoint and assume the test DB fixture setup might need adjustment 
    # OR we use a fixture that creates an approved user.
    
    # Login
    response = await client.post(
        "/api/auth/login",
        data={"username": "social@test.com", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest.mark.asyncio
async def test_announcements_api(client, db_session):
    # Setup approved user
    from app.models.user import User
    from app.services.auth import get_password_hash
    user = User(email="announce@test.com", password_hash=get_password_hash("pass"), is_approved=True)
    db_session.add(user)
    await db_session.commit()
    
    # Get token
    response = await client.post(
        "/api/auth/login",
        data={"username": "announce@test.com", "password": "pass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    response = await client.post(
        "/api/announcements/",
        json={"title": "Test News", "content": "Breaking news!", "is_public": True},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test News"
    announcement_id = data["id"]

    # List
    response = await client.get("/api/announcements/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

@pytest.mark.asyncio
async def test_forum_api(client, db_session):
    # Setup approved user
    from app.models.user import User
    from app.services.auth import get_password_hash
    user = User(email="forum@test.com", password_hash=get_password_hash("pass"), is_approved=True)
    db_session.add(user)
    await db_session.commit()
    
    # Get token
    response = await client.post(
        "/api/auth/login",
        data={"username": "forum@test.com", "password": "pass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Category
    response = await client.post(
        "/api/forum/categories",
        json={"name": "General", "description": "General chat"},
        headers=headers
    )
    assert response.status_code == 200
    cat_id = response.json()["id"]

    # Create Thread
    response = await client.post(
        f"/api/forum/categories/{cat_id}/threads",
        json={"title": "Hello", "content": "First post!"},
        headers=headers
    )
    assert response.status_code == 200
    thread_id = response.json()["id"]

    # Create Post
    response = await client.post(
        f"/api/forum/threads/{thread_id}/posts",
        json={"content": "Second post!"},
        headers=headers
    )
    assert response.status_code == 200

    # Get Thread Detail
    response = await client.get(f"/api/forum/threads/{thread_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["posts"]) == 2  # Initial post + second post

@pytest.mark.asyncio
async def test_event_api(client, db_session):
    # Setup approved user
    from app.models.user import User
    from app.services.auth import get_password_hash
    user = User(email="event@test.com", password_hash=get_password_hash("pass"), is_approved=True)
    db_session.add(user)
    await db_session.commit()
    
    # Get token
    response = await client.post(
        "/api/auth/login",
        data={"username": "event@test.com", "password": "pass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Event
    from datetime import datetime, timedelta
    start = (datetime.now() + timedelta(days=1)).isoformat()
    response = await client.post(
        "/api/events/",
        json={"title": "Mission", "start_time": start, "event_type": "operation"},
        headers=headers
    )
    assert response.status_code == 201
    event_id = response.json()["id"]

    # Signup
    response = await client.post(
        f"/api/events/{event_id}/signup",
        json={"role": "Pilot"},
        headers=headers
    )
    assert response.status_code == 200
    
    # Get Detail
    response = await client.get(f"/api/events/{event_id}", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["signups"]) == 1
