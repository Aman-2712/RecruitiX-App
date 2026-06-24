import os
import unittest
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_security.db"
os.environ["JWT_SECRET_KEY"] = "test_security_secret_12345"
os.environ["OPENAI_API_KEY"] = ""

from app.main import app
from app.core.database import Base, get_db
from app.models import User, Organization, UsageTracking, Job

# Create test database engine
engine = create_engine("sqlite:///./test_security.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

class TestSecurityAndHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            engine.dispose()
            if os.path.exists("test_security.db"):
                os.remove("test_security.db")
        except Exception:
            pass
            
        import app.core.database as db_module
        db_module.engine = engine
        db_module.SessionLocal = TestingSessionLocal

        Base.metadata.create_all(bind=engine)
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)
        
        # Trigger startup manually to seed
        from app.main import startup_event
        startup_event()
        
        # Disable rate limiting for other test cases by default
        from app.core.limiter import limiter
        limiter.enabled = False
        
        # Setup mock user and job
        db = TestingSessionLocal()
        org = Organization(name="Security Testing Org", current_plan="STARTER", plan_status="ACTIVE")
        db.add(org)
        db.commit()
        db.refresh(org)
        
        usage = UsageTracking(organization_id=org.id)
        db.add(usage)
        
        from app.core.security import get_password_hash
        user = User(
            email="security_test@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Security Test",
            role="RECRUITER",
            organization_id=org.id,
            is_email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        job = Job(
            title="Security Engineer",
            description="Secure things",
            skills_required='["Security"]',
            skills_preferred='["Python"]',
            min_experience=3,
            status="ACTIVE",
            organization_id=org.id
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        cls.job_id = job.id
        db.close()

    @classmethod
    def tearDownClass(cls):
        try:
            engine.dispose()
            if os.path.exists("test_security.db"):
                os.remove("test_security.db")
        except Exception:
            pass

    def test_security_headers_present(self):
        """Test that custom HTTP security headers are injected in responses."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertIn("default-src 'self'", response.headers.get("Content-Security-Policy", ""))
        self.assertIn("Strict-Transport-Security", response.headers)

    def test_rate_limiting_login_endpoint(self):
        """Test that hitting login-json repeatedly triggers rate limiting (HTTP 429)."""
        from app.core.limiter import limiter
        limiter.enabled = True
        try:
            payload = {
                "email": "security_test@example.com",
                "password": "password123"
            }
            
            # Reset limiter for clean state (clear limiter history by reloading if necessary or just hitting)
            # Auth rate limit for login is 5/minute. Let's hit it 6 times.
            triggered_429 = False
            for i in range(6):
                response = self.client.post("/api/auth/login-json", json=payload)
                if response.status_code == 429:
                    triggered_429 = True
                    break
                    
            self.assertTrue(triggered_429, "Rate limiter did not trigger HTTP 429 after 6 attempts")
        finally:
            limiter.enabled = False

    def test_file_upload_extension_validation(self):
        """Test that uploads with disallowed extensions are blocked with HTTP 400."""
        # Get login token
        login_res = self.client.post("/api/auth/login-json", json={
            "email": "security_test@example.com",
            "password": "password123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Disallowed extension: PNG
        file_payload = [
            ("files", ("resume.png", io.BytesIO(b"dummy image data"), "image/png"))
        ]
        response = self.client.post(
            "/api/resumes/upload",
            data={"job_id": self.job_id},
            files=file_payload,
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("invalid format", response.json()["detail"].lower())

    def test_file_upload_size_validation(self):
        """Test that uploads exceeding 5MB are blocked with HTTP 400."""
        # Get login token
        login_res = self.client.post("/api/auth/login-json", json={
            "email": "security_test@example.com",
            "password": "password123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Over 5MB file payload
        over_limit_data = b"0" * (5 * 1024 * 1024 + 100)
        file_payload = [
            ("files", ("huge_resume.pdf", io.BytesIO(over_limit_data), "application/pdf"))
        ]
        response = self.client.post(
            "/api/resumes/upload",
            data={"job_id": self.job_id},
            files=file_payload,
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeds the maximum limit of 5mb", response.json()["detail"].lower())

    def test_jwt_dynamic_fallback(self):
        """Test that the application warning-logs and sets a transient JWT SECRET_KEY when variable is missing."""
        import sys
        from importlib import reload
        import app.core.security as sec
        
        # Temporarily clear env key and reload security module
        old_val = os.environ.get("JWT_SECRET_KEY")
        if "JWT_SECRET_KEY" in os.environ:
            del os.environ["JWT_SECRET_KEY"]
            
        try:
            reload(sec)
            self.assertIsNotNone(sec.SECRET_KEY)
            self.assertNotEqual(sec.SECRET_KEY, "recruitix_super_secret_jwt_key_13579")
            self.assertEqual(len(sec.SECRET_KEY), 64) # secrets.token_hex(32) is 64 chars
        finally:
            # Restore env
            if old_val:
                os.environ["JWT_SECRET_KEY"] = old_val
            reload(sec)
