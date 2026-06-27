"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            (window as any).google.accounts.id.renderButton(
              btnEl,
              { theme: "outline", size: "large", text: "signin_with", width: 382 }
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
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 glow">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="mb-2">
            <Logo className="h-12" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to manage your hiring pipelines</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} /> Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex-grow border-t border-slate-150"></div>
          <span className="flex-shrink mx-4">Or Continue With</span>
          <div className="flex-grow border-t border-slate-150"></div>
        </div>

        <div className="space-y-3">
          <div id="google-button" className="w-full flex justify-center"></div>
        </div>

        <div className="pt-2 text-center text-sm text-slate-500 font-medium border-t border-slate-100">
          New to Hirecue?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
