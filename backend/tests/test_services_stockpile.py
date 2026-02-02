# tests/test_services_stockpile.py
import pytest
from app.services.stockpile import StockpileService
from app.models.stockpile import OrgStockpile, ResourceType
from app.models.user import User
from app.schemas.stockpile import (
    StockpileCreate,
    StockpileUpdate,
    StockpileTransactionCreate,
)


@pytest.mark.asyncio
async def test_create_stockpile(db_session):
    """Test creating a stockpile through the service."""
    service = StockpileService(db_session)
    data = StockpileCreate(
        name="Medical Supplies",
        description="Emergency medical kit",
        resource_type=ResourceType.MEDICAL,
        quantity=100,
        unit="units",
        min_threshold=20,
    )
    stockpile = await service.create_stockpile(data)

    assert stockpile.id is not None
    assert stockpile.name == "Medical Supplies"
    assert stockpile.resource_type == ResourceType.MEDICAL
    assert stockpile.quantity == 100


@pytest.mark.asyncio
async def test_get_stockpile_by_id(db_session):
    """Test retrieving a stockpile by ID."""
    service = StockpileService(db_session)
    data = StockpileCreate(name="Fuel Reserve", resource_type=ResourceType.FUEL)
    created = await service.create_stockpile(data)

    found = await service.get_stockpile_by_id(created.id)
    assert found is not None
    assert found.name == "Fuel Reserve"


@pytest.mark.asyncio
async def test_get_all_stockpiles(db_session):
    """Test listing all stockpiles."""
    service = StockpileService(db_session)
    await service.create_stockpile(
        StockpileCreate(name="Ore A", resource_type=ResourceType.ORE)
    )
    await service.create_stockpile(
        StockpileCreate(name="Gas B", resource_type=ResourceType.GAS)
    )

    stockpiles = await service.get_all_stockpiles()
    names = [s.name for s in stockpiles]
    assert "Ore A" in names
    assert "Gas B" in names


@pytest.mark.asyncio
async def test_get_stockpiles_by_type(db_session):
    """Test filtering stockpiles by resource type."""
    service = StockpileService(db_session)
    await service.create_stockpile(
        StockpileCreate(name="Ore Filter Test", resource_type=ResourceType.ORE)
    )
    await service.create_stockpile(
        StockpileCreate(name="Gas Filter Test", resource_type=ResourceType.GAS)
    )

    ore_stockpiles = await service.get_all_stockpiles(resource_type=ResourceType.ORE)
    ore_names = [s.name for s in ore_stockpiles]
    assert "Ore Filter Test" in ore_names
    assert "Gas Filter Test" not in ore_names


@pytest.mark.asyncio
async def test_update_stockpile(db_session):
    """Test updating a stockpile."""
    service = StockpileService(db_session)
    data = StockpileCreate(name="Update Test", resource_type=ResourceType.COMPONENTS)
    stockpile = await service.create_stockpile(data)

    update_data = StockpileUpdate(quantity=500, min_threshold=50)
    updated = await service.update_stockpile(stockpile, update_data)

    assert updated.quantity == 500
    assert updated.min_threshold == 50


@pytest.mark.asyncio
async def test_delete_stockpile(db_session):
    """Test deleting a stockpile."""
    service = StockpileService(db_session)
    data = StockpileCreate(name="Delete Test", resource_type=ResourceType.OTHER)
    stockpile = await service.create_stockpile(data)
    stockpile_id = stockpile.id

    await service.delete_stockpile(stockpile)

    found = await service.get_stockpile_by_id(stockpile_id)
    assert found is None


@pytest.mark.asyncio
async def test_create_transaction(db_session):
    """Test creating a stockpile transaction."""
    # Create user for transaction
    user = User(email="stockpileuser@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    service = StockpileService(db_session)
    stockpile = await service.create_stockpile(
        StockpileCreate(
            name="Transaction Test",
            resource_type=ResourceType.FUEL,
            quantity=1000,
        )
    )

    tx_data = StockpileTransactionCreate(
        quantity_change=-100,
        transaction_type="withdrawal",
        reason="Fleet refueling",
    )
    tx = await service.create_transaction(stockpile, tx_data, user.id)

    assert tx.id is not None
    assert tx.quantity_change == -100
    assert tx.transaction_type == "withdrawal"
    assert tx.user_id == user.id

    # Verify stockpile quantity was updated
    updated = await service.get_stockpile_by_id(stockpile.id)
    assert updated.quantity == 900


@pytest.mark.asyncio
async def test_get_transactions(db_session):
    """Test listing transactions for a stockpile."""
    service = StockpileService(db_session)
    stockpile = await service.create_stockpile(
        StockpileCreate(
            name="TX List Test",
            resource_type=ResourceType.WEAPONS,
            quantity=500,
        )
    )

    await service.create_transaction(
        stockpile,
        StockpileTransactionCreate(quantity_change=50, transaction_type="deposit"),
    )
    await service.create_transaction(
        stockpile,
        StockpileTransactionCreate(quantity_change=-20, transaction_type="withdrawal"),
    )

    transactions = await service.get_transactions(stockpile.id)
    assert len(transactions) >= 2


@pytest.mark.asyncio
async def test_get_low_stock_stockpiles(db_session):
    """Test finding stockpiles below minimum threshold."""
    service = StockpileService(db_session)

    # Create low stock item
    await service.create_stockpile(
        StockpileCreate(
            name="Low Stock Test",
            resource_type=ResourceType.MEDICAL,
            quantity=10,
            min_threshold=50,
        )
    )

    # Create well-stocked item
    await service.create_stockpile(
        StockpileCreate(
            name="Well Stocked Test",
            resource_type=ResourceType.MEDICAL,
            quantity=100,
            min_threshold=50,
        )
    )

    low_stock = await service.get_low_stock_stockpiles()
    names = [s.name for s in low_stock]
    assert "Low Stock Test" in names
    assert "Well Stocked Test" not in names
