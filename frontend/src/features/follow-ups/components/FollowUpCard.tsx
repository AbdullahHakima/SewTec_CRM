"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FollowUp } from "@/types/crm";
import { formatBranchTime, isOverdue, formatBranchDate } from "@/lib/dates/branch-time";
import {
  PhoneCall,
  Building2,
  MessageCircle,
  Clock,
  Check,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { followUpRepository } from "@/infrastructure/local-storage/local-storage-follow-up.repository";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface FollowUpCardProps {
  followUp: FollowUp;
  onComplete: (followUp: FollowUp) => void;
}

export function FollowUpCard({ followUp, onComplete }: FollowUpCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const overdue = followUp.status === "scheduled" && isOverdue(followUp.scheduledAt);

  const getChannelInfo = (channel: string) => {
    switch (channel) {
      case "call":
        return { label: "مكالمة هاتفية", icon: PhoneCall, color: "text-blue-600 bg-blue-50" };
      case "visit":
        return { label: "زيارة ميدانية", icon: Building2, color: "text-purple-600 bg-purple-50" };
      case "whatsapp":
        return { label: "واتساب", icon: MessageCircle, color: "text-green-600 bg-green-50" };
      default:
        return { label: "متابعة", icon: Clock, color: "text-slate-600 bg-slate-50" };
    }
  };

  const channelInfo = getChannelInfo(followUp.channel);
  const ChannelIcon = channelInfo.icon;

  const handleReschedule = async (daysToAdd: number) => {
    setRescheduleOpen(false);
    const newDate = addDays(new Date(), daysToAdd);
    await followUpRepository.reschedule(followUp.id, newDate.toISOString());
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${followUp.customerPhone.replace(/[^0-9]/g, "")}`;
  };

  const handleWhatsAppClick = () => {
    const cleanNumber = followUp.customerPhone.replace(/[^0-9]/g, "");
    const egNumber = cleanNumber.startsWith("0") ? `2${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`السلام عليكم، بخصوص متابعة ${followUp.topic}`);
    window.open(`https://wa.me/${egNumber}?text=${message}`, "_blank");
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-white p-4 shadow-2xs hover:shadow-xs transition-all space-y-3",
        overdue ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
      )}
    >
      {/* Top Bar: Time, Channel, Overdue Warning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold",
              channelInfo.color
            )}
          >
            <ChannelIcon className="h-3.5 w-3.5" />
            <span>{channelInfo.label}</span>
          </span>

          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 tabular-nums">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatBranchTime(followUp.scheduledAt)}</span>
          </span>
        </div>

        {overdue ? (
          <span className="inline-flex items-center gap-1 rounded bg-rose-100 text-rose-700 px-2 py-0.5 text-[11px] font-bold">
            <AlertTriangle className="h-3 w-3" />
            <span>متأخرة!</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            {formatBranchDate(followUp.scheduledAt)}
          </span>
        )}
      </div>

      {/* Customer Name & Topic */}
      <div>
        <Link
          href={`/customers/${followUp.customerId}`}
          className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors inline-block"
        >
          {followUp.customerName}
        </Link>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {followUp.topic}
        </p>
      </div>

      {/* Footer: Phone Shortcuts + Main Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        {/* Contact shortcuts */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePhoneClick}
            title="اتصال هاتفي"
            className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-slate-700 font-mono text-[11px] hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            dir="ltr"
          >
            <Phone className="h-3 w-3" />
            <span>{followUp.customerPhone}</span>
          </button>
          <button
            onClick={handleWhatsAppClick}
            title="واتساب"
            className="p-1 rounded text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Status / Completion Action */}
        <div className="flex items-center gap-2">
          {followUp.status === "scheduled" ? (
            <>
              {/* Reschedule button */}
              <div className="relative">
                <button
                  onClick={() => setRescheduleOpen(!rescheduleOpen)}
                  className="rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50 text-xs transition-colors"
                >
                  تأجيل ⏱
                </button>

                {rescheduleOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setRescheduleOpen(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-1 w-36 rounded-md border border-slate-200 bg-white p-1 shadow-lg z-30 text-right animate-in fade-in duration-100">
                      <button
                        onClick={() => handleReschedule(1)}
                        className="w-full text-right px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded"
                      >
                        غداً
                      </button>
                      <button
                        onClick={() => handleReschedule(3)}
                        className="w-full text-right px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded"
                      >
                        بعد 3 أيام
                      </button>
                      <button
                        onClick={() => handleReschedule(7)}
                        className="w-full text-right px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded"
                      >
                        الأسبوع القادم
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Complete action */}
              <button
                onClick={() => onComplete(followUp)}
                className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 font-bold text-xs shadow-2xs transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>إنجاز المتابعة</span>
              </button>
            </>
          ) : (
            <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-bold text-xs">
              مكتملة ✓ ({followUp.outcome || "تمت"})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
