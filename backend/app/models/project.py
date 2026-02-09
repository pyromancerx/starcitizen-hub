from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, Float, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.user import User

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(String(50), default=ProjectStatus.PLANNING)
    
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    custom_attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    manager: Mapped["User"] = relationship("User")
    phases: Mapped[List["ProjectPhase"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    contribution_goals: Mapped[List["ContributionGoal"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class ProjectPhase(Base):
    __tablename__ = "project_phases"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    project: Mapped["Project"] = relationship(back_populates="phases")
    tasks: Mapped[List["Task"]] = relationship(back_populates="phase", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "project_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    phase_id: Mapped[int] = mapped_column(ForeignKey("project_phases.id", ondelete="CASCADE"), index=True)
    assignee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(String(50), default=TaskStatus.TODO)
    priority: Mapped[int] = mapped_column(Integer, default=0) # Higher is more important
    
    phase: Mapped["ProjectPhase"] = relationship(back_populates="tasks")
    assignee: Mapped["User"] = relationship("User")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class ContributionGoal(Base):
    __tablename__ = "contribution_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    
    resource_type: Mapped[str] = mapped_column(String(50)) # e.g. "auec", "iron", "fuel"
    target_amount: Mapped[float] = mapped_column(Float)
    current_amount: Mapped[float] = mapped_column(Float, default=0)
    unit: Mapped[str] = mapped_column(String(20), default="units")
    
    project: Mapped["Project"] = relationship(back_populates="contribution_goals")
    contributions: Mapped[List["Contribution"]] = relationship(back_populates="goal", cascade="all, delete-orphan")

class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("contribution_goals.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    amount: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    goal: Mapped["ContributionGoal"] = relationship(back_populates="contributions")
    user: Mapped["User"] = relationship("User")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
