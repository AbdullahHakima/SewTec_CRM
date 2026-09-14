"use client";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { RescheduleFollowUpDialog } from "@/features/follow-ups/components/RescheduleFollowUpDialog";

import React, { useState } from "react";
import { useCustomer } from "@/features/customers/hooks/use-customers";
import { useCustomerTimeline } from "@/features/interactions/hooks/use-customer-timeline";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { CustomerHeader } from "./CustomerHeader";
import { ContextRail } from "./ContextRail";
import { QuickLogger } from "@/features/interactions/components/QuickLogger";
import { ActivityTimeline } from "@/features/interactions/components/ActivityTimeline";
import { FollowUpDrawer } from "@/features/follow-ups/components/FollowUpDrawer";
import { OpportunityDrawer } from "@/features/opportunities/components/OpportunityDrawer";
import { FollowUp } from "@/types/crm";
import { Clock, TrendingUp, CheckSquare, Plus } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { formatBranchDate, getDaysInStage } from "@/lib/dates/branch-time";
import { FollowUpService } from "@/features/follow-ups/services/follow-up.service";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogInteractionDrawer } from "@/features/interactions/components/LogInteractionDrawer";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

interface Customer360ScreenProps {
  customerId: string;
}
export function Customer360Screen({ customerId }: Customer360ScreenProps) {
  const { customer, isLoading } = useCustomer(customerId);
  const { activities } = useCustomerTimeline(customerId);
  const { followUps } = useFollowUps({ customerId });
  const { opportunities } = useOpportunities({ customerId });

  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "opportunities" | "followups">("timeline");
  const [showFollowUpDrawer, setShowFollowUpDrawer] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showOpportunityDrawer, setShowOpportunityDrawer] = useState(false);
  const [rescheduling, setRescheduling] = useState<FollowUp | null>(null);
  const [actionError, setActionError] = useState("");

  if (isLoading || !customer) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        {isLoading ? <p className="text-sm">جاري تحميل بيانات العميل...</p> : <div className="surface-card p-10 text-center"><h1 className="font-bold text-zinc-900">لم يتم العثور على العميل</h1><p className="mt-2 text-sm">قد يكون الرابط غير صحيح أو بيانات العميل غير متاحة.</p><Link href="/customers" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm text-white">العودة لدليل العملاء</Link></div>}
      </div>
    );
  }

  // Active follow-up for context rail
  const activeFollowUp = followUps.find((f) => f.status === "scheduled");

  const handleCompleteFollowUp = async (fu: FollowUp) => {
    try {
    setActionError("");
    await FollowUpService.completeFollowUp({
      followUpId: fu.id,
      outcome: "interested",
      outcomeNote: "تم إنجاز المتابعة من بطاقة العميل 360",
    });
    } catch (error) { setActionError(error instanceof Error ? error.message : "تعذر حفظ المتابعة"); }
  };

  return (
    <div className="space-y-5">
      <button onClick={() => setEditing(true)} className="rounded-xl border px-4 py-2 text-sm font-semibold">تعديل البيانات وإدارة الماكينات</button>
      {editing && <EditCustomerDialog customer={customer} onClose={() => setEditing(false)} />}
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{actionError}</p>}
      {/* 3-Tier Customer Header */}
      <CustomerHeader
        customer={customer}
        onLogInteraction={() => setShowLogDrawer(true)}
        onAddFollowUp={() => setShowFollowUpDrawer(true)}
      />

      {/* Main Split: Right Context Rail (35%) vs Left Workspace (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Context Rail (~35% width, in RTL sits on the right) */}
        <div className="lg:col-span-4 order-1 lg:order-1">
          <ContextRail
            customer={customer}
            activeFollowUp={activeFollowUp}
            onCompleteFollowUp={handleCompleteFollowUp}
            onRescheduleFollowUp={setRescheduling}
          />
        </div>

        {/* Main Workspace (~65% width, in RTL expands to the left) */}
        <div className="lg:col-span-8 order-2 lg:order-2 space-y-4">
          {/* Quick Interaction Logger */}
          <QuickLogger
            customerId={customer.id}
            customerName={customer.name}
            repName={customer.assignedRepName}
            onFollowUpPrompt={() => setShowFollowUpDrawer(true)}
          />

          <Tabs dir="rtl" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="gap-4">
            <TabsList aria-label="ملف العميل" className="w-full h-auto! flex-wrap justify-start rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1.5 shadow-2xs">
              <TabsTrigger value="timeline" className="py-2.5 px-3 text-xs rounded-xl dark:text-stone-300 data-[state=active]:bg-red-600 data-[state=active]:text-white shadow-2xs"><Clock size={14} />النشاط ({activities.length})</TabsTrigger>
              <TabsTrigger value="opportunities" className="py-2.5 px-3 text-xs rounded-xl dark:text-stone-300 data-[state=active]:bg-red-600 data-[state=active]:text-white shadow-2xs"><TrendingUp size={14} />الفرص ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="followups" className="py-2.5 px-3 text-xs rounded-xl dark:text-stone-300 data-[state=active]:bg-red-600 data-[state=active]:text-white shadow-2xs"><CheckSquare size={14} />المتابعات ({followUps.length})</TabsTrigger>
            </TabsList>

          {/* Tab 1: Timeline */}
          <TabsContent value="timeline">
            <div className="animate-in fade-in duration-150">
              <ActivityTimeline activities={activities} />
            </div>
          </TabsContent>

          {/* Tab 2: Opportunities */}
          <TabsContent value="opportunities">
            <div className="space-y-3 animate-in fade-in duration-150">
              {opportunities.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  variant="action"
                  badge="فرص البيع"
                  title="لا توجد صفقات بيعية لهذا العميل"
                  description="لم يتم ربط أي عروض أسعار أو فرص توريد بهذا المصنع حتى الآن. ابدأ فرصة جديدة لتسجيل متطلبات خط الإنتاج."
                  action={{
                    label: "إنشاء أول فرصة بيعية",
                    onClick: () => setShowOpportunityDrawer(true),
                    icon: Plus,
                  }}
                />
              ) : (
                opportunities.map((op) => {
                  const daysInStage = getDaysInStage(op.stageUpdatedAt);
                  return (
                    <div
                      key={op.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
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

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                          <span>
                            المرحلة:{" "}
                            <strong className="text-slate-800 font-semibold">
                              {{ new: "جديدة", contacted: "تم التواصل", interested: "مهتم", quotation: "عرض أسعار", negotiation: "تفاوض", won: "مغلقة بنجاح", lost: "مفقودة" }[op.stage]}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>المسؤول: {op.assignedRepName}</span>
                          {daysInStage > 5 && (
                            <span className="text-amber-600 font-semibold">
                              (في هذه المرحلة منذ {daysInStage} أيام)
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
          </TabsContent>

          {/* Tab 3: Follow-ups */}
          <TabsContent value="followups">
            <div className="space-y-3 animate-in fade-in duration-150">
              {followUps.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  variant="action"
                  badge="جدول المتابعات"
                  title="لا توجد مهام متابعة مسجلة لهذا العميل"
                  description="احرص على جدولة تواصل قادم لضمان المتابعة الدورية ومعرفة احتياجات الصيانة والماكينات."
                  action={{
                    label: "جدولة متابعة جديدة",
                    onClick: () => setShowFollowUpDrawer(true),
                    icon: Plus,
                  }}
                />
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
          </TabsContent>
          </Tabs>
        </div>
      </div>

      <FollowUpDrawer
        open={showFollowUpDrawer}
        defaultCustomerId={customer.id}
        onClose={() => setShowFollowUpDrawer(false)}
      />
      <OpportunityDrawer
        open={showOpportunityDrawer}
        defaultCustomerId={customer.id}
        onClose={() => setShowOpportunityDrawer(false)}
      />
      {showLogDrawer && <LogInteractionDrawer open defaultCustomerId={customer.id} onClose={() => setShowLogDrawer(false)} />}
      {rescheduling && <RescheduleFollowUpDialog followUp={rescheduling} onClose={() => setRescheduling(null)} />}
    </div>
  );
}

