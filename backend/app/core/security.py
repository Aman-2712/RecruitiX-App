import os
import secrets
import logging
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    logger.warning(
        "WARNING: JWT_SECRET_KEY environment variable is not set. "
        "Generating a random transient secret key for this session. "
        "All active user sessions will be invalidated when the server restarts!"
    )
    SECRET_KEY = secrets.token_hex(32)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return user

def check_plan_limit(resource_type: str):
    """
    Dependency that raises 403 if the user's organization has reached limits for resource_type.
    """
    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        from app.models import Organization, SubscriptionPlan, UsageTracking
        
        org = user.organization
        if not org:
            raise HTTPException(status_code=400, detail="User does not belong to an organization")
            
        # Get usage
        usage = db.query(UsageTracking).filter(UsageTracking.organization_id == org.id).first()
        if not usage:
            # Create if missing
            usage = UsageTracking(organization_id=org.id)
            db.add(usage)
            db.commit()
            db.refresh(usage)
            
        # Get plan specs
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == org.current_plan).first()
        if not plan:
            raise HTTPException(status_code=500, detail=f"Subscription plan {org.current_plan} not found in database")
            
        if resource_type == "job":
            if plan.job_limit != -1 and usage.jobs_created >= plan.job_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Job posting limit reached for plan {org.current_plan} ({plan.job_limit} jobs max). Please upgrade your plan."
                )
        elif resource_type == "resume":
            if plan.resume_limit != -1 and usage.resumes_processed >= plan.resume_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Resume processing limit reached for plan {org.current_plan} ({plan.resume_limit} resumes max). Please upgrade your plan."
                )
        elif resource_type == "user":
            if plan.user_limit != -1 and usage.active_users >= plan.user_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Team member limit reached for plan {org.current_plan} ({plan.user_limit} members max). Please upgrade your plan."
                )
        return usage
    return dependency

def check_feature_unlocked(feature_name: str):
    """
    Dependency that raises 403 if the organization does not have access to feature_name.
    """
    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        from app.models import Organization, SubscriptionPlan
        import json
        
        org = user.organization
        if not org:
            raise HTTPException(status_code=400, detail="User does not belong to an organization")
            
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == org.current_plan).first()
        if not plan:
            raise HTTPException(status_code=500, detail=f"Subscription plan {org.current_plan} not found")
            
        features = json.loads(plan.features_json or "[]")
        if feature_name not in features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_name}' is locked on plan {org.current_plan}. Please upgrade your plan to unlock."
            )
        return True
    return dependency
