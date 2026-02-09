# app/templates_config.py
from pathlib import Path
from fastapi import Request
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from app.config import get_settings

settings = get_settings()

# Set up templates directory
templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))


def get_flashed_messages(request: Request) -> list:
    """Get and clear flash messages from session."""
    return request.session.pop("_messages", [])


def flash(request: Request, message: str, category: str = "info"):
    """Add a flash message to the session."""
    if "_messages" not in request.session:
        request.session["_messages"] = []
    request.session["_messages"].append({"text": message, "category": category})


def get_template_context(request: Request, **kwargs) -> dict:
    """Build the base template context with common variables."""
    # Get current user from request state (set by middleware or dependency)
    current_user = getattr(request.state, "user", None)
    is_admin = getattr(request.state, "is_admin", False)

    context = {
        "request": request,
        "instance_name": settings.instance_name,
        "allow_registration": settings.allow_registration,
        "require_approval": settings.require_approval,
        "current_user": current_user,
        "is_admin": is_admin,
        "get_flashed_messages": lambda: get_flashed_messages(request),
        "csrf_token": "",  # TODO: Implement CSRF if needed
    }
    context.update(kwargs)
    return context
