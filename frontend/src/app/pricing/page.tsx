"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Bot, ArrowRight, X, HelpCircle, Shield, Zap, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter Plan",
      description: "For small teams and startups starting to build their talent pool.",
      monthlyPrice: 2999,
      yearlyPrice: 29990, // ₹2,499/mo equivalent
      limits: [
        "3 Active Job Postings",
        "500 Resume Uploads / mo",
        "2 Team Members"
      ],
      features: [
        "AI Resume Parsing",
        "AI Candidate Matching",
        "AI Candidate Ranking",
        "Candidate Management",
        "Basic Analytics",
        "Email Support",
        "Bulk Resume Upload (up to 15 at once)"
      ],
      unlocked: [true, true, true, true, false, true, false, false, false, false, false],
      cta: "Start 1-Day Free Trial",
      popular: false,
      color: "border-slate-200 bg-white"
    },
    {
      name: "Growth Plan",
      description: "Perfect for scaling startups and active hiring agencies.",
      monthlyPrice: 9999,
      yearlyPrice: 99990, // ₹8,333/mo equivalent
      limits: [
        "20 Active Job Postings",
        "5,000 Resume Uploads / mo",
        "10 Team Members"
      ],
      features: [
        "AI Resume Parsing",
        "AI Candidate Matching",
        "AI Candidate Ranking",
        "Candidate Management",
        "Advanced Analytics",
        "Priority Support",
        "AI HR Copilot Insights",
        "Bulk Resume Upload (up to 50 at once)",
        "Advanced Search & Filters",
        "API Integration Access",
        "Hiring Funnel Analytics"
      ],
      unlocked: [true, true, true, true, true, true, true, true, true, true, false],
      cta: "Choose Growth Plan",
      popular: true,
      color: "border-blue-600 bg-white shadow-xl shadow-blue-600/5 ring-1 ring-blue-100"
    },
    {
      name: "Enterprise Plan",
      description: "For large talent acquisition teams needing unlimited capacity.",
      monthlyPrice: 49999,
      yearlyPrice: 499990, // ₹41,666/mo equivalent
      limits: [
        "Unlimited Job Postings",
        "Unlimited Resume Processing",
        "Unlimited Team Members"
      ],
      features: [
        "Everything in Growth",
        "Unlimited Bulk Resume Uploads",
        "ATS Integrations",
        "SSO Authentication",
        "White Labeling",
        "Audit logs & Compliance",
        "Dedicated Account Manager",
        "Custom AI Models",
        "Advanced Security Controls"
      ],
      unlocked: [true, true, true, true, true, true, true, true, true, true, true],
      cta: "Contact Enterprise Sales",
      popular: false,
      color: "border-slate-900 bg-slate-900 text-slate-900"
    }
  ];

  const allFeatures = [
    { category: "Core Parsing", name: "AI Resume Parsing", desc: "Automated information extraction from PDFs/Word files" },
    { category: "Core Parsing", name: "AI Candidate Matching", desc: "Compatibility score mapping against job requirements" },
    { category: "Core Parsing", name: "AI Candidate Ranking", desc: "Rank lists sorted by overall compatibility rating" },
    { category: "Collaboration", name: "Candidate Pipeline Funnel", desc: "Applied, Shortlisted, Interviewed stages workflow" },
    { category: "AI Copilot", name: "HR Copilot Insights", desc: "Written recommendations and gaps analysis" },
    { category: "AI Copilot", name: "Bulk Resume Upload", desc: "Upload files in bulk: Starter (15), Growth (50), Enterprise (Unlimited)" },
    { category: "Analytics", name: "Advanced Search & Filters", desc: "Detailed search bar + match score sliders" },
    { category: "Analytics", name: "Hiring Funnel Analytics", desc: "Pipeline stage distributions histograms" },
    { category: "Integration", name: "API Access", desc: "Programmatic access to matching and parsing engines" },
    { category: "Integration", name: "SSO & ATS Integrations", desc: "SAML, Okta SSO and Greenhouse/Workday links" },
    { category: "Security", name: "White Labeling & Audit Logs", desc: "Custom domains and activity compliance logs" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="text-center py-12 md:py-20 px-6 space-y-6 max-w-4xl mx-auto relative">
        <Link href="/" className="absolute left-6 top-8 text-slate-800 hover:underline hidden md:inline-block font-medium">
          &larr; Back to Home
        </Link>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={12} className="fill-blue-700" /> Subscription Billing Plans
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
          Simple pricing that scales <br/>with your hiring.
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
          Screen resumes automatically, rank candidates instantly, and find the perfect match without the manual work.
        </p>

        {/* Early Adopter Discount Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-lg shadow-blue-500/20 max-w-2xl mx-auto mt-4 transform hover:scale-[1.02] transition-transform cursor-default">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-300" size={24} />
            <div className="text-left">
              <h3 className="font-black text-lg tracking-tight">Early Adopter Special! 🎉</h3>
              <p className="text-sm text-blue-100 font-medium">Use code <span className="bg-white/20 px-2 py-0.5 rounded uppercase font-bold text-white tracking-widest border border-white/30">FOUNDER50</span> at checkout for 50% off your first 3 months!</p>
            </div>
          </div>
        </div>

        {/* Toggle Billing Cycle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-sm font-bold ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}>Billed Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-14 h-8 bg-slate-200 rounded-full p-1 transition-all relative focus:outline-none"
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${
              billingCycle === "yearly" ? "translate-x-6 bg-blue-600" : "translate-x-0"
            }`} />
          </button>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
            Billed Yearly <span className="bg-emerald-150 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">Save 20%</span>
          </span>
        </div>
      </section>

      {/* Plan Grid */}
      <section className="px-6 pb-16 md:pb-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => {
          const isEnterprise = p.name.includes("Enterprise");
          const price = billingCycle === "monthly" ? p.monthlyPrice : p.yearlyPrice;
          const cycleText = billingCycle === "monthly" ? "/mo" : "/yr";
          const formattedPrice = isNaN(price) ? "Custom" : `₹${price.toLocaleString()}`;

          return (
            <div 
              key={p.name} 
              className={`rounded-2xl border p-8 flex flex-col justify-between relative transition-all shadow-sm hover:shadow-md ${p.color} ${p.name === "Growth Plan" ? "theme-growth" : ""}`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 right-6 bg-blue-600 text-white border-4 border-slate-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Highly Popular
                </span>
              )}

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className={`text-xl font-extrabold tracking-tight ${p.name === "Growth Plan" ? "text-blue-500" : isEnterprise ? "text-white" : "text-slate-900"}`}>{p.name}</h3>
                  <p className={`text-xs mt-2 font-medium leading-relaxed ${p.name === "Growth Plan" ? "text-slate-400" : isEnterprise ? "text-slate-400" : "text-slate-500"}`}>
                    {p.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 pt-2">
                  <span className={`text-4xl font-black tracking-tight ${p.name === "Growth Plan" ? "text-blue-500" : isEnterprise ? "text-white" : "text-slate-900"}`}>{formattedPrice}</span>
                  <span className={`text-sm font-semibold ${p.name === "Growth Plan" ? "text-slate-400" : isEnterprise ? "text-slate-400" : "text-slate-500"}`}>{cycleText}</span>
                </div>

                {/* Limits */}
                <ul className={`space-y-3.5 pt-4 border-t ${p.name === "Growth Plan" ? "border-blue-100/20" : isEnterprise ? "border-slate-800" : "border-slate-200"}`}>
                  {p.limits.map((l) => (
                    <li key={l} className={`flex items-center gap-2.5 text-sm font-bold ${p.name === "Growth Plan" ? "text-white" : isEnterprise ? "text-slate-200" : "text-slate-900"}`}>
                      <Zap size={14} className={p.name === "Growth Plan" ? "text-blue-500" : isEnterprise ? "text-blue-500" : "text-blue-600"} />
                      {l}
                    </li>
                  ))}
                </ul>

                {/* Features */}
                <ul className="space-y-3 pt-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm font-semibold">
                      <Check size={14} className={p.name === "Growth Plan" ? "text-blue-500" : "text-emerald-500 flex-shrink-0"} />
                      <span className={p.name === "Growth Plan" ? "text-slate-200" : isEnterprise ? "text-slate-300" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA button */}
              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-center block shadow-sm hover:shadow transition-all ${
                    isEnterprise 
                      ? "bg-white text-slate-900 hover:bg-slate-100" 
                      : p.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10 hover:shadow-blue-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* Feature comparison table */}
      <section className="px-6 py-16 md:py-20 border-t border-slate-200 max-w-7xl mx-auto space-y-8 md:space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Plan comparison metrics</h2>
          <p className="text-xs text-slate-500 font-semibold">Decide which plan matches your talent acquisition volumes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden premium-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-150">
                <th className="p-5">Platform Features</th>
                <th className="p-5 text-center">Starter</th>
                <th className="p-5 text-center">Growth</th>
                <th className="p-5 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {allFeatures.map((f, idx) => (
                <tr key={f.name} className="hover:bg-slate-50/50">
                  <td className="p-5">
                    <span className="font-bold text-slate-900 block">{f.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{f.desc}</span>
                  </td>
                  <td className="p-5 text-center">
                    {plans[0].unlocked[idx] ? (
                      <Check className="text-emerald-500 mx-auto" size={16} />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    {plans[1].unlocked[idx] ? (
                      <Check className="text-emerald-500 mx-auto" size={16} />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <Check className="text-emerald-500 mx-auto" size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 md:py-20 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 font-semibold">Got questions about billing limits?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-blue-600" /> Can I change plans later?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Yes, you can upgrade or cancel your subscription at any time. When upgrading, your billing cycle resets immediately, and new quotas are activated.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-blue-600" /> What happens if I hit my limit?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                If you exceed your active job listings or resume processing capacity, our AI parser will prompt you to upgrade. You will never lose candidate files that are already screened.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-blue-600" /> Is there a trial period available?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Yes, every new account starts on our default Starter plan with active limits. You can switch to Growth or Enterprise to unlock premium AI capabilities like the Copilot.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-blue-600" /> Does it support Indian Rupee billing?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Yes, we support localized Indian Rupee (INR) invoicing, optimized for startups, regional agencies, and businesses across India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Bot size={16} className="text-blue-600" /> Hirecue
          </div>
          <div>&copy; 2026 Hirecue Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
