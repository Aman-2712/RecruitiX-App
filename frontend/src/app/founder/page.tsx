import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LinkedInIcon from "@/components/LinkedInIcon";

export const metadata: Metadata = {
  title: "Shaik. Nadeem Ahmed — Founder & CEO of HireCue",
  description: "Shaik. Nadeem Ahmed is the sole Founder & CEO of HireCue (https://hirecue.online), an AI-powered resume screening and candidate evaluation SaaS platform.",
  keywords: ["Shaik. Nadeem Ahmed", "Shaik Nadeem Ahmed", "Nadeem Shaik", "Founder of HireCue", "HireCue Founder", "HireCue CEO", "HireCue"],
  alternates: {
    canonical: "https://hirecue.online/founder",
  },
};

export default function FounderPage() {
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://hirecue.online/founder/#person",
    "name": "Shaik. Nadeem Ahmed",
    "alternateName": ["Nadeem Shaik", "Shaik Nadeem Ahmed"],
    "jobTitle": "Solo Founder & CEO",
    "worksFor": {
      "@type": "Corporation",
      "name": "HireCue",
      "url": "https://hirecue.online"
    },
    "url": "https://hirecue.online/founder",
    "sameAs": ["https://www.linkedin.com/in/nadeem-shaik-458981343"]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900">
            Shaik. Nadeem Ahmed
          </h1>
          <p className="text-base font-bold text-blue-600 uppercase tracking-wider">
            Solo Founder & CEO of HireCue
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 text-left">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Shaik. Nadeem Ahmed is the founder and CEO of <strong>HireCue</strong> (<Link href="https://hirecue.online" className="text-blue-600 underline">https://hirecue.online</Link>), an AI-driven recruitment and candidate evaluation platform designed to automate resume parsing, skill matching, and candidate ranking for modern hiring teams.
          </p>
          <div className="pt-4 flex justify-center">
            <a
              href="https://www.linkedin.com/in/nadeem-shaik-458981343?utm_source=share_via&utm_content=profile&utm_medium=member_android"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md"
            >
              <LinkedInIcon className="w-4 h-4" /> View LinkedIn Profile
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
