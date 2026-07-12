"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, User, Briefcase, ArrowRight, Loader } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("RECRUITER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGoogleCallback(response: any) {
    setLoading(true);
    setError("");
    try {
      await api.googleLogin(response.credential);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google Authentication failed.");
      setLoading(false);
    }
  }

  function initializeGoogleSignIn() {
    try {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1036329707172-mockclientid.apps.googleusercontent.com",
          callback: handleGoogleCallback,
        });
        
        // Defer rendering slightly to guarantee the DOM element is mounted
        setTimeout(() => {
          const btnEl = document.getElementById("google-button");
          if (btnEl && (window as any).google) {
            // Dynamically calculate width based on container (max 400px per Google's API)
            const containerWidth = btnEl.offsetWidth || 300;
            const buttonWidth = Math.min(containerWidth, 400);

            (window as any).google.accounts.id.renderButton(
              btnEl,
              { theme: "outline", size: "large", text: "signup_with", width: buttonWidth }
            );
          }
        }, 300);
      }
    } catch (err) {
      console.error("Failed to initialize Google GSI:", err);
    }
  }

  useEffect(() => {
    // Check if script already loaded
    if (document.getElementById("google-gsi-script")) {
      initializeGoogleSignIn();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.register(email, password, fullName, role);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 glow">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-center pulse-primary mb-2">
            <Bot size={28} className="stroke-[2.5]" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500">Get started screening resumes with AI</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Mail className="text-emerald-500" size={40} />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">Check your email</h3>
              <p className="text-emerald-700 text-sm">
                We've sent a verification link to {email}. Please verify your email to continue.
              </p>
            </div>
            <Link href="/login" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center">
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.jenkins@company.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Your Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="HR_MANAGER">HR Manager / Talent Acquisition</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold">
                  ▼
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} /> Registering...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="relative flex py-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex-grow border-t border-slate-150"></div>
          <span className="flex-shrink mx-4">Or Continue With</span>
          <div className="flex-grow border-t border-slate-150"></div>
        </div>

        <div className="space-y-3">
          <div id="google-button" className="w-full flex justify-center"></div>
        </div>

        <div className="pt-2 text-center text-sm text-slate-500 font-medium border-t border-slate-100">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
