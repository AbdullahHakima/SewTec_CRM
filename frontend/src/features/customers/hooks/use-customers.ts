"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { Customer } from "@/types/crm";
import { CustomerQuery } from "../repositories/customer.repository";
import { useApiPage, DATA_EVENT } from "@/infrastructure/http/use-api-page";
export function useCustomers(query?: CustomerQuery) {
  const result = useApiPage<Customer, {typeCounts: Record<string, number>; all: number}>("/customers", { ...query }, { typeCounts: {}, all: 0 });
  return { ...result, customers: result.items };
}
export function useCustomer(id: string) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot, crmStore.getSnapshot);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => { setLoading(true); crmStore.refreshCustomer(id).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); }); };
    load(); window.addEventListener(DATA_EVENT, load);
    return () => { active = false; window.removeEventListener(DATA_EVENT, load); };
  }, [id]);
  return { customer: state.customers.find(c => c.id === id) ?? null, isLoading, error };
}
