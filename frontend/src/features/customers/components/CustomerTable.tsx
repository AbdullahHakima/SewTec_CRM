"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/crm";
import { Phone, MessageCircle, MoreHorizontal, AlertTriangle, Calendar, Star } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { formatBranchRelative, formatBranchDate, isOverdue, isCustomerStale, getDaysSinceContact } from "@/lib/dates/branch-time";
import { MachineFleetPopover } from "./MachineFleetPopover";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  customers: Customer[];
  onLogInteraction?: (customer: Customer) => void;
  onAddFollowUp?: (customer: Customer) => void;
}

export function CustomerTable({
  customers,
  onLogInteraction,
  onAddFollowUp,
}: CustomerTableProps) {
  const router = useRouter();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const typeLabels: Record<string, { label: string; color: string }> = {
    factory: { label: "مصنع", color: "bg-blue-50 text-blue-700 border-blue-200" },
    workshop: { label: "ورشة", color: "bg-purple-50 text-purple-700 border-purple-200" },
    trader: { label: "تاجر", color: "bg-amber-50 text-amber-700 border-amber-200" },
    individual: { label: "فرد", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone.replace(/[^0-9]/g, "")}`;
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    const egNumber = cleanNumber.startsWith("0") ? `2${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`السلام عليكم، بخصوص ماكينات SewTec للخياطة — فرع المحلة`);
    window.open(`https://wa.me/${egNumber}?text=${message}`, "_blank");
  };

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
        <p className="font-bold text-base text-slate-700">لا يوجد عملاء مطابقين للبحث</p>
        <p className="text-xs text-slate-400 mt-1">
          جرب تغيير معايير البحث أو تصفية التصنيف لعرض نتائج أخرى
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
              <th className="py-3 px-3.5">العميل</th>
              <th className="py-3 px-3">الهاتف</th>
              <th className="py-3 px-2.5">النوع</th>
              <th className="py-3 px-3">الماكينات الحالية</th>
              <th className="py-3 px-3">المسؤول</th>
              <th className="py-3 px-3">آخر تواصل</th>
              <th className="py-3 px-3">المتابعة القادمة</th>
              <th className="py-3 px-3.5 text-left">إجمالي المبيعات</th>
              <th className="py-3 px-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => {
              const stale = isCustomerStale(c.lastContactAt, c.isVip);
              const daysSince = getDaysSinceContact(c.lastContactAt);
              const nextOverdue = isOverdue(c.nextFollowUpAt);

              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/customers/${c.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Customer Name + Title */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-1.5">
                      {c.isVip && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                      {c.address}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-left inline-block text-slate-700" dir="ltr">
                      {c.phone}
                    </span>
                  </td>

                  {/* Type Badge */}
                  <td className="py-2.5 px-2.5">
                    <span
                      className={cn(
                        "inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold",
                        typeLabels[c.type]?.color || "bg-slate-100 text-slate-700"
                      )}
                    >
                      {typeLabels[c.type]?.label || c.type}
                    </span>
                  </td>

                  {/* Machine Fleet */}
                  <td className="py-2.5 px-3">
                    <MachineFleetPopover machines={c.installedMachines} />
                  </td>

                  {/* Assigned Rep */}
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {c.assignedRepName}
                  </td>

                  {/* Last Contact */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      {stale ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          <span>منذ {daysSince} يوماً</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {formatBranchRelative(c.lastContactAt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Next Follow-Up */}
                  <td className="py-2.5 px-3">
                    {c.nextFollowUpAt ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                          nextOverdue
                            ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>{formatBranchDate(c.nextFollowUpAt)}</span>
                        {nextOverdue && <span className="text-[10px]">(متأخرة)</span>}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[11px]">غير مجدول</span>
                    )}
                  </td>

                  {/* Lifetime Sales */}
                  <td className="py-2.5 px-3.5 text-left font-bold text-slate-800 tabular-nums">
                    {formatEgp(c.lifetimeSales)}
                  </td>

                  {/* Row Actions */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Phone call shortcut */}
                      <button
                        onClick={(e) => handlePhoneClick(e, c.phone)}
                        title="اتصال هاتفي مباشر"
                        className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>

                      {/* WhatsApp shortcut */}
                      <button
                        onClick={(e) => handleWhatsAppClick(e, c.phone, c.name)}
                        title="مراسلة واتساب"
                        className="rounded p-1 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === c.id ? null : c.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>

                        {menuOpenId === c.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                              }}
                            />
                            <div
                              className="absolute left-0 mt-1 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg z-30 text-right animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  router.push(`/customers/${c.id}`);
                                }}
                                className="w-full rounded px-2.5 py-1.5 text-right text-xs text-slate-700 hover:bg-slate-50"
                              >
                                عرض ملف العميل 360
                              </button>
                              {onAddFollowUp && (
                                <button
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    onAddFollowUp(c);
                                  }}
                                  className="w-full rounded px-2.5 py-1.5 text-right text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  إضافة متابعة جديدة
                                </button>
                              )}
                              {onLogInteraction && (
                                <button
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    onLogInteraction(c);
                                  }}
                                  className="w-full rounded px-2.5 py-1.5 text-right text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  تسجيل تواصل فوري
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500">
        <span>عرض {customers.length} عميل</span>
        <span>SewTec Customer Directory</span>
      </div>
    </div>
  );
}
