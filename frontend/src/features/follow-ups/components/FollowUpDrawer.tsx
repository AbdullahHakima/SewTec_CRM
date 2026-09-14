"use client";
import { branchDateTimeToIso } from "@/lib/dates/branch-time";
import { apiClient } from "@/infrastructure/http/api-client";
import { useDirectory } from "@/lib/auth/use-directory";
import { Input } from "@/components/ui/input";
import { ModalOverlay } from "@/components/ui/modal-overlay";

import React, { useState } from "react";
import { X, CalendarPlus, Check } from "lucide-react";
import { FollowUpChannel } from "@/types/crm";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { followUpRepository } from "@/infrastructure/local-storage/local-storage-follow-up.repository";

interface FollowUpDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  onSuccess?: () => void;
}

export function FollowUpDrawer({
  open,
  onClose,
  defaultCustomerId,
  onSuccess,
}: FollowUpDrawerProps) {
  const { user: signedInUser, people } = useDirectory();
  const [customerSearch, setCustomerSearch] = useState("");
  const { customers } = useCustomers({ search: customerSearch });

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const customerId = selectedCustomerId || defaultCustomerId || customers[0]?.id || "";
  const [channel, setChannel] = useState<FollowUpChannel>("call");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("11:00");
  const [topic, setTopic] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !topic.trim()) {
      setError("يرجى اختيار العميل وتحديد موضوع المتابعة");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId) ?? await apiClient.get<import("@/types/crm").Customer>(`/customers/${customerId}`);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      const scheduledAt = branchDateTimeToIso(date, time);
      const repName = people.find(person => person.id === assignedRepId)?.fullName || signedInUser?.fullName || "";

      await followUpRepository.create({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        channel,
        scheduledAt,
        topic: topic.trim(),
        assignedRepId,
        assignedRepName: repName,
      });

      setTopic("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء جدولة المتابعة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay label="جدولة متابعة" onClose={onClose} className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                جدولة متابعة جديدة
              </h2>
              <p className="text-xs text-slate-500">
                تحديد موعد اتصال أو زيارة قادمة
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
          id="followup-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
        >
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Customer Picker */}
          <div>
            <label htmlFor="followupdrawer-field-1" className="block font-bold text-slate-700 mb-1">
              العميل <span className="text-rose-500">*</span>
            </label>
            <input aria-label="بحث عن عميل" placeholder="ابحث بالاسم أو رقم الهاتف" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="mb-2 w-full rounded-lg border p-2" />
            <select id="followupdrawer-field-1"
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

          {/* Channel Picker */}
          <div>
            <label htmlFor="followupdrawer-field-2" className="block font-bold text-slate-700 mb-1">
              نوع التواصل <span className="text-rose-500">*</span>
            </label>
            <select id="followupdrawer-field-2"
              value={channel}
              onChange={(e) => setChannel(e.target.value as FollowUpChannel)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="call">مكالمة هاتفية</option>
              <option value="visit">زيارة ميدانية / بالفرع</option>
              <option value="whatsapp">رسالة واتساب</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="followupdrawer-field-3" className="block font-bold text-slate-700 mb-1">
                تاريخ المتابعة <span className="text-rose-500">*</span>
              </label>
              <Input id="followupdrawer-field-3"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label htmlFor="followupdrawer-field-4" className="block font-bold text-slate-700 mb-1">
                الوقت <span className="text-rose-500">*</span>
              </label>
              <Input id="followupdrawer-field-4"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="followupdrawer-field-5" className="block font-bold text-slate-700 mb-1">
              موضوع وغرض المتابعة <span className="text-rose-500">*</span>
            </label>
            <textarea id="followupdrawer-field-5"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: متابعة عرض سعر ماكينة HK2900ASS والرد على طلب الخصم..."
              required
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          {/* Assigned Rep */}
          <div>
            <label htmlFor="followupdrawer-field-6" className="block font-bold text-slate-700 mb-1">
              مسؤول المتابعة
            </label>
            <select id="followupdrawer-field-6"
              value={assignedRepId}
              onChange={(e) => setAssignedRepId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="">المستخدم الحالي</option>{people.map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}
            </select>
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
            form="followup-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ المتابعة"}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
