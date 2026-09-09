"use client";

import React, { useState } from "react";
import { X, Sparkles, Check } from "lucide-react";
import { OpportunityStage } from "@/types/crm";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { opportunityRepository } from "@/infrastructure/local-storage/local-storage-opportunity.repository";

interface OpportunityDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  onSuccess?: () => void;
}

export function OpportunityDrawer({
  open,
  onClose,
  defaultCustomerId,
  onSuccess,
}: OpportunityDrawerProps) {
  const { customers } = useCustomers();

  const [customerId, setCustomerId] = useState(defaultCustomerId || "");
  const [machineModel, setMachineModel] = useState("JACK A4B");
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>(undefined);
  const [stage, setStage] = useState<OpportunityStage>("new");
  const [assignedRepId, setAssignedRepId] = useState("rep_01");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !machineModel.trim()) {
      setError("يرجى اختيار العميل وتحديد نوع الماكينة");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      const repName =
        assignedRepId === "rep_01" ? "أحمد شحاتة" : "محمد السيد";
      const title = `توريد ${quantity} ماكينة ${machineModel}`;

      await opportunityRepository.create({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        title,
        machineModel: machineModel.trim(),
        quantity,
        estimatedValue,
        stage,
        assignedRepId,
        assignedRepName: repName,
        notes: notes.trim() || undefined,
      });

      setNotes("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء الفرصة");
    } finally {
      setSubmitting(false);
    }
  };

  const machineOptions = [
    "JACK A4B",
    "HIKARI HK2900ASS",
    "SIRUBA 747K",
    "JACK F4",
    "JUKI DDL-9000C",
    "Overlock 4-thread",
    "أخرى",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                إنشاء فرصة بيعية جديدة
              </h2>
              <p className="text-xs text-slate-500">
                تسجيل اهتمام أو صفقة توريد لفرع المحلة
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
          id="create-opp-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
        >
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              العميل <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">اختر العميل...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Machine and Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                موديل الماكينة <span className="text-rose-500">*</span>
              </label>
              <select
                value={machineModel}
                onChange={(e) => setMachineModel(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                dir="ltr"
              >
                {machineOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الكمية <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Value and Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                القيمة الإجمالية (اختياري)
              </label>
              <input
                type="number"
                value={estimatedValue ?? ""}
                onChange={(e) =>
                  setEstimatedValue(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="اترك فارغاً إن لم تحدد"
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                المرحلة المبدئية
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as OpportunityStage)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="new">جديد (New)</option>
                <option value="contacted">تم التواصل (Contacted)</option>
                <option value="interested">مهتم (Interested)</option>
                <option value="quotation">عرض سعر (Quotation)</option>
                <option value="negotiation">تفاوض (Negotiation)</option>
              </select>
            </div>
          </div>

          {/* Assigned Rep */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              المسؤول
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

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ملاحظات وتفاصيل الصفقة
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="احتياج العميل، شروط التسليم المطلوبة..."
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
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
            form="create-opp-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0f2744] text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الإنشاء..." : "إنشاء الفرصة"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
