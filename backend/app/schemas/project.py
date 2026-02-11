from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.project import ProjectStatus, TaskStatus
from app.schemas.user import UserResponse

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: int = 0

class TaskCreate(TaskBase):
    assignee_id: Optional[int] = None
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = None
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phase_id: int
    assignee_id: Optional[int] = None
    assignee: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

# --- Phase Schemas ---
class ProjectPhaseBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    sort_order: int = 0

class ProjectPhaseCreate(ProjectPhaseBase):
    pass

class ProjectPhaseUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    sort_order: Optional[int] = None

class ProjectPhaseResponse(ProjectPhaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    tasks: List[TaskResponse] = []

# --- Contribution Schemas ---
class ContributionBase(BaseModel):
    amount: float
    notes: Optional[str] = Field(None, max_length=200)

class ContributionCreate(ContributionBase):
    pass

class ContributionResponse(ContributionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    user_id: int
    user: Optional[UserResponse] = None
    created_at: datetime

class ContributionGoalBase(BaseModel):
    resource_type: str = Field(..., max_length=50)
    target_amount: float
    unit: str = Field("units", max_length=20)

class ContributionGoalCreate(ContributionGoalBase):
    pass

class ContributionGoalUpdate(BaseModel):
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None # Admin/System override

class ContributionGoalResponse(ContributionGoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    current_amount: float
    # contributions: List[ContributionResponse] = [] # Usually lazy loaded or separate

# --- Project Schemas ---
class ProjectBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    manager_id: Optional[int] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manager_id: Optional[int] = None
    manager: Optional[UserResponse] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class ProjectDetail(ProjectResponse):
    phases: List[ProjectPhaseResponse] = []
    contribution_goals: List[ContributionGoalResponse] = []
