import pytest
from sqlalchemy import select
from app.models.federation import (
    PeeredInstance, FederatedEvent, TradeRequest,
    PeerStatus, TradeRequestStatus
)

@pytest.mark.asyncio
async def test_federation_models(db_session):
    # Peer
    peer = PeeredInstance(
        name="Allied Org",
        base_url="https://ally.org",
        api_key="secret-key",
        status=PeerStatus.ACTIVE
    )
    db_session.add(peer)
    await db_session.commit()

    # Event
    from datetime import datetime
    event = FederatedEvent(
        source_instance_id=peer.id,
        remote_event_id=101,
        title="Joint Op",
        start_time=datetime.now(),
        event_type="operation",
        source_url="https://ally.org/events/101"
    )
    db_session.add(event)
    await db_session.commit()

    # Trade Request
    trade = TradeRequest(
        source_instance_id=peer.id,
        resource_type="fuel",
        amount=5000,
        unit="liters",
        status=TradeRequestStatus.OPEN
    )
    db_session.add(trade)
    await db_session.commit()

    # Verify
    result = await db_session.execute(select(PeeredInstance).where(PeeredInstance.name == "Allied Org"))
    saved_peer = result.scalar_one()
    assert saved_peer.base_url == "https://ally.org"

    result = await db_session.execute(select(FederatedEvent).where(FederatedEvent.title == "Joint Op"))
    saved_event = result.scalar_one()
    assert saved_event.source_instance_id == saved_peer.id

    result = await db_session.execute(select(TradeRequest).where(TradeRequest.resource_type == "fuel"))
    saved_trade = result.scalar_one()
    assert saved_trade.status == TradeRequestStatus.OPEN
