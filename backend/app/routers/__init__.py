# app/routers/__init__.py
from app.routers.auth import router as auth_router
from app.routers.stockpile import router as stockpile_router
from app.routers.ship import router as ship_router
from app.routers.inventory import router as inventory_router
from app.routers.wallet import router as wallet_router
from app.routers.web import router as web_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "stockpile_router",
    "ship_router",
    "inventory_router",
    "wallet_router",
    "web_router",
    "admin_router",
]
