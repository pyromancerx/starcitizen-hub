# tests/test_schemas_stockpile.py
import pytest
from pydantic import ValidationError
from app.schemas.stockpile import (
    StockpileCreate,
    StockpileUpdate,
    StockpileResponse,
    StockpileTransactionCreate,
    StockpileTransactionResponse,
)
from app.models.stockpile import ResourceType


def test_stockpile_create_valid():
    """Test valid stockpile creation schema."""
    data = StockpileCreate(
        name="Medical Supplies",
        description="Emergency medical supplies",
        resource_type=ResourceType.MEDICAL,
        quantity=500,
        unit="units",
        min_threshold=100,
    )
    assert data.name == "Medical Supplies"
    assert data.resource_type == ResourceType.MEDICAL


def test_stockpile_create_minimal():
    """Test stockpile creation with minimal required fields."""
    data = StockpileCreate(
        name="Basic Resource",
        resource_type=ResourceType.OTHER,
    )
    assert data.name == "Basic Resource"
    assert data.quantity == 0  # default
    assert data.unit == "units"  # default


def test_stockpile_create_invalid_empty_name():
    """Test stockpile creation fails with empty name."""
    with pytest.raises(ValidationError):
        StockpileCreate(name="", resource_type=ResourceType.ORE)


def test_stockpile_update():
    """Test stockpile update schema."""
    data = StockpileUpdate(
        quantity=1500,
        min_threshold=200,
    )
    assert data.quantity == 1500
    assert data.min_threshold == 200
    assert data.name is None


def test_stockpile_transaction_create():
    """Test stockpile transaction creation schema."""
    data = StockpileTransactionCreate(
        quantity_change=-100,
        transaction_type="withdrawal",
        reason="Fleet refueling operation",
    )
    assert data.quantity_change == -100
    assert data.transaction_type == "withdrawal"


def test_stockpile_transaction_types():
    """Test various transaction types."""
    for tx_type in ["deposit", "withdrawal", "adjustment", "transfer"]:
        data = StockpileTransactionCreate(
            quantity_change=100 if tx_type == "deposit" else -50,
            transaction_type=tx_type,
        )
        assert data.transaction_type == tx_type
