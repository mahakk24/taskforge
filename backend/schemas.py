from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    member = "member"

class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

# ─── Auth ────────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.member

    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

# ─── Users ───────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_color: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Projects ────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_archived: Optional[bool] = None

class ProjectMemberOut(BaseModel):
    id: int
    user: UserOut
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    is_archived: bool
    owner: UserOut
    members: List[ProjectMemberOut] = []
    task_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class AddMemberRequest(BaseModel):
    email: str
    role: RoleEnum = RoleEnum.member

# ─── Tasks ───────────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    assignee: Optional[UserOut]
    creator: UserOut
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Dashboard ───────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    in_progress_tasks: int
    total_projects: int

TokenResponse.model_rebuild()
