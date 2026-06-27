import os
import logging
import requests

logger = logging.getLogger("hirecue.email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Hirecue <onboarding@resend.dev>")

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
