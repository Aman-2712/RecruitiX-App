import os
import sys
import time

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models import User
from app.services.email_service import send_free_trial_broadcast_email

def main():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Found {len(users)} registered users in database.")
    
    sent_count = 0
    fail_count = 0
    
    for i, u in enumerate(users, start=1):
        if not u.email or "example.com" in u.email:
            continue
        try:
            safe_name = u.full_name.encode("ascii", "ignore").decode("ascii") if u.full_name else "No Name"
            print(f"[{i}/{len(users)}] Sending broadcast to {u.email} ({safe_name})...")
            success = send_free_trial_broadcast_email(u.email, u.full_name)
            if success:
                sent_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f"Error processing {u.email}: {e}")
            fail_count += 1
        # Brief pause between emails to avoid hitting rate limits
        time.sleep(0.3)
        
    print(f"\n==========================================")
    print(f"Broadcast Complete! Successfully sent: {sent_count} | Failed: {fail_count}")
    print(f"==========================================\n")

if __name__ == "__main__":
    main()
