"use client";

import React, { useState } from "react";
import { useCustomer } from "@/features/customers/hooks/use-customers";
import { useCustomerTimeline } from "@/features/interactions/hooks/use-customer-timeline";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { CustomerHeader } from "./CustomerHeader";
import { ContextRail } from "./ContextRail";
import { QuickLogger } from "@/features/interactions/components/QuickLogger";
import { ActivityTimeline } from "@/features/interactions/components/ActivityTimeline";
import { FollowUp, Opportunity } from "@/types/crm";
import { Clock, TrendingUp, CheckSquare, Sparkles } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { formatBranchDate, getDaysInStage } from "@/lib/dates/branch-time";
import { FollowUpService } from "@/features/follow-ups/services/follow-up.service";
import { cn } from "@/lib/utils";

interface Customer360ScreenProps {
  customerId: string;
}

export function Customer360Screen({ customerId }: Customer360ScreenProps) {
  const { customer, isLoading } = useCustomer(customerId);
  const { activities } = useCustomerTimeline(customerId);
  const { followUps } = useFollowUps({ customerId });
  const { opportunities } = useOpportunities({ customerId });

  const [activeTab, setActiveTab] = useState<"timeline" | "opportunities" | "followups">("timeline");
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);

  if (isLoading || !customer) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <p className="text-sm">جاري تحميل بيانات العميل...</p>
      </div>
    );
  }

  // Active follow-up for context rail
  const activeFollowUp = followUps.find((f) => f.status === "scheduled");

  const handleCompleteFollowUp = (fu: FollowUp) => {
    FollowUpService.completeFollowUp({
      followUpId: fu.id,
      outcome: "interested",
      outcomeNote: "تم إنجاز المتابعة من بطاقة العميل 360",
    });
  };

  return (
    <div className="space-y-5">
      {/* 3-Tier Customer Header */}
      <CustomerHeader
        customer={customer}
        onLogInteraction={() => setActiveTab("timeline")}
        onAddFollowUp={() => setShowAddFollowUpModal(true)}
      />

      {/* Main Split: Right Context Rail (35%) vs Left Workspace (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Context Rail (~35% width, in RTL sits on the right) */}
        <div className="lg:col-span-4 order-1 lg:order-1">
          <ContextRail
            customer={customer}
            activeFollowUp={activeFollowUp}
            onCompleteFollowUp={handleCompleteFollowUp}
          />
        </div>

        {/* Main Workspace (~65% width, in RTL expands to the left) */}
        <div className="lg:col-span-8 order-2 lg:order-2 space-y-4">
          {/* Quick Interaction Logger */}
          <QuickLogger
            customerId={customer.id}
            customerName={customer.name}
            repName={customer.assignedRepName}
            onFollowUpPrompt={() => setShowAddFollowUpModal(true)}
          />

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-lg">
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors",
                activeTab === "timeline"
                  ? "border-[#0f2744] text-[#0f2744]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>سجل النشاط والتواصل ({activities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("opportunities")}
              className={cn(
                "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors",
                activeTab === "opportunities"
                  ? "border-[#0f2744] text-[#0f2744]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>الفرص البيعية ({opportunities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("followups")}
              className={cn(
                "flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors",
                activeTab === "followups"
                  ? "border-[#0f2744] text-[#0f2744]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>المتابعات ({followUps.length})</span>
            </button>
          </div>

          {/* Tab 1: Timeline */}
          {activeTab === "timeline" && (
            <div className="animate-in fade-in duration-150">
              <ActivityTimeline activities={activities} />
            </div>
          )}

          {/* Tab 2: Opportunities */}
          {activeTab === "opportunities" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {opportunities.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">لا توجد صفقات بيعية حالية</p>
                </div>
              ) : (
                opportunities.map((op) => {
                  const daysInStage = getDaysInStage(op.stageUpdatedAt);
                  return (
                    <div
                      key={op.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {op.title}
                          </span>
                          <span className="font-mono text-xs rounded bg-slate-100 px-2 py-0.5" dir="ltr">
                            {op.machineModel}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-slate-900 tabular-nums">
                          {formatEgp(op.estimatedValue)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <span>
                            المرحلة:{" "}
                            <strong className="text-slate-800 font-semibold">
                              {op.stage}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>المسؤول: {op.assignedRepName}</span>
                          {daysInStage > 5 && (
                            <span className="text-amber-600 font-semibold">
                              (في هذه المرحلة منذ {daysInStage} أيام ⚠)
                            </span>
                          )}
                        </div>
                        {op.quotationRef && (
                          <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]" dir="ltr">
                            عرض: {op.quotationRef}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Follow-ups */}
          {activeTab === "followups" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {followUps.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  <CheckSquare className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">لا توجد مهام متابعة مسجلة</p>
                </div>
              ) : (
                followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {fu.topic}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[10px] font-semibold",
                            fu.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          )}
                        >
                          {fu.status === "completed" ? "مكتملة" : "مجدولة"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        الموعد: {formatBranchDate(fu.scheduledAt)} • المسؤول: {fu.assignedRepName}
                      </div>
                    </div>

                    {fu.status === "scheduled" && (
                      <button
                        onClick={() => handleCompleteFollowUp(fu)}
                        className="rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        إنجاز
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
