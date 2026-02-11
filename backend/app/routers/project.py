from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetail,
    ProjectPhaseCreate, ProjectPhaseResponse, ProjectPhaseUpdate,
    TaskCreate, TaskUpdate, TaskResponse,
    ContributionGoalCreate, ContributionGoalResponse, ContributionGoalUpdate,
    ContributionCreate, ContributionResponse
)
from app.services.project import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])

# --- Projects ---
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.create_operations"))],
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
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await service.update_project(project, data)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await service.delete_project(project)


@router.post("/{project_id}/complete", response_model=ProjectResponse)
async def complete_project_endpoint(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    """Mark a project as completed."""
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await service.complete_project(project_id, current_user.id)

# --- Phases ---
@router.post("/{project_id}/phases", response_model=ProjectPhaseResponse, status_code=status.HTTP_201_CREATED)
async def create_phase(
    project_id: int,
    data: ProjectPhaseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    service = ProjectService(db)
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await service.create_phase(project_id, data)

@router.get("/phases/{phase_id}", response_model=ProjectPhaseResponse)
async def get_phase(
    phase_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    phase = await service.get_phase(phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return phase

@router.patch("/phases/{phase_id}", response_model=ProjectPhaseResponse)
async def update_phase(
    phase_id: int,
    data: ProjectPhaseUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    service = ProjectService(db)
    phase = await service.get_phase(phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return await service.update_phase(phase, data)

@router.delete("/phases/{phase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phase(
    phase_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("org.manage_operations"))],
):
    service = ProjectService(db)
    phase = await service.get_phase(phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    await service.delete_phase(phase)

# --- Tasks ---
@router.post("/phases/{phase_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    phase_id: int,
    data: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    # Verify phase exists
    phase = await service.get_phase(phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return await service.create_task(phase_id, data)

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

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

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await service.delete_task(task)


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

@router.get("/goals/{goal_id}", response_model=ContributionGoalResponse)
async def get_goal(
    goal_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    goal = await service.get_contribution_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.patch("/goals/{goal_id}", response_model=ContributionGoalResponse)
async def update_goal(
    goal_id: int,
    data: ContributionGoalUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    goal = await service.get_contribution_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return await service.update_contribution_goal(goal, data)

@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    goal = await service.get_contribution_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await service.delete_contribution_goal(goal)

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

@router.get("/contributions/{contribution_id}", response_model=ContributionResponse)
async def get_contribution(
    contribution_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    contribution = await service.get_contribution(contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return contribution

@router.patch("/contributions/{contribution_id}", response_model=ContributionResponse)
async def update_contribution(
    contribution_id: int,
    data: ContributionCreate, # Re-using for simplicity, consider ContributionUpdate schema
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    contribution = await service.get_contribution(contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return await service.update_contribution(contribution, data)

@router.delete("/contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contribution(
    contribution_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    service = ProjectService(db)
    contribution = await service.get_contribution(contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    await service.delete_contribution(contribution)