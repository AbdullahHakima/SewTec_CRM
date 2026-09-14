"use client";
import { ModalOverlay } from "@/components/ui/modal-overlay";

import React, { useState } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { AlertTriangle, RotateCcw, X, Check } from "lucide-react";
import { apiClient } from "@/infrastructure/http/api-client";

interface ResetDemoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ResetDemoDialog({
  open,
  onClose,
  onSuccess,
}: ResetDemoDialogProps) {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleReset = async () => {
    setResetting(true);

    try {
      if (typeof window !== "undefined" && apiClient.getToken()) {
        await apiClient.post("/demo/reset");
      }
    } catch (err) {
      console.warn("Could not reset backend DB, continuing with local store reset", err);
    }

    crmStore.reset();
    await crmStore.syncWithBackend();

    setResetting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <ModalOverlay label="إعادة ضبط البيانات التجريبية" onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">
              إعادة ضبط البيانات التجريبية؟
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            سيتم حذف جميع التعديلات والمكالمات المسجلة والمتابعات المنجزة، وإعادة قاعدة بيانات فرع المحلة الكبرى إلى **حالتها الأصلية المعتمدة**.
          </p>
          <div className="rounded-md bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-500">
            يتضمن ذلك استعادة عملاء التجربة (مصنع النور، شركة الصفوة، ورشة المستقبل، إلخ) ومتابعات الصباح المحددة مسبقاً في قاعدة بيانات الخادم.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || done}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
          >
            {done ? (
              <>
                <Check className="h-4 w-4 text-white" />
                <span>تمت الإعادة بنجاح</span>
              </>
            ) : resetting ? (
              <span>جاري الاستعادة...</span>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>تأكيد إعادة الضبط</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
