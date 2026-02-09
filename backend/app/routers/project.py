from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetail,
    ProjectPhaseCreate, ProjectPhaseResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    ContributionGoalCreate, ContributionGoalResponse,
    ContributionCreate, ContributionResponse
)
from app.services.project import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])

# --- Projects ---
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    return await service.create_project(data, current_user.id)

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = ProjectService(db)
    return await service.get_projects(skip, limit)

@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # TODO: Permission check (Manager/Admin)
    return await service.update_project(project, data)

# --- Phases ---
@router.post("/{project_id}/phases", response_model=ProjectPhaseResponse, status_code=status.HTTP_201_CREATED)
async def create_phase(
    project_id: int,
    data: ProjectPhaseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await service.create_phase(project_id, data)

# --- Tasks ---
@router.post("/phases/{phase_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    phase_id: int,
    data: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    # TODO: Verify phase exists
    return await service.create_task(phase_id, data)

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await service.update_task(task, data)

# --- Contribution Goals ---
@router.post("/{project_id}/goals", response_model=ContributionGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    project_id: int,
    data: ContributionGoalCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await service.create_contribution_goal(project_id, data)

# --- Contributions ---
@router.post("/goals/{goal_id}/contribute", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
async def add_contribution(
    goal_id: int,
    data: ContributionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    goal = await service.get_contribution_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return await service.add_contribution(goal_id, current_user.id, data)
