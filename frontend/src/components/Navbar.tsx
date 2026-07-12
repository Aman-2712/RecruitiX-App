import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-55 w-full glass border-b border-slate-200/80 px-6 py-4 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-6" />
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link>
        <Link href="/#workflow" className="hover:text-blue-600 transition-colors">How it Works</Link>
        <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
        <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors px-4 py-2">
          Sign In
        </Link>
        <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5">
          Get Started <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}
