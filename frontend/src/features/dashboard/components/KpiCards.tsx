"use client";

import React from "react";
import Link from "next/link";
import { CheckSquare, AlertTriangle, FileSpreadsheet, TrendingUp } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  todayCount: number;
  completedTodayCount: number;
  overdueCount: number;
  quotationCount: number;
  negotiationCount: number;
  negotiationTotalValue: number;
}

export function KpiCards({
  todayCount,
  completedTodayCount,
  overdueCount,
  quotationCount,
  negotiationCount,
  negotiationTotalValue,
}: KpiCardsProps) {
  const remainingToday = Math.max(0, todayCount - completedTodayCount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Today's Follow-ups */}
      <Link
        href="/follow-ups?view=today"
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            متابعات اليوم المطلوبة
          </span>
          <div className="p-2 rounded-md bg-blue-50 text-blue-600">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {todayCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completedTodayCount} مكتملة • {remainingToday} متبقية
          </p>
        </div>
      </Link>

      {/* 2. Overdue Follow-ups */}
      <Link
        href="/follow-ups?view=overdue"
        className={cn(
          "rounded-lg border p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between",
          overdueCount > 0
            ? "border-rose-200 bg-rose-50/50 hover:border-rose-300"
            : "border-slate-200 bg-white"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs font-bold",
              overdueCount > 0 ? "text-rose-800" : "text-slate-600"
            )}
          >
            متابعات متأخرة ⚠
          </span>
          <div
            className={cn(
              "p-2 rounded-md",
              overdueCount > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div
            className={cn(
              "text-2xl font-bold tabular-nums",
              overdueCount > 0 ? "text-rose-700" : "text-slate-900"
            )}
          >
            {overdueCount}
          </div>
          <p
            className={cn(
              "text-[11px] mt-0.5 font-medium",
              overdueCount > 0 ? "text-rose-600" : "text-slate-400"
            )}
          >
            {overdueCount > 0
              ? "تحتاج تدخلاً سريعاً فورياً"
              : "لا توجد متأخرات ممتازة!"}
          </p>
        </div>
      </Link>

      {/* 3. Quotes Pending Decision */}
      <Link
        href="/opportunities?stage=quotation"
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            عروض أسعار تنتظر الرد
          </span>
          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {quotationCount}
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
            عروض أسعار رسمية مرسلة
          </p>
        </div>
      </Link>

      {/* 4. Negotiation Deals */}
      <Link
        href="/opportunities?stage=negotiation"
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            صفقات في مرحلة التفاوض
          </span>
          <div className="p-2 rounded-md bg-amber-50 text-amber-600">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-amber-700 tabular-nums">
            {formatEgp(negotiationTotalValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {negotiationCount} صفقات على وشك الإغلاق
          </p>
        </div>
      </Link>
    </div>
  );
}
