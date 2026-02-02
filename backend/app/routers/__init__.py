# app/routers/__init__.py
from app.routers.auth import router as auth_router
from app.routers.stockpile import router as stockpile_router

__all__ = ["auth_router", "stockpile_router"]
