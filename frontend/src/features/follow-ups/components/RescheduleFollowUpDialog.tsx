"use client";

import { useState } from "react";
import { FollowUp } from "@/types/crm";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { branchDateTimeToIso, branchDay } from "@/lib/dates/branch-time";
import { followUpRepository } from "@/infrastructure/local-storage/local-storage-follow-up.repository";

function cairoTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.hour}:${value.minute}`;
}

export function RescheduleFollowUpDialog({ followUp, onClose }: { followUp: FollowUp; onClose: () => void }) {
  const [date, setDate] = useState(branchDay(followUp.scheduledAt));
  const [time, setTime] = useState(cairoTime(followUp.scheduledAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      await followUpRepository.reschedule(followUp.id, branchDateTimeToIso(date, time));
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذر تعديل الموعد. حاول مرة أخرى.");
    } finally { setSaving(false); }
  }

  return <ModalOverlay label="تأجيل المتابعة" onClose={onClose} className="flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl dark:bg-stone-900 sm:rounded-2xl">
      <h2 className="text-lg font-bold">تأجيل المتابعة</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-stone-300">اختر الموعد الجديد بتوقيت القاهرة. لن يتغير موضوع المتابعة.</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">التاريخ<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:border-stone-700 dark:bg-stone-800" /></label>
        <label className="text-sm font-semibold">الوقت<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:border-stone-700 dark:bg-stone-800" /></label>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-bold text-white disabled:opacity-60">{saving ? "جاري الحفظ…" : "حفظ الموعد"}</button>
        <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-xl border px-4 text-sm font-semibold dark:border-stone-700">إلغاء</button>
      </div>
    </form>
  </ModalOverlay>;
}
