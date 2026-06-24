import json
import re
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker, check_plan_limit
from app.core.limiter import limiter
from app.models import Job, User, UsageTracking
from app.services.ai_service import client, extract_resume_text

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class JobBase(BaseModel):
    title: str
    description: str
    skills_required: List[str]
    skills_preferred: List[str]
    min_experience: int
    max_experience: Optional[int] = None
    education_required: Optional[str] = None
    location: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    status: str
    created_at: Any
    candidate_count: int = 0

    class Config:
        from_attributes = True

@router.get("", response_model=List[dict])
def get_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(Job).filter(Job.organization_id == current_user.organization_id).order_by(Job.created_at.desc()).all()
    results = []
    for job in jobs:
        results.append({
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "skills_required": json.loads(job.skills_required or "[]"),
            "skills_preferred": json.loads(job.skills_preferred or "[]"),
            "min_experience": job.min_experience,
            "max_experience": job.max_experience,
            "education_required": job.education_required,
            "location": job.location,
            "status": job.status,
            "created_at": job.created_at,
            "candidate_count": len(job.candidates)
        })
    return results

@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied")
    
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "skills_required": json.loads(job.skills_required or "[]"),
        "skills_preferred": json.loads(job.skills_preferred or "[]"),
        "min_experience": job.min_experience,
        "max_experience": job.max_experience,
        "education_required": job.education_required,
        "location": job.location,
        "status": job.status,
        "created_at": job.created_at
    }

@router.post("", response_model=dict)
def create_job(
    job_in: JobCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["ADMIN", "HR_MANAGER", "RECRUITER"])),
    usage: UsageTracking = Depends(check_plan_limit("job"))
):
    job = Job(
        title=job_in.title,
        description=job_in.description,
        skills_required=json.dumps(job_in.skills_required),
        skills_preferred=json.dumps(job_in.skills_preferred),
        min_experience=job_in.min_experience,
        max_experience=job_in.max_experience,
        education_required=job_in.education_required,
        location=job_in.location,
        status="ACTIVE",
        organization_id=current_user.organization_id
    )
    db.add(job)
    # Increment usage count
    usage.jobs_created += 1
    db.commit()
    db.refresh(job)
    
    return {
        "id": job.id,
        "title": job.title,
        "skills_required": job_in.skills_required,
        "skills_preferred": job_in.skills_preferred,
        "status": job.status
    }

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["ADMIN", "HR_MANAGER", "RECRUITER"]))):
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied")
    
    # Decrement usage count
    usage = db.query(UsageTracking).filter(UsageTracking.organization_id == current_user.organization_id).first()
    if usage and usage.jobs_created > 0:
        usage.jobs_created -= 1
        
    db.delete(job)
    db.commit()
    return None

