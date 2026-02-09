# tests/test_routers_admin.py
import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from app.models.user import User
from app.models.role import Role, UserRole, RoleTier
from app.services.auth import AuthService, get_password_hash


@pytest.fixture
async def admin_role(db_session):
    """Create an admin role."""
    role = Role(
        name=f"Admin-{uuid.uuid4().hex[:8]}",
        tier=RoleTier.ADMIN,
        permissions=["admin.manage_users", "admin.manage_roles", "admin.manage_settings"],
        is_default=False,
    )
    db_session.add(role)
    await db_session.commit()
    await db_session.refresh(role)
    return role


@pytest.fixture
async def admin_user(db_session, admin_role):
    """Create an admin user with admin role."""
    unique_email = f"admin-{uuid.uuid4()}@example.com"
    user = User(
        email=unique_email,
        password_hash=get_password_hash("adminpass"),
        display_name="Admin User",
        is_active=True,
        is_approved=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Assign admin role
    user_role = UserRole(
        user_id=user.id,
        role_id=admin_role.id,
    )
    db_session.add(user_role)
    await db_session.commit()

    return user


@pytest.fixture
async def regular_user(db_session):
    """Create a regular user without admin permissions."""
    unique_email = f"regular-{uuid.uuid4()}@example.com"
    user = User(
        email=unique_email,
        password_hash=get_password_hash("userpass"),
        display_name="Regular User",
        is_active=True,
        is_approved=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def pending_user(db_session):
    """Create a pending user."""
    unique_email = f"pending-{uuid.uuid4()}@example.com"
    user = User(
        email=unique_email,
        password_hash=get_password_hash("pendingpass"),
        display_name="Pending User",
        is_active=True,
        is_approved=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_client(db_session, admin_user):
    """Create a test client with admin authentication."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    auth_service = AuthService()
    token = auth_service.create_access_token(
        data={"sub": admin_user.email, "user_id": admin_user.id}
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        cookies={"access_token": token}
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def regular_client(db_session, regular_user):
    """Create a test client without admin permissions."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    auth_service = AuthService()
    token = auth_service.create_access_token(
        data={"sub": regular_user.email, "user_id": regular_user.id}
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
# USER MANAGEMENT TESTS
# ============================================================

@pytest.mark.asyncio
async def test_users_list_requires_admin(regular_client):
    """Test users list requires admin permission."""
    response = await regular_client.get("/admin/users")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_users_list_loads(admin_client):
    """Test users list loads for admin."""
    response = await admin_client.get("/admin/users")
    assert response.status_code == 200
    assert "User Management" in response.text


@pytest.mark.asyncio
async def test_approve_user(admin_client, pending_user, db_session):
    """Test approving a pending user."""
    response = await admin_client.post(f"/admin/users/{pending_user.id}/approve")
    assert response.status_code == 200

    # Verify user was approved
    await db_session.refresh(pending_user)
    assert pending_user.is_approved is True


@pytest.mark.asyncio
async def test_ban_user(admin_client, regular_user, db_session):
    """Test banning a user."""
    response = await admin_client.post(
        f"/admin/users/{regular_user.id}/ban",
        headers={"HX-Request": "true"}
    )
    assert response.status_code == 200

    await db_session.refresh(regular_user)
    assert regular_user.is_active is False


@pytest.mark.asyncio
async def test_cannot_ban_self(admin_client, admin_user):
    """Test admin cannot ban themselves."""
    response = await admin_client.post(f"/admin/users/{admin_user.id}/ban")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_unban_user(admin_client, db_session):
    """Test unbanning a user."""
    # Create a banned user
    unique_email = f"banned-{uuid.uuid4()}@example.com"
    banned_user = User(
        email=unique_email,
        password_hash="hash",
        is_active=False,
        is_approved=True,
    )
    db_session.add(banned_user)
    await db_session.commit()
    await db_session.refresh(banned_user)

    response = await admin_client.post(f"/admin/users/{banned_user.id}/unban")
    assert response.status_code == 200

    await db_session.refresh(banned_user)
    assert banned_user.is_active is True


# ============================================================
# ROLE MANAGEMENT TESTS
# ============================================================

@pytest.mark.asyncio
async def test_roles_list_loads(admin_client):
    """Test roles list loads for admin."""
    response = await admin_client.get("/admin/roles")
    assert response.status_code == 200
    assert "Role Management" in response.text


@pytest.mark.asyncio
async def test_create_role(admin_client, db_session):
    """Test creating a new role."""
    role_name = f"TestRole-{uuid.uuid4().hex[:8]}"
    response = await admin_client.post(
        "/admin/roles",
        data={
            "name": role_name,
            "tier": "member",
            "permissions": ["members.view_directory"],
            "sort_order": "10",
        },
    )
    assert response.status_code == 200

    # Verify role was created
    from sqlalchemy import select
    result = await db_session.execute(select(Role).where(Role.name == role_name))
    role = result.scalar_one_or_none()
    assert role is not None
    assert role.tier == RoleTier.MEMBER


@pytest.mark.asyncio
async def test_update_role(admin_client, admin_role, db_session):
    """Test updating a role."""
    response = await admin_client.put(
        f"/admin/roles/{admin_role.id}",
        data={
            "name": admin_role.name,
            "tier": "officer",
            "permissions": ["admin.manage_users"],
            "sort_order": "5",
        },
    )
    assert response.status_code == 200

    await db_session.refresh(admin_role)
    assert admin_role.tier == RoleTier.OFFICER


@pytest.mark.asyncio
async def test_delete_role(admin_client, db_session):
    """Test deleting a role."""
    # Create a role to delete
    role = Role(
        name=f"DeleteMe-{uuid.uuid4().hex[:8]}",
        tier=RoleTier.CUSTOM,
        permissions=[],
        is_default=False,
    )
    db_session.add(role)
    await db_session.commit()
    role_id = role.id

    response = await admin_client.delete(f"/admin/roles/{role_id}")
    assert response.status_code == 200

    # Verify role was deleted
    from sqlalchemy import select
    result = await db_session.execute(select(Role).where(Role.id == role_id))
    assert result.scalar_one_or_none() is None


# ============================================================
# SETTINGS TESTS
# ============================================================

@pytest.mark.asyncio
async def test_settings_page_loads(admin_client):
    """Test settings page loads for admin."""
    response = await admin_client.get("/admin/settings")
    assert response.status_code == 200
    assert "Instance Settings" in response.text


@pytest.mark.asyncio
async def test_update_settings(admin_client):
    """Test updating settings."""
    response = await admin_client.put(
        "/admin/settings",
        data={
            "instance_name": "Test Hub",
            "allow_registration": "on",
        },
    )
    assert response.status_code == 200
    assert "success" in response.text.lower() or "updated" in response.text.lower()
