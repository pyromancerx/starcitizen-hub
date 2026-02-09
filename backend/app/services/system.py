from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system import SystemSetting
from app.schemas.system import ThemeSettings

class SystemService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_setting(self, key: str) -> Optional[SystemSetting]:
        result = await self.db.execute(select(SystemSetting).where(SystemSetting.key == key))
        return result.scalar_one_or_none()

    async def set_setting(self, key: str, value: str, is_public: bool = False, description: Optional[str] = None) -> SystemSetting:
        setting = await self.get_setting(key)
        if setting:
            setting.value = value
            if is_public is not None:
                setting.is_public = is_public
            if description is not None:
                setting.description = description
        else:
            setting = SystemSetting(key=key, value=value, is_public=is_public, description=description)
            self.db.add(setting)
        
        await self.db.commit()
        await self.db.refresh(setting)
        return setting

    async def get_theme_settings(self) -> ThemeSettings:
        # Fetch all theme-related keys
        keys = [
            "color_sc_dark", "color_sc_panel", "color_sc_blue", 
            "color_sc_light_blue", "color_sc_grey", "logo_url", "org_name"
        ]
        query = select(SystemSetting).where(SystemSetting.key.in_(keys))
        result = await self.db.execute(query)
        settings_db = {s.key: s.value for s in result.scalars().all()}
        
        # Merge with defaults from Pydantic model
        return ThemeSettings(**settings_db)

    async def update_theme_settings(self, settings: ThemeSettings) -> ThemeSettings:
        data = settings.model_dump()
        for key, value in data.items():
            if value is not None:
                await self.set_setting(key, str(value), is_public=True, description="Theme Setting")
        return settings
