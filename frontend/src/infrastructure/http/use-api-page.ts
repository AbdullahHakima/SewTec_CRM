"use client";
import { useEffect, useState } from "react";
import { apiClient, PageResult, SESSION_EVENT } from "./api-client";

export const DATA_EVENT = "sewtec-data-change";
export function useApiPage<T, S>(endpoint: string, params: Record<string, string | number | boolean | undefined>, emptySummary: S) {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<(PageResult<T> & { summary?: S }) | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(params);
  const [previousKey, setPreviousKey] = useState(queryKey);
  if (previousKey !== queryKey) { setPreviousKey(queryKey); setPage(1); }
  useEffect(() => {
    const reload = () => setRefresh(n => n + 1);
    const clear = () => { setData(null); reload(); };
    window.addEventListener(DATA_EVENT, reload); window.addEventListener(SESSION_EVENT, clear);
    return () => { window.removeEventListener(DATA_EVENT, reload); window.removeEventListener(SESSION_EVENT, clear); };
  }, []);
  useEffect(() => {
    let active = true;
    const parsedQuery = JSON.parse(queryKey);
    // Debounce text searches, but never delay the first page or simple filters.
    const delay = typeof parsedQuery.search === "string" && parsedQuery.search.trim() ? 200 : 0;
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      apiClient.get<PageResult<T> & { summary?: S }>(endpoint, { ...parsedQuery, page, pageSize: 50 })
        .then(value => { if (active) setData(value); })
        .catch(error => { if (active) { setData(null); setError(error instanceof Error ? error.message : "تعذر تحميل البيانات."); } })
        .finally(() => { if (active) setLoading(false); });
    }, delay);
    return () => { active = false; clearTimeout(timer); };
  }, [endpoint, queryKey, page, refresh]);
  return { items: data?.items ?? [], totalCount: data?.totalCount ?? 0, summary: data?.summary ?? emptySummary, page, setPage, pageSize: 50, isLoading: loading, error, retry: () => setRefresh(n => n + 1) };
}
