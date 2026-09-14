"use client";

import React from "react";
import Link from "next/link";
import { Opportunity, Customer } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { getDaysInStage, getDaysSinceContact } from "@/lib/dates/branch-time";
import { TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface UrgentDealsProps {
  opportunities: Opportunity[];
  staleCustomers: Customer[];
}
export function UrgentDeals({
  opportunities,
  staleCustomers,
}: UrgentDealsProps) {
  // Urgent: Deals in negotiation or quotation
  const urgentDeals = opportunities
    .filter((op) => op.stage === "negotiation" || op.stage === "quotation")
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. Urgent Opportunities Card */}
      <div className="surface-card relative overflow-hidden p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
          <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span>صفقات تحتاج تركيزاً (تفاوض وعروض)</span>
          </div>
          <Link
            href="/opportunities"
            className="text-[11px] font-semibold text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 flex items-center gap-0.5 transition-colors"
          >
            <span>لوحة الفرص</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {urgentDeals.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            لا توجد صفقات في مرحلة التفاوض حالياً
          </p>
        ) : (
          <div className="space-y-2">
            {urgentDeals.map((op) => {
              const days = getDaysInStage(op.stageUpdatedAt);
              const isAlert = days > 5;

              return (
                <Link
                  key={op.id}
                  href="/opportunities"
                  className="block p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-200 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                      {op.customerName}
                    </span>
                    <span className="font-bold text-zinc-900 tabular-nums">
                      {formatEgp(op.estimatedValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                    <span className="font-mono font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-stone-200/60" dir="ltr">
                      {op.machineModel}
                    </span>

                    <StatusBadge
                      status={op.stage}
                      label={
                        op.stage === "negotiation"
                          ? `تفاوض${isAlert ? ` (منذ ${days} أيام)` : ""}`
                          : "عرض أسعار"
                      }
                      pulse={isAlert}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Stale Customers Warning Card */}
      <div className="surface-card p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
          <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span>تنبيه: عملاء بدون متابعة (&gt;14 يوماً)</span>
          </div>
          <Link
            href="/customers"
            className="text-[11px] font-semibold text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 flex items-center gap-0.5 transition-colors"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {staleCustomers.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            ممتاز! جميع العملاء تم التواصل معهم حديثاً
          </p>
        ) : (
          <div className="space-y-2">
            {staleCustomers.slice(0, 3).map((c) => {
              const days = getDaysSinceContact(c.lastContactAt);

              return (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-amber-100/70 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/40 hover:bg-amber-50/80 dark:hover:bg-amber-950/60 text-xs transition-colors group"
                >
                  <div>
                    <span className="font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                      {c.name}
                    </span>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {c.city} • آخر تواصل: منذ {days} يوماً
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-[10px] font-bold">
                    تواصل مطلوب
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
