import os
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.storage_service import storage_manager
from app.models import Candidate, Job, CandidateExperience, CandidateEducation, User
from app.services.email_service import send_candidate_interview_email, send_candidate_rejection_email

router = APIRouter(prefix="/api/candidates", tags=["candidates"])
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class StatusUpdate(BaseModel):
    status: str  # APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, REJECTED, HIRED

def resolve_user_from_token(token: Optional[str], db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user

@router.get("")
def get_candidates(
    job_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce organization boundaries by joining Job
    q = db.query(Candidate).join(Job).filter(Job.organization_id == current_user.organization_id)
    
    if job_id is not None:
        q = q.filter(Candidate.job_id == job_id)
        
    if status is not None and status.strip() != "":
        q = q.filter(Candidate.status == status.upper())
        
    if min_score is not None:
        q = q.filter(Candidate.match_score >= min_score)
        
    if query is not None and query.strip() != "":
        search_filter = or_(
            Candidate.name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
            Candidate.raw_text.ilike(f"%{query}%")
        )
        q = q.filter(search_filter)
        
    # Order by match score descending by default
    candidates = q.order_by(Candidate.match_score.desc()).all()
    
    results = []
    for cand in candidates:
        skills = []
        try:
            if cand.raw_text:
                from app.services.ai_service import COMMON_SKILLS
                skills = [s for s in COMMON_SKILLS if s.lower() in cand.raw_text.lower()][:5]
        except Exception:
            pass
            
        results.append({
            "id": cand.id,
            "job_id": cand.job_id,
            "job_title": cand.job.title if cand.job else "Unknown Job",
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "match_score": cand.match_score,
            "skill_match_score": cand.skill_match_score,
            "experience_match_score": cand.experience_match_score,
            "relevance_score": cand.relevance_score,
            "status": cand.status,
            "skills": skills,
            "created_at": cand.created_at
        })
    return results

@router.get("/{candidate_id}")
def get_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce organization boundaries
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    exps = [{
        "id": e.id,
        "title": e.title,
        "company": e.company,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "description": e.description
    } for e in cand.experiences]
    
    edus = [{
        "id": ed.id,
        "institution": ed.institution,
        "degree": ed.degree,
        "major": ed.major,
        "graduation_year": ed.graduation_year
    } for ed in cand.educations]
    
    # Gating the HR Copilot feature based on organization subscription plan
    # If the plan does not support "HR Copilot", we mask/clear the ai_summary and ai_concerns!
    ai_summary = cand.ai_summary
    ai_concerns = cand.ai_concerns
    
    try:
        from app.models import SubscriptionPlan
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == current_user.organization.current_plan).first()
        features = json.loads(plan.features_json or "[]")
        if "HR Copilot" not in features:
            ai_summary = "Upgrade to GROWTH or ENTERPRISE plan to unlock AI HR Copilot recommendations."
            ai_concerns = "Upgrade to GROWTH or ENTERPRISE plan to unlock AI HR Copilot gap warnings."
    except Exception:
        pass
        
    return {
        "id": cand.id,
        "job_id": cand.job_id,
        "job_title": cand.job.title if cand.job else "Unknown Job",
        "name": cand.name,
        "email": cand.email,
        "phone": cand.phone,
        "match_score": cand.match_score,
        "skill_match_score": cand.skill_match_score,
        "experience_match_score": cand.experience_match_score,
        "relevance_score": cand.relevance_score,
        "ai_summary": ai_summary,
        "ai_concerns": ai_concerns,
        "status": cand.status,
        "created_at": cand.created_at,
        "experiences": exps,
        "educations": edus
    }

@router.put("/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int, 
    status_in: StatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    old_status = cand.status
    new_status = status_in.status.upper()
    
    cand.status = new_status
    db.commit()
    
    # Trigger actual emails if the status changed and candidate has an email address
    if old_status != new_status and cand.email:
        org_name = current_user.organization.name if current_user.organization else "Hirecue Workspace"
        job_title = cand.job.title if cand.job else "Position"
        
        if new_status == "INTERVIEW_SCHEDULED":
            try:
                send_candidate_interview_email(
                    to_email=cand.email,
                    candidate_name=cand.name,
                    job_title=job_title,
                    org_name=org_name
                )
            except Exception as e:
                print(f"Error dispatching interview email: {e}")
        elif new_status == "REJECTED":
            try:
                send_candidate_rejection_email(
                    to_email=cand.email,
                    candidate_name=cand.name,
                    job_title=job_title,
                    org_name=org_name
                )
            except Exception as e:
                print(f"Error dispatching rejection email: {e}")
                
    return {"id": cand.id, "status": cand.status}

@router.get("/{candidate_id}/resume")
def get_candidate_resume(
    candidate_id: int,
    token: Optional[str] = Query(None),
    bearer_token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
):
    # Browser PDF/object tags cannot attach Authorization headers, so this endpoint
    # supports either a Bearer header or a token query parameter.
    user = resolve_user_from_token(token or bearer_token, db)

    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == user.organization_id,
    ).first()
    if not cand or not cand.resume_path:
        raise HTTPException(status_code=403, detail="Resume not found or access denied")
    
    # Resolve the stored resume path. It may be a local path or a Supabase storage identifier.
    resume_path = cand.resume_path
    filename = storage_manager.get_filename(resume_path)

    if resume_path.startswith("supabase://"):
        try:
            contents = storage_manager.read_file(resume_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download resume from Supabase: {str(e)}",
            )

        return Response(
            content=contents,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    else:
        # Assume a local filesystem path.
        if not os.path.exists(resume_path):
            raise HTTPException(status_code=404, detail="Resume file does not exist on disk")
        return FileResponse(resume_path, filename=filename)

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    if cand.resume_path and os.path.exists(cand.resume_path):
        try:
            os.remove(cand.resume_path)
        except Exception:
            pass
            
    db.delete(cand)
    db.commit()
    return None

@router.get("/job/{job_id}/export")
def export_candidates(
    job_id: int, 
    token: Optional[str] = Query(None),
    bearer_token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db)
):
    current_user = resolve_user_from_token(token or bearer_token, db)
    plan = current_user.organization.current_plan
    if plan not in ["GROWTH", "ENTERPRISE"]:
        raise HTTPException(status_code=403, detail="CSV Export requires GROWTH or ENTERPRISE plan.")
        
    candidates = db.query(Candidate).join(Job).filter(
        Candidate.job_id == job_id,
        Job.organization_id == current_user.organization_id
    ).order_by(Candidate.match_score.desc()).all()
    
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Match Score", "Status", "AI Summary", "AI Concerns"])
    
    for cand in candidates:
        writer.writerow([
            cand.name, 
            cand.email, 
            cand.phone or "", 
            cand.match_score, 
            cand.status,
            cand.ai_summary or "",
            cand.ai_concerns or ""
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job_{job_id}_candidates.csv"}
    )
