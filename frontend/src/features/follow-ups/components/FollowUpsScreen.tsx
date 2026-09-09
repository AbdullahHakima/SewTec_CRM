"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { FollowUpCard } from "./FollowUpCard";
import { FollowUpCompletionModal } from "./FollowUpCompletionModal";
import { FollowUpDrawer } from "./FollowUpDrawer";
import { FollowUp } from "@/types/crm";
import { CheckSquare, Plus, Clock, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseISO, getHours } from "date-fns";

export function FollowUpsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = (searchParams.get("view") as "today" | "overdue" | "upcoming" | "completed") || "today";

  const { followUps, counts } = useFollowUps({ view: currentView });

  const [activeFollowUpForModal, setActiveFollowUpForModal] = useState<FollowUp | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Group today's follow-ups into Morning (before 12:00) and Afternoon (12:00 and after)
  const todayGroups = useMemo(() => {
    if (currentView !== "today") return null;

    const morning: FollowUp[] = [];
    const afternoon: FollowUp[] = [];

    followUps.forEach((fu) => {
      try {
        const hour = getHours(parseISO(fu.scheduledAt));
        if (hour < 12) {
          morning.push(fu);
        } else {
          afternoon.push(fu);
        }
      } catch {
        morning.push(fu);
      }
    });

    return { morning, afternoon };
  }, [followUps, currentView]);

  const setView = (view: string) => {
    router.push(`/follow-ups?view=${view}`);
  };

  const tabs = [
    {
      key: "today",
      label: "متابعات اليوم",
      count: counts.today,
      icon: Clock,
      alert: false,
    },
    {
      key: "overdue",
      label: "المتأخرة",
      count: counts.overdue,
      icon: AlertTriangle,
      alert: counts.overdue > 0,
    },
    {
      key: "upcoming",
      label: "القادمة",
      count: counts.upcoming,
      icon: Calendar,
      alert: false,
    },
    {
      key: "completed",
      label: "المكتملة",
      count: counts.completed,
      icon: CheckCircle,
      alert: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f2744] text-white">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">جدول المتابعات</h1>
            <p className="text-xs text-slate-500">
              خطة الاتصالات والزيارات الميدانية المجدولة لفرع المحلة
            </p>
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-[#0f2744] px-4 py-2 text-xs font-bold text-white hover:bg-[#19406b] shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ متابعة جديدة</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white p-2 rounded-lg shadow-2xs">
        {tabs.map((tab) => {
          const isSelected = currentView === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-all shrink-0",
                isSelected
                  ? "bg-[#0f2744] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-mono",
                  tab.alert
                    ? isSelected
                      ? "bg-rose-500 text-white"
                      : "bg-rose-100 text-rose-700"
                    : isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main List */}
      {followUps.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">
            لا توجد متابعات في هذا القسم حالياً
          </p>
          <p className="mt-1 text-slate-400">
            {currentView === "overdue"
              ? "ممتاز! لا توجد أي متابعات متأخرة على مسؤولي الفرع."
              : "يمكنك جدولة متابعة جديدة بالضغط على زر + متابعة جديدة أعلاه."}
          </p>
        </div>
      ) : currentView === "today" && todayGroups ? (
        /* Grouped by Morning vs Afternoon */
        <div className="space-y-5">
          {todayGroups.morning.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 border-b border-slate-200 pb-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>الفترة الصباحية (09:00 ص – 11:59 ص)</span>
                <span className="text-[10px] text-slate-400">
                  ({todayGroups.morning.length} مهمة)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayGroups.morning.map((fu) => (
                  <FollowUpCard
                    key={fu.id}
                    followUp={fu}
                    onComplete={(f) => setActiveFollowUpForModal(f)}
                  />
                ))}
              </div>
            </div>
          )}

          {todayGroups.afternoon.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 border-b border-slate-200 pb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>الفترة المسائية (12:00 م – 05:00 م)</span>
                <span className="text-[10px] text-slate-400">
                  ({todayGroups.afternoon.length} مهمة)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayGroups.afternoon.map((fu) => (
                  <FollowUpCard
                    key={fu.id}
                    followUp={fu}
                    onComplete={(f) => setActiveFollowUpForModal(f)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Regular Flat Grid for Overdue / Upcoming / Completed */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {followUps.map((fu) => (
            <FollowUpCard
              key={fu.id}
              followUp={fu}
              onComplete={(f) => setActiveFollowUpForModal(f)}
            />
          ))}
        </div>
      )}

      {/* Completion Modal */}
      <FollowUpCompletionModal
        followUp={activeFollowUpForModal}
        onClose={() => setActiveFollowUpForModal(null)}
      />

      {/* Follow Up Drawer */}
      <FollowUpDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
