from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from app.routers import (
    auth_router,
    stockpile_router,
    ship_router,
    inventory_router,
    wallet_router,
    announcement_router,
    forum_router,
    event_router,
    project_router,
    federation_router,
    federation_inbound_router,
    system_public_router,
    system_admin_router,
    trade_router,
    crew_router,
    activity_router,
    notification_router,
    achievement_router,
    message_router,
    discord_router,
)
from app.routers.web import router as web_router
from app.routers.admin import router as admin_router
from app.routers.operation_web import router as operation_web_router
from app.routers.member_web import router as member_web_router
from app.routers.treasury_web import router as treasury_web_router
from app.config import get_settings
from pathlib import Path
from fastapi.staticfiles import StaticFiles

settings = get_settings()

from contextlib import asynccontextmanager
import asyncio
from app.tasks.federation import federation_sync_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background tasks
    task = asyncio.create_task(federation_sync_loop())
    yield
    # Cancel tasks on shutdown (optional but good practice)
    task.cancel()

app = FastAPI(
    title="Star Citizen Hub",
    description="Social and logistics hub for Star Citizen communities",
    version="0.1.0",
    lifespan=lifespan,
)

# Mount uploads directory for dev mode (Caddy handles prod)
# Ensure dir exists
Path("data/uploads").mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="data/uploads"), name="uploads")

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
app.include_router(announcement_router)
app.include_router(forum_router)
app.include_router(event_router)
app.include_router(project_router)
app.include_router(federation_router)
app.include_router(federation_inbound_router)
app.include_router(system_public_router)
app.include_router(system_admin_router)
app.include_router(trade_router)
app.include_router(crew_router)
app.include_router(activity_router)
app.include_router(notification_router)
app.include_router(achievement_router)
app.include_router(message_router)
app.include_router(discord_router)

# Web routes (templates)
app.include_router(web_router)
app.include_router(admin_router)
app.include_router(operation_web_router)
app.include_router(member_web_router)
app.include_router(treasury_web_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
