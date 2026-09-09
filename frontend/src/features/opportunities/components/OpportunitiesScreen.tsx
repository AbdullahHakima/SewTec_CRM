"use client";

import React, { useState } from "react";
import { useOpportunities } from "@/features/opportunities/hooks/use-opportunities";
import { KanbanBoard } from "./KanbanBoard";
import { OpportunityInspectorDrawer } from "./OpportunityInspectorDrawer";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Opportunity } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { TrendingUp, Plus, CheckCircle, XCircle, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpportunitiesScreen() {
  const [activeTab, setActiveTab] = useState<"active" | "won" | "lost">("active");
  const [selectedRep, setSelectedRep] = useState("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const { opportunities, stats } = useOpportunities({
    stage: activeTab === "active" ? "active" : activeTab,
    assignedRepId: selectedRep,
  });

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setInspectorOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f2744] text-white">
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
          className="flex items-center gap-1.5 rounded-md bg-[#0f2744] px-4 py-2 text-xs font-bold text-white hover:bg-[#19406b] shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ فرصة جديدة</span>
        </button>
      </div>

      {/* Toolbar: Tabs & Rep Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-2 rounded-lg shadow-2xs">
        {/* Pipeline Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "active"
                ? "bg-[#0f2744] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>الفرص النشطة</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                activeTab === "active"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-700"
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
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>تم البيع (Won)</span>
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
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>المفقودة (Lost)</span>
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
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">كل مسؤولي المبيعات</option>
            <option value="rep_01">أحمد شحاتة</option>
            <option value="rep_02">محمد السيد</option>
          </select>
        </div>
      </div>

      {/* Kanban Board for Active deals */}
      {activeTab === "active" ? (
        <KanbanBoard
          opportunities={opportunities}
          onSelectOpportunity={handleSelectOpportunity}
        />
      ) : (
        /* Archive Table for Won / Lost */
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {opportunities.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              لا توجد صفقات في هذا القسم
            </div>
          ) : (
            <table className="w-full text-right text-xs">
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
