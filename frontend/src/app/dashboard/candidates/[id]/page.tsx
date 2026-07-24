"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Bot, Mail, Phone, Calendar, Briefcase, Award, 
  BookOpen, FileText, Check, AlertTriangle, ChevronRight, Loader, 
  Trash2, Download, Settings, X, Send, PlayCircle, Code, RefreshCw
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
  const [activeTab, setActiveTab] = useState<"profile" | "resume" | "skills_test">("profile");
  
  // Custom status dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Interactive triggers states
  const [statusAlert, setStatusAlert] = useState<{ type: "success" | "warning"; message: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [currentPlan, setCurrentPlan] = useState("STARTER");
  const [skillsTest, setSkillsTest] = useState<any>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [candidateCodes, setCandidateCodes] = useState<Record<number, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);

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
    const plan = localStorage.getItem("hirecue_plan") || "STARTER";
    setCurrentPlan(plan);
    fetchCandidate().finally(() => setLoading(false));
    const savedNotes = localStorage.getItem(`candidate_notes_${candidateId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    } else {
      setNotes("");
    }
  }, [candidateId]);

  const fetchSkillsTest = async () => {
    setLoadingTest(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/candidates/${candidateId}/skills-test`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("hirecue_token") || ""}`
        }
      });
      if (!res.ok) throw new Error("Failed to load skills test status.");
      const data = await res.json();
      setSkillsTest(data);
      
      if (data.status === "PENDING" && data.test_questions) {
        const codes: Record<number, string> = {};
        data.test_questions.forEach((q: any) => {
          codes[q.id] = q.starter_code || "";
        });
        setCandidateCodes(codes);
        if (data.test_questions.length > 0) {
          setActiveQuestionId(data.test_questions[0].id);
        }
      } else if (data.status === "COMPLETED" && data.candidate_answers) {
        const codes: Record<number, string> = {};
        data.candidate_answers.forEach((ans: any) => {
          codes[ans.id] = ans.code || "";
        });
        setCandidateCodes(codes);
        if (data.test_questions && data.test_questions.length > 0) {
          setActiveQuestionId(data.test_questions[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTest(false);
    }
  };

  useEffect(() => {
    if (activeTab === "skills_test" && currentPlan === "ENTERPRISE") {
      fetchSkillsTest();
    }
  }, [activeTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateTest = async () => {
    setGeneratingTest(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/candidates/${candidateId}/skills-test/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("hirecue_token") || ""}`
        }
      });
      if (!res.ok) throw new Error("Failed to generate test.");
      const data = await res.json();
      setSkillsTest(data);
      
      const codes: Record<number, string> = {};
      data.test_questions.forEach((q: any) => {
        codes[q.id] = q.starter_code || "";
      });
      setCandidateCodes(codes);
      if (data.test_questions.length > 0) {
        setActiveQuestionId(data.test_questions[0].id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate AI coding assessment.");
    } finally {
      setGeneratingTest(false);
    }
  };

  const handleSubmitTest = async () => {
    if (submittingTest) return;
    setSubmittingTest(true);
    try {
      const answersList = Object.entries(candidateCodes).map(([id, code]) => ({
        id: parseInt(id),
        code
      }));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/candidates/${candidateId}/skills-test/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("hirecue_token") || ""}`
        },
        body: JSON.stringify({
          answers: answersList
        })
      });
      if (!res.ok) throw new Error("Failed to submit and grade answers.");
      const data = await res.json();
      setSkillsTest((prev: any) => ({
        ...prev,
        status: "COMPLETED",
        score: data.score,
        feedback: data.feedback,
        candidate_answers: answersList
      }));
      alert(`🎉 Coding test submitted and graded! AI Scorecard generated: ${data.score}%`);
    } catch (err: any) {
      alert(err.message || "Failed to grade coding test.");
    } finally {
      setSubmittingTest(false);
    }
  };

  const renderSkillsTestLockScreen = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm premium-border max-w-2xl mx-auto space-y-6 text-slate-900 mt-10">
        <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-fit mx-auto border border-amber-100">
          <Award size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">AI Coding & Skills Test Sandbox</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
            Design job-specific code assessments dynamically generated by AI, let applicants compile and run code inside a mock sandbox, and receive detailed scorecards with review feedback.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs text-slate-600 font-bold leading-normal">
          🔒 This feature requires upgrading your team workspace to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600 font-black">Enterprise Plan</span>.
        </div>
        <button
          onClick={() => router.push("/dashboard/team")}
          className="bg-slate-900 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-slate-800 transition active:scale-95 text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
        >
          Reskin Workspace to Enterprise
        </button>
      </div>
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!candidate) return;
    setUpdating(true);
    setStatusAlert(null);
    try {
      await api.updateCandidateStatus(candidateId, newStatus);
      setCandidate({
        ...candidate,
        status: newStatus as any
      });
      
      // Hook up automated workflow alerts based on action triggers
      if (newStatus === "INTERVIEW_SCHEDULED") {
        setStatusAlert({
          type: "success",
          message: `✉️ Automated Interview Invitation Sent! A Cal.com scheduling link has been sent to candidate email: ${candidate.email || "nitesh0505@gmail.com"}`
        });
      } else if (newStatus === "HIRED") {
        setStatusAlert({
          type: "success",
          message: `🔄 HRIS Synced! Candidate profile successfully synced into your BambooHR employee directory.`
        });
      } else if (newStatus === "REJECTED") {
        setStatusAlert({
          type: "warning",
          message: `✉️ Rejection Email Sent! A polite status notification has been sent to candidate: ${candidate.email || "nitesh0505@gmail.com"}`
        });
      } else if (newStatus === "SHORTLISTED") {
        setStatusAlert({
          type: "success",
          message: `⭐ Candidate Shortlisted! Match status successfully synchronized back to your connected Greenhouse ATS.`
        });
      }
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    localStorage.setItem(`candidate_notes_${candidateId}`, notes);
    setTimeout(() => {
      setIsSavingNotes(false);
    }, 500);
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
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all self-end sm:self-center"
        >
          <Trash2 size={14} /> Delete Evaluation
        </button>
      </div>

      {statusAlert && (
        <div className={`border p-4 rounded-2xl flex items-start gap-3 text-sm animate-in slide-in-from-top duration-300 font-medium ${
          statusAlert.type === "success" 
            ? "bg-green-50 border-green-100 text-green-700" 
            : "bg-amber-50 border-amber-100 text-amber-700"
        }`}>
          <div className="mt-0.5">
            {statusAlert.type === "success" ? <Check size={18} className="text-green-600" /> : <AlertTriangle size={18} className="text-amber-600" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-xs">{statusAlert.type === "success" ? "Automated Sync Triggered" : "Hiring Rule Notification"}</p>
            <p className="text-[11px] font-semibold opacity-90 mt-0.5">{statusAlert.message}</p>
          </div>
          <button 
            onClick={() => setStatusAlert(null)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => !updating && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                disabled={updating}
                className="w-48 flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 font-bold bg-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <span>
                  {candidate.status === "APPLIED" ? "Applied" :
                   candidate.status === "SHORTLISTED" ? "Shortlisted" :
                   candidate.status === "INTERVIEW_SCHEDULED" ? "Interview Scheduled" :
                   candidate.status === "INTERVIEWED" ? "Interviewed" :
                   candidate.status === "REJECTED" ? "Rejected" :
                   candidate.status === "HIRED" ? "Hired" :
                   candidate.status}
                </span>
                <span className="text-[9px] text-slate-400">{updating ? "⏳" : "▼"}</span>
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 premium-dropdown">
                  {[
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
                        handleStatusChange(item.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors block ${
                        candidate.status === item.value
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
        <button
          onClick={() => setActiveTab("skills_test")}
          className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "skills_test"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Award size={16} /> AI Skills Test {currentPlan !== "ENTERPRISE" ? "🔒" : ""}
        </button>
      </div>

      {/* Dynamic Tabs Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Left Side: Structured work timeline & education (Col span 2) */}
          <div className="lg:col-span-2 space-y-8 flex flex-col justify-stretch h-full">
            
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

            {/* Recruiter Notes & Interview Feedback (Moved here from Right Sidebar) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Settings size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Recruiter Evaluation Notes</h3>
              </div>
              
              <div className="space-y-3 text-slate-950">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type candidate interview notes, custom highlights, or recruiter evaluations here..."
                  className="w-full min-h-[140px] text-xs font-medium border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900 leading-relaxed transition"
                />
                
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Saving Notes...
                    </>
                  ) : (
                    "Save Evaluation Notes"
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right Side: AI Copilot Scores, recommendations and concerns */}
          <div className="space-y-6 flex flex-col h-full grow">
            
            {/* Score Breakdowns */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6 flex-shrink-0">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border flex-grow flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
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
              </div>

              {/* Concerns */}
              <div className="space-y-3 pt-6 border-t border-slate-150/50">
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
      )}

      {activeTab === "resume" && (
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

      {activeTab === "skills_test" && (
        currentPlan !== "ENTERPRISE" ? renderSkillsTestLockScreen() : (
          loadingTest ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <Loader className="animate-spin text-blue-600" size={24} />
              <span className="text-xs text-slate-400 font-semibold">Loading technical assessment...</span>
            </div>
          ) : !skillsTest || skillsTest.status === "NOT_FOUND" ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm premium-border max-w-2xl mx-auto space-y-6 text-slate-900 mt-10">
              <div className="bg-blue-50 text-blue-600 p-4 rounded-full w-fit mx-auto border border-amber-100">
                <Code size={36} className="text-blue-650" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Custom Coding Assessment</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
                  Automatically generate a 3-question coding assessment customized specifically for the target job description and the candidate's skills.
                </p>
              </div>
              <button
                onClick={handleGenerateTest}
                disabled={generatingTest}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl transition active:scale-95 text-xs inline-flex items-center gap-2 cursor-pointer shadow-md disabled:bg-blue-400"
              >
                {generatingTest ? <Loader className="animate-spin" size={14} /> : null}
                Generate AI Coding Assessment
              </button>
            </div>
          ) : skillsTest.status === "PENDING" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
              {/* Question Sidebar Selector */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm premium-border flex flex-col space-y-4 h-full overflow-y-auto text-slate-900">
                <div className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Assessment Questions</div>
                <div className="flex flex-col gap-2">
                  {skillsTest.test_questions?.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionId(q.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between gap-3 ${
                        activeQuestionId === q.id 
                          ? "bg-blue-50 border-blue-300 text-blue-800" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>{q.id}. {q.title}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>

                {/* Selected Question Detail */}
                {(() => {
                  const activeQ = skillsTest.test_questions?.find((q: any) => q.id === activeQuestionId);
                  if (!activeQ) return null;
                  return (
                    <div className="border-t border-slate-100 pt-4 flex-1 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{activeQ.title}</h4>
                      <p className="text-[11px] font-semibold leading-relaxed text-slate-600">{activeQ.description}</p>
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-450 uppercase block">Sample Test Cases</span>
                        <code className="text-[10px] font-mono text-slate-700 font-extrabold break-all whitespace-pre-wrap">{activeQ.sample_cases}</code>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sandbox Code Editor */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col h-full overflow-hidden relative">
                {/* Header controls */}
                <div className="bg-slate-850 px-5 py-3 border-b border-slate-800 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono ml-2">sandbox_candidate_env.py</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitTest}
                      disabled={submittingTest}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      {submittingTest ? <Loader className="animate-spin" size={12} /> : <PlayCircle size={12} />}
                      Submit Answers
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 flex font-mono text-xs leading-relaxed text-slate-200">
                  <div className="bg-slate-950/60 px-3 py-4 text-right text-[10px] text-slate-600 font-bold select-none border-r border-slate-800/80">
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    value={candidateCodes[activeQuestionId] || ""}
                    onChange={(e) => {
                      setCandidateCodes({
                        ...candidateCodes,
                        [activeQuestionId]: e.target.value
                      });
                    }}
                    className="flex-1 w-full bg-transparent px-4 py-4 outline-none border-none resize-none overflow-y-auto text-slate-200 focus:ring-0 font-mono"
                    spellCheck="false"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* COMPLETED Graded Scorecard View */
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm premium-border flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl border border-emerald-100 font-black text-xl">
                    {skillsTest.score}%
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">AI Coding Assessment Graded</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Evaluation processed in real-time matching the programming guidelines</p>
                  </div>
                </div>
                
                <button
                  onClick={handleGenerateTest}
                  disabled={generatingTest}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-50 transition active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {generatingTest ? <Loader className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  Retake Test
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-900">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Bot size={18} className="text-blue-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">AI Code Review Report</h3>
                  </div>
                  <p className="text-xs font-semibold text-slate-650 leading-relaxed whitespace-pre-wrap">{skillsTest.feedback}</p>
                </div>

                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Code size={18} className="text-blue-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Candidate Code Submissions</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {skillsTest.test_questions?.map((q: any) => {
                      const answer = skillsTest.candidate_answers?.find((a: any) => a.id === q.id);
                      return (
                        <div key={q.id} className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                          <div className="bg-slate-50 border-b border-slate-150 px-4 py-2.5 font-bold text-slate-800 flex justify-between items-center">
                            <span>{q.id}. {q.title}</span>
                          </div>
                          <pre className="bg-slate-900 text-slate-200 font-mono text-[11px] p-4 overflow-x-auto select-all leading-normal whitespace-pre">
                            {answer?.code || "# No submission recorded"}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
