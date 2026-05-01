from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
import models, schemas

router = APIRouter()

def get_project_or_404(project_id: int, db: Session):
    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

def assert_project_admin(project: models.Project, user: models.User, db: Session):
    """User must be project owner, project admin member, or global admin."""
    if user.role == "admin" or project.owner_id == user.id:
        return
    member = db.query(models.ProjectMember).filter_by(project_id=project.id, user_id=user.id).first()
    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Project admin access required")

def assert_project_member(project: models.Project, user: models.User, db: Session):
    if user.role == "admin" or project.owner_id == user.id:
        return
    member = db.query(models.ProjectMember).filter_by(project_id=project.id, user_id=user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this project")

@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = models.Project(**payload.dict(), owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    # Auto-add owner as admin member
    member = models.ProjectMember(project_id=project.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()
    db.refresh(project)
    return _project_with_count(project, db)

@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        projects = db.query(models.Project).filter_by(is_archived=False).all()
    else:
        member_project_ids = db.query(models.ProjectMember.project_id).filter_by(user_id=current_user.id).all()
        ids = [r[0] for r in member_project_ids]
        owned_ids = db.query(models.Project.id).filter_by(owner_id=current_user.id).all()
        ids += [r[0] for r in owned_ids]
        projects = db.query(models.Project).filter(models.Project.id.in_(set(ids)), models.Project.is_archived == False).all()
    return [_project_with_count(p, db) for p in projects]

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_member(project, current_user, db)
    return _project_with_count(project, db)

@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_admin(project, current_user, db)
    for k, v in payload.dict(exclude_none=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return _project_with_count(project, db)

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_admin(project, current_user, db)
    db.delete(project)
    db.commit()

@router.post("/{project_id}/members", response_model=schemas.ProjectMemberOut)
def add_member(project_id: int, payload: schemas.AddMemberRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_admin(project, current_user, db)
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    member = models.ProjectMember(project_id=project_id, user_id=user.id, role=payload.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_admin(project, current_user, db)
    member = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()

@router.get("/{project_id}/tasks", response_model=List[schemas.TaskOut])
def get_project_tasks(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    assert_project_member(project, current_user, db)
    return db.query(models.Task).filter_by(project_id=project_id).all()

def _project_with_count(project, db):
    count = db.query(models.Task).filter_by(project_id=project.id).count()
    project.task_count = count
    return project
