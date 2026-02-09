import pytest
from sqlalchemy import select
from app.models.announcement import Announcement
from app.models.user import User

@pytest.mark.asyncio
async def test_create_announcement(db_session):
    """Test creating an announcement."""
    user = User(email="announcer@example.com", password_hash="hash", display_name="Town Crier")
    db_session.add(user)
    await db_session.commit()

    announcement = Announcement(
        title="Welcome to the Hub",
        content="This is the first announcement.",
        author_id=user.id,
        is_pinned=True
    )
    db_session.add(announcement)
    await db_session.commit()

    result = await db_session.execute(select(Announcement).where(Announcement.title == "Welcome to the Hub"))
    saved_announcement = result.scalar_one()

    assert saved_announcement.content == "This is the first announcement."
    assert saved_announcement.is_pinned is True
    assert saved_announcement.author_id == user.id
