"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader, Check, Briefcase, Plus, X } from "lucide-react";
import { api } from "@/lib/api";

export default function NewJobPosting() {
  const router = useRouter();

  // Raw Description parsing states
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Remote");
  const [minExperience, setMinExperience] = useState(0);
  const [education, setEducation] = useState("Bachelor's Degree");
  const [currentPlan, setCurrentPlan] = useState("STARTER");

  useEffect(() => {
    const cachedPlan = localStorage.getItem("hirecue_plan");
    if (cachedPlan) {
      setCurrentPlan(cachedPlan);
    }
  }, []);
  
  const [skillInput, setSkillInput] = useState("");
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [skillsPreferred, setSkillsPreferred] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAiExtract = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setError("");

    try {
      const data = await api.parseJobDescription(rawText);
      if (data.title) setTitle(data.title);
      if (data.skills_required) setSkillsRequired(data.skills_required);
      if (data.skills_preferred) setSkillsPreferred(data.skills_preferred);
      if (data.min_experience !== undefined) setMinExperience(data.min_experience);
      if (data.location !== undefined) setLocation(data.location || "Remote");
      if (data.education_required !== undefined) setEducation(data.education_required || "");
      
      // Update description field if it is empty
      if (!description) {
        setDescription(rawText);
      }
    } catch (err: any) {
      setError("AI Parsing failed. Ensure backend server is running.");
    } finally {
      setParsing(false);
    }
  };

  const handleAddRequiredSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skillsRequired.includes(skillInput.trim())) {
      setSkillsRequired([...skillsRequired, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleAddPreferredSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (prefSkillInput.trim() && !skillsPreferred.includes(prefSkillInput.trim())) {
      setSkillsPreferred([...skillsPreferred, prefSkillInput.trim()]);
      setPrefSkillInput("");
    }
  };

  const handleRemoveRequiredSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter((s) => s !== skill));
  };

  const handleRemovePreferredSkill = (skill: string) => {
    setSkillsPreferred(skillsPreferred.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || skillsRequired.length === 0) {
      setError("Please fill out Job Title, Job Description, and add at least one Required Skill.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        description,
        skills_required: skillsRequired,
        skills_preferred: skillsPreferred,
        min_experience: minExperience,
        education_required: education,
        location,
        ai_model: "GEMINI"
      };
      await api.createJob(payload);
      router.push("/dashboard/jobs");
    } catch (err: any) {
      setError(err.message || "Failed to create job posting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/dashboard/jobs" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Job Postings
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Job Posting</h1>
        <p className="text-slate-500 font-medium mt-1">Specify job requirements to feed the AI matching engines</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: AI Parser helper */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles size={16} className="text-blue-600 fill-blue-100" />
            <h3 className="font-bold text-slate-900">AI Requirement Extractor</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Paste a raw job description description or draft below. Hirecue will automatically extract the Title, Required Skills, and experience parameters.
          </p>
          <div className="space-y-3">
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw JD text here (e.g. 'Looking for a Senior Python Developer with 5+ years experience in FastAPI, Postgres, and Docker...')"
              className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-slate-800 placeholder:text-slate-400 font-medium transition-all"
            />
            <button
              onClick={handleAiExtract}
              type="button"
              disabled={parsing || !rawText.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {parsing ? (
                <>
                  <Loader className="animate-spin" size={14} /> Extracting...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Extract Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right column: Form details */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm premium-border space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Briefcase size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-900">Position Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Job Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Full Stack Engineer"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote / New York, NY"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Education Requirements</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Bachelor's in Computer Science"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Minimum Experience (Years)</label>
              <input
                type="number"
                min={0}
                required
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium transition-all"
              />
            </div>
          </div>

          {/* Required Skills Input */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Required Skills <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="React (press Add)"
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition-all text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddRequiredSkill}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold px-3.5 sm:px-4 py-3 rounded-xl flex items-center gap-1 transition-all text-xs flex-shrink-0"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              {skillsRequired.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xl text-xs font-bold uppercase">
                  {skill}
                  <button type="button" onClick={() => handleRemoveRequiredSkill(skill)} className="hover:text-red-500 p-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {skillsRequired.length === 0 && (
                <span className="text-xs text-slate-400 font-medium">No required skills added yet.</span>
              )}
            </div>
          </div>

          {/* Preferred Skills Input */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Preferred / Nice-to-Have Skills</label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                placeholder="AWS (press Add)"
                className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition-all text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddPreferredSkill}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold px-3.5 sm:px-4 py-3 rounded-xl flex items-center gap-1 transition-all text-xs flex-shrink-0"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              {skillsPreferred.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold uppercase">
                  {skill}
                  <button type="button" onClick={() => handleRemovePreferredSkill(skill)} className="hover:text-red-500 p-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {skillsPreferred.length === 0 && (
                <span className="text-xs text-slate-400 font-medium">No preferred skills added.</span>
              )}
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Full Job Description</label>
            <textarea
              required
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide the complete responsibilities, qualifications, and role specifics..."
              className="w-full border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:border-blue-600 text-slate-800 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/jobs"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={16} /> Creating...
                </>
              ) : (
                <>
                  <Check size={16} /> Create Posting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
