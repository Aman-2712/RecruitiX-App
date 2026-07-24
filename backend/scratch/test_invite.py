import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models import Candidate, Job, User
from app.services.email_service import send_candidate_reengagement_email

def test():
    db = SessionLocal()
    try:
        # Find first job and candidate
        job = db.query(Job).first()
        if not job:
            print("No jobs found in DB.")
            return
            
        cand = db.query(Candidate).filter(Candidate.job_id != job.id).first()
        if not cand:
            print("No candidates found that belong to another job.")
            cand = db.query(Candidate).first()
            if not cand:
                print("No candidates in DB at all.")
                return

        print(f"Testing invite of Candidate {cand.id} ({cand.name}) to Job {job.id} ({job.title})")
        
        # Test the email service
        print("Sending test re-engagement email...")
        email_sent = send_candidate_reengagement_email(
            to_email="test@hirecue.online",
            candidate_name=cand.name,
            job_title=job.title,
            org_name="Hirecue Test Org"
        )
        print(f"Email service returned: {email_sent}")
        
        # Simulating duplicate logic
        new_cand = Candidate(
            job_id=job.id,
            name=cand.name + " (Test Copy)",
            email=cand.email,
            phone=cand.phone,
            match_score=cand.match_score,
            skill_match_score=cand.skill_match_score,
            experience_match_score=cand.experience_match_score,
            relevance_score=cand.relevance_score,
            ai_summary=cand.ai_summary,
            ai_concerns=cand.ai_concerns,
            resume_path=cand.resume_path,
            raw_text=cand.raw_text,
            status="APPLIED"
        )
        db.add(new_cand)
        db.flush()
        print(f"Flushed candidate copy successfully. New candidate ID: {new_cand.id}")
        
        # Copy experiences
        from app.models import CandidateExperience, CandidateEducation
        for exp in cand.experiences:
            new_exp = CandidateExperience(
                candidate_id=new_cand.id,
                company=exp.company,
                role=exp.role,
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description
            )
            db.add(new_exp)
            
        # Copy educations
        for edu in cand.educations:
            new_edu = CandidateEducation(
                candidate_id=new_cand.id,
                institution=edu.institution,
                degree=edu.degree,
                major=edu.major,
                graduation_year=edu.graduation_year
            )
            db.add(new_edu)
            
        db.commit()
        print("Database commit succeeded!")
        
        # Cleanup
        db.delete(new_cand)
        db.commit()
        print("Database cleaned up successfully.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
