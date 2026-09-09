"use client";

import React from "react";
import Link from "next/link";
import { Opportunity } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { getDaysInStage } from "@/lib/dates/branch-time";
import { Clock, User, FileSpreadsheet, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opportunity: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  onSelect,
}: OpportunityCardProps) {
  const daysInStage = getDaysInStage(opportunity.stageUpdatedAt);
  const isStale =
    opportunity.stage === "negotiation" || opportunity.stage === "quotation"
      ? daysInStage > 5
      : daysInStage > 10;

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className="group relative rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5 text-right"
    >
      {/* Customer Name & Link */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/customers/${opportunity.customerId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
        >
          {opportunity.customerName}
        </Link>
        <span className="text-[10px] text-slate-400 shrink-0">
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        </span>
      </div>

      {/* Machine Model Tag */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-800 border border-slate-200"
          dir="ltr"
        >
          {opportunity.machineModel}
          {opportunity.quantity > 1 && (
            <span className="font-sans text-slate-500 font-normal">
              ×{opportunity.quantity}
            </span>
          )}
        </span>

        {opportunity.quotationRef && (
          <span
            className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-700 border border-indigo-100"
            dir="ltr"
          >
            <FileSpreadsheet className="h-2.5 w-2.5" />
            <span>{opportunity.quotationRef}</span>
          </span>
        )}
      </div>

      {/* Value and Rep */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <span className="font-bold text-slate-900 tabular-nums">
          {formatEgp(opportunity.estimatedValue)}
        </span>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <User className="h-3 w-3 text-slate-400" />
          <span>{opportunity.assignedRepName}</span>
        </div>
      </div>

      {/* Days in Stage signal */}
      <div className="flex items-center justify-between text-[10px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.2 font-semibold",
            isStale
              ? "bg-amber-100 text-amber-900 font-bold"
              : "text-slate-400"
          )}
        >
          <Clock className="h-2.5 w-2.5" />
          <span>
            منذ {daysInStage} {daysInStage === 1 ? "يوم" : "أيام"}
            {isStale && " ⚠"}
          </span>
        </span>

        <span className="text-slate-400 text-[10px]">اضغط للتعديل</span>
      </div>
    </div>
  );
}
