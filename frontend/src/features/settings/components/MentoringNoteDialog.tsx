"use client";

import React, { useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { MessageSquare, X, Check, Target, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MentoringNoteDialogProps {
  open: boolean;
  onClose: () => void;
  repName: string;
  repId: string;
  onSuccess: (note: { repId: string; type: string; message: string; date: string }) => Promise<void>;
}

export function MentoringNoteDialog({
  open,
  onClose,
  repName,
  repId,
  onSuccess,
}: MentoringNoteDialogProps) {
  const [noteType, setNoteType] = useState<"target" | "coaching" | "alert">("coaching");
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !message.trim()) return;

    try {
    setSaving(true); setError("");
    await onSuccess({
      repId,
      type: noteType,
      message: message.trim(),
      date: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    });

    setMessage("");
    onClose();
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر الحفظ."); } finally { setSaving(false); }
  };

  return (
    <ModalOverlay
      label="توجيه إشرافي للمندوب"
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-right dark:border-stone-800 dark:bg-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 dark:border-stone-800 dark:bg-stone-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-stone-100">
                توجيه وملاحظة إشرافية
              </h3>
              <p className="text-[11px] text-slate-500">
                تسجيل توجيه خاص بالمندوب: <span className="font-bold text-slate-800 dark:text-stone-200">{repName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {error && <p role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1.5">
              نوع التوجيه الإشرافي
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNoteType("coaching")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-center transition ${
                  noteType === "coaching"
                    ? "border-blue-500 bg-blue-50/70 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-stone-800 dark:bg-stone-800"
                }`}
              >
                <Lightbulb size={16} className="text-amber-500" />
                <span className="text-[11px]">نصيحة بيعية</span>
              </button>

              <button
                type="button"
                onClick={() => setNoteType("target")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-center transition ${
                  noteType === "target"
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-stone-800 dark:bg-stone-800"
                }`}
              >
                <Target size={16} className="text-emerald-600" />
                <span className="text-[11px]">هدف مستهدف</span>
              </button>

              <button
                type="button"
                onClick={() => setNoteType("alert")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-center transition ${
                  noteType === "alert"
                    ? "border-red-500 bg-red-50/70 text-red-800 dark:bg-red-950/50 dark:text-red-300 font-bold"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-stone-800 dark:bg-stone-800"
                }`}
              >
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-[11px]">تنبيه متابعة</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1">
              نص التوجيه أو التوصية <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="مثال: يرجى التركيز على التواصل مع مشاغل المنشية لتقديم عروض ماكينة الأوفرلوك SIRUBA 747K قبل نهاية الأسبوع..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 text-xs text-slate-900 dark:text-stone-100 focus:border-red-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              <Check size={14} className="ml-1.5" />
              حفظ التوجيه
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
