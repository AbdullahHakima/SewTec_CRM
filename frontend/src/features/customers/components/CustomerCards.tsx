"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  CalendarPlus,
  Phone,
  Star,
  MapPin,
  SearchX,
  UserPlus,
  RotateCcw,
  MessageCircle,
  Copy,
  Check,
  Cpu,
} from "lucide-react";
import { Customer } from "@/types/crm";
import { formatBranchRelative } from "@/lib/dates/branch-time";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export function CustomerCards({
  customers,
  onAddFollowUp,
  onAddNewCustomer,
  onResetFilters,
}: {
  customers: Customer[];
  onAddFollowUp: (customer: Customer) => void;
  onAddNewCustomer?: () => void;
  onResetFilters?: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = async (e: React.MouseEvent, id: string, phone: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  if (!customers.length) {
    return (
      <EmptyState
        icon={SearchX}
        variant="search"
        badge="نتائج التصفية"
        title="لا توجد بطاقات عملاء مطابقة"
        description="لم يتم العثور على أي عميل يطابق معايير البحث أو التصنيف الحالية. جرّب تغيير عوامل التصفية أو إضافة عميل جديد."
        action={onAddNewCustomer ? { label: "إضافة عميل جديد", onClick: onAddNewCustomer, icon: UserPlus } : undefined}
        secondaryAction={onResetFilters ? { label: "مسح الفلاتر والبحث", onClick: onResetFilters, icon: RotateCcw } : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer) => {
        const cleanPhone = customer.phone.replace(/[^0-9+]/g, "");
        const waNumber = cleanPhone.startsWith("+")
          ? cleanPhone.replace("+", "")
          : cleanPhone.startsWith("0")
          ? "20" + cleanPhone.slice(1)
          : "20" + cleanPhone;

        const totalMachines = customer.installedMachines?.reduce((acc, m) => acc + (m.quantity || 1), 0) || 0;

        return (
          <div
            key={customer.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs transition-all hover:border-red-200 hover:shadow-md"
          >
            {/* Card Header: Avatar, Name, Status Badge, VIP */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100/60 text-lg font-bold text-red-700 shadow-2xs border border-red-200/40"
                  aria-hidden="true"
                >
                  {customer.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-sm font-bold leading-6 text-zinc-900 hover:text-red-600 transition-colors block truncate"
                  >
                    {customer.name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                    <MapPin size={12} className="text-zinc-400" />
                    <span>{customer.city || "المحلة الكبرى"}</span>
                    {customer.type && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span>{{ factory: "مصنع", workshop: "ورشة", trader: "تاجر", individual: "فرد" }[customer.type]}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {customer.isVip && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 shadow-2xs shrink-0"
                  title="عميل استراتيجي VIP"
                >
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  VIP
                </span>
              )}
            </div>

            {/* Status & Machines Meta Pill */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50/80 border border-stone-100 p-2.5 text-xs">
              <StatusBadge status={customer.status} pulse={customer.status === "active"} />

              {totalMachines > 0 ? (
                <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-zinc-600 bg-white px-2 py-0.5 rounded border border-stone-200/60">
                  <Cpu size={12} className="text-zinc-400" />
                  <span>{totalMachines} ماكينة</span>
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400">لا توجد ماكينات</span>
              )}
            </div>

            {/* Contact & Relative Timing */}
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>آخر تواصل:</span>
              <span className="font-medium text-zinc-700">
                {customer.lastContactAt
                  ? formatBranchRelative(customer.lastContactAt)
                  : "لم يتم التواصل بعد"}
              </span>
            </div>

            {/* Kokonut UI Micro Action Toolbar */}
            <div className="mt-4 flex items-center justify-between gap-1 border-t border-stone-100 pt-3">
              {/* Phone + Copy */}
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-red-600 transition-colors"
                  aria-label={`اتصال بـ ${customer.name}`}
                  dir="ltr"
                >
                  <Phone size={13} className="text-zinc-400" />
                  <span>{customer.phone}</span>
                </a>
                <button
                  type="button"
                  onClick={(e) => handleCopyPhone(e, customer.id, customer.phone)}
                  title={copiedId === customer.id ? "تم النسخ" : "نسخ الرقم"}
                  className="rounded p-1 text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 transition"
                >
                  {copiedId === customer.id ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                  title="محادثة واتساب"
                >
                  <MessageCircle size={15} />
                </a>

                <button
                  onClick={() => onAddFollowUp(customer)}
                  className="rounded-lg bg-stone-100 p-1.5 text-zinc-600 hover:bg-red-50 hover:text-red-600 transition"
                  title={`جدولة متابعة مع ${customer.name}`}
                  aria-label={`جدولة متابعة مع ${customer.name}`}
                >
                  <CalendarPlus size={15} />
                </button>

                <Link
                  href={`/customers/${customer.id}`}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
                  title={`عرض ملف ${customer.name}`}
                  aria-label={`عرض ملف ${customer.name}`}
                >
                  <ArrowUpLeft size={16} />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
