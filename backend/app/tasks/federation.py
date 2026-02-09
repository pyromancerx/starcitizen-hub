import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.services.federation import FederationService
from app.models.federation import PeerStatus

logger = logging.getLogger(__name__)

async def sync_all_peers():
    """
    Iterate through all active peers and sync events.
    """
    logger.info("Starting peer sync...")
    async with async_session() as session:
        service = FederationService(session)
        # Get all peers (including pending/unreachable to retry?)
        # Let's retry active and unreachable ones.
        peers = await service.get_peers(limit=100) 
        
        for peer in peers:
            if peer.status == PeerStatus.BLOCKED:
                continue
                
            try:
                count = await service.sync_peer_events(peer)
                if count > 0:
                    logger.info(f"Synced {count} events from {peer.name}")
            except Exception as e:
                logger.error(f"Failed to sync {peer.name}: {e}")

async def federation_sync_loop():
    while True:
        try:
            await sync_all_peers()
        except Exception as e:
            logger.error(f"Error in sync loop: {e}")
        
        # Sync every 5 minutes
        await asyncio.sleep(300)
