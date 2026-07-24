"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, LayoutDashboard, Briefcase, BarChart3, LogOut, User, Menu, X, CreditCard, Users, Sparkles } from "lucide-react";
import { api, User as UserType } from "@/lib/api";
import Logo from "@/components/Logo";

const getThemeClass = (plan: string | null) => {
  if (plan === "GROWTH") return "theme-growth";
  if (plan === "ENTERPRISE") return "theme-enterprise";
  return "theme-starter";
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hirecue_token");
    const userStr = localStorage.getItem("hirecue_user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const userObj = JSON.parse(userStr);
      setCurrentUser(userObj);
      
      // Try to get current plan from local storage if available
      const cachedPlan = localStorage.getItem("hirecue_plan");
      if (cachedPlan) {
        setCurrentPlan(cachedPlan);
        document.documentElement.className = getThemeClass(cachedPlan);
      }
      
      // Proactively fetch fresh user details and subscription
      Promise.all([api.getCurrentUser(), api.getSubscription()])
        .then(([user, sub]) => {
          setCurrentUser(user);
          setPlanStatus(sub.plan_status);
          setCurrentPlan(sub.current_plan);
          localStorage.setItem("hirecue_plan", sub.current_plan);
          localStorage.setItem("hirecue_user", JSON.stringify(user));
          
          if (sub.plan_status !== "ACTIVE" && sub.plan_status !== "TRIAL" && sub.plan_status !== "ONBOARDING" && pathname !== "/dashboard/billing") {
            router.push("/dashboard/billing");
          }
        })
        .catch(() => {
          // ignore, keep cached user details
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      localStorage.clear();
      router.push("/login");
    }
  }, [router, pathname]);

  useEffect(() => {
    if (currentPlan) {
      document.documentElement.className = getThemeClass(currentPlan);
    }
  }, [currentPlan]);

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem("hirecue_plan");
    document.documentElement.className = "theme-starter";
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Job Postings", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Hiring Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
    { name: "Team Settings", href: "/dashboard/team", icon: Users },
  ];

  if (loading && !currentUser) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center bg-slate-50 theme-starter`}>
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-10" />
          <span className="text-sm font-semibold text-slate-500">Loading Hirecue Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 ${getThemeClass(currentPlan)}`}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-full flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center">
          <Logo className="h-6" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? currentPlan === "GROWTH"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-blue-50 text-blue-600 border-l-4 border-blue-600 pl-3"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} className={isActive ? currentPlan === "GROWTH" ? "text-inherit" : "text-blue-600" : "text-slate-400"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-200 bg-[#162128] space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1e2d36] text-teal-500 flex items-center justify-center font-bold text-lg shadow-inner border border-[#2a3f4c]">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-500 truncate leading-none mb-1.5 drop-shadow-sm">
                {currentUser?.full_name || "User Profile"}.
              </p>
              <span className="inline-block bg-transparent text-teal-600/90 px-2 py-0.5 rounded text-[9px] font-black tracking-widest border border-teal-900/50 uppercase">
                {currentUser?.role?.replace("_", " ") || "USER"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-teal-900/40 text-slate-300 hover:text-white hover:bg-teal-900/20 hover:border-teal-700/50 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <LogOut size={14} className="text-slate-400" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 bg-white h-full transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="h-6" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? currentPlan === "GROWTH"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-blue-50 text-blue-600 border-l-4 border-blue-600 pl-3"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} className={isActive ? currentPlan === "GROWTH" ? "text-inherit" : "text-blue-600" : "text-slate-400"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-[#162128] space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1e2d36] text-teal-500 flex items-center justify-center font-bold text-lg shadow-inner border border-[#2a3f4c]">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-500 truncate leading-none mb-1.5 drop-shadow-sm">
                {currentUser?.full_name || "User Profile"}.
              </p>
              <span className="inline-block bg-transparent text-teal-600/90 px-2 py-0.5 rounded text-[9px] font-black tracking-widest border border-teal-900/50 uppercase">
                {currentUser?.role?.replace("_", " ") || "USER"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-teal-900/40 text-slate-300 hover:text-white hover:bg-teal-900/20 hover:border-teal-700/50 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <LogOut size={14} className="text-slate-400" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Onboarding Modal Overlay */}
        {planStatus === "ONBOARDING" && (
          <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-6">
              <div className="bg-blue-50 p-4 rounded-full text-blue-600">
                <Sparkles size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">Welcome to Hirecue!</h2>
                <p className="text-slate-500 text-sm font-medium">To get started, please select your path.</p>
              </div>
              <div className="w-full space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      await api.startTrial();
                      setPlanStatus("TRIAL");
                      window.location.reload();
                    } catch (e) {
                      alert("Failed to start trial.");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md"
                >
                  Start my 1-Day Free Trial
                </button>
                <button 
                  onClick={() => {
                    setPlanStatus(null);
                    router.push("/dashboard/billing");
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  View Premium Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700 focus:outline-none">
            <Menu size={22} />
          </button>
          <Logo className="h-6" />
          <div className="w-6"></div> {/* placeholder to align header */}
        </header>

        {/* Dynamic Page Scroll Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
