const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export interface TeamMember {
  id: number;
  email: string;
  full_name: string | null;
  role: "ADMIN" | "HR_MANAGER" | "RECRUITER";
  is_email_verified: boolean;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "HR_MANAGER" | "RECRUITER";
}

export interface Job {
  id: number;
  title: string;
  description: string;
  skills_required: string[];
  skills_preferred: string[];
  min_experience: number;
  max_experience?: number;
  education_required?: string;
  location?: string;
  status: "ACTIVE" | "ARCHIVED";
  created_at: string;
  candidate_count?: number;
}

export interface Candidate {
  id: number;
  job_id: number;
  job_title: string;
  name: string;
  email: string;
  phone: string;
  match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  relevance_score: number;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "INTERVIEWED" | "REJECTED" | "HIRED";
  skills: string[];
  created_at: string;
}

export interface CandidateExperience {
  id: number;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface CandidateEducation {
  id: number;
  institution: string;
  degree: string;
  major: string;
  graduation_year: string;
}

export interface CandidateDetail extends Candidate {
  ai_summary: string;
  ai_concerns: string;
  raw_text: string;
  experiences: CandidateExperience[];
  educations: CandidateEducation[];
}

export interface AnalyticsData {
  total_jobs: number;
  total_candidates: number;
  avg_match_score: number;
  time_saved_hours: number;
  funnel: { status: string; count: number }[];
  top_skills: { skill: string; count: number }[];
  score_distribution: { range: string; count: number }[];
  admin_metrics?: {
    active_subscriptions: number;
    mrr: number;
    arr: number;
    churn_rate: number;
    plan_distribution: { [key: string]: number };
    customers: {
      id: number;
      name: string;
      plan: string;
      status: string;
      users_count: number;
      resumes_processed: number;
    }[];
  };
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_price: number;
  yearly_price: number;
  job_limit: number;
  resume_limit: number;
  user_limit: number;
  features: string[];
}

export interface Organization {
  organization_id: number;
  organization_name: string;
  current_plan: "STARTER" | "GROWTH" | "ENTERPRISE" | "NONE";
  plan_status: "ACTIVE" | "CANCELLED" | "TRIAL" | "INACTIVE" | "ONBOARDING";
  billing_cycle: "MONTHLY" | "YEARLY";
  trial_end_date: string | null;
  subscription_start: string;
  subscription_end: string | null;
  plan_features: string[];
}

export interface UsageTracking {
  jobs_created: number;
  jobs_limit: number;
  resumes_processed: number;
  resumes_limit: number;
  active_users: number;
  users_limit: number;
  billing_period_start: string;
  billing_period_end: string;
}

export interface Invoice {
  invoice_no: string;
  date: string;
  plan: string;
  amount: number;
  status: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("hirecue_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set Content-Type to application/json by default unless we are sending FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hirecue_token");
      localStorage.removeItem("hirecue_user");
      // Redirect to login only if not already on an auth page
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 244 || response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await request<{ access_token: string; user: User }>("/api/auth/login-json", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("hirecue_token", res.access_token);
    localStorage.setItem("hirecue_user", JSON.stringify(res.user));
    return res;
  },

