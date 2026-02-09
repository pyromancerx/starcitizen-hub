import pytest
from sqlalchemy import select
from app.models.forum import ForumCategory, ForumThread, ForumPost
from app.models.user import User

@pytest.mark.asyncio
async def test_forum_structure(db_session):
    """Test creating category, thread, and post."""
    user = User(email="forumuser@example.com", password_hash="hash", display_name="Forum User")
    db_session.add(user)
    await db_session.commit()

    # Category
    category = ForumCategory(
        name="General Discussion",
        description="Talk about anything",
        sort_order=1
    )
    db_session.add(category)
    await db_session.commit()

    # Thread
    thread = ForumThread(
        category_id=category.id,
        author_id=user.id,
        title="Hello World",
        is_pinned=True
    )
    db_session.add(thread)
    await db_session.commit()

    # Post
    post = ForumPost(
        thread_id=thread.id,
        author_id=user.id,
        content="First post in the thread!"
    )
    db_session.add(post)
    await db_session.commit()

    # Verify Category
    result = await db_session.execute(select(ForumCategory).where(ForumCategory.name == "General Discussion"))
    saved_category = result.scalar_one()
    assert saved_category.description == "Talk about anything"

    # Verify Thread
    result = await db_session.execute(select(ForumThread).where(ForumThread.title == "Hello World"))
    saved_thread = result.scalar_one()
    assert saved_thread.category_id == saved_category.id
    assert saved_thread.is_pinned is True

    # Verify Post
    result = await db_session.execute(select(ForumPost).where(ForumPost.content == "First post in the thread!"))
    saved_post = result.scalar_one()
    assert saved_post.thread_id == saved_thread.id
    assert saved_post.author_id == user.id
