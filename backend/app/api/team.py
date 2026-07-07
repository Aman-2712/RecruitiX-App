from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.core.limiter import limiter
from app.models import User, Organization
from app.services.email_service import send_team_invite_email

router = APIRouter(prefix="/api/team", tags=["team"])

class TeamInviteRequest(BaseModel):
    email: EmailStr
    role: str

class TeamRoleUpdateRequest(BaseModel):
    role: str

class TeamMemberResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[TeamMemberResponse])
def get_team_members(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.organization_id:
        return []
        
    members = db.query(User).filter(User.organization_id == current_user.organization_id).all()
    return members

@router.post("/invite")
@limiter.limit("10/minute")
def invite_team_member(request: Request, payload: TeamInviteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Admins can invite team members")
        
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Organization not found")
        
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    
    if existing_user:
        # If they belong to another org, we reject
        if existing_user.organization_id and existing_user.organization_id != org.id:
            raise HTTPException(status_code=400, detail="User already belongs to another organization")
            
        existing_user.organization_id = org.id
        existing_user.role = payload.role
        db.commit()
        # They are already verified and have a password, just notify them
        background_tasks.add_task(send_team_invite_email, existing_user.email, org.name, current_user.full_name, None)
        return {"message": "User added to team"}
        
    # Create new stub user
    reset_token = secrets.token_urlsafe(32)
    # Give them a random impossible password hash for now until they reset it
    random_hash = get_password_hash(secrets.token_urlsafe(32))
    
    new_user = User(
        email=payload.email,
        hashed_password=random_hash,
        role=payload.role,
        organization_id=org.id,
        is_email_verified=False,
        reset_password_token=reset_token,
        reset_password_expires=datetime.utcnow() + timedelta(days=7) # give them 7 days to accept
    )
    
    db.add(new_user)
    db.commit()
    
    background_tasks.add_task(send_team_invite_email, new_user.email, org.name, current_user.full_name, reset_token)
    
    return {"message": "Invite sent successfully"}

@router.patch("/{user_id}/role")
def update_team_member_role(user_id: int, payload: TeamRoleUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Admins can modify roles")
        
    target_user = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found in your organization")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
        
    target_user.role = payload.role
    db.commit()
    
    return {"message": "Role updated"}

@router.delete("/{user_id}")
def remove_team_member(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Admins can remove members")
        
    target_user = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found in your organization")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
        
    # Just remove them from the org, don't delete the user entirely
    target_user.organization_id = None
    db.commit()
    
    return {"message": "User removed from organization"}
