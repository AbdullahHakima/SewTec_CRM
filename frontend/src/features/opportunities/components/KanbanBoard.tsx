"use client";

import React, { useState } from "react";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { OpportunityCard } from "./OpportunityCard";
import { formatCompactEgp } from "@/lib/currency/format-currency";
import { opportunityRepository } from "@/infrastructure/local-storage/local-storage-opportunity.repository";
import { Plus, CheckCircle, XCircle, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Kanban,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanDropIndicator,
} from "@/components/ui/kanban";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opportunity: Opportunity) => void;
  focusedStage?: OpportunityStage;
  onAddNewOpportunity?: () => void;
  onStageChange?: (opportunityId: string, newStage: OpportunityStage) => Promise<void> | void;
}

export function KanbanBoard({
  opportunities,
  onSelectOpportunity,
  focusedStage,
  onAddNewOpportunity,
  onStageChange,
}: KanbanBoardProps) {
  const [activeOverStage, setActiveOverStage] = useState<OpportunityStage | null>(null);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [stageError, setStageError] = useState("");

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
      headerBg: "bg-slate-100/90 dark:bg-stone-800/90",
      headerText: "text-slate-800 dark:text-stone-100",
      badgeBg: "bg-slate-200 text-slate-700 dark:bg-stone-700 dark:text-stone-200",
    },
    {
      key: "contacted",
      label: "تم التواصل",
      headerBg: "bg-blue-50/90 dark:bg-blue-950/40",
      headerText: "text-blue-900 dark:text-blue-200",
      badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    },
    {
      key: "interested",
      label: "مهتم",
      headerBg: "bg-blue-50/90 dark:bg-blue-950/40",
      headerText: "text-blue-900 dark:text-blue-200",
      badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    },
    {
      key: "quotation",
      label: "عرض سعر",
      headerBg: "bg-indigo-50/90 dark:bg-indigo-950/40",
      headerText: "text-indigo-900 dark:text-indigo-200",
      badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
    },
    {
      key: "negotiation",
      label: "تفاوض",
      headerBg: "bg-amber-100/80 dark:bg-amber-950/40",
      headerText: "text-amber-900 dark:text-amber-200",
      badgeBg: "bg-amber-200 text-amber-950 font-bold dark:bg-amber-900/60 dark:text-amber-200",
    },
  ];

  const handleDragStart = (e: React.DragEvent, opp: Opportunity) => {
    setDraggedOppId(opp.id);
  };

  const handleDragEnd = () => {
    setDraggedOppId(null);
    setActiveOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: OpportunityStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeOverStage !== stageKey) {
      setActiveOverStage(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: OpportunityStage) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeOverStage === stageKey) {
        setActiveOverStage(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: OpportunityStage) => {
    e.preventDefault();
    setActiveOverStage(null);
    setDraggedOppId(null);

    const oppId = e.dataTransfer.getData("text/plain");
    if (!oppId) return;

    const currentOpp = opportunities.find((o) => o.id === oppId);
    if (currentOpp && currentOpp.stage === targetStage) return;

    try {
      setStageError("");
      if (onStageChange) {
        await onStageChange(oppId, targetStage);
      } else {
        await opportunityRepository.updateStage(oppId, targetStage);
      }
    } catch (err) {
      setStageError(err instanceof Error ? err.message : "تعذر تغيير مرحلة الفرصة. افتح تفاصيلها وحاول مرة أخرى.");
    }
  };

  return (
    <div className="space-y-4">
      {stageError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{stageError}</p>}
      {/* Shadcn ScrollArea with Horizontal Scrollbar wrapping Shadcn Kanban */}
      <ScrollArea dir="rtl" type="auto" className="w-full">
        <Kanban className="pipeline-board items-start">
          {activeStages
            .filter((stage) => !focusedStage || stage.key === focusedStage)
            .map((stage) => {
              const stageOpps = opportunities.filter((o) => o.stage === stage.key);
              const stageValue = stageOpps.reduce(
                (sum, o) => sum + (o.estimatedValue || 0),
                0
              );
              const isOverThisStage = activeOverStage === stage.key;

              return (
                <KanbanColumn
                  key={stage.key}
                  isOver={isOverThisStage}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragEnter={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={(e) => handleDragLeave(e, stage.key)}
                  onDrop={(e) => handleDrop(e, stage.key)}
                >
                  {/* Column Header */}
                  <KanbanColumnHeader className={stage.headerBg}>
                    <div className="flex items-center gap-1.5">
                      <KanbanColumnTitle className={stage.headerText}>
                        {stage.label}
                      </KanbanColumnTitle>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold",
                          stage.badgeBg
                        )}
                      >
                        {stageOpps.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-stone-200 tabular-nums">
                      {formatCompactEgp(stageValue)}
                    </span>
                  </KanbanColumnHeader>

                  {/* Cards Stack */}
                  <KanbanColumnContent>
                    {stageOpps.length === 0 ? (
                      <div
                        className={cn(
                          "flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all",
                          isOverThisStage
                            ? "border-primary bg-primary/10 text-primary scale-102"
                            : "border-slate-300/80 bg-white/40 text-slate-600 hover:border-red-300 hover:bg-white/80 group"
                        )}
                      >
                        {isOverThisStage ? (
                          <div className="flex flex-col items-center gap-1 text-primary">
                            <ArrowDown className="h-5 w-5 animate-bounce" />
                            <p className="text-xs font-bold">أفلت هنا للنقل إلى {stage.label}</p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 group-hover:scale-110 transition-all">
                              <Plus className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-bold text-slate-600">لا توجد صفقات هنا</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">في مرحلة {stage.label}</p>
                            {onAddNewOpportunity && (
                              <button
                                type="button"
                                onClick={onAddNewOpportunity}
                                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                              >
                                <Plus className="h-3 w-3" />
                                <span>إضافة صفقة</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        {stageOpps.map((opp) => (
                          <OpportunityCard
                            key={opp.id}
                            opportunity={opp}
                            onSelect={onSelectOpportunity}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}

                        {/* Drop indicator if hovering with a dragged card */}
                        {isOverThisStage && (
                          <KanbanDropIndicator>
                            <ArrowDown className="h-3.5 w-3.5" />
                            <span>إفلات للنقل إلى مرحلة {stage.label}</span>
                          </KanbanDropIndicator>
                        )}
                      </>
                    )}
                  </KanbanColumnContent>
                </KanbanColumn>
              );
            })}
        </Kanban>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Quick Drop Targets for Won / Lost during active dragging */}
      {draggedOppId && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Won Drop Target */}
          <div
            onDragOver={(e) => handleDragOver(e, "won")}
            onDragEnter={(e) => handleDragOver(e, "won")}
            onDragLeave={(e) => handleDragLeave(e, "won")}
            onDrop={(e) => handleDrop(e, "won")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all duration-200",
              activeOverStage === "won"
                ? "border-emerald-600 bg-emerald-100 text-emerald-900 scale-102 shadow-md"
                : "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80"
            )}
          >
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold">أفلت هنا لتسجيل الصفقة: تم البيع (Won)</span>
          </div>

          {/* Lost Drop Target */}
          <div
            onDragOver={(e) => handleDragOver(e, "lost")}
            onDragEnter={(e) => handleDragOver(e, "lost")}
            onDragLeave={(e) => handleDragLeave(e, "lost")}
            onDrop={(e) => handleDrop(e, "lost")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all duration-200",
              activeOverStage === "lost"
                ? "border-rose-600 bg-rose-100 text-rose-900 scale-102 shadow-md"
                : "border-rose-300 bg-rose-50/70 text-rose-800 hover:bg-rose-100/80"
            )}
          >
            <XCircle className="h-5 w-5 text-rose-600" />
            <span className="text-xs font-bold">أفلت هنا لنقل الصفقة: فرصة مفقودة (Lost)</span>
          </div>
        </div>
      )}
    </div>
  );
}