  async register(email: string, password: string, full_name: string, role: string): Promise<{ message: string }> {
    const res = await request<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name, role }),
    });
    return res;
  },

  async googleLogin(token: string): Promise<{ access_token: string; user: User }> {
    const res = await request<{ access_token: string; user: User }>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    localStorage.setItem("hirecue_token", res.access_token);
    localStorage.setItem("hirecue_user", JSON.stringify(res.user));
    return res;
  },

  async getCurrentUser(): Promise<User> {
    return request<User>("/api/auth/me");
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  },


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

  logout() {
    localStorage.removeItem("hirecue_token");
    localStorage.removeItem("hirecue_user");
  },

  // Jobs API
  async getJobs(): Promise<Job[]> {
    return request<Job[]>("/api/jobs");
  },

  async getJob(id: number): Promise<Job> {
    return request<Job>(`/api/jobs/${id}`);
  },

  async createJob(job: Omit<Job, "id" | "status" | "created_at">): Promise<{ id: number }> {
    return request<{ id: number }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    });
  },

  async deleteJob(id: number): Promise<void> {
    return request<void>(`/api/jobs/${id}`, {
      method: "DELETE",
    });
  },

  async parseJobDescription(text: string): Promise<Omit<Job, "id" | "status" | "created_at" | "candidate_count">> {
    const formData = new FormData();
    formData.append("text", text);
    return request<Omit<Job, "id" | "status" | "created_at" | "candidate_count">>("/api/jobs/parse-text", {
      method: "POST",
      body: formData,
    });
  },

  // Resumes API
  async uploadResumes(jobId: number, files: File[]): Promise<{ processed: any[] }> {
    const formData = new FormData();
    formData.append("job_id", jobId.toString());
    files.forEach((file) => {
      formData.append("files", file);
    });
    return request<{ processed: any[] }>("/api/resumes/upload", {
      method: "POST",
      body: formData,
    });
  },

  // Candidates API
  async getCandidates(params: {
    job_id?: number;
    status?: string;
    min_score?: number;
    query?: string;
  } = {}): Promise<Candidate[]> {
    const queryParts = [];
    if (params.job_id !== undefined) queryParts.push(`job_id=${params.job_id}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.min_score !== undefined) queryParts.push(`min_score=${params.min_score}`);
    if (params.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);

    const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
    return request<Candidate[]>(`/api/candidates${queryString}`);
  },

  async getCandidate(id: number): Promise<CandidateDetail> {
    return request<CandidateDetail>(`/api/candidates/${id}`);
  },

  async updateCandidateStatus(id: number, status: string): Promise<{ id: number; status: string }> {
    return request<{ id: number; status: string }>(`/api/candidates/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async deleteCandidate(id: number): Promise<void> {
    return request<void>(`/api/candidates/${id}`, {
      method: "DELETE",
    });
  },

  getResumeUrl(id: number): string {
    const token = typeof window !== "undefined" ? localStorage.getItem("hirecue_token") : "";
    return `${API_BASE_URL}/api/candidates/${id}/resume?token=${token}`;
  },

  // Analytics API
  async getAnalytics(): Promise<AnalyticsData> {
    return request<AnalyticsData>("/api/analytics");
  },

  // Billing API
  async getPlans(): Promise<SubscriptionPlan[]> {
    return request<SubscriptionPlan[]>("/api/billing/plans");
  },

  async getSubscription(): Promise<Organization> {
    return request<Organization>("/api/billing/subscription");
  },

  async getUsage(): Promise<UsageTracking> {
    return request<UsageTracking>("/api/billing/usage");
  },

  async startTrial(): Promise<any> {
    return request<any>("/api/billing/start-trial", {
      method: "POST",
    });
  },

  async upgradePlan(planName: string, billingCycle: string = "MONTHLY"): Promise<any> {
    return request<any>("/api/billing/upgrade", {
      method: "POST",
      body: JSON.stringify({ plan_name: planName, billing_cycle: billingCycle }),
    });
  },

  async cancelSubscription(): Promise<any> {
    return request<any>("/api/billing/cancel", {
      method: "POST",
    });
  },

  async getBillingHistory(): Promise<Invoice[]> {
    return request<Invoice[]>("/api/billing/billing-history");
  },

  async triggerMockPaymentWebhook(orgId: number, planName: string, billingCycle: string = "MONTHLY"): Promise<any> {
    return request<any>("/api/billing/webhook/payment", {
      method: "POST",
      body: JSON.stringify({ organization_id: orgId, plan_name: planName, billing_cycle: billingCycle })
    });
  },

  async createRazorpayOrder(planName: string, billingCycle: string = "MONTHLY", couponCode?: string): Promise<{order_id: string, amount: number, currency: string, key_id: string, notes?: any}> {
    return request<{order_id: string, amount: number, currency: string, key_id: string, notes?: any}>("/api/billing/create-razorpay-order", {
      method: "POST",
      body: JSON.stringify({ plan_name: planName, billing_cycle: billingCycle, coupon_code: couponCode }),
    });
  },

  async autoClassifyCandidates(jobId: number): Promise<{ shortlisted: number; rejected: number; unchanged: number; total_processed: number }> {
    return request<{ shortlisted: number; rejected: number; unchanged: number; total_processed: number }>(`/api/jobs/${jobId}/auto-classify`, {
      method: "POST",
    });
  },
};
