from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.federation import (
    PeeredInstance, FederatedEvent, TradeRequest,
    PeerStatus, TradeRequestStatus
)
from app.schemas.federation import (
    PeeredInstanceCreate, PeeredInstanceUpdate,
    FederatedEventCreate,
    TradeRequestCreate
)

import httpx
import time
from datetime import datetime
from app.config import get_settings
from app.utils.federation_security import FederationSecurity

settings = get_settings()

class FederationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ... (existing methods)

    async def sync_peer_events(self, peer: PeeredInstance) -> int:
        """
        Fetch events from a peer and update local cache.
        Returns number of events synced.
        """
        # Prepare request
        timestamp = str(time.time())
        path = "/api/federation/inbound/events"
        url = f"{peer.base_url}{path}"
        
        # Determine query params (sync since last seen)
        params = {}
        if peer.last_seen_at:
            params["since"] = peer.last_seen_at.timestamp()

        # Sign request
        signature = FederationSecurity.generate_signature(
            peer.api_key, "GET", path, timestamp
        )
        
        headers = {
            FederationSecurity.HEADER_SIGNATURE: signature,
            FederationSecurity.HEADER_TIMESTAMP: timestamp,
            FederationSecurity.HEADER_SOURCE_HOST: settings.instance_url
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=10.0)
                
            if response.status_code == 200:
                events_data = response.json()
                synced_count = 0
                
                for event_data in events_data:
                    # Check if exists
                    remote_id = event_data["id"]
                    
                    # Update or Create
                    query = select(FederatedEvent).where(
                        FederatedEvent.source_instance_id == peer.id,
                        FederatedEvent.remote_event_id == remote_id
                    )
                    result = await self.db.execute(query)
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        existing.title = event_data["title"]
                        existing.description = event_data.get("description")
                        existing.start_time = datetime.fromisoformat(event_data["start_time"])
                        existing.event_type = event_data["event_type"]
                        # source_url might be missing in response if not populated, assume constructed
                        # but schema has source_url? Let's check schema.
                    else:
                        new_event = FederatedEvent(
                            source_instance_id=peer.id,
                            remote_event_id=remote_id,
                            title=event_data["title"],
                            description=event_data.get("description"),
                            start_time=datetime.fromisoformat(event_data["start_time"]),
                            event_type=event_data["event_type"],
                            source_url=f"{peer.base_url}/events/{remote_id}" # Simplistic
                        )
                        self.db.add(new_event)
                    
                    synced_count += 1
                
                # Update peer last seen
                peer.last_seen_at = datetime.now()
                peer.status = PeerStatus.ACTIVE
                await self.db.commit()
                return synced_count
                
            elif response.status_code in [401, 403]:
                peer.status = PeerStatus.BLOCKED # Auth failed
                await self.db.commit()
                return 0
            else:
                return 0
                
        except httpx.RequestError:
            peer.status = PeerStatus.UNREACHABLE
            await self.db.commit()
            return 0

    # --- Peers ---
    async def create_peer(self, data: PeeredInstanceCreate) -> PeeredInstance:
        peer = PeeredInstance(
            name=data.name,
            base_url=str(data.base_url),
            api_key=data.api_key,
            status=data.status
        )
        self.db.add(peer)
        await self.db.commit()
        await self.db.refresh(peer)
        return peer

    async def get_peers(self, skip: int = 0, limit: int = 20) -> List[PeeredInstance]:
        result = await self.db.execute(
            select(PeeredInstance).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_peer(self, peer_id: int) -> Optional[PeeredInstance]:
        result = await self.db.execute(select(PeeredInstance).where(PeeredInstance.id == peer_id))
        return result.scalar_one_or_none()

    async def update_peer(self, peer: PeeredInstance, data: PeeredInstanceUpdate) -> PeeredInstance:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'base_url' and value:
                value = str(value)
            setattr(peer, field, value)
        await self.db.commit()
        await self.db.refresh(peer)
        return peer

    async def delete_peer(self, peer: PeeredInstance) -> None:
        await self.db.delete(peer)
        await self.db.commit()

    # --- Federated Events ---
    async def create_federated_event(self, source_instance_id: int, data: FederatedEventCreate) -> FederatedEvent:
        event = FederatedEvent(
            source_instance_id=source_instance_id,
            remote_event_id=data.remote_event_id,
            title=data.title,
            description=data.description,
            start_time=data.start_time,
            event_type=data.event_type,
            source_url=data.source_url
        )
        self.db.add(event)
        await self.db.commit()
        
        # Load relationships
        query = (
            select(FederatedEvent)
            .where(FederatedEvent.id == event.id)
            .options(selectinload(FederatedEvent.source_instance))
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_federated_events(self, skip: int = 0, limit: int = 20) -> List[FederatedEvent]:
        query = (
            select(FederatedEvent)
            .options(selectinload(FederatedEvent.source_instance))
            .order_by(FederatedEvent.start_time.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # --- Trade Requests ---
    async def create_trade_request(self, source_instance_id: int, data: TradeRequestCreate) -> TradeRequest:
        request = TradeRequest(
            source_instance_id=source_instance_id,
            resource_type=data.resource_type,
            amount=data.amount,
            unit=data.unit,
            price_per_unit=data.price_per_unit,
            status=data.status,
            expires_at=data.expires_at
        )
        self.db.add(request)
        await self.db.commit()
        
        # Load relationships
        query = (
            select(TradeRequest)
            .where(TradeRequest.id == request.id)
            .options(selectinload(TradeRequest.source_instance))
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_trade_requests(self, skip: int = 0, limit: int = 20) -> List[TradeRequest]:
        query = (
            select(TradeRequest)
            .options(selectinload(TradeRequest.source_instance))
            .order_by(TradeRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
