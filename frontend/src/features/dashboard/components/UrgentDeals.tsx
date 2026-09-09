"use client";

import React from "react";
import Link from "next/link";
import { Opportunity, Customer } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { getDaysInStage, getDaysSinceContact } from "@/lib/dates/branch-time";
import { TrendingUp, AlertTriangle, ArrowLeft, Building2, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span>صفقات تحتاج تركيزاً (تفاوض وعروض)</span>
          </div>
          <Link
            href="/opportunities"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            <span>لوحة الفرص</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {urgentDeals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
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
                  className="block p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {op.customerName}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatEgp(op.estimatedValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="font-mono font-medium text-slate-700" dir="ltr">
                      {op.machineModel}
                    </span>

                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 font-semibold",
                        op.stage === "negotiation"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-indigo-100 text-indigo-800"
                      )}
                    >
                      {op.stage === "negotiation" ? "مرحلة التفاوض" : "عرض أسعار"}
                      {isAlert && ` (منذ ${days} أيام ⚠)`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Stale Customers Warning Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>تنبيه: عملاء بدون متابعة (&gt;14 يوماً)</span>
          </div>
          <Link
            href="/customers"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {staleCustomers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
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
                  className="flex items-center justify-between p-2 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50 text-xs transition-colors group"
                >
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-blue-600">
                      {c.name}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {c.city} • آخر تواصل: منذ {days} يوماً
                    </div>
                  </div>
                  <span className="rounded bg-amber-200/80 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
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
