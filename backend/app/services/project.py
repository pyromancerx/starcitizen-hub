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
        
        # Track activity
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_project_created(
            user_id=manager_id,
            project_id=project.id,
            name=project.title
        )

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

    async def complete_project(self, project_id: int, user_id: int) -> Optional[Project]:
        """Mark a project as completed and track activity."""
        project = await self.get_project(project_id)
        if not project:
            return None
        
        project.status = "completed"
        await self.db.commit()
        await self.db.refresh(project)
        
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_project_completed(
            user_id=user_id,
            project_id=project.id,
            name=project.title
        )
        return project

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

    async def get_phase(self, phase_id: int) -> Optional[ProjectPhase]:
        result = await self.db.execute(select(ProjectPhase).where(ProjectPhase.id == phase_id))
        return result.scalar_one_or_none()

    async def update_phase(self, phase: ProjectPhase, data: ProjectPhaseUpdate) -> ProjectPhase:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(phase, field, value)
        await self.db.commit()
        await self.db.refresh(phase)
        return phase

    async def delete_phase(self, phase: ProjectPhase) -> None:
        await self.db.delete(phase)
        await self.db.commit()

    # --- Tasks ---
    async def create_task(self, phase_id: int, data: TaskCreate) -> Task:
        task = Task(
            phase_id=phase_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            assignee_id=data.assignee_id
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

    async def delete_task(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()

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

    async def update_contribution_goal(self, goal: ContributionGoal, data: ContributionGoalUpdate) -> ContributionGoal:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)
        await self.db.commit()
        await self.db.refresh(goal)
        return goal

    async def delete_contribution_goal(self, goal: ContributionGoal) -> None:
        await self.db.delete(goal)
        await self.db.commit()

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
        
        # Track activity
        from app.services.activity import ActivityService
        from app.services.notification import NotificationService
        from app.models.user import User
        activity_service = ActivityService(self.db)
        notification_service = NotificationService(self.db)

        # We need the project info for the activity tracking and notification
        project_query = (
            select(Project)
            .join(ContributionGoal)
            .where(ContributionGoal.id == goal_id)
        )
        result = await self.db.execute(project_query)
        project = result.scalar_one()
        project_name = project.title

        await activity_service.track_contribution_made(
            user_id=user_id,
            project_id=project.id,
            project_name=project_name,
            amount=data.amount
        )

        # Notify project manager
        if project.manager_id != user_id:
            result = await self.db.execute(select(User).where(User.id == user_id))
            contributor = result.scalar_one()
            
            await notification_service.create_notification(
                user_id=project.manager_id,
                notification_type=NotificationType.MENTION, # Or generic
                title="New Project Contribution",
                message=f"{contributor.display_name or f'User {user_id}'} contributed {data.amount} aUEC to '{project_name}'",
                link=f"/projects/{project.id}"
            )

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

    async def get_contribution(self, contribution_id: int) -> Optional[Contribution]:
        result = await self.db.execute(select(Contribution).where(Contribution.id == contribution_id))
        return result.scalar_one_or_none()

    async def update_contribution(self, contribution: Contribution, data: ContributionCreate) -> Contribution:
        # Note: ContributionCreate is used here for simplicity,
        # consider a specific ContributionUpdate schema if needed.
        update_data = data.model_dump(exclude_unset=True)
        
        # Adjust goal amount if contribution amount changes
        old_amount = contribution.amount
        
        for field, value in update_data.items():
            setattr(contribution, field, value)
        
        if 'amount' in update_data:
            goal = await self.get_contribution_goal(contribution.goal_id)
            if goal:
                goal.current_amount -= old_amount # Subtract old amount
                goal.current_amount += contribution.amount # Add new amount
        
        await self.db.commit()
        await self.db.refresh(contribution)
        return contribution

    async def delete_contribution(self, contribution: Contribution) -> None:
        goal = await self.get_contribution_goal(contribution.goal_id)
        if goal:
            goal.current_amount -= contribution.amount
        
        await self.db.delete(contribution)
        await self.db.commit()
