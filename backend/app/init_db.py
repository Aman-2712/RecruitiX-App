import os
import sys
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path)

# Verify loaded variables
print("DATABASE_URL present:", bool(os.getenv("DATABASE_URL")))
print("SUPABASE_URL present:", bool(os.getenv("SUPABASE_URL")))
print("SUPABASE_KEY present:", bool(os.getenv("SUPABASE_KEY")))

# Import SQLAlchemy Base and Engine
from app.core.database import Base, engine

# Force import all models so SQLAlchemy is aware of them
from app.models import (
    SubscriptionPlan,
    Organization,
    UsageTracking,
    User,
    Job,
    Candidate,
    CandidateExperience,
    CandidateEducation
)

print("Tables found in metadata:", list(Base.metadata.tables.keys()))

# Create tables in PostgreSQL (Supabase)
print("Creating tables in Supabase...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Now initialize storage bucket
print("Initializing Supabase Storage...")
from app.services.storage_service import storage_manager
if storage_manager.use_supabase:
    print("Supabase Storage bucket 'resumes' checked/created successfully!")
else:
    print("Failed to initialize Supabase storage (storage_manager.use_supabase is False).")
