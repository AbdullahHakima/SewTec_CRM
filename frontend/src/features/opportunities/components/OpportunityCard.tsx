"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Opportunity } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { getDaysInStage } from "@/lib/dates/branch-time";
import { Clock, User, FileSpreadsheet, ChevronLeft, Zap, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "@/components/ui/kanban";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opportunity: Opportunity) => void;
  onDragStart?: (e: React.DragEvent, opportunity: Opportunity) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function OpportunityCard({
  opportunity,
  onSelect,
  onDragStart,
  onDragEnd,
}: OpportunityCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const daysInStage = getDaysInStage(opportunity.stageUpdatedAt);
  const isStale =
    opportunity.stage === "negotiation" || opportunity.stage === "quotation"
      ? daysInStage > 5
      : daysInStage > 10;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", opportunity.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: opportunity.id, sourceStage: opportunity.stage })
    );
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    onDragStart?.(e, opportunity);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  return (
    <KanbanCard
      draggable
      isDragging={isDragging}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (!isDragging) onSelect(opportunity);
      }}
    >
      <button type="button" onClick={event=>{event.stopPropagation();onSelect(opportunity);}} className="w-full rounded-lg border px-3 py-2 text-sm">تفاصيل وتغيير المرحلة</button>
      {/* Customer Name & Link & Drag Grip */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
          <Link
            href={`/customers/${opportunity.customerId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
          >
            {opportunity.customerName}
          </Link>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        </span>
      </div>

      {/* Machine Model Tag */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="secondary" className="font-mono text-[11px] gap-1 rounded-lg" dir="ltr">
          {opportunity.machineModel}
          {opportunity.quantity > 1 && (
            <span className="text-muted-foreground font-sans">×{opportunity.quantity}</span>
          )}
        </Badge>
        {opportunity.quotationRef && (
          <Badge
            variant="outline"
            className="gap-1 rounded-lg text-[10px] font-mono text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/50"
            dir="ltr"
          >
            <FileSpreadsheet className="h-2.5 w-2.5" />
            {opportunity.quotationRef}
          </Badge>
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
          </span>
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(opportunity);
          }}
          aria-label={`عرض تفاصيل ${opportunity.title}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
        >
          <Zap className="h-3 w-3" />
          عرض التفاصيل
        </button>
      </div>
    </KanbanCard>
  );
}
