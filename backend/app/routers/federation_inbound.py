from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.federation import PeeredInstance, PeerStatus
from app.models.event import Event, EventStatus
from app.schemas.event import EventResponse
from app.utils.federation_security import FederationSecurity

router = APIRouter(prefix="/api/federation/inbound", tags=["federation-inbound"])

async def verify_peer(
    request: Request,
    source_host: Annotated[str, Header(alias=FederationSecurity.HEADER_SOURCE_HOST)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> PeeredInstance:
    # Find peer
    result = await db.execute(select(PeeredInstance).where(PeeredInstance.base_url == source_host))
    peer = result.scalar_one_or_none()
    
    if not peer:
        raise HTTPException(status_code=401, detail="Unknown peer")
        
    if peer.status != PeerStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Peer not active")
        
    # Verify signature
    await FederationSecurity.verify_request(request, peer.api_key)
    
    return peer

@router.get("/events", response_model=List[EventResponse])
async def export_events(
    peer: Annotated[PeeredInstance, Depends(verify_peer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    since: float = 0.0 # Timestamp
):
    """
    Export public events to a verified peer.
    """
    from datetime import datetime, timezone
    
    query = select(Event).where(
        Event.status != EventStatus.DRAFT
        # TODO: Add is_public flag to Event model if strictly required, 
        # or assume all non-draft events are sharable with trusted peers.
        # For now, let's assume we trust peers with scheduled/active events.
    )
    
    if since > 0:
        since_dt = datetime.fromtimestamp(since, tz=timezone.utc)
        query = query.where(Event.updated_at > since_dt)
        
    query = query.order_by(Event.updated_at.desc()).limit(50)
    
    result = await db.execute(query)
    return list(result.scalars().all())
