"use client";

import React, { useState, useEffect } from "react";
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
  const { customers } = useCustomers();

  const [customerId, setCustomerId] = useState(defaultCustomerId || "");
  const [channel, setChannel] = useState<FollowUpChannel>("call");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("11:00");
  const [topic, setTopic] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("rep_01");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !topic.trim()) {
      setError("يرجى اختيار العميل وتحديد موضوع المتابعة");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const repName =
        assignedRepId === "rep_01" ? "أحمد شحاتة" : "محمد السيد";

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
      setError("حدث خطأ أثناء جدولة المتابعة");
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

          {/* Channel Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              نوع التواصل <span className="text-rose-500">*</span>
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as FollowUpChannel)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="call">مكالمة هاتفية</option>
              <option value="visit">زيارة ميدانية / بالفرع</option>
              <option value="whatsapp">رسالة واتساب</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                تاريخ المتابعة <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الوقت <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              موضوع وغرض المتابعة <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: متابعة عرض سعر ماكينة HK2900ASS والرد على طلب الخصم..."
              required
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Assigned Rep */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              مسؤول المتابعة
            </label>
            <select
              value={assignedRepId}
              onChange={(e) => setAssignedRepId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="rep_01">أحمد شحاتة</option>
              <option value="rep_02">محمد السيد</option>
            </select>
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
            form="followup-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0f2744] text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ المتابعة"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
