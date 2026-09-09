"use client";

import React, { useState } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { InteractionChannel } from "@/types/crm";
import { PhoneCall, Building2, MessageCircle, FileText, Send, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickLoggerProps {
  customerId: string;
  customerName: string;
  repName: string;
  onFollowUpPrompt?: () => void;
}

export function QuickLogger({
  customerId,
  customerName,
  repName,
  onFollowUpPrompt,
}: QuickLoggerProps) {
  const [channel, setChannel] = useState<InteractionChannel>("call");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false);

  const channels: { key: InteractionChannel; label: string; icon: React.ElementType }[] = [
    { key: "call", label: "مكالمة هاتفية", icon: PhoneCall },
    { key: "visit", label: "زيارة ميدانية", icon: Building2 },
    { key: "whatsapp", label: "رسالة واتساب", icon: MessageCircle },
    { key: "note", label: "ملاحظة داخلية", icon: FileText },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setSaving(true);
    const now = new Date().toISOString();

    crmStore.update((state) => {
      // Add interaction
      state.interactions.unshift({
        id: `int_${Date.now()}`,
        customerId,
        customerName,
        channel,
        outcome: "interested",
        summary: note.trim(),
        performedBy: repName,
        occurredAt: now,
      });

      // Add timeline activity
      const channelArabic =
        channel === "call"
          ? "مكالمة هاتفية"
          : channel === "visit"
          ? "زيارة ميدانية"
          : channel === "whatsapp"
          ? "مراسلة واتساب"
          : "ملاحظة مسجلة";

      state.activities.unshift({
        id: `act_${Date.now()}`,
        customerId,
        type: "interaction",
        title: `${channelArabic} — ${customerName}`,
        description: note.trim(),
        occurredAt: now,
        performedBy: repName,
        metadata: {
          channel,
        },
      });

      // Update customer lastContactAt
      const customer = state.customers.find((c) => c.id === customerId);
      if (customer) {
        customer.lastContactAt = now;
      }
    });

    setNote("");
    setSaving(false);
    setShowFollowUpPrompt(true);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-slate-800">
          تسجيل تواصل أو ملاحظة سريعة
        </span>
        <span className="text-[11px] text-slate-400">
          تظهر فوراً في سجل النشاط
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-2.5">
        {/* Channel Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {channels.map((ch) => {
            const isSelected = channel === ch.key;
            const Icon = ch.icon;

            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setChannel(ch.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-[#0f2744] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ما تم مع العميل (مثال: تم الاتصال، مهتم بطلب ماكينة HK2900ASS ويطلب خصم نقدي)..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1">
          {showFollowUpPrompt ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 animate-in fade-in">
              <span>تم حفظ التواصل بنجاح! هل تريد جدولة متابعة؟</span>
              <button
                type="button"
                onClick={() => {
                  setShowFollowUpPrompt(false);
                  if (onFollowUpPrompt) onFollowUpPrompt();
                }}
                className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 underline"
              >
                <CalendarPlus className="h-3 w-3" />
                <span>+ جدولة متابعة</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFollowUpPrompt(false)}
                className="text-slate-400 hover:text-slate-600 text-[11px]"
              >
                تخطي
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="flex items-center gap-1.5 rounded-md bg-[#0f2744] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "جاري الحفظ..." : "حفظ التحديث"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
