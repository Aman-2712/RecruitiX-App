"use client";

import React, { useEffect, useState } from "react";
import { 
  CreditCard, RefreshCw, CheckCircle, AlertCircle, Loader, 
  BarChart3, Zap, Receipt, Sparkles, HelpCircle, Shield, Bot 
} from "lucide-react";
import { api, Organization, UsageTracking, Invoice, SubscriptionPlan } from "@/lib/api";

export default function BillingWorkspace() {
  const [subscription, setSubscription] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const subInfo = await api.getSubscription();
      setSubscription(subInfo);
      setCycle(subInfo.billing_cycle);
      
      const usageInfo = await api.getUsage();
      setUsage(usageInfo);
      
      const invoices = await api.getBillingHistory();
      setBillingHistory(invoices);
      
      const plansList = await api.getPlans();
      setPlans(plansList);
      
      setError("");
    } catch (err: any) {
      setError("Failed to load subscription details. Ensure backend server is online.");
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planName: string) => {
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }

      const orderData = await api.createRazorpayOrder(planName, cycle);
      
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hirecue",
        description: `Upgrade to ${planName} Plan`,
        order_id: orderData.order_id,
        notes: orderData.notes,
        handler: function (response: any) {
          setSuccess("Payment successful! Upgrading your account shortly...");
          setTimeout(() => fetchData(), 3000);
        },
        prefill: {
          name: subscription?.organization_name || "Company",
          email: "founder@company.com",
        },
        theme: {
          color: "#2563EB",
        },
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setError("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription? You will be immediately reverted to Starter limits.")) {
      return;
    }
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      await api.cancelSubscription();
      setSuccess("Subscription cancelled successfully. Reverted to STARTER.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel subscription.");
    } finally {
      setUpdating(false);
    }
  };



  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
          <span className="text-slate-500 font-medium">Loading subscription details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-500 font-medium mt-1">Manage billing plans, resource usage quotas, and invoices</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl font-medium">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl font-medium">
          <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Current Plan & Quota Gauges (Col span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current plan summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-900">Current Active Plan</h3>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  {subscription?.current_plan} PLAN
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    subscription?.plan_status === "ACTIVE" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  }`}>
                    {subscription?.plan_status}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Billing Cycle: {subscription?.billing_cycle}
                </p>
              </div>
            </div>
            
            {subscription?.current_plan !== "STARTER" && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-100 font-bold px-4 py-2 rounded-xl text-xs transition-all self-start sm:self-center"
              >
                {updating ? <Loader className="animate-spin" size={14} /> : "Cancel Subscription"}
              </button>
            )}
          </div>

          {/* Usage quotas progress gauges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BarChart3 className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900">Monthly Usage Quotas</h3>
            </div>

            <div className="space-y-6">
              {/* Job limit gauge */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Job Postings Created</span>
                    <span>
                      {usage.jobs_created} / {usage.jobs_limit === -1 ? "Unlimited" : usage.jobs_limit}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ 
                        width: `${usage.jobs_limit === -1 ? 10 : Math.min(100, (usage.jobs_created / usage.jobs_limit) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Resume limit gauge */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Resumes Processed</span>
                    <span>
                      {usage.resumes_processed} / {usage.resumes_limit === -1 ? "Unlimited" : usage.resumes_limit}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ 
                        width: `${usage.resumes_limit === -1 ? 5 : Math.min(100, (usage.resumes_processed / usage.resumes_limit) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* User limits gauge */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Team Members Added</span>
                    <span>
                      {usage.active_users} / {usage.users_limit === -1 ? "Unlimited" : usage.users_limit}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ 
                        width: `${usage.users_limit === -1 ? 5 : Math.min(100, (usage.active_users / usage.users_limit) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade plan selection portal */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Change Subscription Plan</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Select a new plan to unlock premium AI recruitment features</p>
              </div>

              {/* Toggle Billing Cycle */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setCycle("MONTHLY")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    cycle === "MONTHLY" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("YEARLY")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    cycle === "YEARLY" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isCurrent = subscription?.current_plan === p.name;
                const price = cycle === "MONTHLY" ? p.monthly_price : p.yearly_price;
                const isEnterprise = p.name === "ENTERPRISE";

                return (
                  <div 
                    key={p.name} 
                    className={`bg-white border rounded-2xl p-5 shadow-sm premium-border flex flex-col justify-between ${
                      isCurrent ? "border-blue-600 ring-1 ring-blue-100 bg-blue-50/5" : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-800 tracking-tight">{p.name}</span>
                        {isCurrent && (
                          <span className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-black text-slate-900">₹{price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{cycle === "MONTHLY" ? "/mo" : "/yr"}</span>
                      </div>

                      <ul className="space-y-2 text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-3">
                        <li>• {p.job_limit === -1 ? "Unlimited" : p.job_limit} Jobs</li>
                        <li>• {p.resume_limit === -1 ? "Unlimited" : p.resume_limit} Resumes</li>
                        <li>• {p.user_limit === -1 ? "Unlimited" : p.user_limit} Members</li>
                      </ul>
                    </div>

                    <div className="pt-6">
                      {isCurrent ? (
                        <span className="w-full text-center text-xs font-bold text-slate-400 border border-slate-150 py-2.5 rounded-xl block bg-slate-50">
                          Current Plan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(p.name)}
                          disabled={updating}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1"
                        >
                          {updating ? <Loader className="animate-spin" size={12} /> : "Upgrade"}
                        </button>
                      )}
                      

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Invoice History & Support portal (Col span 1) */}
        <div className="space-y-6">
          
          {/* Invoice logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900">Invoicing Logs</h3>
            </div>

            {billingHistory.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">No invoices recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {billingHistory.map((inv) => (
                  <div key={inv.invoice_no} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">{inv.invoice_no}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{inv.date} • {inv.plan}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black text-slate-800 block">₹{inv.amount.toLocaleString()}</span>
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-100 mt-0.5">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plan Limits FAQ quick card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm premium-border space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles size={16} className="text-blue-600 fill-blue-550/10" />
              <h4 className="font-bold text-slate-900">Need Custom Capacity?</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              If your recruitment team exceeds 5,000 resume reviews/month, get in touch with our enterprise consulting sales for a customized API rate or high-volume processing quotas.
            </p>
            <a href="mailto:sales@hirecue.com" className="text-xs font-bold text-blue-600 hover:text-blue-700 block">
              Contact Enterprise Sales →
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
