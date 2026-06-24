"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart3, RefreshCw, AlertCircle, Briefcase, Users, 
  Award, Clock, CheckCircle2, ChevronRight, Bot 
} from "lucide-react";
import { api, AnalyticsData } from "@/lib/api";

export default function HiringAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
      setError("");
    } catch (err: any) {
      setError("Failed to load analytics reports. Make sure the server is online.");
    }
  };

  useEffect(() => {
    fetchAnalytics().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Computing analytics reports...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { name: "Positions Posted", value: analytics?.total_jobs ?? 0, icon: Briefcase, color: "text-blue-600 bg-blue-50" },
    { name: "Candidates Tracked", value: analytics?.total_candidates ?? 0, icon: Users, color: "text-indigo-600 bg-indigo-50" },
    { name: "Average Compatibility", value: `${analytics?.avg_match_score ?? 0}%`, icon: Award, color: "text-emerald-600 bg-emerald-50" },
    { name: "Recruiter Time Saved", value: `${analytics?.time_saved_hours ?? 0} hrs`, icon: Clock, color: "text-amber-600 bg-amber-50" }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hiring Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time statistics on recruitment metrics and AI performance</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 font-semibold text-sm shadow-sm transition-all self-start sm:self-center"
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl font-medium">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Admin SaaS Revenue Dashboard */}
      {analytics?.admin_metrics && (
        <div className="space-y-6 pt-2 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-650" size={20} />
            <h2 className="text-xl font-bold text-slate-900">SaaS Administrator Dashboard</h2>
          </div>
          
          {/* Admin KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
              <div className="space-y-1">
                <span className="text-3xl font-black tracking-tight">{analytics.admin_metrics.active_subscriptions}</span>
                <p className="text-[10px] text-slate-400 font-semibold">Customers with active plan tiers</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MRR</span>
              <div className="space-y-1">
                <span className="text-3xl font-black tracking-tight">₹{analytics.admin_metrics.mrr.toLocaleString()}</span>
                <p className="text-[10px] text-slate-400 font-semibold">Monthly Recurring Revenue</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ARR</span>
              <div className="space-y-1">
                <span className="text-3xl font-black tracking-tight">₹{analytics.admin_metrics.arr.toLocaleString()}</span>
                <p className="text-[10px] text-slate-400 font-semibold">Annualized run-rate revenue</p>
              </div>
            </div>
            <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Churn Rate</span>
              <div className="space-y-1">
                <span className="text-3xl font-black tracking-tight">{analytics.admin_metrics.churn_rate}%</span>
                <p className="text-[10px] text-slate-400 font-semibold">Percentage of cancelled accounts</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Subscription Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm premium-border space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Plan Tier Distribution</h3>
              <div className="space-y-3">
                {["STARTER", "GROWTH", "ENTERPRISE"].map((tier) => {
                  const count = analytics.admin_metrics?.plan_distribution[tier] ?? 0;
                  const total = analytics.admin_metrics?.active_subscriptions || 1;
                  const percentage = Math.round((count / total) * 100);
                  
                  return (
                    <div key={tier} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-600">{tier}</span>
                        <span className="text-slate-500">{count} active ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Top Customer Usage */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm premium-border lg:col-span-2 space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Customer Subscription Accounts</h3>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {analytics.admin_metrics.customers.map((c) => (
                  <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-semibold gap-4">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{c.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {c.users_count} member(s) • {c.resumes_processed} resumes
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-100">
                        {c.plan}
                      </span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between premium-border">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{kpi.name}</span>
                <span className="text-3xl font-black text-slate-900 block tracking-tight">{kpi.value}</span>
              </div>
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts and Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recruitment Funnel Progress Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Hiring Pipeline Funnel</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Total candidates tracking across lifecycle stages</p>
          </div>

          <div className="space-y-4">
            {analytics?.funnel.map((item, idx) => {
              const maxCount = Math.max(...(analytics.funnel.map(f => f.count)), 1);
              const percentage = Math.round((item.count / maxCount) * 100);
              
              const barColor = 
                item.status === "HIRED" ? "bg-emerald-500" :
                item.status === "REJECTED" ? "bg-red-400" :
                item.status === "SHORTLISTED" ? "bg-indigo-500" :
                "bg-blue-500";

              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700 tracking-wide">{item.status.replace("_", " ")}</span>
                    <span className="text-slate-500">{item.count} candidate(s)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            {analytics?.total_candidates === 0 && (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">No candidates in the funnel yet.</p>
            )}
          </div>
        </div>

        {/* Skill Distributions and Top Skills matched */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Top Candidate Tech Stacks</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Frequency of extracted skills in candidate pool</p>
          </div>

          <div className="space-y-4">
            {analytics?.top_skills.map((item) => {
              const maxSkillCount = analytics.top_skills[0]?.count || 1;
              const skillPercentage = Math.round((item.count / maxSkillCount) * 100);

              return (
                <div key={item.skill} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">{item.skill}</span>
                    <span className="text-slate-400">{item.count} profile(s)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${skillPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {analytics?.top_skills.length === 0 && (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">No resume skills parsed yet.</p>
            )}
          </div>
        </div>

        {/* Compatibility Distributions (Distribution curve chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6 lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Compatibility Match Distribution</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Concentration of match score groupings in the candidate pool</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {analytics?.score_distribution.map((item) => {
              const count = item.count;
              
              const rangeColor =
                item.range === "90-100" ? "border-emerald-100 bg-emerald-50 text-emerald-700" :
                item.range === "80-89" ? "border-blue-100 bg-blue-50 text-blue-700" :
                item.range === "70-79" ? "border-indigo-100 bg-indigo-50 text-indigo-700" :
                "border-slate-200 bg-slate-50 text-slate-600";

              return (
                <div 
                  key={item.range} 
                  className={`p-5 rounded-2xl border text-center space-y-2 font-bold ${rangeColor}`}
                >
                  <span className="text-[10px] uppercase tracking-wider block opacity-70">Fit Range ({item.range})</span>
                  <span className="text-3xl font-black block leading-none">{count}</span>
                  <span className="text-[10px] font-semibold block opacity-60">Applicants</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
