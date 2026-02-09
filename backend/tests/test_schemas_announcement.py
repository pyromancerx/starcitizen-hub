import pytest
from pydantic import ValidationError
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse

def test_announcement_create_valid():
    data = AnnouncementCreate(title="Test", content="Content", is_pinned=True)
    assert data.title == "Test"

def test_announcement_response():
    from datetime import datetime
    announcement = AnnouncementResponse(
        id=1,
        title="Test",
        content="Content",
        author_id=1,
        is_pinned=False,
        is_public=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    assert announcement.id == 1
