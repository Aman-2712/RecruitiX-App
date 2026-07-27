import os
import json
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_google.db"
os.environ["JWT_SECRET_KEY"] = "google_test_secret_key"
os.environ["OPENAI_API_KEY"] = ""

from app.main import app
from app.core.database import Base, get_db
from app.models import SubscriptionPlan, User, Organization, UsageTracking, Job, Candidate, CandidateExperience, CandidateEducation



# Create test database engine
engine = create_engine("sqlite:///./test_google.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestGoogleAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Dispose any existing engine connections and delete file
        try:
            engine.dispose()
            if os.path.exists("test_google.db"):
                os.remove("test_google.db")
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


    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        try:
            if os.path.exists("test_google.db"):
                os.remove("test_google.db")
        except Exception:
            pass

    def test_google_auth_registration_and_login(self):
        # 1. Test registration of a new user via Google mock token
        mock_payload = {
            "token": "mock_token:google_user@hirecue.com"
        }
        res = self.client.post("/api/auth/google", json=mock_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["email"], "google_user@hirecue.com")
        self.assertEqual(data["user"]["full_name"], "Google_User")
        token = data["access_token"]
        
        # 2. Verify subscription details were auto-created for this user's organization
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.get("/api/billing/subscription", headers=headers)
        self.assertEqual(res.status_code, 200)
        sub_data = res.json()
        self.assertEqual(sub_data["current_plan"], "STARTER")
        self.assertEqual(sub_data["plan_status"], "TRIAL")
        
        # 3. Test logging in again with the same mock token (should return existing user without duplicating)
        res = self.client.post("/api/auth/google", json=mock_payload)
        self.assertEqual(res.status_code, 200)
        data_login = res.json()
        self.assertEqual(data_login["user"]["id"], data["user"]["id"])
        self.assertEqual(data_login["user"]["email"], "google_user@hirecue.com")

if __name__ == "__main__":
    unittest.main()
