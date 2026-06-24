"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Bot, Mail, Phone, Calendar, Briefcase, Award, 
  BookOpen, FileText, Check, AlertTriangle, ChevronRight, Loader, 
  Trash2, Download 
} from "lucide-react";
import { api, CandidateDetail } from "@/lib/api";

export default function CandidateWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const candidateId = parseInt(id as string);

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "resume">("profile");

  const fetchCandidate = async () => {
    try {
      const data = await api.getCandidate(candidateId);
      setCandidate(data);
      setError("");
    } catch (err: any) {
      setError("Failed to fetch candidate details. Ensure the backend is online.");
    }
  };

  useEffect(() => {
    fetchCandidate().finally(() => setLoading(false));
  }, [candidateId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!candidate) return;
    setUpdating(true);
    try {
      await api.updateCandidateStatus(candidateId, newStatus);
      setCandidate({
        ...candidate,
        status: newStatus as any
      });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!candidate) return;
    if (!confirm("Are you sure you want to delete this candidate evaluation permanently?")) return;

    try {
      await api.deleteCandidate(candidateId);
      router.push(`/dashboard/jobs/${candidate.job_id}`);
    } catch (err: any) {
      alert("Failed to delete candidate: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Loading candidate workspace...</span>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-full w-fit mx-auto">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Candidate not found</h2>
        <Link href="/dashboard/jobs" className="text-blue-600 hover:underline">
          Return to job postings
        </Link>
      </div>
    );
  }

  const scoreColor = 
    candidate.match_score >= 85 ? "bg-emerald-500 text-white" :
    candidate.match_score >= 70 ? "bg-blue-500 text-white" :
    "bg-slate-500 text-white";

  const progressBg = 
    candidate.match_score >= 85 ? "bg-emerald-500" :
    candidate.match_score >= 70 ? "bg-blue-500" :
    "bg-slate-500";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back to job and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href={`/dashboard/jobs/${candidate.job_id}`} 
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Job Candidates
        </Link>
        <button 
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl text-xs font-bold transition-all self-end sm:self-center"
        >
          <Trash2 size={14} /> Delete Evaluation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Bio */}
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl ${scoreColor}`}>
            {candidate.match_score}%
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{candidate.name || "Unknown Candidate"}</h1>
            <p className="text-sm text-slate-500 font-semibold leading-none">
              Position: <span className="text-slate-800">{candidate.job_title}</span>
            </p>
            {/* Contacts details */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-400 pt-1">
              <span className="flex items-center gap-1 hover:text-blue-600">
                <Mail size={13} />
                {candidate.email || "No email"}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} />
                {candidate.phone || "No phone"}
              </span>
            </div>
          </div>
        </div>

        {/* Status Dropdown selector */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 flex-shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Candidate Status</label>
            <div className="relative">
              <select
                disabled={updating}
                value={candidate.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-48 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 font-bold bg-white focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 font-bold text-[10px]">
                {updating ? "⏳" : "▼"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Briefcase size={16} /> Structured Profile
        </button>
        <button
          onClick={() => setActiveTab("resume")}
          className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "resume"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <FileText size={16} /> Original Resume Document
        </button>
      </div>

      {/* Dynamic Tabs Content */}
      {activeTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Structured work timeline & education (Col span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Experience timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Briefcase size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-900">Work Experience Timeline</h2>
              </div>

              {candidate.experiences.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No work experiences parsed.</p>
              ) : (
                <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-8">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 bg-blue-100 border-2 border-blue-600 rounded-full h-4 w-4"></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 leading-tight">
                          {exp.title}
                        </h4>
                        <span className="text-xs font-semibold text-slate-400">
                          {exp.start_date} – {exp.end_date}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold text-slate-500">
                        {exp.company}
                      </p>
                      
                      {exp.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-2 font-medium">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <BookOpen size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-900">Education History</h2>
              </div>

              {candidate.educations.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No education details parsed.</p>
              ) : (
                <div className="space-y-6">
                  {candidate.educations.map((edu, idx) => (
                    <div key={edu.id || idx} className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 leading-tight">
                          {edu.degree} {edu.major ? `in ${edu.major}` : ""}
                        </h4>
                        <p className="text-xs font-bold text-slate-500">
                          {edu.institution}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        Class of {edu.graduation_year}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible raw text */}
            <details className="bg-white border border-slate-200 rounded-2xl shadow-sm premium-border group overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between font-bold text-sm text-slate-600 focus:outline-none">
                <span>View Raw Extracted Resume Text</span>
                <ChevronRight size={18} className="transform group-open:rotate-90 transition-transform text-slate-400" />
              </summary>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                <pre className="bg-slate-50 p-4 rounded-xl text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {candidate.raw_text}
                </pre>
              </div>
            </details>

          </div>

          {/* Right Side: AI Copilot Scores, recommendations and concerns */}
          <div className="space-y-6">
            
            {/* Score Breakdowns */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Award size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Evaluation Breakdown</h3>
              </div>
              
              <div className="space-y-4">
                {/* Skill Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Skill Compatibility</span>
                    <span>{candidate.skill_match_score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${candidate.skill_match_score}%` }}></div>
                  </div>
                </div>

                {/* Experience Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Experience Match</span>
                    <span>{candidate.experience_match_score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${candidate.experience_match_score}%` }}></div>
                  </div>
                </div>

                {/* Relevance Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Project & Role Relevance</span>
                    <span>{candidate.relevance_score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${candidate.relevance_score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copilot Advice box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Bot size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">AI Copilot Analysis</h3>
              </div>

              {/* Strengths */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Check className="text-emerald-500 border border-emerald-100 bg-emerald-50 rounded-full p-0.5" size={14} /> Key Recommendations
                </h4>
                <div className="text-xs text-slate-600 leading-relaxed font-semibold space-y-2">
                  {candidate.ai_summary ? (
                    candidate.ai_summary.split("\n").map((line, idx) => (
                      <p key={idx} className="pl-1">
                        {line.startsWith("-") ? line.substring(1).trim() : line}
                      </p>
                    ))
                  ) : (
                    <p>Qualifies according to the experience guidelines.</p>
                  )}
                </div>
              </div>

              {/* Concerns */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500" size={14} /> Potential Gaps
                </h4>
                <div className="text-xs text-slate-600 leading-relaxed font-semibold space-y-2">
                  {candidate.ai_concerns ? (
                    candidate.ai_concerns.split("\n").map((line, idx) => (
                      <p key={idx} className="pl-1 text-slate-600">
                        {line.startsWith("-") ? line.substring(1).trim() : line}
                      </p>
                    ))
                  ) : (
                    <p>No critical gaps or concerns parsed from resume.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* Original Resume Viewer Tab using iframe and download backup button */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm premium-border overflow-hidden h-[75vh] flex flex-col">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Resume Document Viewer</span>
            <a
              href={api.getResumeUrl(candidateId)}
              target="_blank"
              rel="noreferrer"
              className="bg-white border border-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download size={13} /> Download Resume File
            </a>
          </div>
          
          <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
            <iframe
              src={api.getResumeUrl(candidateId)}
              className="w-full h-full rounded-lg border border-slate-200 shadow-sm bg-white"
              title="Resume PDF Document"
            />
          </div>
        </div>
      )}
    </div>
  );
}
