import os

file_path = "frontend/src/lib/api.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add TeamMember interface
interface_code = """
export interface TeamMember {
  id: number;
  email: string;
  full_name: string | null;
  role: "ADMIN" | "HR_MANAGER" | "RECRUITER";
  is_email_verified: boolean;
  created_at: string;
}
"""

if "export interface TeamMember" not in content:
    content = content.replace("export interface User {", interface_code + "\nexport interface User {")

# Add Team API methods
team_api_code = """
  // Team API
  async getTeamMembers(): Promise<TeamMember[]> {
    return request<TeamMember[]>("/api/team");
  },

  async inviteTeamMember(email: string, role: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/team/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async updateTeamMemberRole(userId: number, role: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/team/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async removeTeamMember(userId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/team/${userId}`, {
      method: "DELETE",
    });
  },
"""

if "getTeamMembers()" not in content:
    content = content.replace("  logout() {", team_api_code + "\n  logout() {")

with open(file_path, "w") as f:
    f.write(content)
print("Successfully patched api.ts")
