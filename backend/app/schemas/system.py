from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class SystemSettingBase(BaseModel):
    key: str = Field(..., max_length=100)
    value: str
    description: Optional[str] = Field(None, max_length=255) # Use Field for max_length
    is_public: bool = False

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = Field(None, max_length=255)
    is_public: Optional[bool] = None

class SystemSettingResponse(SystemSettingBase):
    model_config = ConfigDict(from_attributes=True)
    updated_at: datetime

class ThemeSettings(BaseModel):
    # Colors
    color_sc_dark: str = "#0b0c10"
    color_sc_panel: str = "#1f2833"
    color_sc_blue: str = "#66fcf1"
    color_sc_light_blue: str = "#45a29e"
    color_sc_grey: str = "#c5c6c7"
    
    # Assets
    logo_url: Optional[str] = None
    
    # Metadata
    org_name: str = "Star Citizen Hub"
