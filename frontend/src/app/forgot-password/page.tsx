"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bot, ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError("");
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while requesting password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 glow">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-center mb-2">
            <Bot size={28} className="stroke-[2.5]" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
          <p className="text-slate-500 text-sm">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
            <CheckCircle className="text-emerald-500 mx-auto" size={40} />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">Check your email</h3>
              <p className="text-emerald-700 text-sm">
                If {email} is registered, a password reset link has been sent.
              </p>
            </div>
            <Link href="/login" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-100">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/10"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="pt-2 text-center">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16} className="mr-1.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
