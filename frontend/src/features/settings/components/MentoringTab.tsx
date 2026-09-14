"use client";

import React from "react";
import { Users, TrendingUp, Award, AlertTriangle, Target, MessageSquare, Lightbulb } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { Button } from "@/components/ui/button";

export interface RepPerformance {
  repId: string;
  repName: string;
  username: string;
  role: string;
  customerCount: number;
  pipelineValue: number;
  lifetimeSales: number;
  overdueCount: number;
  completedCount: number;
  scheduledCount: number;
  activityCount: number;
  completionRate: number;
}

export interface TeamSummary {
  totalReps: number;
  totalCustomers: number;
  totalActivePipeline: number;
  totalWonSales: number;
  totalOverdueTasks: number;
  totalCompletedTasks: number;
  repsPerformance: RepPerformance[];
}

export interface MentoringNote {
  id: string;
  repId?: string;
  repName: string;
  type: string;
  message: string;
  date: string;
  author: string;
}

interface MentoringTabProps {
  summary: TeamSummary | null;
  mentoringNotes: MentoringNote[];
  onOpenMentoringDialog: (repId: string, repName: string) => void;
}

export function MentoringTab({ summary, mentoringNotes, onOpenMentoringDialog }: MentoringTabProps) {
  return (
    <div className="space-y-6">
      {/* Top KPI Cards for Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold">مناديب المبيعات الفعّالون</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <Users size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-stone-100">
            {summary?.totalReps ?? 2}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">فرع المحلة الكبرى الرئيسي</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold">حجم الصفقات الجارية للفريق</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-stone-100 font-mono" dir="ltr">
            {formatEgp(summary?.totalActivePipeline ?? 651000)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">صفقات في مراحل التفاوض والعروض</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold">مبيعات مغلقة (Won Deals)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <Award size={16} />
            </span>
          </div>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono" dir="ltr">
            {formatEgp(summary?.totalWonSales ?? 1098500)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">إجمالي المبيعات المحققة للفرع</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold">متابعات تستوجب التدخل</span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50">
              <AlertTriangle size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-red-600">
            {summary?.totalOverdueTasks ?? 3}
          </p>
          <p className="text-[11px] text-red-700 dark:text-red-300 font-medium mt-1">متأخرة عن مواعيدها المحددة</p>
        </div>
      </div>

      {/* Reps Performance & Mentoring Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-red-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-stone-100">
              مراقبة وتوجيه أداء مناديب المبيعات (Mentoring Matrix)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">محدث لحظياً من قاعدة بيانات SQLite</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/80 text-slate-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800">
              <tr>
                <th className="p-3.5 font-bold">المندوب</th>
                <th className="p-3.5 font-bold">العملاء</th>
                <th className="p-3.5 font-bold">الصفقات الجارية</th>
                <th className="p-3.5 font-bold">المبيعات المحققة</th>
                <th className="p-3.5 font-bold">المتابعات (إنجاز / تأخير)</th>
                <th className="p-3.5 font-bold">الأنشطة</th>
                <th className="p-3.5 font-bold text-center">إجراءات الإشراف والتوجيه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-slate-800 dark:text-stone-200">
              {summary?.repsPerformance.map((rep) => (
                <tr key={rep.repId} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold text-xs shrink-0">
                        {rep.repName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-stone-100">
                          {rep.repName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                          @{rep.username} • {rep.role === "supervisor" ? "مشرف" : "مندوب"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="font-bold">{rep.customerCount}</span> عملاء
                  </td>

                  <td className="p-3.5 font-mono font-semibold" dir="ltr">
                    {formatEgp(rep.pipelineValue)}
                  </td>

                  <td className="p-3.5 font-mono text-emerald-600 font-semibold" dir="ltr">
                    {formatEgp(rep.lifetimeSales)}
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">{rep.completedCount} منجزة</span>
                        <span>•</span>
                        <span className="text-red-700 dark:text-red-300 font-bold">{rep.overdueCount} متأخرة</span>
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, rep.completionRate))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="rounded-lg bg-slate-100 dark:bg-stone-800 px-2 py-1 text-[11px] font-semibold">
                      {rep.activityCount} تفاعل
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenMentoringDialog(rep.repId, rep.repName)}
                      className="h-8 gap-1.5 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold"
                    >
                      <MessageSquare size={13} />
                      <span>توجيه وملاحظة</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mentoring & Coaching Feed */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-stone-100">
              سجل التوجيه والملاحظات الإشرافية (Supervisory Coaching Log)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">توجيهات مباشرة للمناديب ومتابعة التنفيذ</span>
        </div>

        <div className="space-y-3">
          {mentoringNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-800/40"
            >
              <span
                className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                  note.type === "target"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : note.type === "alert"
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                }`}
              >
                {note.type === "target" ? (
                  <Target size={15} />
                ) : note.type === "alert" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <Lightbulb size={15} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-stone-100">
                      موجه إلى: {note.repName}
                    </span>
                    <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-stone-700 dark:text-stone-300">
                      بواسطة: {note.author}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{note.date}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                  {note.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
