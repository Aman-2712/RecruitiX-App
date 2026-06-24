import os
import json
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_recruitix.db"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_12345"
# Clear OpenAI key to ensure Mock mode is tested
os.environ["OPENAI_API_KEY"] = ""

from app.main import app
from app.core.database import Base, get_db
from app.models import SubscriptionPlan, User, Organization, UsageTracking, Job, Candidate, CandidateExperience, CandidateEducation



# Create test database engine
engine = create_engine("sqlite:///./test_recruitix.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestRecruitix(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Dispose any existing engine connections and delete file
        try:
            engine.dispose()
            if os.path.exists("test_recruitix.db"):
                os.remove("test_recruitix.db")
        except Exception:
            pass
            
        # Override app.core.database engine and SessionLocal
        import app.core.database as db_module
        db_module.engine = engine
        db_module.SessionLocal = TestingSessionLocal

        
        # Create database tables
        Base.metadata.create_all(bind=engine)

        
        # Set dependency override
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

        
        # Trigger app startup events manually to seed plans
        from app.main import startup_event
        startup_event()

        # Mock email verification to succeed instantly in tests
        import app.api.auth as auth_api
        auth_api.send_verification_email = lambda email, token: True



    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        # Clean up database file
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        try:
            if os.path.exists("test_recruitix.db"):
                os.remove("test_recruitix.db")
        except Exception:
            pass
        try:
            if os.path.exists("uploads/test_resume.txt"):
                os.remove("uploads/test_resume.txt")
        except Exception:
            pass

    def test_complete_recruitment_flow(self):
        # 1. Register User
        register_payload = {
            "email": "recruiter@recruitix.com",
            "password": "SecurePassword123",
            "full_name": "Jane Recruiter",
            "role": "HR_MANAGER"
        }
        res = self.client.post("/api/auth/register", json=register_payload)
        self.assertEqual(res.status_code, 200)
        
        # Verify email using database token
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "recruiter@recruitix.com").first()
        verification_token = user.verification_token
        db.close()
        
        res_verify = self.client.post(f"/api/auth/verify-email?token={verification_token}")
        self.assertEqual(res_verify.status_code, 200)
        
        # Login to obtain access token
        login_payload = {
            "email": "recruiter@recruitix.com",
            "password": "SecurePassword123"
        }
        res_login = self.client.post("/api/auth/login-json", json=login_payload)
        self.assertEqual(res_login.status_code, 200)
        data = res_login.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "recruiter@recruitix.com")
        self.assertEqual(data["user"]["role"], "HR_MANAGER")
        
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Login JSON
        login_payload = {
            "email": "recruiter@recruitix.com",
            "password": "SecurePassword123"
        }
        res = self.client.post("/api/auth/login-json", json=login_payload)
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json())

        # 3. Create Job Posting
        job_payload = {
            "title": "Senior React Developer",
            "description": "We are looking for a Senior React Developer with experience in Next.js, TypeScript, Tailwind CSS, and Node.js.",
            "skills_required": ["React", "TypeScript", "Next.js"],
            "skills_preferred": ["Node.js", "Tailwind CSS", "AWS"],
            "min_experience": 5,
            "max_experience": 10,
            "education_required": "Bachelor's Degree",
            "location": "Remote"
        }
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        job_data = res.json()
        self.assertIn("id", job_data)
        job_id = job_data["id"]

        # 4. Parse Job Description Text Heuristic
        job_text_payload = {
            "text": "Senior Backend Developer\nLooking for Python, FastAPI and SQL. 3+ years experience. Remote."
        }
        res = self.client.post("/api/jobs/parse-text", data=job_text_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        parsed_job = res.json()
        self.assertEqual(parsed_job["title"], "Senior Backend Developer")
        self.assertIn("Python", parsed_job["skills_required"])
        self.assertEqual(parsed_job["min_experience"], 3)

        # 5. Upload Resume (Mock file)
        os.makedirs("uploads", exist_ok=True)
        resume_content = """
        Johnathan Candidate
        johnathan.candidate@gmail.com
        (123) 456-7890
        
        Summary:
        Experienced Software Developer with 6 years in Frontend development. 
        Specialized in TypeScript, React, Next.js, HTML, and CSS.
        
        Experience:
        Senior Software Developer at Tech Solutions (2022 - Present)
        Developed scalable React applications with Next.js.
        
        Education:
        Bachelor of Science in Computer Science from State Tech University (2018)
        """
        resume_filename = "test_resume.docx"
        from docx import Document
        doc = Document()
        doc.add_paragraph(resume_content)
        doc.save(f"uploads/{resume_filename}")

        # Post file upload
        with open(f"uploads/{resume_filename}", "rb") as f:
            res = self.client.post(
                "/api/resumes/upload",
                data={"job_id": job_id},
                files=[("files", (resume_filename, f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))],
                headers=headers
            )
        self.assertEqual(res.status_code, 200)
        upload_data = res.json()
        self.assertEqual(len(upload_data["processed"]), 1)
        candidate = upload_data["processed"][0]
        self.assertEqual(candidate["name"], "Johnathan Candidate")
        self.assertEqual(candidate["email"], "johnathan.candidate@gmail.com")
        self.assertTrue(candidate["match_score"] > 50)
        candidate_id = candidate["id"]

        # 6. List Candidates
        res = self.client.get(f"/api/candidates?job_id={job_id}", headers=headers)
        self.assertEqual(res.status_code, 200)
        candidates_list = res.json()
        self.assertEqual(len(candidates_list), 1)
        self.assertEqual(candidates_list[0]["id"], candidate_id)

        # 7. Get Candidate Details
        res = self.client.get(f"/api/candidates/{candidate_id}", headers=headers)
        self.assertEqual(res.status_code, 200)
        cand_detail = res.json()
        self.assertEqual(cand_detail["name"], "Johnathan Candidate")
        self.assertEqual(cand_detail["email"], "johnathan.candidate@gmail.com")
        self.assertEqual(cand_detail["phone"], "(123) 456-7890")
        self.assertEqual(len(cand_detail["experiences"]), 1) # check parsed experience
        self.assertEqual(len(cand_detail["educations"]), 1)

        # 8. Update Candidate Status
        res = self.client.put(f"/api/candidates/{candidate_id}/status", json={"status": "SHORTLISTED"}, headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "SHORTLISTED")

        # 9. Fetch Analytics
        res = self.client.get("/api/analytics", headers=headers)
        self.assertEqual(res.status_code, 200)
        analytics_data = res.json()
        self.assertEqual(analytics_data["total_jobs"], 1)
        self.assertEqual(analytics_data["total_candidates"], 1)
        self.assertTrue(analytics_data["time_saved_hours"] > 0)

    def test_auto_classify_candidates(self):
        # 1. Register and Login
        register_payload = {
            "email": "classifier@recruitix.com",
            "password": "SecurePassword123",
            "full_name": "Classifier Recruiter",
            "role": "HR_MANAGER"
        }
        res = self.client.post("/api/auth/register", json=register_payload)
        self.assertEqual(res.status_code, 200)
        
        # Verify email using database token
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "classifier@recruitix.com").first()
        verification_token = user.verification_token
        db.close()
        
        res_verify = self.client.post(f"/api/auth/verify-email?token={verification_token}")
        self.assertEqual(res_verify.status_code, 200)
        
        # Login to obtain access token
        login_payload = {
            "email": "classifier@recruitix.com",
            "password": "SecurePassword123"
        }
        res_login = self.client.post("/api/auth/login-json", json=login_payload)
        self.assertEqual(res_login.status_code, 200)
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a job
        job_payload = {
            "title": "Python Developer",
            "description": "FastAPI developer",
            "skills_required": ["Python", "FastAPI"],
            "skills_preferred": [],
            "min_experience": 2,
            "max_experience": 5,
            "education_required": "Bachelor's Degree",
            "location": "Remote"
        }
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        job_id = res.json()["id"]

        # 3. Use database session to add mock candidates directly
        db = TestingSessionLocal()
        try:
            # High score candidate (should be shortlisted)
            cand_high = Candidate(
                job_id=job_id,
                name="High Score Candidate",
                email="high@score.com",
                phone="111-222-3333",
                resume_path="uploads/high.pdf",
                match_score=85,
                status="APPLIED"
            )
            # Low score candidate (should be rejected)
            cand_low = Candidate(
                job_id=job_id,
                name="Low Score Candidate",
                email="low@score.com",
                phone="444-555-6666",
                resume_path="uploads/low.pdf",
                match_score=40,
                status="APPLIED"
            )
            # Medium score candidate (should remain applied)
            cand_mid = Candidate(
                job_id=job_id,
                name="Mid Score Candidate",
                email="mid@score.com",
                phone="777-888-9999",
                resume_path="uploads/mid.pdf",
                match_score=65,
                status="APPLIED"
            )
            # Already shortlisted/rejected candidate (should remain unchanged)
            cand_pre = Candidate(
                job_id=job_id,
                name="Pre-shortlisted Candidate",
                email="pre@score.com",
                phone="000-000-0000",
                resume_path="uploads/pre.pdf",
                match_score=40,  # low score but status already set manually
                status="HIRED"
            )
            db.add_all([cand_high, cand_low, cand_mid, cand_pre])
            db.commit()
        finally:
            db.close()

        # 4. Trigger auto-classify endpoint
        res = self.client.post(f"/api/jobs/{job_id}/auto-classify", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # Verify stats returned by API
        self.assertEqual(data["shortlisted"], 1)
        self.assertEqual(data["rejected"], 1)
        self.assertEqual(data["unchanged"], 2) # mid and pre
        self.assertEqual(data["total_processed"], 2) # high and low

        # 5. Verify database updates
        db = TestingSessionLocal()
        try:
            candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
            for cand in candidates:
                if cand.email == "high@score.com":
                    self.assertEqual(cand.status, "SHORTLISTED")
                elif cand.email == "low@score.com":
                    self.assertEqual(cand.status, "REJECTED")
                elif cand.email == "mid@score.com":
                    self.assertEqual(cand.status, "APPLIED")
                elif cand.email == "pre@score.com":
                    self.assertEqual(cand.status, "HIRED")
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
