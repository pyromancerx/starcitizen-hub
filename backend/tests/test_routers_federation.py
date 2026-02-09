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
async def test_federation_api(client, db_session):
    # Setup approved user
    from app.models.user import User
    from app.services.auth import get_password_hash
    user = User(email="fed@test.com", password_hash=get_password_hash("pass"), is_approved=True)
    db_session.add(user)
    await db_session.commit()
    
    # Get token
    response = await client.post(
        "/api/auth/login",
        data={"username": "fed@test.com", "password": "pass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Peer
    response = await client.post(
        "/api/federation/peers",
        json={
            "name": "External Org",
            "base_url": "https://external.org",
            "api_key": "secret"
        },
        headers=headers
    )
    assert response.status_code == 201
    peer_id = response.json()["id"]

    # List Peers
    response = await client.get("/api/federation/peers", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Create Federated Event (Simulate Sync)
    from datetime import datetime
    response = await client.post(
        f"/api/federation/peers/{peer_id}/events",
        json={
            "remote_event_id": 99,
            "title": "Synced Event",
            "start_time": datetime.now().isoformat(),
            "event_type": "meeting",
            "source_url": "https://external.org/e/99"
        },
        headers=headers
    )
    assert response.status_code == 201

    # Create Trade Request
    response = await client.post(
        f"/api/federation/peers/{peer_id}/trade-requests",
        json={
            "resource_type": "quantainium",
            "amount": 500,
            "unit": "scu"
        },
        headers=headers
    )
    assert response.status_code == 201
    
    # List Trade Requests
    response = await client.get("/api/federation/trade-requests", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
