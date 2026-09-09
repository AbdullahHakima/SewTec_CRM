"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { opportunityRepository } from "@/infrastructure/local-storage/local-storage-opportunity.repository";
import { formatEgp } from "@/lib/currency/format-currency";
import { formatBranchDate, getDaysInStage } from "@/lib/dates/branch-time";
import { X, Check, TrendingUp, User, Building2, Calendar, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpportunityInspectorDrawerProps {
  opportunity: Opportunity | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpportunityInspectorDrawer({
  opportunity,
  open,
  onClose,
  onSuccess,
}: OpportunityInspectorDrawerProps) {
  const [stage, setStage] = useState<OpportunityStage>("new");
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setStage(opportunity.stage);
      setEstimatedValue(opportunity.estimatedValue);
      setNotes(opportunity.notes || "");
      setStageNote("");
    }
  }, [opportunity]);

  if (!open || !opportunity) return null;

  const daysInStage = getDaysInStage(opportunity.stageUpdatedAt);

  const stages: { key: OpportunityStage; label: string; color: string }[] = [
    { key: "new", label: "جديد (New)", color: "text-slate-700 bg-slate-100" },
    { key: "contacted", label: "تم التواصل (Contacted)", color: "text-blue-700 bg-blue-50" },
    { key: "interested", label: "مهتم (Interested)", color: "text-blue-700 bg-blue-50" },
    { key: "quotation", label: "عرض سعر (Quotation)", color: "text-indigo-700 bg-indigo-50" },
    { key: "negotiation", label: "تفاوض (Negotiation)", color: "text-amber-800 bg-amber-100" },
    { key: "won", label: "تم البيع (Won ✓)", color: "text-emerald-700 bg-emerald-100" },
    { key: "lost", label: "خسارة (Lost)", color: "text-rose-700 bg-rose-100" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (stage !== opportunity.stage) {
        await opportunityRepository.updateStage(opportunity.id, stage, stageNote.trim() || undefined);
      }

      await opportunityRepository.update(opportunity.id, {
        estimatedValue,
        notes: notes.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 line-clamp-1">
                {opportunity.title}
              </h2>
              <p className="text-xs text-slate-500">
                تفاصيل الصفقة وإجراءات التحريك
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

        {/* Content */}
        <form
          id="opp-inspector-form"
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
        >
          {/* Customer & Machine Info Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">العميل:</span>
              <Link
                href={`/customers/${opportunity.customerId}`}
                className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {opportunity.customerName}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">الماكينة والكمية:</span>
              <span className="font-mono font-bold text-slate-800" dir="ltr">
                {opportunity.machineModel} (×{opportunity.quantity})
              </span>
            </div>
            {opportunity.quotationRef && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">عرض السعر المرتبط:</span>
                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold" dir="ltr">
                  {opportunity.quotationRef}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">المسؤول:</span>
              <span className="font-medium text-slate-700">
                {opportunity.assignedRepName}
              </span>
            </div>
          </div>

          {/* Stage Selector */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              مرحلة الصفقة الحالية
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as OpportunityStage)}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
            >
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>
                في هذه المرحلة منذ {daysInStage} أيام (آخر تحديث: {formatBranchDate(opportunity.stageUpdatedAt)})
              </span>
            </div>
          </div>

          {/* If Stage Changed: Note prompt */}
          {stage !== opportunity.stage && (
            <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 space-y-1.5 animate-in fade-in">
              <label className="block font-bold text-blue-900">
                سبب أو تفاصيل نقل المرحلة إلى ({stage}):
              </label>
              <input
                type="text"
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="مثال: العميل وافق على العرض وطلب الاتفاق النهائي..."
                className="w-full rounded border border-blue-300 bg-white p-2 text-xs text-slate-900 focus:outline-hidden"
              />
            </div>
          )}

          {/* Deal Value */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              القيمة الإجمالية المتوقعة (جنيه مصري)
            </label>
            <input
              type="number"
              value={estimatedValue ?? ""}
              onChange={(e) =>
                setEstimatedValue(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="مثال: 120000"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              ملاحظات وتطورات التفاوض
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط السداد، الخصم المطلوب، متطلبات التركيب..."
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
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
            form="opp-inspector-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0f2744] text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ التغييرات ✓"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
