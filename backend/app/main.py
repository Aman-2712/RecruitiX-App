import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.database import Base, engine
# Import models to ensure they are registered with metadata before create_all
from app import models
from app.core.limiter import limiter
from app.api.auth import router as auth_router
from app.api.jobs import router as jobs_router
from app.api.resumes import router as resumes_router
from app.api.candidates import router as candidates_router
from app.api.analytics import router as analytics_router
from app.api.billing import router as billing_router
from app.api.team import router as team_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hirecue API",
    description="AI-powered Recruitment & Resume Screening Platform API",
    version="1.0.0"
)

# Setup slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://lh3.googleusercontent.com; "
        "frame-src 'self' https://accounts.google.com; "
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://api.openai.com;"
    )
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://recruiti-x-app.vercel.app",
    "https://hirecue.online",
    "https://www.hirecue.online"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(resumes_router)
app.include_router(candidates_router)
app.include_router(analytics_router)
app.include_router(billing_router)
app.include_router(team_router)

@app.on_event("startup")
def startup_event():
    from app.core.database import SessionLocal
    from app.models import SubscriptionPlan, User, Organization, UsageTracking, Job, PromoCode
    import json
    import datetime
    
    db = SessionLocal()
    try:
        # 1. Seed Subscription Plans
        plans_data = [
            {
                "name": "STARTER",
                "monthly_price": 2999,
                "yearly_price": 29990,
                "job_limit": 3,
                "resume_limit": 500,
                "user_limit": 2,
                "features_json": json.dumps([
                    "AI Resume Parsing",
                    "AI Candidate Matching",
                    "AI Candidate Ranking",
                    "Candidate Management",
                    "Basic Analytics",
                    "Email Support",
                    "Bulk Resume Upload"
                ])
            },
            {
                "name": "GROWTH",
                "monthly_price": 9999,
                "yearly_price": 99990,
                "job_limit": 20,
                "resume_limit": 5000,
                "user_limit": 10,
                "features_json": json.dumps([
                    "AI Resume Parsing",
                    "AI Candidate Matching",
                    "AI Candidate Ranking",
                    "Candidate Management",
                    "Advanced Analytics",
                    "Email Support",
                    "HR Copilot",
                    "Bulk Resume Upload",
                    "Advanced Candidate Search",
                    "API Access",
                    "Priority Support",
                    "Hiring Funnel Analytics",
                    "ATS Integrations",
                    "Custom Workflows"
                ])
            },
            {
                "name": "ENTERPRISE",
                "monthly_price": 49999,
                "yearly_price": 499990,
                "job_limit": -1,
                "resume_limit": -1,
                "user_limit": -1,
                "features_json": json.dumps([
                    "AI Resume Parsing",
                    "AI Candidate Matching",
                    "AI Candidate Ranking",
                    "Candidate Management",
                    "Advanced Analytics",
                    "Email Support",
                    "HR Copilot",
                    "Bulk Resume Upload",
                    "Advanced Candidate Search",
                    "API Access",
                    "Priority Support",
                    "Hiring Funnel Analytics",
                    "ATS Integrations",
                    "SSO Authentication",
                    "White Labeling",
                    "Audit Logs",
                    "Custom Workflows",
                    "Dedicated Account Manager",
                    "Custom AI Models",
                    "Advanced Security Controls"
                ])
            }
        ]
        
        for plan in plans_data:
            existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan["name"]).first()
            if not existing:
                db.add(SubscriptionPlan(**plan))
            else:
                existing.monthly_price = plan["monthly_price"]
                existing.yearly_price = plan["yearly_price"]
                existing.job_limit = plan["job_limit"]
                existing.resume_limit = plan["resume_limit"]
                existing.user_limit = plan["user_limit"]
                existing.features_json = plan["features_json"]
        db.commit()

        # 2. Auto-migrate existing users to default Organization
        users = db.query(User).filter(User.organization_id == None).all()
        for u in users:
            org_name = f"{u.full_name or u.email.split('@')[0]}'s Team"
            org = Organization(name=org_name, current_plan="NONE", plan_status="INACTIVE")
            db.add(org)
            db.commit()
            db.refresh(org)
            
            # Create usage tracking
            usage = UsageTracking(organization_id=org.id)
            db.add(usage)
            
            u.organization_id = org.id
            db.commit()
            
            # Link existing jobs to this organization
            jobs = db.query(Job).filter(Job.organization_id == None).all()
            for j in jobs:
                j.organization_id = org.id
            db.commit()

        # 3. Seed PromoCode
        founder_promo = db.query(PromoCode).filter(PromoCode.code == "FOUNDER50").first()
        if not founder_promo:
            founder_promo = PromoCode(
                code="FOUNDER50",
                discount_percentage=50,
                max_uses=50,
                current_uses=0,
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30),
                is_active=True
            )
            db.add(founder_promo)
            db.commit()
            
    finally:
        db.close()

@app.get("/")
def read_root():
    # Production deployment configuration trigger comment
    return {
        "app": "Hirecue API Gateway",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
