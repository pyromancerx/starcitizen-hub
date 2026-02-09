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
async def test_project_api(client, db_session):
    # Setup approved user
    from app.models.user import User
    from app.services.auth import get_password_hash
    user = User(email="project@test.com", password_hash=get_password_hash("pass"), is_approved=True)
    db_session.add(user)
    await db_session.commit()
    
    # Get token
    response = await client.post(
        "/api/auth/login",
        data={"username": "project@test.com", "password": "pass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Project
    response = await client.post(
        "/api/projects/",
        json={"title": "New Base", "status": "planning"},
        headers=headers
    )
    assert response.status_code == 201
    project_id = response.json()["id"]

    # Create Phase
    response = await client.post(
        f"/api/projects/{project_id}/phases",
        json={"name": "Phase 1"},
        headers=headers
    )
    assert response.status_code == 201
    phase_id = response.json()["id"]

    # Create Task
    response = await client.post(
        f"/api/projects/phases/{phase_id}/tasks",
        json={"title": "Scout Location", "status": "todo"},
        headers=headers
    )
    assert response.status_code == 201
    task_id = response.json()["id"]

    # Create Goal
    response = await client.post(
        f"/api/projects/{project_id}/goals",
        json={"resource_type": "iron", "target_amount": 1000},
        headers=headers
    )
    assert response.status_code == 201
    goal_id = response.json()["id"]

    # Contribute
    response = await client.post(
        f"/api/projects/goals/{goal_id}/contribute",
        json={"amount": 100, "notes": "Found some"},
        headers=headers
    )
    if response.status_code != 201:
        print(response.json())
    assert response.status_code == 201

    # Verify Project Detail
    response = await client.get(f"/api/projects/{project_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["phases"]) == 1
    assert len(data["contribution_goals"]) == 1
    assert data["contribution_goals"][0]["current_amount"] == 100.0
