import os
import logging
import requests

logger = logging.getLogger("hirecue.email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Hirecue <hello@hirecue.online>")

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Sends an email using Resend API. Falls back to console log if key is not configured.
    """
    if not RESEND_API_KEY or RESEND_API_KEY.startswith("mock"):
        logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
        print(f"\n{'='*50}\n[MOCK EMAIL] TO: {to_email}\nSUBJECT: {subject}\nCONTENT:\n{html_content}\n{'='*50}\n")
        return True

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=15)
        
        if response.status_code in [200, 201]:
            logger.info(f"Email successfully sent to {to_email} via Resend")
            return True
        else:
            logger.error(f"Failed to send email to {to_email}. Resend API returned status {response.status_code}: {response.text}")
            print(f"\n[ERROR] Resend API Failed: {response.text}\n")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email to {to_email} via Resend: {e}")
        return False

def send_verification_email(to_email: str, verification_token: str):
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    subject = "Verify your Hirecue account"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Welcome to Hirecue!</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Thank you for registering. Please verify your email address to activate your recruiter account and start screening candidates with AI.
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{verification_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="{verification_link}" style="color: #2563eb;">{verification_link}</a>
        </p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_password_reset_email(to_email: str, reset_token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset your Hirecue password"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We received a request to reset your password for your Hirecue account. Click the button below to choose a new password. This link is valid for 1 hour.
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If you did not request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="{reset_link}" style="color: #2563eb;">{reset_link}</a>
        </p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_welcome_email(to_email: str, user_name: str):
    name_display = user_name if user_name else "there"
    subject = "Welcome to Hirecue!"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Welcome to Hirecue, {name_display}!</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We are thrilled to have you on board! Hirecue is designed to save you hours of manual resume screening by leveraging advanced AI to instantly rank your top candidates.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            <strong>To get started:</strong>
            <ol>
                <li>Create your first Job Post</li>
                <li>Upload your candidate resumes</li>
                <li>Let our AI rank and score them instantly!</li>
            </ol>
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                Go to Dashboard
            </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If you have any questions, just reply to this email!
        </p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_admin_notification(user_email: str, user_name: str):
    admin_email = "shaiknadeem271226@gmail.com"
    name_display = user_name if user_name else "Unknown"
    subject = f"🎉 New User Registered: {name_display}"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">New Sign-up Alert! 🚀</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            A new user has just registered on Hirecue.online!
        </p>
        <ul style="font-size: 14px; color: #475569; line-height: 1.5;">
            <li><strong>Name:</strong> {name_display}</li>
            <li><strong>Email:</strong> {user_email}</li>
        </ul>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Keep up the great marketing!
        </p>
    </div>
    """
    return send_email(admin_email, subject, html_content)


def send_team_invite_email(to_email: str, org_name: str, inviter_name: str, reset_token: str = None):
    subject = f"You've been invited to join {org_name} on Hirecue"
    
    if reset_token:
        action_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        action_text = "Join Team"
        extra_text = "You have been invited to join your team. Click below to set your password and access your new account."
    else:
        action_link = f"{FRONTEND_URL}/dashboard"
        action_text = "Go to Dashboard"
        extra_text = "You have been added to the team! You can now log in and collaborate."
        
    html_content = f"""
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
    """
    return send_email(to_email, subject, html_content)


def send_team_join_notification(admin_email: str, admin_name: str, joined_user: str):
    subject = f"✅ {joined_user} has joined your team!"
    admin_name_display = admin_name if admin_name else "Admin"
    html_content = f"""
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
    """
    return send_email(admin_email, subject, html_content)

def send_promo_exhausted_notification(promo_code: str):
    admin_email = "shaiknadeem271226@gmail.com"
    subject = f"⚠️ Promo Code Exhausted: {promo_code}"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Promo Code Limit Reached! 🚨</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            The promotional offer <strong>{promo_code}</strong> has just hit its maximum usage limit or expired.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Users will no longer be able to claim this discount. You can set up a new offer by adding a new promo code to the database!
        </p>
    </div>
    """
    return send_email(admin_email, subject, html_content)
