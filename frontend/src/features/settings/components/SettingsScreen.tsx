"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings, Activity, Users, Building2, Server } from "lucide-react";
import { MentoringTab, TeamSummary, MentoringNote } from "./MentoringTab";
import { RolesTab, UserRecord } from "./RolesTab";
import { BranchTab } from "./BranchTab";
import { AddUserDialog } from "./AddUserDialog";
import { MentoringNoteDialog } from "./MentoringNoteDialog";
import { apiClient } from "@/infrastructure/http/api-client";
import { useAuth } from "@/lib/auth/auth-context";

export function SettingsScreen() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"mentoring" | "roles" | "branch">("mentoring");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [mentoringDialogOpen, setMentoringDialogOpen] = useState(false);
  const [selectedRepForMentoring, setSelectedRepForMentoring] = useState<string>("");
  const [selectedRepIdForMentoring, setSelectedRepIdForMentoring] = useState<string>("");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);

  const [mentoringNotes, setMentoringNotes] = useState<MentoringNote[]>([]);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (currentUser?.role !== "admin") return;
    try {
      setError("");
      const [usersRes, summaryRes, notesRes] = await Promise.all([
        apiClient.get<UserRecord[]>("/users"),
        apiClient.get<TeamSummary>("/users/monitoring"),
        apiClient.get<MentoringNote[]>("/mentoring/notes"),
      ]);
      if (usersRes) setUsers(usersRes);
      if (summaryRes) setSummary(summaryRes);
      if (Array.isArray(notesRes)) setMentoringNotes(notesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الإعدادات.");
    }
  }, [currentUser?.role]);

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المستخدم "${name}"؟`)) return;
    try {
      await apiClient.delete(`/users/${id}`);
      await loadData();
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "تعذر حذف المستخدم. راجع توزيع أعماله ثم حاول مرة أخرى.");
    }
  };

  const handleAddMentoringNote = async (note: { repId: string; type: string; message: string; date: string }) => {
    try {
      const saved = await apiClient.post<MentoringNote>("/mentoring/notes", {
        repId: note.repId,
        type: note.type,
        message: note.message,
      });
      setMentoringNotes((prev) => [saved, ...prev]);
    } catch (error) { throw error; }

  };

  if (currentUser?.role !== "admin") return <div className="space-y-3"><h1>حسابي</h1><p>{currentUser?.fullName}</p><p className="text-sm">تظهر لك بيانات العملاء المسندين إليك. تواصل مع مسؤول الفرع لإدارة الحساب والصلاحيات.</p></div>;
  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200"><span>{error}</span><button onClick={loadData} className="min-h-11 rounded-lg border border-red-200 px-3 font-semibold dark:border-red-800">إعادة المحاولة</button></div>}
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/20">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-stone-100">
              إعدادات النظام وإشراف الإدارة
            </h1>
            <p className="text-xs text-slate-500 dark:text-stone-400">
              فرع المحلة الكبرى • مراقبة وتوجيه أداء المناديب • إدارة الأدوار والصلاحيات
            </p>
          </div>
        </div>

        {/* Server Status Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Server size={14} className="text-emerald-600 animate-pulse" />
          <span className="font-semibold">إدارة الفرع</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-px">
        <button
          onClick={() => setActiveTab("mentoring")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === "mentoring"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          <Activity size={16} />
          <span>الفريق</span>
          {summary && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700 dark:bg-red-950 dark:text-red-300">
              {summary.totalReps} مناديب
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === "roles"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          <Users size={16} />
          <span>المستخدمون</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-stone-800 dark:text-stone-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("branch")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === "branch"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          <Building2 size={16} />
          <span>الفرع</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "mentoring" && (
        <MentoringTab
          summary={summary}
          mentoringNotes={mentoringNotes}
          onOpenMentoringDialog={(repId, repName) => {
            setSelectedRepIdForMentoring(repId);
            setSelectedRepForMentoring(repName);
            setMentoringDialogOpen(true);
          }}
        />
      )}

      {activeTab === "roles" && (
        <RolesTab
          users={users}
          onUserSaved={loadData}
          onOpenAddUserDialog={() => setAddUserDialogOpen(true)}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === "branch" && (
        <BranchTab />
      )}

      {/* Dialogs */}


      <AddUserDialog
        open={addUserDialogOpen}
        onClose={() => setAddUserDialogOpen(false)}
        onSuccess={loadData}
      />

      <MentoringNoteDialog
        open={mentoringDialogOpen}
        onClose={() => setMentoringDialogOpen(false)}
        repName={selectedRepForMentoring}
        repId={selectedRepIdForMentoring}
        onSuccess={handleAddMentoringNote}
      />
    </div>
  );
}
