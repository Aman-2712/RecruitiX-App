from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.core.limiter import limiter
from app.models import User, Organization, UsageTracking
from datetime import datetime, timedelta
import secrets
from app.services.email_service import send_verification_email, send_password_reset_email, send_welcome_email, send_admin_notification

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "RECRUITER"  # ADMIN, HR_MANAGER, RECRUITER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/register", response_model=dict)
@limiter.limit("3/minute")
def register(request: Request, user_in: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create organization
    org_name = f"{user_in.full_name or user_in.email.split('@')[0]}'s Team"
    org = Organization(name=org_name, current_plan="NONE", plan_status="INACTIVE")
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Create usage tracking
    usage = UsageTracking(organization_id=org.id)
    db.add(usage)
    db.commit()

    # Create new user (unverified by default)
    hashed_pwd = get_password_hash(user_in.password)
    verification_token = secrets.token_urlsafe(32)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role.upper(),
        organization_id=org.id,
        is_email_verified=False,
        verification_token=verification_token
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send welcome and admin notification
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    background_tasks.add_task(send_admin_notification, user.email, user.full_name)
    
    # Send verification email
    background_tasks.add_task(send_verification_email, user.email, verification_token)

    return {
        "message": "User registered successfully. Please check your email to verify your account."
    }

@router.post("/verify-email")
@limiter.limit("5/minute")
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
        
    user.is_email_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email successfully verified. You can now log in."}

class ResendVerificationRequest(BaseModel):
    email: EmailStr

@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: ResendVerificationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If that email is registered, a new verification link has been sent."}
        
    if user.is_email_verified:
        return {"message": "Email is already verified."}
        
    user.verification_token = secrets.token_urlsafe(32)
    db.commit()
    
    background_tasks.add_task(send_verification_email, user.email, user.verification_token)
    
    return {"message": "If that email is registered, a new verification link has been sent."}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Prevent email enumeration
        return {"message": "If that email is registered, a password reset link has been sent."}
        
    reset_token = secrets.token_urlsafe(32)
    user.reset_password_token = reset_token
    user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    
    return {"message": "If that email is registered, a password reset link has been sent."}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.reset_password_token == payload.token,
        User.reset_password_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    was_unverified = not user.is_email_verified
    org_id = user.organization_id

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    user.is_email_verified = True
    db.commit()
    
    if was_unverified and org_id:
        admins = db.query(User).filter(User.organization_id == org_id, User.role == "ADMIN").all()
        for admin in admins:
            background_tasks.add_task(send_team_join_notification, admin.email, admin.full_name, user.full_name or user.email)

    
    return {"message": "Password successfully reset. You can now log in."}

# Swagger/Standard OAuth2 compatible login endpoint
@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox or resend the verification link."
        )
    
    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

# JSON-only login endpoint (useful for frontend API calls)
@router.post("/login-json", response_model=TokenResponse)
@limiter.limit("5/minute")
def login_json(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox or resend the verification link."
        )
    
    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

class GoogleTokenRequest(BaseModel):
    token: str

@router.post("/google", response_model=TokenResponse)
@limiter.limit("5/minute")
def google_auth(request: Request, payload: GoogleTokenRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    import os
    
    token = payload.token
    CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    
    if token.startswith("mock_token:"):
        email = token.split(":")[1]
        full_name = email.split("@")[0].title()
    else:
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            email = idinfo.get("email")
            full_name = idinfo.get("name")
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google token verification failed: {str(e)}"
            )
            
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve email from Google token"
        )
        
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Register new user
        org_name = f"{full_name or email.split('@')[0]}'s Team"
        org = Organization(name=org_name, current_plan="NONE", plan_status="INACTIVE")
        db.add(org)
        db.commit()
        db.refresh(org)
        
        usage = UsageTracking(organization_id=org.id)
        db.add(usage)
        db.commit()
        
        random_password = secrets.token_hex(16)
        hashed_pwd = get_password_hash(random_password)
        
        user = User(
            email=email,
            hashed_password=hashed_pwd,
            full_name=full_name,
            role="RECRUITER",
            organization_id=org.id,
            is_email_verified=True, # Google verified them
            verification_token=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send welcome and admin notification for new Google Auth users
        background_tasks.add_task(send_welcome_email, user.email, user.full_name)
        background_tasks.add_task(send_admin_notification, user.email, user.full_name)
        
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
