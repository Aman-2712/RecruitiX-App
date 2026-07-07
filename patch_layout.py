import os

file_path = "frontend/src/app/dashboard/layout.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add Users icon
icon_target = "Bot, LayoutDashboard, Briefcase, BarChart3, LogOut, User, Menu, X, CreditCard"
icon_replacement = "Bot, LayoutDashboard, Briefcase, BarChart3, LogOut, User, Menu, X, CreditCard, Users"
if icon_target in content:
    content = content.replace(icon_target, icon_replacement)

# Add nav item
nav_target = '{ name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },'
nav_replacement = '{ name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },\n    { name: "Team Settings", href: "/dashboard/team", icon: Users },'
if nav_target in content and "/dashboard/team" not in content:
    content = content.replace(nav_target, nav_replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Successfully patched layout.tsx")
