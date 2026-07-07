import os

file_path = "backend/app/services/email_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"Accept Invite & Set Password"', '"Join Team"')

new_function = """
def send_team_join_notification(admin_email: str, admin_name: str, joined_user: str):
    subject = f"✅ {joined_user} has joined your team!"
    admin_name_display = admin_name if admin_name else "Admin"
    html_content = f\"\"\"
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Team Member Joined</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Hi {admin_name_display},
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Great news! <strong>{joined_user}</strong> has accepted your invitation and joined the team on Hirecue.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            They can now log in and start collaborating on job postings and candidate reviews.
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{FRONTEND_URL}/dashboard/team" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                Manage Team
            </a>
        </div>
    </div>
    \"\"\"
    return send_email(admin_email, subject, html_content)
"""

if "def send_team_join_notification" not in content:
    content += "\n" + new_function

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Safe patch completed")
