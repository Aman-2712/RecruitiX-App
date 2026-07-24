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

def send_candidate_interview_email(to_email: str, candidate_name: str, job_title: str, org_name: str):
    subject = f"Next Steps: Interview with {org_name} for {job_title}"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Interview Invitation! 📅</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Hi {candidate_name or "there"},
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Thank you for applying to the <strong>{job_title}</strong> position at <strong>{org_name}</strong>.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Our recruiting team has completed the initial review of your application, and we are excited to invite you for a virtual interview to learn more about your background and experience.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Please select a convenient time slot for a 30-minute meeting using the scheduling calendar link below:
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://cal.com/hirecue-interviews" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                Schedule Interview Slot
            </a>
        </div>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We look forward to speaking with you soon!
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
            Best regards,<br/>
            The Hiring Team at {org_name}<br/>
            Processed securely via <a href="https://hirecue.online" style="color: #2563eb; text-decoration: none;">Hirecue.online</a>
        </p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_candidate_rejection_email(to_email: str, candidate_name: str, job_title: str, org_name: str):
    subject = f"Application Update: {job_title} at {org_name}"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #475569; margin-bottom: 20px;">Thank you for your application</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Hi {candidate_name or "there"},
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Thank you for your interest in the <strong>{job_title}</strong> role at <strong>{org_name}</strong> and for taking the time to submit your application.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We received a large volume of competitive applications for this position. While we were impressed with your credentials, we have decided to move forward with other candidates whose profiles more closely match our immediate requirements.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We appreciate the effort you put into your application, and we will keep your profile in our talent network for future openings that match your skills.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            We wish you the very best in your professional job search.
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
            Best regards,<br/>
            The Hiring Team at {org_name}<br/>
            Processed securely via <a href="https://hirecue.online" style="color: #2563eb; text-decoration: none;">Hirecue.online</a>
        </p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_candidate_reengagement_email(to_email: str, candidate_name: str, job_title: str, org_name: str):
    subject = f"New Opportunity: {job_title} role at {org_name}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Job Opportunity</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 28px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.025em;">hire<span style="color: #2563eb;">cue</span></div>
                <div style="font-size: 11px; font-weight: 700; color: #b5c2d9; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Talent Pool Match</div>
            </div>
            
            <p style="font-size: 15px; font-weight: 600; line-height: 1.6; color: #334155;">Hello {candidate_name or "there"},</p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Our AI Talent Agent matching engine recently scanned our active applicant pool and flagged your profile as a fantastic fit for a new role we just opened: <strong>{job_title}</strong> at <strong>{org_name}</strong>.
            </p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Having reviewed your past applications, we believe your skills align perfectly with our current engineering requirements. We would love to fast-track your profile for this new position.
            </p>
            
            <div style="margin: 35px 0; text-align: center;">
                <a href="https://hirecue.online" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 13px; font-weight: 700; border-radius: 12px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); transition: all 0.2s;">View Role & Express Interest</a>
            </div>
            
            <p style="font-size: 12px; line-height: 1.6; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 40px;">
                Best regards,<br>
                The Talent Acquisition Team<br>
                <strong>{org_name}</strong>
            </p>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_content)

def send_enterprise_welcome_email(to_email: str, user_name: str, org_name: str):
    subject = "Welcome to HireCue Enterprise Plan!"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to HireCue Enterprise</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafafa; color: #1a1a1a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 28px; font-weight: 800; color: #0f172a;">hire<span style="color: #6366f1;">cue</span></div>
                <div style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Enterprise Subscription Upgrade</div>
            </div>
            
            <p style="font-size: 15px; font-weight: 600; color: #1e293b;">Dear {user_name or "Partner"},</p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Congratulations! Your organization <strong>{org_name}</strong> has successfully upgraded to the **HireCue Enterprise Plan**.
            </p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Your workspace is now upgraded with premium visual custom branding, unlimited candidate parsing, and enterprise security features. Here is what has been unlocked in your dashboard:
            </p>
            
            <ul style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px;">
                <li>🎨 <strong>Rose Gold & Platinum Theme Reskin:</strong> Elite recruiter layout design.</li>
                <li>⚙️ <strong>SSO Config & Compliance Audit Logs:</strong> SAML integration support (Okta, Azure AD) and exportable activity trails.</li>
                <li>🤖 <strong>Multi-AI Model Selection:</strong> Gated matching engine supporting Gemini, Claude, and GPT-4o.</li>
                <li>💬 <strong>Candidate AI Interview Simulator:</strong> Text-based candidate interaction sandbox.</li>
                <li>📈 <strong>Talent Pool Re-Engagement:</strong> Past candidates matching scanner agent.</li>
                <li>📝 <strong>AI Skills Test Generator & Sandbox Editor:</strong> Technical coding exercises with live grading scorecards.</li>
            </ul>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                We are thrilled to help you build and scale your engineering teams. If you need any assistance setting up your SSO or configuring models, please contact your account manager directly.
            </p>
            
            <div style="margin: 35px 0; text-align: center;">
                <a href="{FRONTEND_URL}/dashboard" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 13px; font-weight: 700; border-radius: 12px; display: inline-block;">Go to Enterprise Dashboard</a>
            </div>
            
            <p style="font-size: 12px; line-height: 1.6; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 40px;">
                Best regards,<br>
                The HireCue Customer Success Team<br>
                <strong>HireCue.online</strong>
            </p>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_content)
