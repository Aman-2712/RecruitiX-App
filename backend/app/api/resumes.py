import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, check_plan_limit
from app.core.limiter import limiter
from app.models import Job, Candidate, CandidateExperience, CandidateEducation, User, UsageTracking, SubscriptionPlan
from app.services.ai_service import process_resume_and_match

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
@limiter.limit("10/minute")
def upload_resumes(
    request: Request,
    job_id: int = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    usage: UsageTracking = Depends(check_plan_limit("resume"))
):
    # Validate file size and extensions
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
    
    for file in files:
        # Check extension
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has an invalid format. Only PDF, DOCX, and DOC are allowed."
            )
            
        # Check size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds the maximum limit of 5MB."
            )

    # 1. Fetch the Job and verify organization tenancy
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied")
        
    # Check plan limit for batch uploads
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == current_user.organization.current_plan).first()
    if plan and plan.resume_limit != -1:
        if usage.resumes_processed + len(files) > plan.resume_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Uploading {len(files)} file(s) would exceed your plan's monthly limit ({usage.resumes_processed}/{plan.resume_limit} processed). Please upgrade your plan."
            )

    # Check for Bulk Upload limits based on subscription plan
    current_plan = current_user.organization.current_plan.upper()
    num_files = len(files)
    
    if num_files > 1:
        if current_plan == "STARTER" and num_files > 15:
            raise HTTPException(
                status_code=403,
                detail=f"Bulk upload limit exceeded. The STARTER plan is limited to 15 resumes per upload (you tried to upload {num_files}). Please upgrade to Growth or Enterprise to upload more at once."
            )
        elif current_plan == "GROWTH" and num_files > 50:
            raise HTTPException(
                status_code=403,
                detail=f"Bulk upload limit exceeded. The GROWTH plan is limited to 50 resumes per upload (you tried to upload {num_files}). Please upgrade to Enterprise for unlimited bulk uploads."
            )
        
    job_data = {
        "title": job.title,
        "description": job.description,
        "skills_required": json.loads(job.skills_required or "[]"),
        "skills_preferred": json.loads(job.skills_preferred or "[]"),
        "min_experience": job.min_experience,
        "max_experience": job.max_experience,
        "education_required": job.education_required,
        "location": job.location
    }
    
    results = []
    
    from app.services.storage_service import storage_manager
    import uuid

    for file in files:
        # Generate a unique filename using UUID to prevent collisions in Supabase Storage
        unique_id = uuid.uuid4().hex
        unique_filename = f"{job_id}_{unique_id}_{file.filename}"
        local_file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(local_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            # 2. Extract and match using AI Service
            candidate_profile, match_result = process_resume_and_match(local_file_path, file.filename, job_data)
            
            # Upload to Storage Layer
            file.file.seek(0)
            final_path = storage_manager.upload_file(file, unique_filename)
            
            # 3. Create Candidate
            candidate = Candidate(
                job_id=job_id,
                name=candidate_profile.get("name"),
                email=candidate_profile.get("email"),
                phone=candidate_profile.get("phone"),
                match_score=match_result.get("match_score", 0),
                skill_match_score=match_result.get("skill_match_score", 0),
                experience_match_score=match_result.get("experience_match_score", 0),
                relevance_score=match_result.get("relevance_score", 0),
                ai_summary=match_result.get("ai_summary", ""),
                ai_concerns=match_result.get("ai_concerns", ""),
                resume_path=final_path,
                status="APPLIED",
                raw_text=candidate_profile.get("raw_text", "")
            )
            db.add(candidate)
            db.commit() # Commit to get candidate ID
            db.refresh(candidate)
            
            # 4. Save experiences
            for exp in candidate_profile.get("experiences", []):
                db_exp = CandidateExperience(
                    candidate_id=candidate.id,
                    title=exp.get("title"),
                    company=exp.get("company"),
                    start_date=str(exp.get("start_date", "")),
                    end_date=str(exp.get("end_date", "")),
                    description=exp.get("description", "")
                )
                db.add(db_exp)
                
            # 5. Save educations
            for edu in candidate_profile.get("educations", []):
                db_edu = CandidateEducation(
                    candidate_id=candidate.id,
                    institution=edu.get("institution"),
                    degree=edu.get("degree"),
                    major=edu.get("major"),
                    graduation_year=str(edu.get("graduation_year", ""))
                )
                db.add(db_edu)
                
            # 6. Increment resumes_processed usage
            usage.resumes_processed += 1
            
            db.commit()
            
            results.append({
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "match_score": candidate.match_score,
                "status": candidate.status,
                "filename": file.filename
            })
            
        except Exception as e:
            # Cleanup saved file on total failure
            if os.path.exists(local_file_path):
                os.remove(local_file_path)
            # Log error and continue with other files
            results.append({
                "filename": file.filename,
                "error": f"Failed to process resume: {str(e)}"
            })
            
    return {"processed": results}
