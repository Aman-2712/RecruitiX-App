"use strict";

import Link from "next/link";
import { ArrowRight, Bot, Cpu, FileText, CheckCircle, Shield, Zap, Briefcase, Sparkles, UserCheck } from "lucide-react";
import Logo from "@/components/Logo";
import Navbar from "@/components/Navbar";
import LinkedInIcon from "@/components/LinkedInIcon";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-16 md:pt-28 md:pb-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 md:gap-16">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Zap size={12} className="fill-blue-700" /> Introducing Hirecue v1.0
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Discover world-class talent on <span className="text-blue-600">autopilot</span>.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Hirecue is your autonomous recruitment assistant. Automatically parse, score, and rank candidates against any job description with deep AI insights. Eliminate 80% of manual screening work.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center gap-2">
              Start Screening Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-base font-semibold px-6 py-3.5 rounded-xl transition-all">
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden premium-border glow">
            {/* Header toolbar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                <div className="h-3 w-3 rounded-full bg-slate-300"></div>
              </div>
              <div className="bg-slate-200/60 px-3 py-1 rounded-md text-xs font-medium text-slate-500">hirecue.online/dashboard</div>
              <div className="w-10"></div>
            </div>
            
            {/* Mock Dashboard Body */}
            <div className="p-6 space-y-6">
              {/* Candidate Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-5 w-40 bg-slate-200 rounded animate-pulse"></div>
                  <a 
                    href="https://www.linkedin.com/in/nadeem-shaik-458981343?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    <LinkedInIcon className="w-4 h-4" /> Connect on LinkedIn
                  </a>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-sm font-bold">
                  92% Match
                </div>
              </div>

              {/* Grid of Scores */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-slate-50 border border-slate-100 p-2 md:p-4 rounded-xl text-center">
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 block uppercase">Skill Match</span>
                  <span className="text-lg md:text-xl font-bold text-slate-800">95%</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 md:p-4 rounded-xl text-center">
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 block uppercase">Experience</span>
                  <span className="text-lg md:text-xl font-bold text-slate-800">88%</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 md:p-4 rounded-xl text-center">
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 block uppercase">Relevance</span>
                  <span className="text-lg md:text-xl font-bold text-slate-800">93%</span>
                </div>
              </div>

              {/* Copilot Insights */}
              <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-bold">
                  <Bot size={16} /> AI HR Copilot Insights
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-xs text-slate-600 font-medium">Strong React/Next.js experience (4+ years)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-xs text-slate-600 font-medium">Has built similar scalable B2B SaaS platforms</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-amber-500 font-bold">!</span>
                    <span className="text-xs text-slate-600 font-medium">Lacks direct AWS deployment experience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900 text-white py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-2">
            <span className="text-4xl lg:text-5xl font-black text-blue-400">80%</span>
            <h4 className="text-lg font-bold">Screening Workload Reduced</h4>
            <p className="text-sm text-slate-400">AI automatically parses and evaluates candidates on upload.</p>
          </div>
          <div className="space-y-2 border-slate-800 md:border-x px-4">
            <span className="text-4xl lg:text-5xl font-black text-blue-400">10x</span>
            <h4 className="text-lg font-bold">Faster Time-to-Hire</h4>
            <p className="text-sm text-slate-400">Identify top matches instantly and schedule interviews immediately.</p>
          </div>
          <div className="space-y-2">
            <span className="text-4xl lg:text-5xl font-black text-blue-400">0%</span>
            <h4 className="text-lg font-bold">Setup Friction</h4>
            <p className="text-sm text-slate-400">Paste your job, upload resumes, and view matches in seconds.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Everything you need for smart recruiting.
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Hirecue automates the heavy-lifting of candidate screening while leaving final human judgments to your HR experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI Parsing Agent</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Instantly extract contact info, skills, complete work history, and education from standard PDF or DOCX files into a structured database.
            </p>
          </div>
          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Structured Matching</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Compare candidate profile against job specifications to calculate dedicated Skill, Experience, and Relevance scores out of 100.
            </p>
          </div>
          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI HR Copilot</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Get an instant textual briefing on why a candidate is recommended and potential red flags to keep in mind before inviting them.
            </p>
          </div>
          {/* Card 4 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Bulk Resume Upload</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Upload hundreds of candidate resumes simultaneously. The pipeline queues, parses, and matches them in parallel effortlessly.
            </p>
          </div>
          {/* Card 5 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Candidate Funnel</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Manage pipeline statuses seamlessly from applied, shortlisted, interview scheduled, interviewed, all the way to reject or hire.
            </p>
          </div>
          {/* Card 6 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Role-Based Access</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Configure fine-grained permissions for Admins, HR Managers, and Recruiters to restrict creation and deletion privileges.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="workflow" className="py-16 md:py-24 px-6 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={12} className="fill-blue-700" /> Seamless Integration
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              How Hirecue Works
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Skip the manual screening pile. Hirecue automates candidate ranking and evaluation in four simple, highly secure steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-slate-900/10 font-black text-6xl select-none transition-colors group-hover:text-blue-50/20">01</div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit relative z-10">
                <Briefcase size={22} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-bold text-slate-900">1. Post a Job Opportunity</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Create a job posting by entering the title, description, and required experience level. Let the AI extract requirements instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-slate-900/10 font-black text-6xl select-none transition-colors group-hover:text-blue-50/20">02</div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit relative z-10">
                <FileText size={22} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-bold text-slate-900">2. Upload Candidate Resumes</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Drag and drop candidate resumes in bulk (PDF or DOCX). Our parser extracts text and matches them to your database automatically.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-slate-900/10 font-black text-6xl select-none transition-colors group-hover:text-blue-50/20">03</div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit relative z-10">
                <Cpu size={22} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-bold text-slate-900">3. Evaluate and Score</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  The AI scoring engine compares resumes with job parameters to calculate match rates across skills, experience, and relevance.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-slate-900/10 font-black text-6xl select-none transition-colors group-hover:text-blue-50/20">04</div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit relative z-10">
                <CheckCircle size={22} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-bold text-slate-900">4. Review and Shortlist</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Access ranked list views. Examine AI summaries, analyze weaknesses with the HR Copilot, and schedule interviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="py-16 md:py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Background decorative element */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Founder Avatar Badge */}
          <div className="flex-shrink-0 relative">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-xl">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex flex-col items-center justify-center text-center p-2">
                <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">SN</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Founder</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg">
              <UserCheck size={16} />
            </div>
          </div>

          {/* Founder Bio & LinkedIn CTA */}
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={12} className="fill-blue-300" /> Leadership & Vision
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Meet the Founder
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              &quot;We built HireCue to empower recruitment teams, founders, and agencies to automate 80% of manual resume screening work with deep AI precision. Our mission is to make intelligent hiring accessible and effortless for every team.&quot;
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Shaik. Nadeem Ahmed</h3>
                <p className="text-xs font-semibold text-blue-400">Founder & CEO, HireCue</p>
              </div>

              <a 
                href="https://www.linkedin.com/in/nadeem-shaik-458981343?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <LinkedInIcon className="w-4 h-4" /> Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Bot size={16} className="text-blue-600" /> Hirecue
            <span className="text-xs text-slate-400 font-normal ml-2">Founded by <strong className="text-slate-700">Shaik. Nadeem Ahmed</strong></span>
          </div>
          <div>&copy; 2026 Hirecue Platform. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a 
              href="https://www.linkedin.com/in/nadeem-shaik-458981343?utm_source=share_via&utm_content=profile&utm_medium=member_android"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1 font-semibold text-xs text-slate-600"
            >
              <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" /> Founder LinkedIn
            </a>
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
