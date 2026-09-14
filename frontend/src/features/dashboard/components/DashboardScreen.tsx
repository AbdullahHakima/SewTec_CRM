"use client";

import React, { useState } from "react";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { KpiCards } from "./KpiCards";
import { ActionSchedule } from "./ActionSchedule";
import { UrgentDeals } from "./UrgentDeals";
import { LiveCalendar } from "./LiveCalendar";
import { OperationalSummaryStrip } from "./OperationalSummaryStrip";
import { FollowUpCompletionModal } from "@/features/follow-ups/components/FollowUpCompletionModal";
import { FollowUp } from "@/types/crm";
import { useAuth } from "@/lib/auth/auth-context";

export function DashboardScreen() {
  const { followUps: todayFollowUps, counts } = useFollowUps({ view: "today" });
  const { followUps: allFollowUps } = useFollowUps();
  const { opportunities, stats: oppStats } = useOpportunities();
  const { customers: staleCustomers } = useCustomers({isStale: true});
  const { user } = useAuth();

  const [activeFollowUpForModal, setActiveFollowUpForModal] = useState<FollowUp | null>(null);

  // Stale customers (>14 days)

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner & Live Calendar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <span>مرحباً {user ? user.fullName.split(" ")[0] : "بك"}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-stone-400 mt-1">
            إليك ما يتطلب انتباهك اليوم في فرع المحلة الكبرى • خطة العمل المباشرة
          </p>
        </div>

        {/* Live Interactive Calendar using shadcn components */}
        <LiveCalendar followUps={allFollowUps} />
      </div>

      {/* Fully Dynamic Operational Summary Strip reflecting real-time CRM data */}
      <OperationalSummaryStrip
        counts={counts}
        activeOpportunitiesCount={oppStats.activeCount}
        activeOpportunitiesValue={oppStats.totalActiveValue}
      />

      {/* 4 Action-Oriented KPI Cards */}
      <KpiCards
        todayCount={counts.today + counts.completedToday}
        completedTodayCount={counts.completedToday}
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
