from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import (
    Project, ProjectPhase, Task, ContributionGoal, Contribution
)
from app.schemas.project import (
    ProjectCreate, ProjectUpdate,
    ProjectPhaseCreate, ProjectPhaseUpdate,
    TaskCreate, TaskUpdate,
    ContributionGoalCreate, ContributionGoalUpdate,
    ContributionCreate
)

class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Projects ---
    async def create_project(self, data: ProjectCreate, manager_id: int) -> Project:
        project = Project(
            title=data.title,
            description=data.description,
            status=data.status,
            manager_id=manager_id,
            start_date=data.start_date,
            target_date=data.target_date,
            custom_attributes=data.custom_attributes,
        )
        self.db.add(project)
        await self.db.commit()
        
        # Fetch with relationships loaded to avoid lazy load errors
        query = (
            select(Project)
            .where(Project.id == project.id)
            .options(
                selectinload(Project.phases),
                selectinload(Project.contribution_goals),
                selectinload(Project.manager)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_projects(self, skip: int = 0, limit: int = 20) -> List[Project]:
        query = (
            select(Project)
            .options(selectinload(Project.manager))
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_project(self, project_id: int) -> Optional[Project]:
        query = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.manager),
                selectinload(Project.phases).selectinload(ProjectPhase.tasks).selectinload(Task.assignee),
                selectinload(Project.contribution_goals)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_project(self, project: Project, data: ProjectUpdate) -> Project:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.commit()

    # --- Phases ---
    async def create_phase(self, project_id: int, data: ProjectPhaseCreate) -> ProjectPhase:
        phase = ProjectPhase(
            project_id=project_id,
            name=data.name,
            description=data.description,
            sort_order=data.sort_order
        )
        self.db.add(phase)
        await self.db.commit()
        
        # Fetch with tasks loaded
        query = (
            select(ProjectPhase)
            .where(ProjectPhase.id == phase.id)
            .options(selectinload(ProjectPhase.tasks))
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    # --- Tasks ---
    async def create_task(self, phase_id: int, data: TaskCreate) -> Task:
        task = Task(
            phase_id=phase_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority
        )
        self.db.add(task)
        await self.db.commit()
        
        # Fetch with relationships
        query = (
            select(Task)
            .where(Task.id == task.id)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.phase)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()
    
    async def get_task(self, task_id: int) -> Optional[Task]:
        result = await self.db.execute(
             select(Task)
             .where(Task.id == task_id)
             .options(selectinload(Task.assignee))
        )
        return result.scalar_one_or_none()

    async def update_task(self, task: Task, data: TaskUpdate) -> Task:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    # --- Contribution Goals ---
    async def create_contribution_goal(self, project_id: int, data: ContributionGoalCreate) -> ContributionGoal:
        goal = ContributionGoal(
            project_id=project_id,
            resource_type=data.resource_type,
            target_amount=data.target_amount,
            unit=data.unit,
        )
        self.db.add(goal)
        await self.db.commit()
        await self.db.refresh(goal)
        return goal
    
    async def get_contribution_goal(self, goal_id: int) -> Optional[ContributionGoal]:
        result = await self.db.execute(select(ContributionGoal).where(ContributionGoal.id == goal_id))
        return result.scalar_one_or_none()

    # --- Contributions ---
    async def add_contribution(self, goal_id: int, user_id: int, data: ContributionCreate) -> Contribution:
        contribution = Contribution(
            goal_id=goal_id,
            user_id=user_id,
            amount=data.amount,
            notes=data.notes
        )
        self.db.add(contribution)
        
        # Update goal amount
        goal = await self.get_contribution_goal(goal_id)
        if goal:
            goal.current_amount += data.amount
        
        await self.db.commit()
        
        # Fetch with relationships
        query = (
            select(Contribution)
            .where(Contribution.id == contribution.id)
            .options(
                selectinload(Contribution.user),
                selectinload(Contribution.goal)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()
