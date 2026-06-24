"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Briefcase, MapPin, Calendar, Upload, Bot, Search, 
  Trash2, FileText, Loader, Filter, CheckCircle, RefreshCw, X, Sparkles 
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
    fetchData().finally(() => setLoading(false));
  }, [jobId, statusFilter, minScore]); // trigger fetch on dropdown/slider filter changes

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
            
            {/* Dropdown status */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 font-medium bg-white focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Pipeline Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
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
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
    </div>
  );
}
