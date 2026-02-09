import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.event import Event, EventSignup, EventType, EventStatus, SignupStatus
from app.models.user import User

@pytest.mark.asyncio
async def test_event_lifecycle(db_session):
    """Test event creation and signup."""
    user = User(email="eventorg@example.com", password_hash="hash", display_name="Event Organizer")
    participant = User(email="participant@example.com", password_hash="hash", display_name="Participant")
    db_session.add_all([user, participant])
    await db_session.commit()

    # Create Event
    start_time = datetime.now() + timedelta(days=1)
    event = Event(
        title="Mining Operation",
        description="Big mining op in the belt",
        start_time=start_time,
        end_time=start_time + timedelta(hours=2),
        organizer_id=user.id,
        event_type=EventType.OPERATION,
        status=EventStatus.SCHEDULED,
        max_participants=10
    )
    db_session.add(event)
    await db_session.commit()

    # Signup
    signup = EventSignup(
        event_id=event.id,
        user_id=participant.id,
        status=SignupStatus.CONFIRMED,
        role="miner"
    )
    db_session.add(signup)
    await db_session.commit()

    # Verify Event
    result = await db_session.execute(select(Event).where(Event.title == "Mining Operation"))
    saved_event = result.scalar_one()
    assert saved_event.organizer_id == user.id
    assert saved_event.event_type == EventType.OPERATION

    # Verify Signup
    result = await db_session.execute(select(EventSignup).where(EventSignup.user_id == participant.id))
    saved_signup = result.scalar_one()
    assert saved_signup.event_id == saved_event.id
    assert saved_signup.status == SignupStatus.CONFIRMED
