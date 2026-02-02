# tests/test_schemas_inventory.py
import pytest
from pydantic import ValidationError
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryAdjustment,
)
from app.models.inventory import ItemType


def test_inventory_create_valid():
    """Test valid inventory item creation schema."""
    data = InventoryItemCreate(
        item_type=ItemType.GEAR,
        item_name="Pembroke Armor Set",
        quantity=1,
        location="Port Olisar",
    )
    assert data.item_type == ItemType.GEAR
    assert data.item_name == "Pembroke Armor Set"
    assert data.quantity == 1
    assert data.location == "Port Olisar"


def test_inventory_create_minimal():
    """Test inventory creation with minimal required fields."""
    data = InventoryItemCreate(
        item_type=ItemType.CONSUMABLE,
        item_name="MedPen",
    )
    assert data.item_type == ItemType.CONSUMABLE
    assert data.item_name == "MedPen"
    assert data.quantity == 1  # default
    assert data.location is None


def test_inventory_create_invalid_empty_name():
    """Test inventory creation fails with empty name."""
    with pytest.raises(ValidationError):
        InventoryItemCreate(item_type=ItemType.GEAR, item_name="")


def test_inventory_create_negative_quantity():
    """Test inventory creation fails with negative quantity."""
    with pytest.raises(ValidationError):
        InventoryItemCreate(
            item_type=ItemType.CARGO,
            item_name="Test Item",
            quantity=-5,
        )


def test_inventory_create_all_item_types():
    """Test inventory creation with all item types."""
    for item_type in ItemType:
        data = InventoryItemCreate(
            item_type=item_type,
            item_name=f"Test {item_type.value}",
        )
        assert data.item_type == item_type


def test_inventory_create_with_custom_attributes():
    """Test inventory creation with custom attributes."""
    custom = {
        "rarity": "legendary",
        "acquired_from": "Event",
        "value": 50000,
    }
    data = InventoryItemCreate(
        item_type=ItemType.GEAR,
        item_name="Rare Armor",
        custom_attributes=custom,
    )
    assert data.custom_attributes == custom


def test_inventory_update():
    """Test inventory update schema."""
    data = InventoryItemUpdate(
        item_name="Updated Name",
        quantity=10,
    )
    assert data.item_name == "Updated Name"
    assert data.quantity == 10
    assert data.item_type is None
    assert data.location is None


def test_inventory_update_negative_quantity_fails():
    """Test inventory update fails with negative quantity."""
    with pytest.raises(ValidationError):
        InventoryItemUpdate(quantity=-1)


def test_inventory_adjustment_add():
    """Test inventory adjustment for adding quantity."""
    data = InventoryAdjustment(
        quantity_change=10,
        reason="Restocking supplies",
    )
    assert data.quantity_change == 10
    assert data.reason == "Restocking supplies"


def test_inventory_adjustment_remove():
    """Test inventory adjustment for removing quantity."""
    data = InventoryAdjustment(
        quantity_change=-5,
        reason="Used in mission",
    )
    assert data.quantity_change == -5


def test_inventory_response():
    """Test inventory response schema."""
    from datetime import datetime

    response = InventoryItemResponse(
        id=1,
        user_id=100,
        item_type=ItemType.GEAR,
        item_name="Test Item",
        quantity=5,
        location="Lorville",
        created_at=datetime.utcnow(),
    )
    assert response.id == 1
    assert response.user_id == 100
    assert response.item_type == ItemType.GEAR
