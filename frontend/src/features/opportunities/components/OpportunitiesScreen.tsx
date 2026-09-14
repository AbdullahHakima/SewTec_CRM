"use client";
import { useDirectory } from "@/lib/auth/use-directory";
import { ListStatus } from "@/components/ui/list-status";

import React, { useState } from "react";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { KanbanBoard } from "./KanbanBoard";
import { opportunityRepository } from "@/infrastructure/local-storage/local-storage-opportunity.repository";
import { OpportunityInspectorDrawer } from "./OpportunityInspectorDrawer";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TrendingUp, Plus, CheckCircle, XCircle, LayoutGrid, Trophy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

export function OpportunitiesScreen() {
  const { people } = useDirectory();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStage = searchParams.get("stage");
  const validStages = ["new", "contacted", "interested", "quotation", "negotiation"];
  const focusedStage = requestedStage && validStages.includes(requestedStage) ? (requestedStage as OpportunityStage) : undefined;
  const [activeTab, setActiveTab] = useState<"active" | "won" | "lost">("active");
  const [selectedRep, setSelectedRep] = useState("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const list = useOpportunities({
    stage: activeTab === "active" ? focusedStage || "active" : activeTab,
    assignedRepId: selectedRep,
  });
  const { opportunities, stats } = list;

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setInspectorOpen(true);
  };

  return (
    <div className="space-y-4">
      <ListStatus {...list} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              خط الصفقات والفرص البيعية
            </h1>
            <p className="text-xs text-slate-500">
              إجمالي الصفقات النشطة: {stats.activeCount} صفقات بقيمة{" "}
              <strong className="text-slate-800 font-bold tabular-nums">
                {formatEgp(stats.totalActiveValue)}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>فرصة جديدة</span>
        </button>
      </div>

      {/* Toolbar: Tabs & Rep Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 rounded-2xl shadow-2xs">
        {/* Pipeline Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "active"
                ? "bg-primary text-white shadow-2xs"
                : "text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>الفرص النشطة</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                activeTab === "active"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 dark:bg-stone-800 dark:text-stone-300 text-slate-700"
              )}
            >
              {stats.activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("won")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "won"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800"
            )}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>تم البيع</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                activeTab === "won"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {stats.wonCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("lost")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "lost"
                ? "bg-rose-700 text-white shadow-2xs"
                : "text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800"
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>المفقودة</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                activeTab === "lost"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-800"
              )}
            >
              {stats.lostCount}
            </span>
          </button>
        </div>

        {/* Rep selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">المسؤول:</span>
          <select aria-label="تصفية حسب المسؤول"
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">كل مسؤولي المبيعات</option>
            <option value="">المستخدم الحالي</option>{people.map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban Board for Active deals */}
      {activeTab === "active" && (
        <div className="pb-1">
          <ScrollArea dir="rtl" type="auto" className="w-full max-w-full whitespace-nowrap">
            <div className="flex items-center gap-1.5 pb-2" role="tablist" aria-label="مراحل الصفقات">
            {[
              { key: "active", label: "كل المراحل", count: stats.activeCount },
              { key: "new", label: "جديد", count: stats.stageCounts.new?.count || 0 },
              { key: "contacted", label: "تم التواصل", count: stats.stageCounts.contacted?.count || 0 },
              { key: "interested", label: "مهتم", count: stats.stageCounts.interested?.count || 0 },
              { key: "quotation", label: "عرض أسعار", count: stats.stageCounts.quotation?.count || 0 },
              { key: "negotiation", label: "تفاوض", count: stats.stageCounts.negotiation?.count || 0 },
            ].map((st) => {
              const isSelected = (!focusedStage && st.key === "active") || focusedStage === st.key;
              return (
                <button
                  key={st.key}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => router.replace(st.key === "active" ? "/opportunities" : `/opportunities?stage=${st.key}`)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0 transition-all border",
                    isSelected
                      ? "bg-primary text-white border-red-600 shadow-2xs"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/60"
                  )}
                >
                  <span>{st.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      isSelected ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                    )}
                  >
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
      {activeTab === "active" ? (
        <KanbanBoard
          opportunities={opportunities}
          focusedStage={focusedStage}
          onSelectOpportunity={handleSelectOpportunity}
          onAddNewOpportunity={() => setCreateDrawerOpen(true)}
          onStageChange={async (id, stage) => {
            await opportunityRepository.updateStage(id, stage);
          }}
        />
      ) : (
        /* Archive Table for Won / Lost */
        <div className="overflow-hidden">
          {opportunities.length === 0 ? (
            <EmptyState
              icon={activeTab === "won" ? Trophy : AlertCircle}
              variant={activeTab === "won" ? "celebrate" : "default"}
              badge={activeTab === "won" ? "سجل النجاحات" : "سجل الصفقات"}
              title={activeTab === "won" ? "لم يتم إغلاق أي صفقات ناجحة بعد" : "سجل ممتاز! لا توجد صفقات مفقودة"}
              description={
                activeTab === "won"
                  ? "عند نقل أي صفقة إلى مرحلة 'تم البيع' ستظهر هنا موثقة مع المبيعات المحققة."
                  : "لم يتم تسجيل أي صفقات خاسرة أو ملغاة في فرع المحلة الكبرى."
              }
              action={{ label: "إنشاء فرصة بيعية جديدة", onClick: () => setCreateDrawerOpen(true), icon: Plus }}
            />
          ) : (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="p-3">الصفقة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">الماكينة</th>
                  <th className="p-3">القيمة</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() => handleSelectOpportunity(opp)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="p-3 font-bold text-slate-900">{opp.title}</td>
                    <td className="p-3 text-slate-700">{opp.customerName}</td>
                    <td className="p-3 font-mono" dir="ltr">{opp.machineModel}</td>
                    <td className="p-3 font-bold tabular-nums">{formatEgp(opp.estimatedValue)}</td>
                    <td className="p-3 text-slate-600">{opp.assignedRepName}</td>
                    <td className="p-3 text-center text-blue-600 font-bold">عرض</td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspector Drawer */}
      <OpportunityInspectorDrawer
        opportunity={selectedOpportunity}
        open={inspectorOpen}
        onClose={() => {
          setInspectorOpen(false);
          setSelectedOpportunity(null);
        }}
      />

      {/* Create Opportunity Drawer */}
      <OpportunityDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
      />
    </div>
  );
}
