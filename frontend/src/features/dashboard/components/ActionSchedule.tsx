"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FollowUp } from "@/types/crm";
import { formatBranchTime, isOverdue } from "@/lib/dates/branch-time";
import {
  PhoneCall,
  Building2,
  MessageCircle,
  Clock,
  Check,
  Phone,
  Calendar,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { parseISO, getHours } from "date-fns";
import { cn } from "@/lib/utils";

interface ActionScheduleProps {
  followUps: FollowUp[];
  overdueCount: number;
  onComplete: (followUp: FollowUp) => void;
}

export function ActionSchedule({
  followUps,
  overdueCount,
  onComplete,
}: ActionScheduleProps) {
  // Group by Morning and Afternoon
  const { morning, afternoon } = useMemo(() => {
    const morningList: FollowUp[] = [];
    const afternoonList: FollowUp[] = [];

    followUps.forEach((fu) => {
      try {
        const hour = getHours(parseISO(fu.scheduledAt));
        if (hour < 12) {
          morningList.push(fu);
        } else {
          afternoonList.push(fu);
        }
      } catch {
        morningList.push(fu);
      }
    });

    return { morning: morningList, afternoon: afternoonList };
  }, [followUps]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "call":
        return <PhoneCall className="h-3.5 w-3.5 text-blue-600" />;
      case "visit":
        return <Building2 className="h-3.5 w-3.5 text-purple-600" />;
      case "whatsapp":
        return <MessageCircle className="h-3.5 w-3.5 text-green-600" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^0-9]/g, "")}`;
  };

  const handleWhatsAppClick = (phone: string, topic: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    const egNumber = cleanNumber.startsWith("0") ? `2${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`السلام عليكم، بخصوص متابعة ${topic}`);
    window.open(`https://wa.me/${egNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-base text-slate-900">
            جدول العمل المباشر اليوم
          </h2>
        </div>
        <Link
          href="/follow-ups"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <span>عرض كل المتابعات</span>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Overdue Banner if overdue items exist */}
      {overdueCount > 0 && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>لديك {overdueCount} متابعات متأخرة من أيام سابقة لم يتم إنجازها!</span>
          </div>
          <Link
            href="/follow-ups?view=overdue"
            className="rounded bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-xs font-bold transition-colors shrink-0"
          >
            معالجة الآن
          </Link>
        </div>
      )}

      {/* Schedule Items */}
      {followUps.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">
            لا توجد مهام متابعة مجدولة لليوم حتى الآن
          </p>
          <p className="text-slate-400 mt-1">
            جميع مهام اليوم مكتملة، أو يمكنك جدولة مهمة جديدة.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Morning Section */}
          {morning.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 block">
                الفترة الصباحية (09:00 ص – 11:59 ص)
              </span>
              <div className="space-y-2">
                {morning.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 transition-all text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-white border border-slate-200 shrink-0 mt-0.5">
                        {getChannelIcon(fu.channel)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-bold tabular-nums" dir="ltr">
                            {formatBranchTime(fu.scheduledAt)}
                          </span>
                          <span>•</span>
                          <Link
                            href={`/customers/${fu.customerId}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {fu.customerName}
                          </Link>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          {fu.topic}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={() => handlePhoneClick(fu.customerPhone)}
                        title="اتصال"
                        className="p-1 text-slate-400 hover:text-emerald-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppClick(fu.customerPhone, fu.topic)}
                        title="واتساب"
                        className="p-1 text-slate-400 hover:text-green-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onComplete(fu)}
                        className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 font-bold text-xs shadow-2xs transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>إنجاز</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon Section */}
          {afternoon.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 block">
                الفترة المسائية (12:00 م – 05:00 م)
              </span>
              <div className="space-y-2">
                {afternoon.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 transition-all text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-white border border-slate-200 shrink-0 mt-0.5">
                        {getChannelIcon(fu.channel)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-bold tabular-nums" dir="ltr">
                            {formatBranchTime(fu.scheduledAt)}
                          </span>
                          <span>•</span>
                          <Link
                            href={`/customers/${fu.customerId}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {fu.customerName}
                          </Link>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          {fu.topic}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={() => handlePhoneClick(fu.customerPhone)}
                        title="اتصال"
                        className="p-1 text-slate-400 hover:text-emerald-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppClick(fu.customerPhone, fu.topic)}
                        title="واتساب"
                        className="p-1 text-slate-400 hover:text-green-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onComplete(fu)}
                        className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 font-bold text-xs shadow-2xs transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>إنجاز</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
