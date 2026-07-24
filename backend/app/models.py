import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # STARTER, GROWTH, ENTERPRISE
    monthly_price = Column(Integer, default=0)
    yearly_price = Column(Integer, default=0)
    job_limit = Column(Integer, default=0)       # -1 for unlimited
    resume_limit = Column(Integer, default=0)    # -1 for unlimited
    user_limit = Column(Integer, default=0)      # -1 for unlimited
    features_json = Column(Text, nullable=True)  # JSON list of feature strings

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Billing fields
    current_plan = Column(String, default="STARTER") # STARTER, GROWTH, ENTERPRISE
    plan_status = Column(String, default="ACTIVE")    # ACTIVE, TRIAL, CANCELLED
    billing_cycle = Column(String, default="MONTHLY") # MONTHLY, YEARLY
    trial_end_date = Column(DateTime, nullable=True)
    subscription_start = Column(DateTime, default=datetime.datetime.utcnow)
    subscription_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization")
    jobs = relationship("Job", back_populates="organization", cascade="all, delete-orphan")
    usage = relationship("UsageTracking", back_populates="organization", cascade="all, delete-orphan", uselist=False)

class UsageTracking(Base):
    __tablename__ = "usage_tracking"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Current usage values
    jobs_created = Column(Integer, default=0)
    resumes_processed = Column(Integer, default=0)
    active_users = Column(Integer, default=1)
    
    billing_period_start = Column(DateTime, default=datetime.datetime.utcnow)
    billing_period_end = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=30))

    # Relationships
    organization = relationship("Organization", back_populates="usage")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="RECRUITER")  # ADMIN, HR_MANAGER, RECRUITER
    is_email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_password_token = Column(String, nullable=True)
    reset_password_expires = Column(DateTime, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="users")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(Text, nullable=True)  # JSON-encoded array
    skills_preferred = Column(Text, nullable=True)  # JSON-encoded array
    min_experience = Column(Integer, default=0)
    max_experience = Column(Integer, nullable=True)
    education_required = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, ARCHIVED
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    ai_model = Column(String, default="GEMINI")  # GEMINI, CLAUDE, GPT

    # Relationships
    organization = relationship("Organization", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # AI evaluations
    match_score = Column(Integer, default=0)
    skill_match_score = Column(Integer, default=0)
    experience_match_score = Column(Integer, default=0)
    relevance_score = Column(Integer, default=0)
    
    ai_summary = Column(Text, nullable=True)  # Why recommended
    ai_concerns = Column(Text, nullable=True) # Weaknesses / gaps
    
    resume_path = Column(String, nullable=True)
    status = Column(String, default="APPLIED")  # APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, REJECTED, HIRED
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="candidates")
    experiences = relationship("CandidateExperience", back_populates="candidate", cascade="all, delete-orphan")
    educations = relationship("CandidateEducation", back_populates="candidate", cascade="all, delete-orphan")
    skills_tests = relationship("SkillsTest", back_populates="candidate", cascade="all, delete-orphan")

class CandidateExperience(Base):
    __tablename__ = "candidate_experiences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    candidate = relationship("Candidate", back_populates="experiences")

class CandidateEducation(Base):
    __tablename__ = "candidate_educations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    major = Column(String, nullable=True)
    graduation_year = Column(String, nullable=True)

    # Relationships
    candidate = relationship("Candidate", back_populates="educations")

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_percentage = Column(Integer, default=50)
    max_uses = Column(Integer, default=50)
    current_uses = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SkillsTest(Base):
    __tablename__ = "skills_tests"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    test_questions = Column(Text, nullable=True)     # JSON string of questions
    candidate_answers = Column(Text, nullable=True)   # JSON string of candidate responses
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String, default="PENDING")        # PENDING, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills_tests")
