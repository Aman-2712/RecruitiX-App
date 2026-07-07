from app.services.email_service import send_team_invite_email
import sys

email = "nadeemshaik2712@gmail.com"
print(f"Testing sending invite email to {email}...")

result = send_team_invite_email(email, "Test Org", "Admin Name", "fake-token-123")
if result:
    print("SUCCESS! The email was sent.")
else:
    print("FAILED! The email could not be sent.")
