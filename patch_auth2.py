import os

file_path = "backend/app/api/auth.py"
with open(file_path, "r") as f:
    content = f.read()

# Add import for send_team_join_notification
import_target = "from app.services.email_service import send_verification_email, send_welcome_email, send_admin_notification, send_password_reset_email"
import_replacement = "from app.services.email_service import send_verification_email, send_welcome_email, send_admin_notification, send_password_reset_email, send_team_join_notification"
if import_target in content and "send_team_join_notification" not in content:
    content = content.replace(import_target, import_replacement)

# Also patch def reset_password signature to include background_tasks
sig_target = "def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):"
sig_replacement = "def reset_password(request: Request, payload: ResetPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):"
if sig_target in content:
    content = content.replace(sig_target, sig_replacement)

# Update reset_password logic
logic_target = """    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    user.is_email_verified = True
    db.commit()"""

logic_replacement = """    was_unverified = not user.is_email_verified
    org_id = user.organization_id

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    user.is_email_verified = True
    db.commit()
    
    if was_unverified and org_id:
        admins = db.query(User).filter(User.organization_id == org_id, User.role == "ADMIN").all()
        for admin in admins:
            background_tasks.add_task(send_team_join_notification, admin.email, admin.full_name, user.full_name or user.email)
"""

if logic_target in content:
    content = content.replace(logic_target, logic_replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Successfully patched auth.py")
