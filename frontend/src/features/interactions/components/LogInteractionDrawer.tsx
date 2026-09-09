"use client";

import React, { useState, useEffect } from "react";
import { X, PhoneCall, Check } from "lucide-react";
import { InteractionChannel, InteractionOutcome, FollowUpChannel } from "@/types/crm";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { crmStore } from "@/lib/storage/crm-store";
import { getTomorrowMorningIso } from "@/lib/dates/branch-time";

interface LogInteractionDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  onSuccess?: () => void;
}

export function LogInteractionDrawer({
  open,
  onClose,
  defaultCustomerId,
  onSuccess,
}: LogInteractionDrawerProps) {
  const { customers } = useCustomers();

  const [customerId, setCustomerId] = useState(defaultCustomerId || "");
  const [channel, setChannel] = useState<InteractionChannel>("call");
  const [outcome, setOutcome] = useState<InteractionOutcome>("interested");
  const [summary, setSummary] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [nextTime, setNextTime] = useState("11:00");
  const [nextChannel, setNextChannel] = useState<FollowUpChannel>("call");
  const [nextTopic, setNextTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultCustomerId) {
      setCustomerId(defaultCustomerId);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [defaultCustomerId, customers, customerId]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !summary.trim()) {
      setError("يرجى اختيار العميل وكتابة ملخص التواصل");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      const now = new Date().toISOString();
      const channelArabic =
        channel === "call"
          ? "مكالمة هاتفية"
          : channel === "visit"
          ? "زيارة ميدانية"
          : channel === "whatsapp"
          ? "مراسلة واتساب"
          : "ملاحظة مسجلة";

      crmStore.update((state) => {
        // Add Interaction
        state.interactions.unshift({
          id: `int_${Date.now()}`,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          channel,
          outcome,
          summary: summary.trim(),
          performedBy: selectedCustomer.assignedRepName,
          occurredAt: now,
        });

        // Add Activity
        state.activities.unshift({
          id: `act_${Date.now()}`,
          customerId: selectedCustomer.id,
          type: "interaction",
          title: `${channelArabic} — ${selectedCustomer.name}`,
          description: summary.trim(),
          occurredAt: now,
          performedBy: selectedCustomer.assignedRepName,
          metadata: {
            channel,
            outcome,
          },
        });

        // Update Customer lastContactAt
        const c = state.customers.find((cust) => cust.id === customerId);
        if (c) {
          c.lastContactAt = now;
        }

        // Optional Next Follow-Up
        if (scheduleNext && nextDate) {
          const scheduledAt = new Date(`${nextDate}T${nextTime}:00`).toISOString();
          const newFuId = `fu_${Date.now() + 1}`;
          state.followUps.unshift({
            id: newFuId,
            branchId: "mahalla",
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            channel: nextChannel,
            scheduledAt,
            topic: nextTopic.trim() || `متابعة ما بعد ${channelArabic}`,
            status: "scheduled",
            assignedRepId: selectedCustomer.assignedRepId,
            assignedRepName: selectedCustomer.assignedRepName,
          });

          if (c) {
            c.nextFollowUpAt = scheduledAt;
          }
        }
      });

      setSummary("");
      setScheduleNext(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء حفظ التواصل");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                تسجيل تواصل فوري
              </h2>
              <p className="text-xs text-slate-500">
                توثيق مكالمة أو زيارة تمت مع العميل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="log-interaction-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
        >
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Customer */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              العميل <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              طريقة التواصل <span className="text-rose-500">*</span>
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as InteractionChannel)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="call">مكالمة هاتفية</option>
              <option value="visit">زيارة ميدانية / بالفرع</option>
              <option value="whatsapp">مراسلة واتساب</option>
              <option value="note">ملاحظة داخلية</option>
            </select>
          </div>

          {/* Outcome */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              النتيجة المبدئية
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="interested">مهتم 👍</option>
              <option value="quotation_requested">طلب عرض أسعار 📄</option>
              <option value="needs_time">يحتاج وقتاً ⏳</option>
              <option value="no_answer">لم يرد 📵</option>
              <option value="not_interested">غير مهتم ✕</option>
            </select>
          </div>

          {/* Summary Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              تفاصيل وملخص ما دار <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="اكتب ما تم الاتفاق عليه أو ملاحظات الزيارة..."
              required
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Next Follow-Up Checkbox */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="rounded accent-[#0f2744] h-4 w-4"
              />
              <span>جدولة متابعة قادمة لهذا العميل</span>
            </label>

            {scheduleNext && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">التاريخ</span>
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">الوقت</span>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">موضوع المتابعة</span>
                  <input
                    type="text"
                    value={nextTopic}
                    onChange={(e) => setNextTopic(e.target.value)}
                    placeholder="متابعة العرض والاتفاق..."
                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            form="log-interaction-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0f2744] text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ التواصل"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
