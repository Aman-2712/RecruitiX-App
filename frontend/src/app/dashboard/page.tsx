"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, Users, Award, Clock, ArrowRight, Bot, 
  CheckCircle2, PlusCircle, AlertCircle, RefreshCw 
} from "lucide-react";
import { api, AnalyticsData, Candidate, UsageTracking } from "@/lib/api";

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const analyticData = await api.getAnalytics();
      setAnalytics(analyticData);
      
      const candidateList = await api.getCandidates();
      setCandidates(candidateList.slice(0, 5));
      
      const usageInfo = await api.getUsage();
      setUsage(usageInfo);
      
      setError("");
    } catch (err: any) {
      setError("Failed to load dashboard data. Ensure the backend server is running.");
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Fetching analytics...</span>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      name: "Total Job Openings",
      value: analytics?.total_jobs ?? 0,
      icon: Briefcase,
      color: "bg-blue-500 text-blue-50",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-100",
      description: "Active job positions listed"
    },
    {
      name: "Total Applicants",
      value: analytics?.total_candidates ?? 0,
      icon: Users,
      color: "bg-indigo-500 text-indigo-50",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-100",
      description: "Resumes parsed and evaluated"
    },
    {
      name: "Average Match Score",
      value: `${analytics?.avg_match_score ?? 0}%`,
      icon: Award,
      color: "bg-emerald-500 text-emerald-50",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-100",
      description: "Overall candidate compatibility"
    },
    {
      name: "AI Time Saved",
      value: `${analytics?.time_saved_hours ?? 0} hrs`,
      icon: Clock,
      color: "bg-amber-500 text-amber-50",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-100",
      description: "Time saved vs manual screening"
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recruiting Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">AI-powered workspace for candidate screening</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 font-semibold text-sm shadow-sm transition-all"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
          <Link
            href="/dashboard/jobs/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all"
          >
            <PlusCircle size={16} />
            Post a Job
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl font-medium">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            {error} <br/>
            <span className="font-normal text-xs text-amber-700">Make sure the FastAPI server is running locally on port 8000.</span>
          </div>
        </div>
      )}

      {/* Usage Limit Gating Warning */}
      {usage && (
        (usage.jobs_limit !== -1 && usage.jobs_created >= usage.jobs_limit) ||
        (usage.resumes_limit !== -1 && usage.resumes_processed >= usage.resumes_limit)
      ) && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-150 text-red-800 p-4 rounded-xl font-medium shadow-sm">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <span className="font-bold">Subscription quota limit reached!</span> <br/>
            <span className="font-normal text-xs text-red-600">
              You have used {usage.jobs_created}/{usage.jobs_limit === -1 ? "Unlimited" : usage.jobs_limit} jobs and {usage.resumes_processed}/{usage.resumes_limit === -1 ? "Unlimited" : usage.resumes_limit} resumes. 
              Please go to the <Link href="/dashboard/billing" className="font-bold underline hover:text-red-800">Billing & Plans</Link> page to upgrade your account.
            </span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 premium-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{m.name}</span>
                <div className={`p-2.5 rounded-xl ${m.bgColor} ${m.textColor}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{m.value}</span>
                <p className="text-xs text-slate-500 font-medium">{m.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applicants */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 premium-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Candidate Screenings</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Matches evaluated across your jobs</p>
            </div>
            <Link href="/dashboard/jobs" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Jobs <ArrowRight size={14} />
            </Link>
          </div>

          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl space-y-3">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full">
                <Users size={28} />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No candidates analyzed yet</h4>
                <p className="text-xs text-slate-400">Create a job posting, and drag and drop resumes to view match scores.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {candidates.map((cand) => {
                const scoreColor = 
                  cand.match_score >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  cand.match_score >= 70 ? "bg-blue-50 text-blue-700 border-blue-100" :
                  "bg-slate-50 text-slate-600 border-slate-200";
                  
                return (
                  <div key={cand.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/dashboard/candidates/${cand.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline block truncate">
                        {cand.name || "Unknown Candidate"}
                      </Link>
                      <span className="text-xs text-slate-500 truncate block mt-1">
                        Applied for <span className="font-semibold">{cand.job_title}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${scoreColor}`}>
                        {cand.match_score}% Score
                      </div>
                      <span className="hidden sm:inline-block bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {cand.status}
                      </span>
                      <Link href={`/dashboard/candidates/${cand.id}`} className="text-slate-400 hover:text-slate-600 p-1">
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI HR Copilot Quick Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Recruiter Assistant</h2>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online & Active
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hiring Tips</h4>
            <div className="space-y-3.5 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="leading-tight">
                  <span className="font-bold text-slate-800">Job requirements:</span> Paste your complete PDF JD in the job screen. Hirecue automatically creates structured keywords.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="leading-tight">
                  <span className="font-bold text-slate-800">Bulk uploads:</span> You can select multiple resumes at once. Bulk limits: Starter (15), Growth (50), Enterprise (Unlimited).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="leading-tight">
                  <span className="font-bold text-slate-800">Copilot Summaries:</span> Every candidate detail card features list of strengths and red flags generated by the Copilot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
