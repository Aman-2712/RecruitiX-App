"use client";

import React, { useState, useEffect } from "react";
import { api, TeamMember, User } from "@/lib/api";
import { Users, Mail, Shield, ShieldAlert, Trash2, Plus, X, Check, Loader2 } from "lucide-react";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("RECRUITER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userStr = localStorage.getItem("hirecue_user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
      
      const teamData = await api.getTeamMembers();
      setMembers(teamData);
    } catch (err) {
      console.error("Failed to load team members", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess(false);
    
    try {
      await api.inviteTeamMember(inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail("");
      fetchData(); // reload team
      
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (userId === currentUser?.id) return;
    try {
      await api.updateTeamMemberRole(userId, newRole);
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole as any } : m));
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleRemove = async (userId: number) => {
    if (userId === currentUser?.id) return;
    if (!confirm("Are you sure you want to remove this user from your team?")) return;
    
    try {
      await api.removeTeamMember(userId);
      setMembers(members.filter(m => m.id !== userId));
    } catch (err: any) {
      alert(err.message || "Failed to remove user");
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Settings</h1>
          <p className="text-slate-500 mt-1">Manage your team members and roles.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            Invite Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{member.full_name || "Pending Invite"}</div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.is_email_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
                        <Loader2 size={14} className="animate-spin" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin && member.id !== currentUser?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 font-semibold"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="RECRUITER">Recruiter</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        {member.role === "ADMIN" ? <ShieldAlert size={16} className="text-blue-600"/> : <Shield size={16} className="text-slate-400"/>}
                        {member.role.replace("_", " ")}
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      {member.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-slate-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
                          title="Remove user"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              
              {members.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-500">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Invite Teammate</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6">
              {inviteSuccess ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 font-medium">
                  <Check className="text-green-600" />
                  Invite sent successfully!
                </div>
              ) : (
                <div className="space-y-4">
                  {inviteError && (
                    <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl">
                      {inviteError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 font-medium"
                        placeholder="colleague@company.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 font-medium bg-white"
                    >
                      <option value="RECRUITER">Recruiter (View Only)</option>
                      <option value="HR_MANAGER">HR Manager (Manage Jobs)</option>
                      <option value="ADMIN">Admin (Manage Billing & Team)</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                  >
                    {inviteLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Invite"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
