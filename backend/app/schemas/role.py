from typing import List
from pydantic import BaseModel, ConfigDict

class RoleResponse(BaseModel):
    id: int
    name: str
    tier: str
    permissions: List[str]
    is_default: bool
    sort_order: int

    model_config = ConfigDict(from_attributes=True)
