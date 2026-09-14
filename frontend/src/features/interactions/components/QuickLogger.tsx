"use client";

import React, { useState } from "react";
import { apiClient } from "@/infrastructure/http/api-client";
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

  const [error, setError] = useState("");
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!note.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await apiClient.post("/interactions", { customerId, customerName, channel, outcome: "interested", summary: note.trim(), performedBy: repName });
      await crmStore.refreshCustomer(customerId);
      setNote(""); setShowFollowUpPrompt(true);
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر حفظ التواصل."); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-slate-800 dark:text-stone-100">
          تسجيل تواصل أو ملاحظة سريعة
        </span>
        <span className="text-[11px] text-slate-400">
          تظهر فوراً في سجل النشاط
        </span>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
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
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 hover:bg-slate-200/70 dark:hover:bg-stone-700"
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
            aria-label="تفاصيل التواصل أو الملاحظة"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ما تم مع العميل (مثال: تم الاتصال، مهتم بطلب ماكينة HK2900ASS ويطلب خصم نقدي)..."
            className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 p-3 text-xs text-slate-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-stone-800 focus:border-red-500 rounded-xl focus:outline-hidden transition-all"
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
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "جاري الحفظ..." : "حفظ التحديث"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

