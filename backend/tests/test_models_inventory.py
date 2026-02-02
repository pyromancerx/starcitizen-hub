# tests/test_models_inventory.py
import pytest
from sqlalchemy import select
from app.models.inventory import PersonalInventory, ItemType
from app.models.user import User


@pytest.mark.asyncio
async def test_create_inventory_item(db_session):
    """Test creating an inventory item."""
    user = User(email="inventoryowner@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    item = PersonalInventory(
        user_id=user.id,
        item_type=ItemType.GEAR,
        item_name="Pembroke Armor Set",
        quantity=1,
        location="Port Olisar",
    )
    db_session.add(item)
    await db_session.commit()

    result = await db_session.execute(
        select(PersonalInventory).where(PersonalInventory.user_id == user.id)
    )
    saved_item = result.scalar_one()

    assert saved_item.item_name == "Pembroke Armor Set"
    assert saved_item.item_type == ItemType.GEAR
