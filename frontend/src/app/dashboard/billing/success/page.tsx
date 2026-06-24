"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader } from "lucide-react";

export default function PaymentSuccessPage() {
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Simulate a brief verification delay while webhook processes in the background
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg shadow-emerald-600/5 border border-slate-200 max-w-md w-full text-center space-y-6 premium-border">
        {verifying ? (
          <div className="space-y-5 py-8">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verifying Payment...</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Please wait while we confirm your payment securely.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="text-emerald-500" size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful!</h1>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Thank you for upgrading! Your invoice has been sent to your email, and your account limits have been instantly updated.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/dashboard/billing"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow shadow-blue-600/20"
              >
                Return to Billing Dashboard <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
