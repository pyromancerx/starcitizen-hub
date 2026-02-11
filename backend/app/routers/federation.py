from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.schemas.federation import (
    PeeredInstanceCreate, PeeredInstanceUpdate, PeeredInstanceResponse,
    FederatedEventCreate, FederatedEventResponse,
    TradeRequestCreate, TradeRequestResponse
)
from app.services.federation import FederationService

router = APIRouter(prefix="/api/federation", tags=["federation"])

# --- Peers ---
@router.post("/peers", response_model=PeeredInstanceResponse, status_code=status.HTTP_201_CREATED)
async def create_peer(
    data: PeeredInstanceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    return await service.create_peer(data)

@router.get("/peers", response_model=List[PeeredInstanceResponse])
async def list_peers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = FederationService(db)
    return await service.get_peers(skip, limit)

@router.get("/peers/{peer_id}", response_model=PeeredInstanceResponse)
async def get_peer(
    peer_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = FederationService(db)
    peer = await service.get_peer(peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    return peer

@router.patch("/peers/{peer_id}", response_model=PeeredInstanceResponse)
async def update_peer(
    peer_id: int,
    data: PeeredInstanceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    peer = await service.get_peer(peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    return await service.update_peer(peer, data)

@router.delete("/peers/{peer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_peer(
    peer_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    peer = await service.get_peer(peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    await service.delete_peer(peer)

# --- Federated Events ---
@router.post("/peers/{peer_id}/events", response_model=FederatedEventResponse, status_code=status.HTTP_201_CREATED)
async def create_federated_event(
    peer_id: int,
    data: FederatedEventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    peer = await service.get_peer(peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    return await service.create_federated_event(peer_id, data)

@router.get("/events", response_model=List[FederatedEventResponse])
async def list_federated_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = FederationService(db)
    return await service.get_federated_events(skip, limit)

@router.get("/events/{event_id}", response_model=FederatedEventResponse)
async def get_federated_event(
    event_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = FederationService(db)
    event = await service.get_federated_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Federated Event not found")
    return event

@router.patch("/events/{event_id}", response_model=FederatedEventResponse)
async def update_federated_event(
    event_id: int,
    data: FederatedEventCreate, # Using Create schema for simplicity, consider Update schema
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    event = await service.get_federated_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Federated Event not found")
    return await service.update_federated_event(event, data)

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_federated_event(
    event_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    event = await service.get_federated_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Federated Event not found")
    await service.delete_federated_event(event)


# --- Trade Requests ---
@router.post("/peers/{peer_id}/trade-requests", response_model=TradeRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_trade_request(
    peer_id: int,
    data: TradeRequestCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    peer = await service.get_peer(peer_id)
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    return await service.create_trade_request(peer_id, data)

@router.get("/trade-requests", response_model=List[TradeRequestResponse])
async def list_trade_requests(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = FederationService(db)
    return await service.get_trade_requests(skip, limit)

@router.get("/trade-requests/{request_id}", response_model=TradeRequestResponse)
async def get_trade_request(
    request_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = FederationService(db)
    request = await service.get_trade_request(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Trade Request not found")
    return request

@router.patch("/trade-requests/{request_id}", response_model=TradeRequestResponse)
async def update_trade_request(
    request_id: int,
    data: TradeRequestCreate, # Using Create schema for simplicity, consider Update schema
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    request = await service.get_trade_request(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Trade Request not found")
    return await service.update_trade_request(request, data)

@router.delete("/trade-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade_request(
    request_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("admin.manage_settings"))],
):
    service = FederationService(db)
    request = await service.get_trade_request(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Trade Request not found")
    await service.delete_trade_request(request)