# tests/test_services_inventory.py
import pytest
import uuid
from app.services.inventory import InventoryService
from app.models.user import User
from app.models.inventory import ItemType
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate


@pytest.fixture
async def test_user(db_session):
    """Create a test user for inventory ownership."""
    unique_email = f"inventory-{uuid.uuid4()}@example.com"
    user = User(email=unique_email, password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_create_item(db_session, test_user):
    """Test creating an inventory item through the service."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.GEAR,
        item_name="Pembroke Armor Set",
        quantity=1,
        location="Port Olisar",
    )
    item = await service.create_item(test_user.id, data)

    assert item.id is not None
    assert item.user_id == test_user.id
    assert item.item_type == ItemType.GEAR
    assert item.item_name == "Pembroke Armor Set"
    assert item.quantity == 1
    assert item.location == "Port Olisar"


@pytest.mark.asyncio
async def test_get_item_by_id(db_session, test_user):
    """Test retrieving an item by ID."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.COMPONENT,
        item_name="S3 Power Plant",
    )
    created = await service.create_item(test_user.id, data)

    found = await service.get_item_by_id(created.id)
    assert found is not None
    assert found.item_name == "S3 Power Plant"


@pytest.mark.asyncio
async def test_get_item_by_id_not_found(db_session):
    """Test retrieving a non-existent item."""
    service = InventoryService(db_session)
    found = await service.get_item_by_id(99999)
    assert found is None


@pytest.mark.asyncio
async def test_get_user_inventory(db_session, test_user):
    """Test listing all items for a user."""
    service = InventoryService(db_session)
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="Helmet"),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.CARGO, item_name="Medical Supplies"),
    )

    items = await service.get_user_inventory(test_user.id)
    item_names = [i.item_name for i in items]
    assert "Helmet" in item_names
    assert "Medical Supplies" in item_names


@pytest.mark.asyncio
async def test_get_user_inventory_filter_by_type(db_session, test_user):
    """Test filtering inventory by item type."""
    service = InventoryService(db_session)
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="Armor"),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.CONSUMABLE, item_name="MedPen"),
    )

    gear_items = await service.get_user_inventory(test_user.id, item_type=ItemType.GEAR)
    assert len(gear_items) >= 1
    assert all(i.item_type == ItemType.GEAR for i in gear_items)


@pytest.mark.asyncio
async def test_get_user_inventory_filter_by_location(db_session, test_user):
    """Test filtering inventory by location."""
    service = InventoryService(db_session)
    await service.create_item(
        test_user.id,
        InventoryItemCreate(
            item_type=ItemType.CARGO,
            item_name="Quantanium",
            location="Lorville",
        ),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(
            item_type=ItemType.CARGO,
            item_name="Agricium",
            location="Area18",
        ),
    )

    lorville_items = await service.get_user_inventory(
        test_user.id, location="Lorville"
    )
    assert len(lorville_items) >= 1
    assert all(i.location == "Lorville" for i in lorville_items)


@pytest.mark.asyncio
async def test_update_item(db_session, test_user):
    """Test updating an inventory item."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.COMPONENT,
        item_name="Shield Generator",
        quantity=1,
    )
    item = await service.create_item(test_user.id, data)

    update_data = InventoryItemUpdate(
        quantity=3,
        location="Ship Storage",
    )
    updated = await service.update_item(item, update_data)

    assert updated.quantity == 3
    assert updated.location == "Ship Storage"


@pytest.mark.asyncio
async def test_delete_item(db_session, test_user):
    """Test deleting an inventory item."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.CONSUMABLE,
        item_name="OxyPen",
    )
    item = await service.create_item(test_user.id, data)
    item_id = item.id

    await service.delete_item(item)

    found = await service.get_item_by_id(item_id)
    assert found is None


@pytest.mark.asyncio
async def test_adjust_quantity_add(db_session, test_user):
    """Test adding to item quantity."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.CONSUMABLE,
        item_name="MedPen",
        quantity=5,
    )
    item = await service.create_item(test_user.id, data)

    adjusted = await service.adjust_quantity(item, 3)
    assert adjusted.quantity == 8


@pytest.mark.asyncio
async def test_adjust_quantity_remove(db_session, test_user):
    """Test removing from item quantity."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.CONSUMABLE,
        item_name="OxyPen",
        quantity=10,
    )
    item = await service.create_item(test_user.id, data)

    adjusted = await service.adjust_quantity(item, -4)
    assert adjusted.quantity == 6


@pytest.mark.asyncio
async def test_adjust_quantity_negative_result_fails(db_session, test_user):
    """Test that adjusting to negative quantity fails."""
    service = InventoryService(db_session)
    data = InventoryItemCreate(
        item_type=ItemType.CONSUMABLE,
        item_name="Grenade",
        quantity=3,
    )
    item = await service.create_item(test_user.id, data)

    with pytest.raises(ValueError, match="Quantity cannot be negative"):
        await service.adjust_quantity(item, -5)


@pytest.mark.asyncio
async def test_search_items(db_session, test_user):
    """Test searching items by name."""
    service = InventoryService(db_session)
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="Pembroke Helmet"),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="Pembroke Suit"),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="Tundra Armor"),
    )

    results = await service.search_items(test_user.id, "Pembroke")
    names = [i.item_name for i in results]
    assert "Pembroke Helmet" in names
    assert "Pembroke Suit" in names
    assert "Tundra Armor" not in names


@pytest.mark.asyncio
async def test_get_locations(db_session, test_user):
    """Test getting unique locations."""
    service = InventoryService(db_session)
    await service.create_item(
        test_user.id,
        InventoryItemCreate(
            item_type=ItemType.GEAR,
            item_name="Item 1",
            location="Lorville",
        ),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(
            item_type=ItemType.GEAR,
            item_name="Item 2",
            location="Area18",
        ),
    )
    await service.create_item(
        test_user.id,
        InventoryItemCreate(
            item_type=ItemType.GEAR,
            item_name="Item 3",
            location="Lorville",
        ),
    )

    locations = await service.get_locations(test_user.id)
    assert "Lorville" in locations
    assert "Area18" in locations
    # Lorville should only appear once (distinct)
    assert locations.count("Lorville") == 1


@pytest.mark.asyncio
async def test_item_custom_attributes(db_session, test_user):
    """Test creating an item with custom attributes."""
    service = InventoryService(db_session)
    custom = {
        "rarity": "legendary",
        "acquired_from": "Event Reward",
        "value_auec": 50000,
    }
    data = InventoryItemCreate(
        item_type=ItemType.GEAR,
        item_name="Special Armor",
        custom_attributes=custom,
    )
    item = await service.create_item(test_user.id, data)

    assert item.custom_attributes is not None
    assert item.custom_attributes["rarity"] == "legendary"
    assert item.custom_attributes["value_auec"] == 50000
