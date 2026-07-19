from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from typing import Dict, Any, List
from collections import Counter
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Job, Candidate, User, Organization, UsageTracking

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch organization scope metrics
    total_jobs = db.query(Job).filter(Job.organization_id == current_user.organization_id).count()
    
    # Total candidates in organization jobs
    total_candidates = db.query(Candidate).join(Job).filter(Job.organization_id == current_user.organization_id).count()
    
    # Calculate average score for organization
    avg_score_query = db.query(func.avg(Candidate.match_score)).join(Job).filter(Job.organization_id == current_user.organization_id).scalar()
    avg_match_score = int(avg_score_query) if avg_score_query is not None else 0
    
    # Status Pipeline Funnel
    pipeline_counts = db.query(Candidate.status, func.count(Candidate.id)).join(Job).filter(Job.organization_id == current_user.organization_id).group_by(Candidate.status).all()
    pipeline_dict = {status: count for status, count in pipeline_counts}
    
    statuses = ["APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "REJECTED", "HIRED"]
    funnel = [{"status": s, "count": pipeline_dict.get(s, 0)} for s in statuses]
    
    # Calculate time saved
    time_saved_hours = round((total_candidates * 20) / 60, 1)
    
    # Top Skills (limit scan to latest 100 candidates to keep performance instant)
    all_skills = []
    candidates = db.query(Candidate.raw_text).join(Job)\
        .filter(Job.organization_id == current_user.organization_id)\
        .order_by(Candidate.created_at.desc())\
        .limit(100).all()
    from app.services.ai_service import COMMON_SKILLS
    for (text,) in candidates:
        if text:
            text_lower = text.lower()
            for skill in COMMON_SKILLS:
                if skill.lower() in text_lower:
                    all_skills.append(skill)
                    
    skill_counts = Counter(all_skills).most_common(6)
    top_skills = [{"skill": skill, "count": count} for skill, count in skill_counts]
    
    # Match Score Distribution (single pass query instead of 4 separate count queries)
    distribution = db.query(
        func.sum(case((Candidate.match_score >= 90, 1), else_=0)).label("range_90_100"),
        func.sum(case((and_(Candidate.match_score >= 80, Candidate.match_score < 90), 1), else_=0)).label("range_80_89"),
        func.sum(case((and_(Candidate.match_score >= 70, Candidate.match_score < 80), 1), else_=0)).label("range_70_79"),
        func.sum(case((Candidate.match_score < 70, 1), else_=0)).label("range_below_70")
    ).join(Job).filter(Job.organization_id == current_user.organization_id).first()
    
    score_ranges = {
        "90-100": int(distribution.range_90_100 or 0) if distribution else 0,
        "80-89": int(distribution.range_80_89 or 0) if distribution else 0,
        "70-79": int(distribution.range_70_79 or 0) if distribution else 0,
        "Below 70": int(distribution.range_below_70 or 0) if distribution else 0
    }
    score_distribution = [{"range": k, "count": v} for k, v in score_ranges.items()]
    
    # --- ADMIN SaaS METRICS (Gated for ADMIN and HR_MANAGER role checks) ---
    admin_metrics = {}
    if current_user.role in ["ADMIN", "HR_MANAGER"]:
        # Subscriptions counts
        active_subscriptions = db.query(Organization).filter(Organization.plan_status == "ACTIVE").count()
        cancelled_subscriptions = db.query(Organization).filter(Organization.plan_status == "CANCELLED").count()
        
        # Calculate MRR
        mrr = 0
        orgs = db.query(Organization).filter(Organization.plan_status == "ACTIVE").all()
        for org in orgs:
            if org.current_plan == "STARTER":
                mrr += 2999
            elif org.current_plan == "GROWTH":
                mrr += 9999
            elif org.current_plan == "ENTERPRISE":
                mrr += 49999
        
        arr = mrr * 12
        
        # Churn Rate
        total_ever = active_subscriptions + cancelled_subscriptions
        churn_rate = round((cancelled_subscriptions / total_ever) * 100, 1) if total_ever > 0 else 0.0
        
        # Plan distribution
        plan_distribution = {
            "STARTER": db.query(Organization).filter(Organization.current_plan == "STARTER", Organization.plan_status == "ACTIVE").count(),
            "GROWTH": db.query(Organization).filter(Organization.current_plan == "GROWTH", Organization.plan_status == "ACTIVE").count(),
            "ENTERPRISE": db.query(Organization).filter(Organization.current_plan == "ENTERPRISE", Organization.plan_status == "ACTIVE").count()
        }
        
        # Customer profiles analytics (using joined query + subquery to avoid N+1 queries)
        customers = []
        user_counts = db.query(
            User.organization_id, 
            func.count(User.id).label("users_count")
        ).group_by(User.organization_id).subquery()
        
        results = db.query(
            Organization.id,
            Organization.name,
            Organization.current_plan,
            Organization.plan_status,
            func.coalesce(user_counts.c.users_count, 0).label("users_count"),
            func.coalesce(UsageTracking.resumes_processed, 0).label("resumes_processed")
        ).outerjoin(user_counts, user_counts.c.organization_id == Organization.id)\
         .outerjoin(UsageTracking, UsageTracking.organization_id == Organization.id)\
         .all()
         
        for row in results:
            customers.append({
                "id": row.id,
                "name": row.name,
                "plan": row.current_plan,
                "status": row.plan_status,
                "users_count": row.users_count,
                "resumes_processed": row.resumes_processed
            })
            
        admin_metrics = {
            "active_subscriptions": active_subscriptions,
            "mrr": mrr,
            "arr": arr,
            "churn_rate": churn_rate,
            "plan_distribution": plan_distribution,
            "customers": customers[:10] # Top 10 customers
        }
        
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "avg_match_score": avg_match_score,
        "time_saved_hours": time_saved_hours,
        "funnel": funnel,
        "top_skills": top_skills,
        "score_distribution": score_distribution,
        "admin_metrics": admin_metrics if admin_metrics else None
    }
