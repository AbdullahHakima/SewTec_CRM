"use client";

import React from "react";
import Link from "next/link";
import { Customer } from "@/types/crm";
import {
  ArrowRight,
  Star,
  Phone,
  MessageCircle,
  CalendarPlus,
  PhoneCall,
  MapPin,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface CustomerHeaderProps {
  customer: Customer;
  onLogInteraction: () => void;
  onAddFollowUp: () => void;
}

export function CustomerHeader({
  customer,
  onLogInteraction,
  onAddFollowUp,
}: CustomerHeaderProps) {
  const handlePhoneClick = () => {
    window.location.href = `tel:${customer.phone.replace(/[^0-9]/g, "")}`;
  };

  const handleWhatsAppClick = () => {
    const cleanNumber = customer.phone.replace(/[^0-9]/g, "");
    const egNumber = cleanNumber.startsWith("0") ? `2${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(
      `السلام عليكم ${customer.contactPerson || customer.name}، بخصوص ماكينات الخياطة من SewTec فرع المحلة`
    );
    window.open(`https://wa.me/${egNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="surface-card relative overflow-hidden p-5 sm:p-7 space-y-4 border-t-4 border-t-red-600 shadow-sm">

      {/* Back button link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors relative z-10"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        <span>العودة لدليل العملاء</span>
      </Link>

      {/* Tier 1: Customer Name + VIP + Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          {customer.isVip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              <span>عميل VIP</span>
            </span>
          )}
          <StatusBadge status={customer.status} pulse={customer.status === "active"} />
        </div>

        {/* Tier 3 actions on large screens */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onLogInteraction}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-2xs"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
            <span>تسجيل تواصل</span>
          </button>
          <button
            onClick={onAddFollowUp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>+ إضافة متابعة</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Metadata Subtitle (Type, City, Rep) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 border-t border-stone-100 pt-3 relative z-10">
        <span className="font-semibold text-slate-700">
          {customer.type === "factory"
            ? "مصنع ملابس"
            : customer.type === "workshop"
            ? "مشغل / ورشة"
            : customer.type === "trader"
            ? "تاجر ماكينات"
            : "فرد"}
        </span>
        <span className="text-stone-300">•</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{customer.city}</span>
        </span>
        <span className="text-stone-300">•</span>
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>المسؤول: {customer.assignedRepName}</span>
        </span>
        {customer.contactPerson && (
          <>
            <span className="text-stone-300">•</span>
            <span>جهة الاتصال: {customer.contactPerson}</span>
          </>
        )}
      </div>

      {/* Tier 3: Direct Contact Links */}
      <div className="flex items-center gap-3 pt-1 relative z-10">
        <button
          onClick={handlePhoneClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 text-xs font-mono font-medium text-slate-800 transition-colors"
          dir="ltr"
        >
          <Phone className="h-3.5 w-3.5 text-slate-500" />
          <span>{customer.phone}</span>
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors shadow-2xs"
        >
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>واتساب مباشر</span>
        </button>
      </div>
    </div>
  );
}
