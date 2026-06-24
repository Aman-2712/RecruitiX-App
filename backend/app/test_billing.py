import os
import json
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_billing.db"
os.environ["JWT_SECRET_KEY"] = "billing_test_secret_key"
os.environ["OPENAI_API_KEY"] = ""

from app.main import app
from app.core.database import Base, get_db
from app.models import SubscriptionPlan, User, Organization, UsageTracking, Job, Candidate, CandidateExperience, CandidateEducation



# Create test database engine
engine = create_engine("sqlite:///./test_billing.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestRecruitixBilling(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Dispose any existing engine connections and delete file
        try:
            engine.dispose()
            if os.path.exists("test_billing.db"):
                os.remove("test_billing.db")
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
        # FastAPI TestClient doesn't automatically trigger startup events unless we use "with TestClient(app)" block,
        # but since we are running standalone test requests, let's call the startup_event function directly!
        from app.main import startup_event
        startup_event()

        # Mock email verification to succeed instantly in tests
        import app.api.auth as auth_api
        auth_api.send_verification_email = lambda email, token: True


    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        try:
            if os.path.exists("test_billing.db"):
                os.remove("test_billing.db")
        except Exception:
            pass

    def test_billing_gating_and_upgrade(self):
        # 1. Register User
        register_payload = {
            "email": "sarah@billingtest.com",
            "password": "SecurePassword123",
            "full_name": "Sarah Architect",
            "role": "HR_MANAGER"
        }
        res = self.client.post("/api/auth/register", json=register_payload)
        self.assertEqual(res.status_code, 200)
        
        # Verify email using database token
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "sarah@billingtest.com").first()
        verification_token = user.verification_token
        db.close()
        
        res_verify = self.client.post(f"/api/auth/verify-email?token={verification_token}")
        self.assertEqual(res_verify.status_code, 200)
        
        # Login to obtain access token
        login_payload = {
            "email": "sarah@billingtest.com",
            "password": "SecurePassword123"
        }
        res_login = self.client.post("/api/auth/login-json", json=login_payload)
        self.assertEqual(res_login.status_code, 200)
        data = res_login.json()
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Verify subscription details (should be STARTER by default)
        res = self.client.get("/api/billing/subscription", headers=headers)
        self.assertEqual(res.status_code, 200)
        sub_data = res.json()
        self.assertEqual(sub_data["current_plan"], "STARTER")
        self.assertEqual(sub_data["plan_status"], "ACTIVE")
        org_id = sub_data["organization_id"]

        # 3. Create Jobs (Starter limit is 3)
        job_payload = {
            "title": "Engineer",
            "description": "Requires React and Python.",
            "skills_required": ["React", "Python"],
            "skills_preferred": [],
            "min_experience": 2,
            "max_experience": None,
            "education_required": None,
            "location": "Remote"
        }
        
        # Job 1
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        
        # Job 2
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        
        # Job 3
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)

        # Job 4 - Should fail because limit is 3
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("limit reached", res.json()["detail"].lower())

        # 4. Check active usage
        res = self.client.get("/api/billing/usage", headers=headers)
        self.assertEqual(res.status_code, 200)
        usage_data = res.json()
        self.assertEqual(usage_data["jobs_created"], 3)
        self.assertEqual(usage_data["jobs_limit"], 3)

        # 5. Upgrade Organization to Growth via Upgrade Endpoint
        upgrade_payload = {
            "plan_name": "GROWTH",
            "billing_cycle": "MONTHLY"
        }
        res = self.client.post("/api/billing/upgrade", json=upgrade_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["current_plan"], "GROWTH")

        # 6. Verify upgraded subscription state
        res = self.client.get("/api/billing/subscription", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["current_plan"], "GROWTH")

        # 7. Try Job 4 again - Should succeed now!
        res = self.client.post("/api/jobs", json=job_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        
        # 8. Cancel subscription and verify reversion to STARTER
        res = self.client.post("/api/billing/cancel", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["current_plan"], "STARTER")
        self.assertEqual(res.json()["plan_status"], "CANCELLED")

        # 9. Test Webhook direct payment processing simulation
        webhook_payload = {
            "organization_id": org_id,
            "plan_name": "ENTERPRISE",
            "billing_cycle": "YEARLY"
        }
        res = self.client.post("/api/billing/webhook/payment", json=webhook_payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")
        
        # Get subscription state to verify Webhook updated it successfully
        res = self.client.get("/api/billing/subscription", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["current_plan"], "ENTERPRISE")
        self.assertEqual(res.json()["plan_status"], "ACTIVE")
        self.assertEqual(res.json()["billing_cycle"], "YEARLY")

if __name__ == "__main__":
    unittest.main()
