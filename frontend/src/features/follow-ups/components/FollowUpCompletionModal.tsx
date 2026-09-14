"use client";
import { branchDateTimeToIso } from "@/lib/dates/branch-time";
import { ModalOverlay } from "@/components/ui/modal-overlay";

import React, { useState } from "react";
import { FollowUp, InteractionOutcome, FollowUpChannel } from "@/types/crm";
import { FollowUpService } from "@/features/follow-ups/services/follow-up.service";
import { getTomorrowMorningIso } from "@/lib/dates/branch-time";
import { X, Check, PhoneOff, Calendar, ThumbsUp, FileText, Clock, PhoneMissed, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpCompletionModalProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FollowUpCompletionModal({
  followUp,
  onClose,
  onSuccess,
}: FollowUpCompletionModalProps) {
  const [outcome, setOutcome] = useState<InteractionOutcome>("interested");
  const [note, setNote] = useState("");
  const [uninterestedReason, setUninterestedReason] = useState("السعر مرتفع");

  // Next follow-up state
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [nextTime, setNextTime] = useState("11:00");
  const [nextChannel, setNextChannel] = useState<FollowUpChannel>("call");
  const [nextTopic, setNextTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!followUp) return null;

  const outcomeChips: { key: InteractionOutcome; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "interested", label: "مهتم ومستمر بالنقاش", icon: ThumbsUp },
    { key: "quotation_requested", label: "طلب عرض أسعار رسمي", icon: FileText },
    { key: "needs_time", label: "يحتاج وقتاً للتفكير", icon: Clock },
    { key: "no_answer", label: "لم يرد على الاتصال", icon: PhoneMissed },
    { key: "not_interested", label: "غير مهتم حالياً", icon: Ban },
  ];

  const lossReasons = [
    "السعر مرتفع مقارنة بالميزانية",
    "الماكينة غير مناسبة لنوع القماش",
    "اشترى من منافس آخر بالمحلة",
    "تم تأجيل خط الإنتاج مؤقتاً",
    "سبب آخر",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let nextFollowUpPayload = undefined;

      if (outcome === "no_answer") {
        // Automatic retry tomorrow at 11:00 AM
        nextFollowUpPayload = {
          scheduledAt: getTomorrowMorningIso(11, 0),
          channel: followUp.channel,
          topic: `إعادة محاولة اتصال (لم يرد سابقاً): ${followUp.topic}`,
        };
      } else if (outcome !== "not_interested" && scheduleNext && nextDate) {
        nextFollowUpPayload = {
          scheduledAt: branchDateTimeToIso(nextDate, nextTime),
          channel: nextChannel,
          topic: nextTopic.trim() || `متابعة لاحقة مع ${followUp.customerName}`,
        };
      }

      await FollowUpService.completeFollowUp({
        followUpId: followUp.id,
        outcome,
        outcomeNote: note.trim() || undefined,
        uninterestedReason: outcome === "not_interested" ? uninterestedReason : undefined,
        nextFollowUp: nextFollowUpPayload,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay label="إنجاز المتابعة" onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              تسجيل نتيجة المتابعة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {followUp.customerName} • {followUp.topic}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Outcome Chips */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              ما هي نتيجة هذا التواصل؟
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {outcomeChips.map((chip) => {
                const isSelected = outcome === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setOutcome(chip.key)}
                    className={cn(
                      "flex items-center gap-1.5 p-2 rounded-lg border text-right transition-all",
                      isSelected
                        ? "bg-primary text-white border-primary shadow-xs font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <chip.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Outcome Dependent Section */}
          {outcome === "no_answer" ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <PhoneOff className="h-4 w-4" />
                <span>إعادة المحاولة غداً تلقائياً</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                سيتم تسجيل هذه المحاولة كـ &quot;لم يرد&quot;، وتوليد مهمة اتصال للمتابعة غداً الساعة 11:00 صباحاً تلقائياً حتى لا يفقد العميل.
              </p>
            </div>
          ) : outcome === "not_interested" ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <label className="block font-bold text-slate-700">
                سبب عدم الاهتمام:
              </label>
              <div className="space-y-1.5">
                {lossReasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 cursor-pointer text-slate-700"
                  >
                    <input
                      type="radio"
                      name="lossReason"
                      value={reason}
                      checked={uninterestedReason === reason}
                      onChange={(e) => setUninterestedReason(e.target.value)}
                      className="accent-red-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            /* Positive/Neutral: Next Follow-Up Scheduler */
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleNext}
                    onChange={(e) => setScheduleNext(e.target.checked)}
                    className="rounded accent-red-600 h-4 w-4"
                  />
                  <span>جدولة متابعة قادمة لهذا العميل</span>
                </label>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>

              {scheduleNext && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        تاريخ المتابعة
                      </span>
                      <input
                        type="date"
                        value={nextDate}
                        onChange={(e) => setNextDate(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        الوقت
                      </span>
                      <input
                        type="time"
                        value={nextTime}
                        onChange={(e) => setNextTime(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        طريقة التواصل
                      </span>
                      <select
                        value={nextChannel}
                        onChange={(e) =>
                          setNextChannel(e.target.value as FollowUpChannel)
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                      >
                        <option value="call">مكالمة هاتفية</option>
                        <option value="visit">زيارة ميدانية</option>
                        <option value="whatsapp">واتساب</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        موضوع المتابعة
                      </span>
                      <input
                        type="text"
                        value={nextTopic}
                        onChange={(e) => setNextTopic(e.target.value)}
                        placeholder="متابعة العرض، توقيع العقد..."
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ملاحظات وتفاصيل ما دار مع العميل:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملخص المكالمة أو الزيارة..."
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded bg-primary px-5 py-2 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "جاري الحفظ..." : "حفظ وإنهاء"}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
