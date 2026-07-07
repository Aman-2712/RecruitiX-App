email_code = """
def send_team_invite_email(to_email: str, org_name: str, inviter_name: str, reset_token: str = None):
    subject = f"You've been invited to join {org_name} on Hirecue"
    
    if reset_token:
        action_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        action_text = "Accept Invite & Set Password"
        extra_text = "You have been invited to join your team. Click below to set your password and access your new account."
    else:
        action_link = f"{FRONTEND_URL}/dashboard"
        action_text = "Go to Dashboard"
        extra_text = "You have been added to the team! You can now log in and collaborate."
        
    html_content = f\"\"\"
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Team Invitation</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            <strong>{inviter_name}</strong> has invited you to join <strong>{org_name}</strong> on Hirecue!
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            {extra_text}
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{action_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                {action_text}
            </a>
        </div>
    </div>
    \"\"\"
    return send_email(to_email, subject, html_content)
"""

with open("backend/app/services/email_service.py", "a") as f:
    f.write("\n" + email_code)
print("Successfully appended send_team_invite_email to email_service.py")
