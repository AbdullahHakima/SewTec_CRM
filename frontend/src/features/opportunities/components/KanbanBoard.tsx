"use client";

import React from "react";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { OpportunityCard } from "./OpportunityCard";
import { formatCompactEgp } from "@/lib/currency/format-currency";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export function KanbanBoard({
  opportunities,
  onSelectOpportunity,
}: KanbanBoardProps) {
  const activeStages: {
    key: OpportunityStage;
    label: string;
    headerBg: string;
    headerText: string;
    badgeBg: string;
  }[] = [
    {
      key: "new",
      label: "جديد",
      headerBg: "bg-slate-100/90",
      headerText: "text-slate-800",
      badgeBg: "bg-slate-200 text-slate-700",
    },
    {
      key: "contacted",
      label: "تم التواصل",
      headerBg: "bg-blue-50/90",
      headerText: "text-blue-900",
      badgeBg: "bg-blue-100 text-blue-800",
    },
    {
      key: "interested",
      label: "مهتم",
      headerBg: "bg-blue-50/90",
      headerText: "text-blue-900",
      badgeBg: "bg-blue-100 text-blue-800",
    },
    {
      key: "quotation",
      label: "عرض سعر",
      headerBg: "bg-indigo-50/90",
      headerText: "text-indigo-900",
      badgeBg: "bg-indigo-100 text-indigo-800",
    },
    {
      key: "negotiation",
      label: "تفاوض ⚠",
      headerBg: "bg-amber-100/80",
      headerText: "text-amber-900",
      badgeBg: "bg-amber-200 text-amber-950 font-bold",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
      {activeStages.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage.key);
        const stageValue = stageOpps.reduce(
          (sum, o) => sum + (o.estimatedValue || 0),
          0
        );

        return (
          <div
            key={stage.key}
            className="flex flex-col rounded-lg border border-slate-200 bg-slate-100/50 p-2.5 min-h-[480px] shadow-2xs space-y-2.5"
          >
            {/* Column Header */}
            <div
              className={cn(
                "rounded-md p-2 flex items-center justify-between border border-slate-200/60 shadow-2xs",
                stage.headerBg
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-bold", stage.headerText)}>
                  {stage.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold",
                    stage.badgeBg
                  )}
                >
                  {stageOpps.length}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                {formatCompactEgp(stageValue)}
              </span>
            </div>

            {/* Cards Stack */}
            <div className="space-y-2.5 flex-1">
              {stageOpps.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-[11px] text-slate-400">
                  لا توجد صفقات هنا
                </div>
              ) : (
                stageOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onSelect={onSelectOpportunity}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
