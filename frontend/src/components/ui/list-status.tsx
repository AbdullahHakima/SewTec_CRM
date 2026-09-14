"use client";

import { AlertCircle, ChevronRight, ChevronLeft, Loader2, RotateCcw } from "lucide-react";

export function ListStatus({
  page,
  setPage,
  totalCount,
  pageSize,
  error,
  isLoading,
  retry,
}: {
  page: number;
  setPage: (page: number) => void;
  totalCount: number;
  pageSize: number;
  error: string;
  isLoading: boolean;
  retry: () => void;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
        <button
          onClick={retry}
          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
        >
          <RotateCcw className="h-3 w-3" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  // If loading and no pagination yet, show subtle loading bar
  if (isLoading && totalCount <= pageSize) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-slate-500 dark:text-stone-400" aria-live="polite">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
        <span>جاري التحميل والتحديث…</span>
      </div>
    );
  }

  // Only render pagination toolbar when items exceed single page
  if (totalCount > pageSize) {
    const totalPages = Math.ceil(totalCount / pageSize);
    return (
      <nav
        aria-label="التنقل بين الصفحات"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-xs dark:border-stone-800 dark:bg-stone-900 shadow-2xs"
      >
        <span className="text-slate-500 dark:text-stone-400">
          إجمالي <strong className="font-bold text-slate-800 dark:text-stone-200">{totalCount}</strong> نتيجة (صفحة {page} من {totalPages})
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(page - 1)}
            aria-label="الصفحة السابقة"
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 transition"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <span>السابق</span>
          </button>
          <span className="px-2 font-mono font-bold text-slate-900 dark:text-white">
            {page} / {totalPages}
          </span>
          <button
            disabled={page * pageSize >= totalCount || isLoading}
            onClick={() => setPage(page + 1)}
            aria-label="الصفحة التالية"
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 transition"
          >
            <span>التالي</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
    );
  }

  return null;
}
