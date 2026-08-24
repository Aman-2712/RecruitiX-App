import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LinkedInIcon from "@/components/LinkedInIcon";

export const metadata: Metadata = {
  title: "About HireCue — Founded Solely by Shaik. Nadeem Ahmed",
  description: "Learn about HireCue (https://hirecue.online), the autonomous AI recruitment platform founded solely by Shaik. Nadeem Ahmed (Founder & CEO).",
  keywords: ["HireCue", "Shaik. Nadeem Ahmed", "Shaik Nadeem Ahmed", "Founder of HireCue", "HireCue Founder", "HireCue CEO", "HireCue About"],
  alternates: {
    canonical: "https://hirecue.online/about",
  },
};

export default function AboutPage() {
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Corporation",
        "@id": "https://hirecue.online/#organization",
        "name": "HireCue",
        "legalName": "HireCue Technologies",
        "url": "https://hirecue.online",
        "logo": "https://hirecue.online/logo.png",
        "description": "HireCue (https://hirecue.online) is an AI-powered candidate screening and recruitment automation SaaS startup founded solely by Shaik. Nadeem Ahmed (Solo Founder & CEO).",
        "foundingDate": "2024",
        "founder": {
          "@type": "Person",
          "@id": "https://hirecue.online/#founder",
          "name": "Shaik. Nadeem Ahmed",
          "alternateName": ["Nadeem Shaik", "Shaik Nadeem Ahmed"],
          "jobTitle": "Solo Founder & CEO",
          "url": "https://www.linkedin.com/in/nadeem-shaik-458981343",
          "sameAs": ["https://www.linkedin.com/in/nadeem-shaik-458981343"]
        }
      },
      {
        "@type": "Person",
        "@id": "https://hirecue.online/#founder",
        "name": "Shaik. Nadeem Ahmed",
        "alternateName": ["Nadeem Shaik", "Shaik Nadeem Ahmed"],
        "jobTitle": "Solo Founder & CEO",
        "worksFor": {
          "@type": "Corporation",
          "name": "HireCue",
          "url": "https://hirecue.online"
        },
        "sameAs": ["https://www.linkedin.com/in/nadeem-shaik-458981343"]
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider">
            About HireCue
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Autonomous AI Hiring for Modern Teams
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            HireCue (<Link href="https://hirecue.online" className="text-blue-600 underline">https://hirecue.online</Link>) is a B2B AI-powered candidate screening and recruitment platform built to eliminate 80% of manual resume evaluation work.
          </p>
        </div>

        {/* Founder Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Company Leadership
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-black text-slate-900">Shaik. Nadeem Ahmed</h3>
              <p className="text-sm font-bold text-blue-600">Solo Founder & CEO, HireCue</p>
              <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                HireCue is founded solely by Shaik. Nadeem Ahmed to provide recruitment teams, startups, and hiring managers with autonomous AI parsing, candidate ranking, and intelligent HR insights.
              </p>
            </div>
            <a
              href="https://www.linkedin.com/in/nadeem-shaik-458981343?utm_source=share_via&utm_content=profile&utm_medium=member_android"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md flex-shrink-0"
            >
              <LinkedInIcon className="w-4 h-4" /> Founder LinkedIn
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        &copy; 2026 HireCue Platform. Founded solely by Shaik. Nadeem Ahmed. All rights reserved.
      </footer>
    </div>
  );
}
