"use client";

import React from "react";
import { Customer, FollowUp } from "@/types/crm";
import { formatBranchDateTime, isOverdue } from "@/lib/dates/branch-time";
import { AlertCircle, Calendar, Cpu, Check, Clock, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/number-ticker";

interface ContextRailProps {
  customer: Customer;
  activeFollowUp?: FollowUp;
  onCompleteFollowUp?: (followUp: FollowUp) => void;
  onRescheduleFollowUp?: (followUp: FollowUp) => void;
}
export function ContextRail({
  customer,
  activeFollowUp,
  onCompleteFollowUp,
  onRescheduleFollowUp,
}: ContextRailProps) {
  const isActionOverdue = activeFollowUp ? isOverdue(activeFollowUp.scheduledAt) : false;

  return (
    <div className="space-y-4">
      {/* Next Follow-Up Alert Card */}
      {activeFollowUp ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4 shadow-2xs space-y-3",
            isActionOverdue
              ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60"
              : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertCircle
                className={cn(
                  "h-4 w-4",
                  isActionOverdue ? "text-rose-600" : "text-amber-600"
                )}
              />
              <span className={isActionOverdue ? "text-rose-800" : "text-amber-800"}>
                {isActionOverdue ? "متابعة متأخرة تحتاج تدخلاً!" : "المتابعة القادمة المجدولة"}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                isActionOverdue
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              )}
            >
              {activeFollowUp.channel === "call"
                ? "مكالمة هاتفية"
                : activeFollowUp.channel === "visit"
                ? "زيارة ميدانية"
                : "واتساب"}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-stone-100 leading-relaxed">
              {activeFollowUp.topic}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-stone-300 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatBranchDateTime(activeFollowUp.scheduledAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {onCompleteFollowUp && (
              <button
                onClick={() => onCompleteFollowUp(activeFollowUp)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>تحديد كمكتملة</span>
              </button>
            )}
            {onRescheduleFollowUp && (
              <button
                onClick={() => onRescheduleFollowUp(activeFollowUp)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                تأجيل
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 text-xs text-slate-500 text-center">
          <Calendar className="h-5 w-5 mx-auto text-slate-400 mb-1" />
          <p className="font-semibold text-slate-700">لا توجد متابعة مجدولة حالياً</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ينصح بجدولة متابعة دورية لضمان استمرار التواصل
          </p>
        </div>
      )}

      {/* Financial Metrics Cards with Magic UI NumberTicker */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">إجمالي المبيعات</span>
          <div className="text-lg font-bold text-slate-900 tabular-nums mt-1 flex items-baseline gap-1" dir="ltr">
            <NumberTicker value={customer.lifetimeSales} />
            <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
            مسحوبات محققة
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">الفرص المفتوحة</span>
          <div className="text-lg font-bold text-blue-700 tabular-nums mt-1 flex items-baseline gap-1" dir="ltr">
            <NumberTicker value={customer.openPipelineValue} />
            <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">
            صفقات قيد التفاوض
          </span>
        </div>
      </div>


      {/* Facility Details Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-2 border-b border-stone-100">
          <Building className="h-4 w-4 text-blue-600" />
          <span>بيانات المنشأة</span>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-slate-400 block text-[11px]">العنوان والمنطقة</span>
            <span className="text-slate-800 font-medium">{customer.address}</span>
          </div>

          {customer.phoneSecondary && (
            <div>
              <span className="text-slate-400 block text-[11px]">هاتف إضافي</span>
              <span className="font-mono text-left inline-block text-slate-800" dir="ltr">
                {customer.phoneSecondary}
              </span>
            </div>
          )}

          {customer.notes && (
            <div className="pt-1">
              <span className="text-slate-400 block text-[11px]">ملاحظات</span>
              <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5">
                {customer.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Installed Machine Fleet */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>الماكينات المركبة ({customer.installedMachines.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">أسطول العميل</span>
        </div>

        {customer.installedMachines.length === 0 ? (
          <p className="text-slate-400 text-center py-2">لا توجد ماكينات مسجلة حالياً</p>
        ) : (
          <div className="space-y-2">
            {customer.installedMachines.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-100 flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-slate-800" dir="ltr">
                    {m.model}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    شراء عام {m.purchaseYear}
                    {m.serialNumber && ` • الرقم: ${m.serialNumber}`}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-slate-700">
                    {m.quantity} ماكينات
                  </span>
                  {m.purchasedFromSewTec ? (
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      توريد SewTec
                    </span>
                  ) : (
                    <span className="rounded bg-stone-200/60 px-1.5 py-0.5 text-[9px] text-slate-500">
                      مورد آخر
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

