"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Briefcase, MapPin, Calendar, Upload, Bot, Search, 
  Trash2, FileText, Loader, Filter, CheckCircle, RefreshCw, X, Sparkles,
  MessageSquare, Send, User, Users
} from "lucide-react";
import { api, Job, Candidate } from "@/lib/api";

export default function JobDetails() {
  const { id } = useParams();
  const jobId = parseInt(id as string);

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minScore, setMinScore] = useState(0);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // Branded AI Agent Switcher state
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  // Custom status filter dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const handleAgentChange = async (newAgent: string) => {
    if (!job) return;
    setUpdatingAgent(true);
    setError("");
    try {
      await api.updateJobAiModel(jobId, newAgent);
      setJob(prev => prev ? { ...prev, ai_model: newAgent } : null);
      setInfoMessage(`Active AI Recruiter Agent changed to ${
        newAgent === "GEMINI" ? "NEX" :
        newAgent === "CLAUDE" ? "Aura-Sonnet 5.0" :
        "Vortex-4o"
      }.`);
    } catch (err: any) {
      setError(err.message || "Failed to update AI Agent.");
    } finally {
      setUpdatingAgent(false);
    }
  };

  // AI Candidate Simulator States
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simMessage, setSimMessage] = useState("");
  const [simMessages, setSimMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [sendingSim, setSendingSim] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("STARTER");

  // Talent Pool Re-Engagement states
  const [isTalentPoolOpen, setIsTalentPoolOpen] = useState(false);
  const [talentPoolCandidates, setTalentPoolCandidates] = useState<any[]>([]);
  const [selectedTalentIds, setSelectedTalentIds] = useState<number[]>([]);
  const [loadingTalent, setLoadingTalent] = useState(false);
  const [invitingTalent, setInvitingTalent] = useState(false);

  const fetchData = async () => {
    try {
      const jobData = await api.getJob(jobId);
      setJob(jobData);
      
      const candidateList = await api.getCandidates({ 
        job_id: jobId,
        status: statusFilter,
        query: searchQuery,
        min_score: minScore > 0 ? minScore : undefined
      });
      setCandidates(candidateList);
      setError("");
    } catch (err: any) {
      setError("Failed to fetch job details. Make sure the server is online.");
    }
  };

  useEffect(() => {
    const plan = localStorage.getItem("hirecue_plan") || "STARTER";
    setCurrentPlan(plan);
    fetchData().finally(() => setLoading(false));
  }, [jobId, statusFilter, minScore]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search on enter or when user finishes typing
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem("hirecue_token");
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/candidates/job/${jobId}/export?token=${token}`, '_blank');
  };

  const handleAutoClassify = async () => {
    setClassifying(true);
    setError("");
    setInfoMessage("");
    try {
      const result = await api.autoClassifyCandidates(jobId);
      setInfoMessage(`AI pipeline completed: Auto-shortlisted ${result.shortlisted} and auto-rejected ${result.rejected} candidate(s).`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to run AI Auto-Pipeline.");
    } finally {
      setClassifying(false);
    }
  };

  const handleOpenSimulator = (cand: Candidate) => {
    if (currentPlan !== "ENTERPRISE") {
      alert("⚠️ Candidate AI Simulator (Interview Sandbox) is an Enterprise Plan feature. Please upgrade your workspace!");
      return;
    }
    setSelectedCandidate(cand);
    setSimMessages([
      { role: "assistant", content: `Hello! I am ${cand.name}. I've applied for the ${job?.title || 'position'} role. Ask me anything about my experience, skills, or background!` }
    ]);
    setSimMessage("");
    setIsSimulatorOpen(true);
  };

  const handleSendSimMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim() || !selectedCandidate || sendingSim) return;

    const userText = simMessage.trim();
    setSimMessages((prev) => [...prev, { role: "user", content: userText }]);
    setSimMessage("");
    setSendingSim(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/candidates/${selectedCandidate.id}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("hirecue_token") || ""}`
        },
        body: JSON.stringify({
          message: userText,
          chat_history: simMessages.slice(1)
        })
      });
      if (!res.ok) {
        throw new Error("Failed to get response from AI clone.");
      }
      const data = await res.json();
      setSimMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      setSimMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble matching your connection, but I'd be happy to chat about my qualifications later." }]);
    } finally {
      setSendingSim(false);
    }
  };

  const handleOpenTalentPool = async () => {
    if (currentPlan !== "ENTERPRISE") {
      alert("⚠️ Talent Pool Re-Engagement Agent is an Enterprise Plan feature. Please upgrade your workspace!");
      return;
    }
    setIsTalentPoolOpen(true);
    setLoadingTalent(true);
    setSelectedTalentIds([]);
    try {
      const data = await api.getTalentPoolMatches(jobId);
      setTalentPoolCandidates(data);
    } catch (err: any) {
      alert(err.message || "Failed to load talent pool.");
    } finally {
      setLoadingTalent(false);
    }
  };

  const handleInviteTalent = async () => {
    if (selectedTalentIds.length === 0 || invitingTalent) return;
    setInvitingTalent(true);
    try {
      const data = await api.inviteTalentPoolCandidates(jobId, selectedTalentIds);
      alert(`🎉 Successfully re-engaged and invited ${data.invited_count} candidate(s) to this job opening!`);
      setIsTalentPoolOpen(false);
      await fetchData(); // refresh candidates list
    } catch (err: any) {
      alert(err.message || "Failed to invite talent.");
    } finally {
      setInvitingTalent(false);
    }
  };

  const toggleSelectTalent = (id: number) => {
    setSelectedTalentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadErrors([]);
    setUploadProgress(`Processing ${files.length} resume(s)...`);

    try {
      const fileList = Array.from(files);
      const res = await api.uploadResumes(jobId, fileList);
      
      // Parse results
      const failed = res.processed.filter((p: any) => p.error);
      const succeeded = res.processed.filter((p: any) => !p.error);
      
      if (failed.length > 0) {
        setUploadErrors(failed.map((f: any) => `${f.filename}: ${f.error}`));
      }
      
      setUploadProgress(`Successfully parsed and matched ${succeeded.length} candidate(s).`);
      
      // Execute Custom Workflow Automation Rules
      const savedWorkflows = localStorage.getItem("mock_workflows");
      if (savedWorkflows && succeeded.length > 0) {
        const activeRules = JSON.parse(savedWorkflows).filter((w: any) => w.active);
        const executedActions: string[] = [];
        
        for (const candidate of succeeded) {
          for (const rule of activeRules) {
            let candidateVal = 0;
            if (rule.trigger === "match_score") candidateVal = candidate.match_score;
            else if (rule.trigger === "skill_match_score") candidateVal = candidate.skill_match_score || 0;
            else if (rule.trigger === "experience_match_score") candidateVal = candidate.experience_match_score || 0;
            
            if (candidateVal >= rule.value) {
              if (rule.action === "shortlist") {
                try {
                  await api.updateCandidateStatus(candidate.id, "SHORTLISTED");
                  executedActions.push(`⚡ [Workflow Rule] Auto-Shortlisted ${candidate.name} (AI score: ${candidateVal}%)`);
                } catch (e) {
                  console.error("Workflow failed to update candidate status", candidate.id, e);
                }
              } else if (rule.action === "email") {
                try {
                  await api.updateCandidateStatus(candidate.id, "INTERVIEW_SCHEDULED");
                  executedActions.push(`✉️ [Workflow Rule] Sent automated interview invite to ${candidate.name} (AI score: ${candidateVal}%)`);
                } catch (e) {
                  console.error("Workflow failed to update candidate status", candidate.id, e);
                }
              } else if (rule.action === "slack") {
                executedActions.push(`💬 [Workflow Rule] Sent Slack Notification for Star Candidate ${candidate.name} (AI score: ${candidateVal}%)`);
              }
            }
          }
        }
        
        if (executedActions.length > 0) {
          setTimeout(() => {
            alert(`⚙️ Automation Workflows Triggered:\n\n${executedActions.join("\n")}`);
          }, 500);
        }
      }
      
      // Trigger Webhook Event Dispatch
      const savedWebhook = localStorage.getItem("mock_webhook");
      if (savedWebhook && succeeded.length > 0) {
        for (const candidate of succeeded) {
          try {
            fetch(savedWebhook, {
              method: "POST",
              headers: {
                "Content-Type": "text/plain"
              },
              body: JSON.stringify({
                event: "candidate.screened",
                timestamp: new Date().toISOString(),
                candidate: {
                  id: candidate.id,
                  name: candidate.name,
                  email: candidate.email,
                  match_score: candidate.match_score,
                  skill_match_score: candidate.skill_match_score,
                  experience_match_score: candidate.experience_match_score,
                  relevance_score: candidate.relevance_score,
                  status: candidate.status || "APPLIED",
                  ai_summary: candidate.ai_summary,
                  ai_concerns: candidate.ai_concerns
                }
              })
            }).then(response => {
              console.log(`Webhook successfully dispatched to ${savedWebhook}: Status ${response.status}`);
            }).catch(err => {
              console.error(`Failed to dispatch webhook to ${savedWebhook}:`, err);
            });
          } catch (e) {
            console.error("Webhook dispatch error:", e);
          }
        }
      }

      // Refresh candidates list
      await fetchData();
    } catch (err: any) {
      setUploadErrors([err.message || "Failed to upload resumes."]);
      setUploadProgress(""); // Clear progress on request failure
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteCandidate = async (candidateId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this candidate evaluation permanently?")) return;

    try {
      await api.deleteCandidate(candidateId);
      setCandidates(candidates.filter((c) => c.id !== candidateId));
    } catch (err: any) {
      alert("Failed to delete candidate: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Loading position detail...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full w-fit mx-auto">
          <Briefcase size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Job position not found</h2>
        <Link href="/dashboard/jobs" className="text-blue-600 hover:underline">
          Return to job postings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back to jobs */}
      <Link href="/dashboard/jobs" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Job Postings
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {infoMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-4 rounded-xl font-medium flex justify-between items-center">
          <span>{infoMessage}</span>
          <button onClick={() => setInfoMessage("")} className="hover:text-emerald-950 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={15} />
                {job.location || "Remote"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={15} />
                Created {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {job.skills_required.map((skill) => (
              <span key={skill} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                {skill}
              </span>
            ))}
            {job.skills_preferred.map((skill) => (
              <span key={skill} className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Right side: quick stats */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 flex-shrink-0">
          <div className="text-center">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide block">Total Evaluated</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block">{candidates.length}</span>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide block">Average Fit</span>
            <span className="text-3xl font-black text-blue-600 mt-1 block">
              {candidates.length > 0
                ? Math.round(candidates.reduce((sum, c) => sum + c.match_score, 0) / candidates.length)
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Results splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Drag and Drop Resume Uploader */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border h-fit space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Upload size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-900">Upload Resumes</h3>
          </div>

          {/* Branded AI Agent Selection Custom Dropdown */}
          <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100" ref={agentDropdownRef}>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={13} className="text-blue-500" /> Assigned AI Recruiter Agent
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !uploading && !updatingAgent && setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                disabled={updatingAgent || uploading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 shadow-sm"
              >
                <span>
                  {job.ai_model === "CLAUDE" ? "Aura-Sonnet 5.0" : job.ai_model === "GPT" ? "Vortex-4o" : "NEX"}
                </span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              {isAgentDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 premium-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      handleAgentChange("GEMINI");
                      setIsAgentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors block ${
                      (job.ai_model || "GEMINI") === "GEMINI"
                        ? "bg-blue-50/40 text-blue-700 font-extrabold"
                        : "text-slate-650 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="font-bold">NEX</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">Cognitive Analytics & Deep Matching</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAgentChange("CLAUDE");
                      setIsAgentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors block ${
                      job.ai_model === "CLAUDE"
                        ? "bg-blue-50/40 text-blue-700 font-extrabold"
                        : "text-slate-650 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="font-bold">Aura-Sonnet 5.0</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">Semantic Integrity & Precise Screening</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAgentChange("GPT");
                      setIsAgentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors block ${
                      job.ai_model === "GPT"
                        ? "bg-blue-50/40 text-blue-700 font-extrabold"
                        : "text-slate-650 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="font-bold">Vortex-4o</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">High-Speed Throughput & Pipeline Sync</div>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">
              Select the cognitive model to parse, match, and rate candidate compatibility.
            </p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/10 space-y-3 ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">Drag & Drop resumes here</p>
              <p className="text-xs text-slate-400 font-semibold">Supports PDF and DOCX files (Bulk available)</p>
            </div>
            <button className="bg-white border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs shadow-sm hover:bg-slate-50 transition-all">
              Choose Files
            </button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc"
              className="hidden"
            />
          </div>

          {/* Upload Status / Errors */}
          {(uploading || uploadProgress || uploadErrors.length > 0) && (
            <div className={`p-4 rounded-xl space-y-2.5 border ${
              uploadErrors.length > 0 && !uploading 
                ? "bg-red-50/50 border-red-200 text-red-800" 
                : "bg-blue-50/50 border-blue-100 text-blue-800"
            }`}>
              {(uploading || uploadProgress) && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  {uploading ? <Loader className="animate-spin text-blue-600" size={14} /> : <CheckCircle size={14} className="text-emerald-600" />}
                  {uploadProgress}
                </div>
              )}
              
              {uploadErrors.length > 0 && (
                <div className={`pt-2 space-y-1.5 ${uploading || uploadProgress ? "border-t border-slate-100" : ""}`}>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide block ${
                    uploadErrors.length > 0 && !uploading ? "text-red-500" : "text-slate-400"
                  }`}>
                    {uploading ? "Processing Warnings:" : "Errors/Warnings:"}
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {uploadErrors.map((err, idx) => (
                      <p key={idx} className="text-[10px] text-red-600 leading-tight font-semibold flex items-start gap-1">
                        <span>•</span> {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Candidates list and filters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm premium-border flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name or skills..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-600 transition-all"
              />
            </div>
            
            {/* Custom Dropdown status */}
            <div className="w-full sm:w-48 relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 font-bold bg-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer shadow-sm"
              >
                <span>
                  {statusFilter === "APPLIED" ? "Applied" :
                   statusFilter === "SHORTLISTED" ? "Shortlisted" :
                   statusFilter === "INTERVIEW_SCHEDULED" ? "Interview Scheduled" :
                   statusFilter === "INTERVIEWED" ? "Interviewed" :
                   statusFilter === "REJECTED" ? "Rejected" :
                   statusFilter === "HIRED" ? "Hired" :
                   "All Pipeline Statuses"}
                </span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 premium-dropdown">
                  {[
                    { value: "", label: "All Pipeline Statuses" },
                    { value: "APPLIED", label: "Applied" },
                    { value: "SHORTLISTED", label: "Shortlisted" },
                    { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
                    { value: "INTERVIEWED", label: "Interviewed" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "HIRED", label: "Hired" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(item.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors block ${
                        statusFilter === item.value
                          ? "bg-blue-50/40 text-blue-700 font-extrabold"
                          : "text-slate-650 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Slider Min score */}
            <div className="w-full sm:w-48 space-y-1">
              <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                <span>Min Match Fit</span>
                <span>{minScore}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#a78bfa] border border-slate-700 bg-transparent"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #a78bfa ${minScore}%, rgba(255, 255, 255, 0.05) ${minScore}%, rgba(255, 255, 255, 0.05) 100%)`
                }}
              />
            </div>

            <button type="submit" className="hidden sm:inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">
              Search
            </button>
          </form>

          {/* Candidate Lists */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm premium-border overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Candidate Rank Rankings</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={candidates.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <FileText size={14} />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleOpenTalentPool}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Users size={14} />
                  Re-Engage Talent
                </button>
                <button
                  type="button"
                  onClick={handleAutoClassify}
                  disabled={classifying || candidates.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {classifying ? (
                    <Loader className="animate-spin" size={14} />
                  ) : (
                    <Sparkles size={14} className="fill-blue-100" />
                  )}
                  AI Auto-Pipeline
                </button>
                <button onClick={handleRefresh} disabled={refreshing} className="text-slate-400 hover:text-slate-600 p-1">
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto">
                  <Bot size={28} />
                </div>
                <div className="max-w-xs mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No matching candidates found</h4>
                  <p className="text-xs text-slate-400">Try adjusting your filters or upload new candidate resumes to trigger evaluations.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {candidates.map((cand, idx) => {
                  const scoreColor = 
                    cand.match_score >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    cand.match_score >= 70 ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-slate-50 text-slate-600 border-slate-200";

                  const badgeColor =
                    cand.status === "HIRED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    cand.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                    cand.status === "SHORTLISTED" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    "bg-slate-50 text-slate-500 border-slate-200";
                    
                  return (
                    <div key={cand.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative group">
                      
                      <div className="space-y-3 min-w-0">
                        {/* Name and Rank */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <Link href={`/dashboard/candidates/${cand.id}`} className="text-base font-bold text-slate-900 hover:text-blue-600 hover:underline truncate">
                            {cand.name || "Unknown Candidate"}
                          </Link>
                          <span className={`inline-block px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase ${badgeColor}`}>
                            {cand.status}
                          </span>
                        </div>

                        {/* Contact */}
                        <p className="text-xs text-slate-500 font-medium leading-none">
                          {cand.email || "No email"} • {cand.phone || "No phone"}
                        </p>

                        {/* Extracted Skills */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {cand.skills.map((skill) => (
                            <span key={skill} className="bg-slate-50 border border-slate-150 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score and actions */}
                      <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <div className={`px-3 py-1.5 rounded-xl border text-sm font-extrabold flex items-center justify-center gap-1.5 ${scoreColor}`}>
                            <Bot size={15} /> {cand.match_score}% Fit
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link 
                            href={`/dashboard/candidates/${cand.id}`} 
                            className="bg-white border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleOpenSimulator(cand)}
                            className="bg-white border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <MessageSquare size={13} /> Sandbox
                          </button>
                          <button
                            onClick={(e) => handleDeleteCandidate(cand.id, e)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Candidate AI Simulator Modal */}
      {isSimulatorOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px] border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-900">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 text-blue-400 p-2 rounded-xl">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide uppercase text-slate-300">AI Interview Simulator</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Conversing with the clone of <span className="text-white font-extrabold">{selectedCandidate.name}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
              {simMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 h-8 w-8 flex items-center justify-center ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-3xl text-xs font-semibold leading-relaxed shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-150 text-slate-800 rounded-tl-none"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sendingSim && (
                <div className="flex gap-3 mr-auto items-center">
                  <div className="p-2 rounded-xl h-8 w-8 flex items-center justify-center bg-slate-200 text-slate-700">
                    <Bot size={14} className="animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-150 p-4 rounded-3xl rounded-tl-none text-xs font-semibold text-slate-400 italic">
                    Candidate is typing...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-6 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button 
                onClick={() => {
                  setSimMessage("Tell me about your background and experience.");
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer"
              >
                📝 Tell me about yourself
              </button>
              <button 
                onClick={() => {
                  setSimMessage(`Why are you interested in this ${job?.title || 'role'} position?`);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer"
              >
                ❓ Why this role?
              </button>
              <button 
                onClick={() => {
                  setSimMessage("What is your salary expectation for this job?");
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer"
              >
                💰 Salary expectations?
              </button>
              <button 
                onClick={() => {
                  setSimMessage("What are your primary technical skills?");
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer"
              >
                ⚙️ Technical stack?
              </button>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendSimMessage} className="p-4 bg-white border-t border-slate-150 flex gap-3">
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder={`Ask ${selectedCandidate.name} a question...`}
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 transition"
              />
              <button
                type="submit"
                disabled={sendingSim || !simMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 p-3 rounded-2xl transition active:scale-95 flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Talent Pool Re-Engagement Modal */}
      {isTalentPoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[550px] border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-900">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-xl">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide uppercase text-slate-300">Talent Pool Re-Engagement Agent</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Recycle and invite past candidates who match this role's requirements</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTalentPoolOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
              {loadingTalent ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <Loader className="animate-spin text-indigo-600" size={24} />
                  <span className="text-xs text-slate-400 font-semibold">Scanning past applications for matching skills...</span>
                </div>
              ) : talentPoolCandidates.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm font-extrabold text-slate-700">No matching past candidates found</p>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">Upload resumes to other job vacancies to build a recycleable talent network pool.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Matching Candidates ({talentPoolCandidates.length})</div>
                  {talentPoolCandidates.map((cand) => {
                    const isSelected = selectedTalentIds.includes(cand.id);
                    return (
                      <div 
                        key={cand.id} 
                        onClick={() => toggleSelectTalent(cand.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected 
                            ? "bg-indigo-50/70 border-indigo-300 shadow-sm" 
                            : "bg-white border-slate-150 hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // handled by click container
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{cand.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Applied previously to: <span className="text-slate-800 font-extrabold">{cand.previous_job}</span></p>
                            {cand.skills && cand.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {cand.skills.map((skill: string) => (
                                  <span key={skill} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-xl block w-fit ml-auto">
                            {cand.match_score}% Match
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-150 p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">
                {selectedTalentIds.length} candidate(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsTalentPoolOpen(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-50 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteTalent}
                  disabled={selectedTalentIds.length === 0 || invitingTalent}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10 transition active:scale-95 flex items-center gap-1.5"
                >
                  {invitingTalent ? <Loader className="animate-spin" size={14} /> : null}
                  Send Invite & Import Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
