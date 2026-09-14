"use client";
import { branchDateTimeToIso } from "@/lib/dates/branch-time";
import { Input } from "@/components/ui/input";
import { ModalOverlay } from "@/components/ui/modal-overlay";

import React, { useState } from "react";
import { X, PhoneCall, Check } from "lucide-react";
import { InteractionChannel, InteractionOutcome, FollowUpChannel } from "@/types/crm";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { apiClient } from "@/infrastructure/http/api-client";
import { crmStore } from "@/lib/storage/crm-store";

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
  const [customerSearch, setCustomerSearch] = useState("");
  const { customers } = useCustomers({ search: customerSearch });

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const customerId = selectedCustomerId || defaultCustomerId || customers[0]?.id || "";
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

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !summary.trim()) {
      setError("يرجى اختيار العميل وكتابة ملخص التواصل");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId) ?? await apiClient.get<import("@/types/crm").Customer>(`/customers/${customerId}`);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      await apiClient.post("/interactions", {
        customerId, customerName: selectedCustomer.name, channel, outcome, summary: summary.trim(), performedBy: "",
        nextFollowUp: scheduleNext ? { scheduledAt: branchDateTimeToIso(nextDate, nextTime), channel: nextChannel, topic: nextTopic.trim() || "متابعة التواصل" } : undefined,
      });
      await crmStore.syncWithBackend();
      await crmStore.refreshCustomer(customerId);

      setSummary("");
      setScheduleNext(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ التواصل");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay label="تسجيل تواصل" onClose={onClose} className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
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
            aria-label="إغلاق"
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
            <label htmlFor="loginteractiondrawer-field-1" className="block font-bold text-slate-700 mb-1">
              العميل <span className="text-rose-500">*</span>
            </label>
            <input aria-label="بحث عن عميل" placeholder="ابحث بالاسم أو رقم الهاتف" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="mb-2 w-full rounded-lg border p-2" />
            <select id="loginteractiondrawer-field-1"
              value={customerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              {customerId && !customers.some(c => c.id === customerId) && <option value={customerId}>العميل المحدد</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div>
            <label htmlFor="loginteractiondrawer-field-2" className="block font-bold text-slate-700 mb-1">
              طريقة التواصل <span className="text-rose-500">*</span>
            </label>
            <select id="loginteractiondrawer-field-2"
              value={channel}
              onChange={(e) => setChannel(e.target.value as InteractionChannel)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="call">مكالمة هاتفية</option>
              <option value="visit">زيارة ميدانية / بالفرع</option>
              <option value="whatsapp">مراسلة واتساب</option>
              <option value="note">ملاحظة داخلية</option>
            </select>
          </div>

          {/* Outcome */}
          <div>
            <label htmlFor="loginteractiondrawer-field-3" className="block font-bold text-slate-700 mb-1">
              النتيجة المبدئية
            </label>
            <select id="loginteractiondrawer-field-3"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="interested">مهتم ومستمر</option>
              <option value="quotation_requested">طلب عرض أسعار</option>
              <option value="needs_time">يحتاج وقتاً ⏳</option>
              <option value="no_answer">لم يرد على الاتصال</option>
              <option value="not_interested">غير مهتم حالياً</option>
            </select>
          </div>

          {/* Summary Note */}
          <div>
            <label htmlFor="loginteractiondrawer-field-4" className="block font-bold text-slate-700 mb-1">
              تفاصيل وملخص ما دار <span className="text-rose-500">*</span>
            </label>
            <textarea id="loginteractiondrawer-field-4"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="اكتب ما تم الاتفاق عليه أو ملاحظات الزيارة..."
              required
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          {/* Next Follow-Up Checkbox */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <Input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="rounded accent-red-600 h-4 w-4"
              />
              <span>جدولة متابعة قادمة لهذا العميل</span>
            </label>

            {scheduleNext && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">التاريخ</span>
                    <Input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">الوقت</span>
                    <Input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">قناة المتابعة</span>
                  <select
                    value={nextChannel}
                    onChange={(e) => setNextChannel(e.target.value as FollowUpChannel)}
                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                  >
                    <option value="call">اتصال هاتفي (Call)</option>
                    <option value="visit">زيارة ميدانية (Visit)</option>
                    <option value="whatsapp">رسالة واتساب (WhatsApp)</option>
                    <option value="meeting">اجتماع مقر (Meeting)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">موضوع المتابعة</span>
                  <Input
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
            aria-label="إغلاق"
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            form="log-interaction-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ التواصل"}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
