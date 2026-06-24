"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Briefcase, MapPin, Calendar, Users, Trash2, Loader, RefreshCw, AlertCircle } from "lucide-react";
import { api, Job } from "@/lib/api";

export default function JobListings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchJobs = async () => {
    try {
      const jobList = await api.getJobs();
      setJobs(jobList);
      setError("");
    } catch (err: any) {
      setError("Failed to load job postings. Ensure the backend server is running.");
    }
  };

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (!confirm("Are you sure you want to delete this job posting? All associated candidate evaluations will be deleted permanentely.")) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deleteJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
    } catch (err: any) {
      alert("Failed to delete job: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Loading job postings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Job Postings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage positions and evaluate candidate lists</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all self-start sm:self-center"
        >
          <PlusCircle size={16} />
          Create Job Listing
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl font-medium">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4 premium-border">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Briefcase size={32} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-slate-950">No job openings created yet</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Create your first job posting. You can enter details manually or paste a raw description and let the AI extract it automatically.
            </p>
          </div>
          <Link
            href="/dashboard/jobs/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all"
          >
            <PlusCircle size={16} />
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between premium-border group"
            >
              <div className="space-y-4">
                {/* Title and delete */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {job.title}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(job.id, e)}
                    disabled={deletingId === job.id}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                  >
                    {deletingId === job.id ? <Loader className="animate-spin" size={15} /> : <Trash2 size={15} />}
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {job.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {job.candidate_count ?? 0} candidates
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-2">Core Skills Required</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills_required.slice(0, 3).map((skill) => (
                      <span key={skill} className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {skill}
                      </span>
                    ))}
                    {job.skills_required.length > 3 && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        +{job.skills_required.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-6 mt-auto">
                <span>Evaluate Candidates</span>
                <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
