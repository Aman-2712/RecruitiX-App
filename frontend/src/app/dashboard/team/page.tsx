"use client";

import React, { useState, useEffect } from "react";
import { api, TeamMember, User } from "@/lib/api";
import { Users, Mail, Shield, ShieldAlert, Trash2, Plus, X, Check, Loader2, Link as LinkIcon, GitBranch, Key, Lock, Settings } from "lucide-react";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("RECRUITER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);



  const [activeTab, setActiveTab] = useState<"members" | "ats" | "workflows" | "api">("members");
  const [currentPlan, setCurrentPlan] = useState<string>("STARTER");
  
  // ATS State
  const [atsConnections, setAtsConnections] = useState<Record<string, boolean>>({
    greenhouse: false,
    workday: false,
    lever: false,
    bamboohr: false
  });
  
  // Custom Workflow State
  const [workflowTrigger, setWorkflowTrigger] = useState("match_score");
  const [workflowValue, setWorkflowValue] = useState(80);
  const [workflowAction, setWorkflowAction] = useState("shortlist");
  const [workflows, setWorkflows] = useState<any[]>([]);
  
  // API Key State
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  // ATS Modal State
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [selectedAts, setSelectedAts] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [syncJobs, setSyncJobs] = useState(true);
  const [syncScores, setSyncScores] = useState(true);
  const [stageThreshold, setStageThreshold] = useState(75);

  const fetchData = async () => {
    try {
      const userStr = localStorage.getItem("hirecue_user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
      
      const cachedPlan = localStorage.getItem("hirecue_plan");
      if (cachedPlan) {
        setCurrentPlan(cachedPlan);
      } else {
        const sub = await api.getSubscription();
        setCurrentPlan(sub.current_plan);
      }
      
      const teamData = await api.getTeamMembers();
      setMembers(teamData);
      
      // Load saved mocks from localStorage
      const savedAts = localStorage.getItem("mock_ats");
      if (savedAts) setAtsConnections(JSON.parse(savedAts));
      
      const savedWorkflows = localStorage.getItem("mock_workflows");
      if (savedWorkflows) setWorkflows(JSON.parse(savedWorkflows));
      
      const savedApiKey = localStorage.getItem("mock_api_key");
      if (savedApiKey) setApiKey(savedApiKey);
      
      const savedWebhook = localStorage.getItem("mock_webhook");
      if (savedWebhook) setWebhookUrl(savedWebhook);
    } catch (err) {
      console.error("Failed to load team settings page data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess(false);
    
    try {
      await api.inviteTeamMember(inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail("");
      fetchData(); // reload team
      
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (userId === currentUser?.id) return;
    try {
      await api.updateTeamMemberRole(userId, newRole);
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole as any } : m));
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleRemove = async (userId: number) => {
    if (userId === currentUser?.id) return;
    if (!confirm("Are you sure you want to remove this user from your team?")) return;
    
    try {
      await api.removeTeamMember(userId);
      setMembers(members.filter(m => m.id !== userId));
    } catch (err: any) {
      alert(err.message || "Failed to remove user");
    }
  };

  // Mocks Handlers
  const handleToggleAts = (platform: string) => {
    const updated = { ...atsConnections, [platform]: !atsConnections[platform] };
    setAtsConnections(updated);
    localStorage.setItem("mock_ats", JSON.stringify(updated));
  };

  const handleSaveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorkflow = {
      id: Date.now(),
      trigger: workflowTrigger,
      value: workflowValue,
      action: workflowAction,
      active: true
    };
    const updated = [...workflows, newWorkflow];
    setWorkflows(updated);
    localStorage.setItem("mock_workflows", JSON.stringify(updated));
  };

  const handleDeleteWorkflow = (id: number) => {
    const updated = workflows.filter(w => w.id !== id);
    setWorkflows(updated);
    localStorage.setItem("mock_workflows", JSON.stringify(updated));
  };

  const handleGenerateKey = () => {
    const key = `hc_live_key_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(key);
    localStorage.setItem("mock_api_key", key);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mock_webhook", webhookUrl);
    alert("Webhook URL configured successfully!");
  };

  const handleConfigureAts = (atsId: string) => {
    setSelectedAts(atsId);
    const saved = localStorage.getItem(`mock_ats_config_${atsId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSubdomain(parsed.subdomain || "");
      setApiKeyInput(parsed.apiKeyInput || "");
      setWebhookSecret(parsed.webhookSecret || "");
      setSyncJobs(parsed.syncJobs !== false);
      setSyncScores(parsed.syncScores !== false);
      setStageThreshold(parsed.stageThreshold || 75);
    } else {
      setSubdomain("");
      setApiKeyInput("");
      setWebhookSecret("");
      setSyncJobs(true);
      setSyncScores(true);
      setStageThreshold(75);
    }
    setIsAtsModalOpen(true);
  };

  const handleSaveAtsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAts) return;
    const config = {
      subdomain,
      apiKeyInput,
      webhookSecret,
      syncJobs,
      syncScores,
      stageThreshold
    };
    localStorage.setItem(`mock_ats_config_${selectedAts}`, JSON.stringify(config));
    setIsAtsModalOpen(false);
    alert(`${selectedAts.charAt(0).toUpperCase() + selectedAts.slice(1)} integration settings updated successfully!`);
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const isUnlocked = currentPlan === "GROWTH" || currentPlan === "ENTERPRISE";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Common lock screen for locked tabs on Starter Plan
  const renderLockScreen = (title: string, desc: string) => (
    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-6 premium-border shadow-sm flex flex-col items-center">
      <div className="bg-yellow-50 p-4 rounded-full text-[#CBB067] border border-yellow-100 animate-pulse">
        <Lock size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">{desc}</p>
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-md max-w-sm">
        <span className="text-xs font-black uppercase tracking-wider block text-yellow-300 mb-1">👑 Growth Feature Unlocked</span>
        <span className="text-xs font-semibold">Unlock Custom Workflows, ATS Integrations, API Access, and the Gold Premium Theme!</span>
      </div>
      <a
        href="/dashboard/billing"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-extrabold hover:bg-blue-700 transition shadow-md active:scale-95"
      >
        Upgrade to Growth
      </a>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Workspace Settings</h1>
        <p className="text-slate-500 mt-1">Configure team access, external integrations, automation rules, and API interfaces.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "members" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-950 hover:border-slate-300"
          }`}
        >
          <Users size={16} />
          Team Members
        </button>
        <button
          onClick={() => setActiveTab("ats")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "ats" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-950 hover:border-slate-300"
          }`}
        >
          <LinkIcon size={16} />
          ATS Integrations
          {!isUnlocked && <Lock size={12} className="text-slate-400" />}
        </button>
        <button
          onClick={() => setActiveTab("workflows")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "workflows" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-950 hover:border-slate-300"
          }`}
        >
          <GitBranch size={16} />
          Custom Workflows
          {!isUnlocked && <Lock size={12} className="text-slate-400" />}
        </button>
        <button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "api" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-950 hover:border-slate-300"
          }`}
        >
          <Key size={16} />
          API & Webhooks
          {!isUnlocked && <Lock size={12} className="text-slate-400" />}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Manage Members ({members.length})</h2>
            {isAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={18} />
                Invite Member
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm premium-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                            {(member.full_name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.full_name || "Pending Invite"}</div>
                            <div className="text-sm text-slate-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.is_email_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">
                            <Check size={14} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
                            <Loader2 size={14} className="animate-spin" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin && member.id !== currentUser?.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 font-semibold bg-white"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="HR_MANAGER">HR Manager</option>
                            <option value="RECRUITER">Recruiter</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                            {member.role === "ADMIN" ? <ShieldAlert size={16} className="text-blue-600"/> : <Shield size={16} className="text-slate-400"/>}
                            {member.role.replace("_", " ")}
                          </div>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {member.id !== currentUser?.id && (
                            <button
                              onClick={() => handleRemove(member.id)}
                              className="text-slate-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
                              title="Remove user"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-500">
                        No team members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ats" && (
        !isUnlocked ? renderLockScreen("ATS Integrations", "Synchronize your applicant pipelines. Import jobs automatically and push matched rankings back to your enterprise ATS.") : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Applicant Tracking Systems</h2>
              <p className="text-sm text-slate-500 mt-1">Connect your workspace to push and pull candidate lists from Greenhouse, Workday, Lever, and more.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: "greenhouse", name: "Greenhouse", desc: "Sync candidate rankings, review reports, and automate application pipeline updates directly in Greenhouse." },
                { id: "workday", name: "Workday Recruitment", desc: "Import postings and sync hiring stages for enterprise-wide compliance and analytics." },
                { id: "lever", name: "Lever", desc: "Automate screening actions and move candidates between Lever folders dynamically based on AI scores." },
                { id: "bamboohr", name: "BambooHR", desc: "Sync hired recruiter profiles to employee onboarding lists automatically." }
              ].map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-6 premium-border shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-lg text-slate-900">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        atsConnections[p.id] ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                      }`}>
                        {atsConnections[p.id] ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{p.desc}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleToggleAts(p.id)}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${
                        atsConnections[p.id] 
                          ? "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-100" 
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {atsConnections[p.id] ? "Disconnect" : "Connect ATS"}
                    </button>
                    {atsConnections[p.id] && (
                      <button 
                        onClick={() => handleConfigureAts(p.id)}
                        className="text-slate-400 hover:text-slate-700 transition font-bold text-xs"
                      >
                        Configure Rules
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === "workflows" && (
        !isUnlocked ? renderLockScreen("Custom Workflows", "Create automated screening rules. Auto-shortlist high scorers, trigger rejection templates, and send Slack updates dynamically.") : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hiring Automation Rules</h2>
              <p className="text-sm text-slate-500 mt-1">Design triggers that execute actions automatically when candidate profiles are processed by AI.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <form onSubmit={handleSaveWorkflow} className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl premium-border shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900">Create Workflow</h3>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">If Candidate Trigger</label>
                    <select 
                      value={workflowTrigger}
                      onChange={(e) => setWorkflowTrigger(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-bold bg-white"
                    >
                      <option value="match_score">AI Match Score</option>
                      <option value="skill_match_score">AI Skill Fit Score</option>
                      <option value="experience_match_score">AI Experience Fit Score</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Threshold: {workflowValue}%</label>
                    <input 
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={workflowValue}
                      onChange={(e) => setWorkflowValue(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>50%</span>
                      <span>80%</span>
                      <span>95%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Then Automate Action</label>
                    <select 
                      value={workflowAction}
                      onChange={(e) => setWorkflowAction(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-bold bg-white"
                    >
                      <option value="shortlist">Auto-Move to SHORTLISTED stage</option>
                      <option value="slack">Post candidate alert to Slack workspace</option>
                      <option value="invite">Send calendar link for Tech Interview</option>
                      <option value="reject">Auto-Move to REJECTED stage</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition active:scale-95 text-xs mt-4"
                  >
                    Save & Activate Rule
                  </button>
                </div>
              </form>

              {/* Active Rules List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-extrabold text-slate-900">Active Workspace Automation Rules</h3>
                
                <div className="space-y-4">
                  {workflows.map(w => (
                    <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between premium-border shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Rule</span>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          IF <span className="text-blue-600 uppercase tracking-wider text-xs font-black">{w.trigger.replace(/_/g, " ")}</span> is &ge; <span className="text-blue-600 font-black">{w.value}%</span>, 
                          THEN <span className="text-emerald-600 uppercase tracking-wider text-xs font-black">{w.action === "shortlist" ? "Shortlist Candidate" : w.action === "slack" ? "Post Slack Alert" : w.action === "invite" ? "Invite to Interview" : "Reject Candidate"}</span>
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteWorkflow(w.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {workflows.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 premium-border">
                      No automated workflows created yet. Configure a rule on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === "api" && (
        !isUnlocked ? renderLockScreen("Developer API & Webhooks", "Build external hiring microservices. Access candidate scoring webhooks and generate secure API keys for ATS integrations.") : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Developer Integrations API</h2>
              <p className="text-sm text-slate-500 mt-1">Authenticate custom software scripts and bind real-time event webhooks to your servers.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* API Keys */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl premium-border shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900">Workspace API Keys</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">Generate secret credentials to programmatically push jobs and screen candidate resumes via terminal CLI.</p>
                </div>
                
                {apiKey ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="font-mono">{apiKey}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        alert("API Key copied to clipboard!");
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center text-xs text-slate-400 font-bold">
                    No keys generated. Click below to generate.
                  </div>
                )}
                
                <button
                  onClick={handleGenerateKey}
                  className="bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition active:scale-95 text-xs w-full self-end mt-2"
                >
                  Generate Live Secret API Key
                </button>
              </div>

              {/* Webhooks */}
              <form onSubmit={handleSaveWebhook} className="bg-white border border-slate-200 p-6 rounded-2xl premium-border shadow-sm space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900">Event Webhooks</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">Send JSON payloads to your servers whenever a candidate resume has finished scanning.</p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Endpoint Target URL</label>
                    <input
                      type="url"
                      required
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yourcompany.com/webhooks"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition active:scale-95 text-xs w-full mt-2"
                  >
                    Save Webhook Endpoint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Invite Teammate</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6">
              {inviteSuccess ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 font-medium">
                  <Check className="text-green-600" />
                  Invite sent successfully!
                </div>
              ) : (
                <div className="space-y-4">
                  {inviteError && (
                    <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl">
                      {inviteError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 font-medium bg-white"
                        placeholder="colleague@company.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 font-medium bg-white"
                    >
                      <option value="RECRUITER">Recruiter (View Only)</option>
                      <option value="HR_MANAGER">HR Manager (Manage Jobs)</option>
                      <option value="ADMIN">Admin (Manage Billing & Team)</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                  >
                    {inviteLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Invite"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ATS Configuration Modal */}
      {isAtsModalOpen && selectedAts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-slate-950">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Configure {selectedAts.toUpperCase()}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Map automation rules and sync credentials</p>
              </div>
              <button 
                onClick={() => setIsAtsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAtsConfig} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Company Subdomain</label>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="company-name"
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition font-medium bg-white text-sm text-slate-900"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Webhook Secret</label>
                  <input
                    type="password"
                    required
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition font-medium bg-white text-sm text-slate-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Harvest API Key</label>
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gh_harv_key_••••••••••••••••"
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition font-medium bg-white text-sm text-slate-900"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sync Settings & Automation</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={syncJobs}
                    onChange={(e) => setSyncJobs(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Auto-import jobs from {selectedAts.toUpperCase()}</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={syncScores}
                    onChange={(e) => setSyncScores(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Push AI screening score reports back to candidate notes</span>
                </label>

                {syncScores && (
                  <div className="pl-7 pt-1 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">Auto-advance to Screen stage if Match Score &ge;</span>
                    <input 
                      type="number"
                      min="50"
                      max="100"
                      value={stageThreshold}
                      onChange={(e) => setStageThreshold(parseInt(e.target.value))}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold bg-white text-center text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-slate-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAtsModalOpen(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 text-sm"
                >
                  Save Integration Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
