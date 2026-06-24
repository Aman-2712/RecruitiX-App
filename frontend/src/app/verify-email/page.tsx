"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot, CheckCircle, XCircle, Loader } from "lucide-react";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.verifyEmail(token);
        setStatus("success");
        setMessage(res.message || "Email successfully verified.");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link might be expired or invalid.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 glow text-center">
        <div className="flex flex-col items-center space-y-2">
          <Link href="/" className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-center pulse-primary mb-2">
            <Bot size={28} className="stroke-[2.5]" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Verification</h1>
        </div>

        <div className="py-6">
          {status === "loading" && (
            <div className="flex flex-col items-center text-slate-500 space-y-4">
              <Loader className="animate-spin text-blue-600" size={48} />
              <p className="font-medium">Verifying your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center text-emerald-600 space-y-4">
              <CheckCircle size={48} />
              <p className="font-medium text-slate-700">{message}</p>
              <Link href="/login" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center">
                Proceed to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-red-600 space-y-4">
              <XCircle size={48} />
              <p className="font-medium text-slate-700">{message}</p>
              <Link href="/login" className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader className="animate-spin text-blue-600" size={32} /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
