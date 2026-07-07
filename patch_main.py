import os

file_path = "backend/app/main.py"
with open(file_path, "r") as f:
    content = f.read()

# Add import
import_target = "from app.api.billing import router as billing_router"
import_replacement = "from app.api.billing import router as billing_router\nfrom app.api.team import router as team_router"
if import_target in content and "from app.api.team import router as team_router" not in content:
    content = content.replace(import_target, import_replacement)

# Add route
route_target = "app.include_router(billing_router)"
route_replacement = "app.include_router(billing_router)\napp.include_router(team_router)"
if route_target in content and "app.include_router(team_router)" not in content:
    content = content.replace(route_target, route_replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Successfully patched main.py")
