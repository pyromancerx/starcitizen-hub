# tests/test_models_stockpile.py
import pytest
from sqlalchemy import select
from app.models.stockpile import OrgStockpile, StockpileTransaction, ResourceType
from app.models.user import User


@pytest.mark.asyncio
async def test_create_stockpile(db_session):
    """Test creating an org stockpile."""
    stockpile = OrgStockpile(
        name="Medical Supplies",
        description="Emergency medical supplies for org operations",
        resource_type=ResourceType.MEDICAL,
        quantity=500,
        unit="units",
        min_threshold=100,
    )
    db_session.add(stockpile)
    await db_session.commit()

    result = await db_session.execute(
        select(OrgStockpile).where(OrgStockpile.name == "Medical Supplies")
    )
    saved = result.scalar_one()

    assert saved.name == "Medical Supplies"
    assert saved.resource_type == ResourceType.MEDICAL
    assert saved.quantity == 500
    assert saved.unit == "units"
    assert saved.min_threshold == 100


@pytest.mark.asyncio
async def test_stockpile_custom_attributes(db_session):
    """Test stockpile with custom attributes."""
    stockpile = OrgStockpile(
        name="Refined Quantanium",
        resource_type=ResourceType.ORE,
        quantity=1000,
        unit="SCU",
        custom_attributes={"purity": 0.95, "source_location": "Lyria"},
    )
    db_session.add(stockpile)
    await db_session.commit()

    result = await db_session.execute(
        select(OrgStockpile).where(OrgStockpile.name == "Refined Quantanium")
    )
    saved = result.scalar_one()

    assert saved.custom_attributes["purity"] == 0.95
    assert saved.custom_attributes["source_location"] == "Lyria"


@pytest.mark.asyncio
async def test_stockpile_transaction(db_session):
    """Test recording a stockpile transaction."""
    # Create user for transaction tracking
    user = User(email="stockpileadmin@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    # Create stockpile
    stockpile = OrgStockpile(
        name="Fuel Reserve",
        resource_type=ResourceType.FUEL,
        quantity=10000,
        unit="units",
    )
    db_session.add(stockpile)
    await db_session.commit()

    # Create transaction
    transaction = StockpileTransaction(
        stockpile_id=stockpile.id,
        user_id=user.id,
        quantity_change=-500,
        transaction_type="withdrawal",
        reason="Fleet operation refueling",
    )
    db_session.add(transaction)
    await db_session.commit()

    result = await db_session.execute(
        select(StockpileTransaction).where(StockpileTransaction.stockpile_id == stockpile.id)
    )
    saved_tx = result.scalar_one()

    assert saved_tx.quantity_change == -500
    assert saved_tx.transaction_type == "withdrawal"
    assert saved_tx.reason == "Fleet operation refueling"
    assert saved_tx.user_id == user.id


@pytest.mark.asyncio
async def test_all_resource_types(db_session):
    """Test all resource type enum values."""
    for i, resource_type in enumerate(ResourceType):
        stockpile = OrgStockpile(
            name=f"Test Resource {resource_type.value}",
            resource_type=resource_type,
            quantity=100,
            unit="units",
        )
        db_session.add(stockpile)

    await db_session.commit()

    result = await db_session.execute(select(OrgStockpile))
    stockpiles = result.scalars().all()

    # Filter out stockpiles from previous tests
    test_stockpiles = [s for s in stockpiles if s.name.startswith("Test Resource")]
    assert len(test_stockpiles) == len(ResourceType)
