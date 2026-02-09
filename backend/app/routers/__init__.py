# app/routers/__init__.py
from app.routers.auth import router as auth_router
from app.routers.stockpile import router as stockpile_router
from app.routers.ship import router as ship_router
from app.routers.inventory import router as inventory_router
from app.routers.wallet import router as wallet_router
from app.routers.announcement import router as announcement_router
from app.routers.forum import router as forum_router
from app.routers.event import router as event_router
from app.routers.project import router as project_router
from app.routers.federation import router as federation_router
from app.routers.federation_inbound import router as federation_inbound_router
from app.routers.system import public_router as system_public_router
from app.routers.system import admin_router as system_admin_router

__all__ = [
    "auth_router",
    "stockpile_router",
    "ship_router",
    "inventory_router",
    "wallet_router",
    "announcement_router",
    "forum_router",
    "event_router",
    "project_router",
    "federation_router",
    "federation_inbound_router",
    "system_public_router",
    "system_admin_router",
]