# AI job parsing helper endpoint
@router.post("/parse-text")
def parse_job_description(text: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Parses a job description text to extract structured information like title, skills, location, etc.
    """
    if client:
        try:
            prompt = f"""
            You are an expert AI recruiting assistant. Extract structural job specifications from this job description text:
            \"\"\"
            {text}
            \"\"\"
            
            Return a valid JSON object matching this schema:
            {{
              "title": "Job Title (or null)",
              "skills_required": ["Skill A", "Skill B", ...],
              "skills_preferred": ["Skill C", ...],
              "min_experience": 3, (estimated integer minimum years, default to 0 if not mentioned)
              "max_experience": null, (estimated integer maximum years or null)
              "education_required": "Degree requirement (or null)",
              "location": "Location (e.g. Remote, New York, etc. or null)"
            }}
            """
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful recruitment analyzer. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            pass

    # Mock/regex parsing logic when OpenAI is not available or out of quota
    title = "Software Engineer"
    
    first_line = text.split("\n")[0].strip()
    if 3 < len(first_line) < 50 and not any(char in first_line for char in [":", "@", ".", "/", "\\"]):
        title = first_line
    else:
        # Try regex patterns to extract title from text
        patterns = [
            r"(?:hiring|seeking)\s+(?:a\s+|an\s+)?([A-Za-z0-9\s\-\/&]+?)\s+(?:with|to|who|for|at|in|on|\.)",
            r"looking\s+for\s+(?:a\s+|an\s+)?([A-Za-z0-9\s\-\/&]+?)\s+(?:with|to|who|for|at|in|on|\.)",
            r"(?:position|role|title):\s*([A-Za-z0-9\s\-\/&]+)",
        ]
        
        matched_title = None
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                # Ensure it's a reasonable length for a title
                if 3 < len(candidate) < 50:
                    matched_title = candidate.title()
                    break
                    
        if matched_title:
            title = matched_title
        else:
            # Fallback to checking a list of common job titles
            COMMON_TITLES = [
                "Frontend Developer", "Frontend Engineer", "Backend Developer", "Backend Engineer", 
                "Software Developer", "Software Engineer", "Full Stack Developer", "Full Stack Engineer", 
                "DevOps Engineer", "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
                "Product Manager", "Project Manager", "UX Designer", "UI Designer", "Product Designer",
                "Marketing Manager", "Marketing Specialist", "Sales Development Representative", "Account Executive",
                "Customer Success Manager", "Recruiter", "HR Manager"
            ]
            for common_title in COMMON_TITLES:
                if re.search(r"\b" + re.escape(common_title) + r"\b", text, re.IGNORECASE):
                    title = common_title
                    break
            else:
                first_sentence = text.split(".")[0].strip()
                if len(first_sentence) < 50 and len(first_sentence) > 3:
                    title = first_sentence
                elif len(first_line) < 50 and len(first_line) > 3:
                    title = first_line

    # Simple skill extraction
    from app.services.ai_service import COMMON_SKILLS
    skills_found = []
    for skill in COMMON_SKILLS:
        # Use word boundaries to avoid partial matches (e.g. "Go" in "negotiation")
        if re.search(r"\b" + re.escape(skill) + r"\b", text, re.IGNORECASE):
            skills_found.append(skill)
            
    # Try to extract location using regex or fallback search
    location = "Remote"
    loc_match = re.search(r"location:\s*([A-Za-z\s,]+?)(?:\.|\n|$)", text, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(1).strip()
    else:
        site_match = re.search(r"(?:on-site|onsite|hybrid|based|office|located)\s+in\s+([A-Za-z\s,]+?)(?:\.|\n|and|but|$)", text, re.IGNORECASE)
        if site_match:
            location = site_match.group(1).strip()
        else:
            for city in ["New York", "San Francisco", "London", "Berlin", "India", "Bangalore", "Boston", "Seattle", "Chicago", "Los Angeles"]:
                if city.lower() in text.lower():
                    location = city
                    break

    # Experience heuristic
    min_exp = 0
    range_match = re.search(r"(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years|yrs|year|yr)", text, re.IGNORECASE)
    if range_match:
        min_exp = int(range_match.group(1))
    else:
        single_match = re.search(r"(\d+)\+?\s*(?:years|yrs|year|yr)", text, re.IGNORECASE)
        if single_match:
            min_exp = int(single_match.group(1))

    # Education heuristic
    education = None
    edu_lower = text.lower()
    if any(keyword in edu_lower for keyword in ["bachelor", "b.s.", "b.a.", "bs degree", "ba degree", "undergraduate"]):
        education = "Bachelor's Degree"
    elif any(keyword in edu_lower for keyword in ["master", "m.s.", "m.a.", "ms degree", "ma degree", "postgraduate"]):
        education = "Master's Degree"
    elif "phd" in edu_lower or "ph.d" in edu_lower:
        education = "Ph.D."
    elif "degree" in edu_lower:
        education = "Bachelor's Degree"

    return {
        "title": title,
        "skills_required": skills_found[:5],
        "skills_preferred": skills_found[5:8],
        "min_experience": min_exp,
        "max_experience": None,
        "education_required": education,
        "location": location
    }

@router.post("/{job_id}/auto-classify", response_model=dict)
@limiter.limit("5/minute")
def auto_classify_candidates(
    request: Request,
    job_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Automatically classifies candidates for a given job based on their match score:
    - Match Score >= 80%: SHORTLISTED
    - Match Score < 50%: REJECTED
    - Others: Left as APPLIED (or unchanged)
    """
    from app.models import Candidate
    
    # 1. Fetch the Job and verify organization tenancy
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied")
        
    # 2. Fetch candidates for the job
    candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    
    shortlisted_count = 0
    rejected_count = 0
    unchanged_count = 0
    
    for candidate in candidates:
        # We only auto-classify candidates who are currently in APPLIED status
        if candidate.status == "APPLIED":
            if candidate.match_score >= 80:
                candidate.status = "SHORTLISTED"
                shortlisted_count += 1
            elif candidate.match_score < 50:
                candidate.status = "REJECTED"
                rejected_count += 1
            else:
                unchanged_count += 1
        else:
            unchanged_count += 1
            
    db.commit()
    
    return {
        "shortlisted": shortlisted_count,
        "rejected": rejected_count,
        "unchanged": unchanged_count,
        "total_processed": shortlisted_count + rejected_count
    }

