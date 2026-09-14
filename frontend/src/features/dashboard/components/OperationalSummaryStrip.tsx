"use client";

import React from "react";
import Link from "next/link";
import { formatEgp } from "@/lib/currency/format-currency";
import { cn } from "@/lib/utils";

interface OperationalSummaryStripProps {
  counts: {
    today: number;
    overdue: number;
    upcoming: number;
    completed: number;
    completedToday: number;
  };
  activeOpportunitiesCount: number;
  activeOpportunitiesValue: number;
}

export function OperationalSummaryStrip({
  counts,
  activeOpportunitiesCount,
  activeOpportunitiesValue,
}: OperationalSummaryStripProps) {
  // 1. Dynamic Overdue text
  const overdueText =
    counts.overdue === 0
      ? "لا توجد متأخرات"
      : counts.overdue === 1
      ? "متابعة واحدة متأخرة"
      : counts.overdue === 2
      ? "متابعتان متأخرتان"
      : counts.overdue <= 10
      ? `${counts.overdue} متابعات متأخرة`
      : `${counts.overdue} متابعة متأخرة`;

  // 2. Dynamic Today text reflecting remaining and completed
  const totalToday = counts.today + counts.completedToday;
  const todayText =
    totalToday === 0
      ? "لا توجد متابعات اليوم"
      : counts.today === 0
      ? `اكتملت جميع متابعات اليوم (${counts.completedToday}) ✓`
      : counts.completedToday > 0
      ? `${counts.today} متبقية اليوم (أُنجز ${counts.completedToday})`
      : counts.today === 1
      ? "متابعة واحدة مجدولة اليوم"
      : counts.today === 2
      ? "متابعتان مجدولتان اليوم"
      : counts.today <= 10
      ? `${counts.today} متابعات مجدولة اليوم`
      : `${counts.today} متابعة مجدولة اليوم`;

  // 3. Dynamic Pipeline Opportunities text reflecting real pipeline count & value
  const activeDealsText =
    activeOpportunitiesCount === 0
      ? "لا توجد صفقات نشطة"
      : activeOpportunitiesCount === 1
      ? `صفقة نشطة واحدة (${formatEgp(activeOpportunitiesValue)})`
      : activeOpportunitiesCount === 2
      ? `صفقتان نشطتان (${formatEgp(activeOpportunitiesValue)})`
      : activeOpportunitiesCount <= 10
      ? `${activeOpportunitiesCount} صفقات نشطة (${formatEgp(activeOpportunitiesValue)})`
      : `${activeOpportunitiesCount} صفقة نشطة (${formatEgp(activeOpportunitiesValue)})`;

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-stone-300 leading-relaxed font-medium">
        <Link
          href="/follow-ups?view=overdue"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors",
            counts.overdue > 0
              ? "bg-red-50 text-red-700 font-bold hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <span>{overdueText}</span>
        </Link>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        <Link
          href="/follow-ups?view=today"
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex items-center gap-1"
        >
          <span>{todayText}</span>
        </Link>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        <Link
          href="/opportunities"
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex items-center gap-1"
        >
          <span>{activeDealsText}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Link
          href="/follow-ups?view=today"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 shadow-xs"
        >
          <span>ابدأ متابعات اليوم</span>
          {counts.today > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {counts.today}
            </span>
          )}
        </Link>

        <Link
          href="/opportunities"
          className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-stone-200 transition hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-2xs"
        >
          استعرض فرص البيع
        </Link>
      </div>
    </div>
  );
}

