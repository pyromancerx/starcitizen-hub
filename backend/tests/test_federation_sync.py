import pytest
import time
from unittest.mock import AsyncMock, patch, MagicMock
from app.utils.federation_security import FederationSecurity
from app.services.federation import FederationService
from app.models.federation import PeeredInstance, PeerStatus

def test_signature_generation():
    key = "secret"
    sig = FederationSecurity.generate_signature(key, "GET", "/path", "1234567890")
    assert sig is not None
    assert len(sig) > 0

@pytest.mark.asyncio
async def test_request_verification_success():
    req = AsyncMock()
    req.headers = {
        FederationSecurity.HEADER_SIGNATURE: "",
        FederationSecurity.HEADER_TIMESTAMP: str(time.time())
    }
    req.method = "GET"
    req.url.path = "/path"
    req.body.return_value = b""
    
    key = "secret"
    sig = FederationSecurity.generate_signature(key, "GET", "/path", req.headers[FederationSecurity.HEADER_TIMESTAMP])
    req.headers[FederationSecurity.HEADER_SIGNATURE] = sig
    
    await FederationSecurity.verify_request(req, key)

@pytest.mark.asyncio
async def test_sync_logic(db_session):
    # Setup peer
    peer = PeeredInstance(
        name="Remote",
        base_url="http://remote.test",
        api_key="secret",
        status=PeerStatus.ACTIVE
    )
    db_session.add(peer)
    await db_session.commit()
    
    service = FederationService(db_session)
    
    # Mock Response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{
        "id": 101,
        "title": "Remote Event",
        "start_time": "2024-01-01T12:00:00",
        "event_type": "op"
    }]
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        
        count = await service.sync_peer_events(peer)
        assert count == 1
        
        # Verify DB
        from sqlalchemy import select
        from app.models.federation import FederatedEvent
        result = await db_session.execute(select(FederatedEvent))
        event = result.scalar_one()
        assert event.title == "Remote Event"
        assert event.remote_event_id == 101
