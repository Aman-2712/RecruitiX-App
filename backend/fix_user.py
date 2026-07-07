from app.core.database import SessionLocal
from app.models import User, Organization

db = SessionLocal()

# Find the specific user
user = db.query(User).filter(User.email == "nadeemshaik2712@gmail.com").first()

if user:
    user.role = "ADMIN"
    user.is_email_verified = True  # Make them Active instead of Pending
    
    # Ensure they have an organization
    if not user.organization_id:
        org_name = f"{user.full_name or user.email.split('@')[0]}'s Team"
        org = Organization(name=org_name, current_plan="NONE", plan_status="INACTIVE")
        db.add(org)
        db.commit()
        db.refresh(org)
        user.organization_id = org.id
        
    db.commit()
    print(f"Successfully promoted {user.email} to ADMIN and verified email in organization {user.organization_id}")
else:
    print("User nadeemshaik2712@gmail.com not found in database.")

db.close()
