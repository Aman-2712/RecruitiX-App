import os

file_path = "backend/app/api/auth.py"
with open(file_path, "r") as f:
    content = f.read()

target = "    user.reset_password_expires = None\n    db.commit()"
replacement = "    user.reset_password_expires = None\n    user.is_email_verified = True\n    db.commit()"

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w") as f:
        f.write(content)
    print("Successfully patched auth.py")
else:
    print("Target string not found in auth.py")
