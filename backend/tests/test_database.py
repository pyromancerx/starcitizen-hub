# tests/test_database.py
import pytest
from sqlalchemy import text
from app.database import get_db, engine


@pytest.mark.asyncio
async def test_database_connection():
    """Test that database connects and WAL mode is enabled."""
    async with engine.begin() as conn:
        result = await conn.execute(text("PRAGMA journal_mode"))
        mode = result.scalar()
        assert mode == "wal"


@pytest.mark.asyncio
async def test_foreign_keys_enabled():
    """Test that foreign keys are enforced."""
    async with engine.begin() as conn:
        result = await conn.execute(text("PRAGMA foreign_keys"))
        enabled = result.scalar()
        assert enabled == 1
