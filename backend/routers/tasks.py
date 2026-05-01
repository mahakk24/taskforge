from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone
from core.database import get_db
from core.security import get_current_user
import models, schemas

router = APIRouter()

def get_task_or_404(task_id: int, db: Session):
    t = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    return t

def assert_task_access(task: models.Task, user: models.User, db: Session):
    project = task.project
    if user.role == "admin" or project.owner_id == user.id:
        return
    member = db.query(models.ProjectMember).filter_by(project_id=project.id, user_id=user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="No access to this task")

@router.post("/project/{project_id}", response_model=schemas.TaskOut, status_code=201)
def create_task(project_id: int, payload: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = models.Task(**payload.dict(), project_id=project_id, creator_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = get_task_or_404(task_id, db)
    assert_task_access(task, current_user, db)
    return task

@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = get_task_or_404(task_id, db)
    assert_task_access(task, current_user, db)
    for k, v in payload.dict(exclude_none=True).items():
        setattr(task, k, v)
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = get_task_or_404(task_id, db)
    assert_task_access(task, current_user, db)
    db.delete(task)
    db.commit()

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)

    if current_user.role == "admin":
        base = db.query(models.Task)
        total_projects = db.query(models.Project).count()
    else:
        member_project_ids = [r[0] for r in db.query(models.ProjectMember.project_id).filter_by(user_id=current_user.id).all()]
        owned_ids = [r[0] for r in db.query(models.Project.id).filter_by(owner_id=current_user.id).all()]
        all_ids = list(set(member_project_ids + owned_ids))
        base = db.query(models.Task).filter(models.Task.project_id.in_(all_ids))
        total_projects = len(all_ids)

    total = base.count()
    completed = base.filter(models.Task.status == "done").count()
    in_progress = base.filter(models.Task.status == "in_progress").count()
    overdue = base.filter(
        and_(models.Task.due_date < now, models.Task.status != "done")
    ).count()

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "overdue_tasks": overdue,
        "in_progress_tasks": in_progress,
        "total_projects": total_projects,
    }
