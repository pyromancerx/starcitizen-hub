# tests/test_models_role.py
import pytest
from sqlalchemy import select
from app.models.role import Role, UserRole, RoleTier
from app.models.user import User


@pytest.mark.asyncio
async def test_create_role(db_session):
    """Test creating a role with permissions."""
    role = Role(
        name="Member",
        tier=RoleTier.MEMBER,
        permissions=["assets.own", "stockpile.view", "stockpile.contribute"],
        is_default=True,
    )
    db_session.add(role)
    await db_session.commit()

    result = await db_session.execute(select(Role).where(Role.name == "Member"))
    saved_role = result.scalar_one()

    assert saved_role.tier == RoleTier.MEMBER
    assert "stockpile.contribute" in saved_role.permissions


@pytest.mark.asyncio
async def test_assign_role_to_user(db_session):
    """Test assigning a role to a user."""
    user = User(email="roletest@example.com", password_hash="hash")
    role = Role(name="TestRole", tier=RoleTier.RECRUIT, permissions=["forum.read"])
    db_session.add_all([user, role])
    await db_session.commit()

    user_role = UserRole(user_id=user.id, role_id=role.id)
    db_session.add(user_role)
    await db_session.commit()

    result = await db_session.execute(
        select(UserRole).where(UserRole.user_id == user.id)
    )
    assignment = result.scalar_one()
    assert assignment.role_id == role.id
