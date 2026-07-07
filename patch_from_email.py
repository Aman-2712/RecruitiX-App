import os

file_path = "backend/app/services/email_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = 'RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Hirecue <onboarding@resend.dev>")'
replacement = 'RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Hirecue <hello@hirecue.online>")'

content = content.replace(target, replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated FROM email to hello@hirecue.online")
