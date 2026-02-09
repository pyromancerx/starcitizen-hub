import pytest
from sqlalchemy import select
from app.models.project import (
    Project, ProjectPhase, Task, ContributionGoal, Contribution,
    ProjectStatus, TaskStatus
)
from app.models.user import User

@pytest.mark.asyncio
async def test_project_structure(db_session):
    """Test project, phase, and task creation."""
    manager = User(email="manager@example.com", password_hash="hash", display_name="Project Manager")
    worker = User(email="worker@example.com", password_hash="hash", display_name="Worker")
    db_session.add_all([manager, worker])
    await db_session.commit()

    # Project
    project = Project(
        title="Base Construction",
        description="Building a forward operating base",
        manager_id=manager.id,
        status=ProjectStatus.PLANNING
    )
    db_session.add(project)
    await db_session.commit()

    # Phase
    phase = ProjectPhase(
        project_id=project.id,
        name="Logistics",
        sort_order=1
    )
    db_session.add(phase)
    await db_session.commit()

    # Task
    task = Task(
        phase_id=phase.id,
        assignee_id=worker.id,
        title="Transport Materials",
        status=TaskStatus.TODO
    )
    db_session.add(task)
    await db_session.commit()

    # Verify
    result = await db_session.execute(select(Task).where(Task.title == "Transport Materials"))
    saved_task = result.scalar_one()
    assert saved_task.phase_id == phase.id
    assert saved_task.assignee_id == worker.id
    
    result = await db_session.execute(select(ProjectPhase).where(ProjectPhase.id == phase.id))
    saved_phase = result.scalar_one()
    assert saved_phase.project_id == project.id

@pytest.mark.asyncio
async def test_contribution_workflow(db_session):
    """Test contribution goals and user contributions."""
    user = User(email="contributor@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()
    
    project = Project(title="Crowdfunding Ship", manager_id=user.id)
    db_session.add(project)
    await db_session.commit()

    # Goal
    goal = ContributionGoal(
        project_id=project.id,
        resource_type="auec",
        target_amount=1000000,
        current_amount=0
    )
    db_session.add(goal)
    await db_session.commit()

    # Contribution
    contribution = Contribution(
        goal_id=goal.id,
        user_id=user.id,
        amount=50000,
        notes="First batch"
    )
    db_session.add(contribution)
    
    # Update goal amount (manual in this test, service would handle logic)
    goal.current_amount += contribution.amount
    
    await db_session.commit()

    # Verify
    from sqlalchemy.orm import selectinload
    result = await db_session.execute(
        select(ContributionGoal)
        .where(ContributionGoal.id == goal.id)
        .options(selectinload(ContributionGoal.contributions))
    )
    saved_goal = result.scalar_one()
    assert saved_goal.current_amount == 50000
    assert len(saved_goal.contributions) == 1
