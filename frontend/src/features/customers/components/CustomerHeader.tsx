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
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Back button link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        <span>العودة لدليل العملاء</span>
      </Link>

      {/* Tier 1: Customer Name + VIP + Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          {customer.isVip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              <span>عميل VIP</span>
            </span>
          )}
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            نشط
          </span>
        </div>

        {/* Tier 3 actions on large screens */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLogInteraction}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
            <span>تسجيل تواصل</span>
          </button>
          <button
            onClick={onAddFollowUp}
            className="flex items-center gap-1.5 rounded-md bg-[#0f2744] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#19406b] transition-colors"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>+ إضافة متابعة</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Metadata Subtitle (Type, City, Rep) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span className="font-semibold text-slate-700">
          {customer.type === "factory"
            ? "مصنع ملابس"
            : customer.type === "workshop"
            ? "مشغل / ورشة"
            : customer.type === "trader"
            ? "تاجر ماكينات"
            : "فرد"}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{customer.city}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>المسؤول: {customer.assignedRepName}</span>
        </span>
        {customer.contactPerson && (
          <>
            <span>•</span>
            <span>جهة الاتصال: {customer.contactPerson}</span>
          </>
        )}
      </div>

      {/* Tier 3: Direct Contact Links */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handlePhoneClick}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-mono font-medium text-slate-800 transition-colors"
          dir="ltr"
        >
          <Phone className="h-3.5 w-3.5 text-slate-500" />
          <span>{customer.phone}</span>
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
          <span>واتساب مباشر</span>
        </button>
      </div>
    </div>
  );
}
