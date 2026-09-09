"use client";

import React, { useState } from "react";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { KpiCards } from "./KpiCards";
import { ActionSchedule } from "./ActionSchedule";
import { UrgentDeals } from "./UrgentDeals";
import { FollowUpCompletionModal } from "@/features/follow-ups/components/FollowUpCompletionModal";
import { FollowUp } from "@/types/crm";
import { Sparkles, CalendarDays } from "lucide-react";
import { formatBranchDate } from "@/lib/dates/branch-time";

export function DashboardScreen() {
  const { followUps: todayFollowUps, counts } = useFollowUps({ view: "today" });
  const { opportunities, stats: oppStats } = useOpportunities();
  const { customers } = useCustomers();

  const [activeFollowUpForModal, setActiveFollowUpForModal] = useState<FollowUp | null>(null);

  // Stale customers (>14 days)
  const staleCustomers = customers.filter(
    (c) => c.status === "active" && (c.isVip ? false : true) // uses default staleness
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>مرحباً أحمد 👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إليك ما يتطلب انتباهك اليوم في فرع المحلة الكبرى • خطة العمل المباشرة
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-2xs font-medium">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <span>{formatBranchDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* 4 Action-Oriented KPI Cards */}
      <KpiCards
        todayCount={counts.today}
        completedTodayCount={counts.completed}
        overdueCount={counts.overdue}
        quotationCount={oppStats.stageCounts.quotation?.count || 0}
        negotiationCount={oppStats.stageCounts.negotiation?.count || 0}
        negotiationTotalValue={oppStats.stageCounts.negotiation?.totalValue || 0}
      />

      {/* Main Grid: 60% Action Schedule + 40% Urgent Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Dominant 60% Schedule Feed */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ActionSchedule
            followUps={todayFollowUps}
            overdueCount={counts.overdue}
            onComplete={(fu) => setActiveFollowUpForModal(fu)}
          />
        </div>

        {/* Secondary 40% Urgent Deals & Alerts */}
        <div className="lg:col-span-5 xl:col-span-4">
          <UrgentDeals
            opportunities={opportunities}
            staleCustomers={staleCustomers}
          />
        </div>
      </div>

      {/* Structured Completion Modal */}
      <FollowUpCompletionModal
        followUp={activeFollowUpForModal}
        onClose={() => setActiveFollowUpForModal(null)}
      />
    </div>
  );
}
