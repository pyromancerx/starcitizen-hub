from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from app.routers import (
    auth_router,
    stockpile_router,
    ship_router,
    inventory_router,
    wallet_router,
)
from app.routers.web import router as web_router
from app.routers.admin import router as admin_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Star Citizen Hub",
    description="Social and logistics hub for Star Citizen communities",
    version="0.1.0",
)

# Add session middleware for flash messages
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
)

# API routes
app.include_router(auth_router)
app.include_router(stockpile_router)
app.include_router(ship_router)
app.include_router(inventory_router)
app.include_router(wallet_router)

# Web routes (templates)
app.include_router(web_router)
app.include_router(admin_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
