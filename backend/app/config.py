# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "sqlite+aiosqlite:///./data/hub.db"
    secret_key: str = "change-me-in-production"
    # The CSRF secret key. If not set, fastapi-csrf-protect will use `secret_key`.
    csrf_secret_key: Optional[str] = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    # Instance settings
    instance_name: str = "Star Citizen Hub"
    instance_url: str = "http://localhost:8000" # Public URL of this instance
    allow_registration: bool = True
    require_approval: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
