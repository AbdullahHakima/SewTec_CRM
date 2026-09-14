"use client";
export function ListStatus({ page, setPage, totalCount, pageSize, error, isLoading, retry }: { page: number; setPage: (page: number) => void; totalCount: number; pageSize: number; error: string; isLoading: boolean; retry: () => void }) {
  if (error) return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}<button onClick={retry} className="underline">إعادة المحاولة</button></div>;
  return <div className="flex items-center justify-between gap-3 text-sm" aria-live="polite">
    <span>{isLoading ? "جاري التحميل…" : `${totalCount} نتيجة`}</span>
    {totalCount > pageSize && <div className="flex items-center gap-3">
      <button disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">السابق</button>
      <span>{page} / {Math.ceil(totalCount / pageSize)}</span>
      <button disabled={page * pageSize >= totalCount || isLoading} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">التالي</button>
    </div>}
  </div>;
}
