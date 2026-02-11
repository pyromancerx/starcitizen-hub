from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse # Assuming UserResponse exists

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime
    
    # Optional: Include user details if loaded by the service
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
