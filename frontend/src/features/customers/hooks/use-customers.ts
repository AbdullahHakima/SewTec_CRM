"use client";

import { useSyncExternalStore, useMemo } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { Customer, CustomerType } from "@/types/crm";
import { CustomerQuery } from "@/features/customers/repositories/customer.repository";
import { isCustomerStale } from "@/lib/dates/branch-time";

export function useCustomers(query?: CustomerQuery) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);

  const customers = useMemo(() => {
    let list = state.customers;

    if (query?.type && query.type !== "all") {
      list = list.filter((c) => c.type === query.type);
    }

    if (query?.assignedRepId && query.assignedRepId !== "all") {
      list = list.filter((c) => c.assignedRepId === query.assignedRepId);
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          c.installedMachines.some((m) => m.model.toLowerCase().includes(q))
      );
    }

    if (query?.isStale) {
      list = list.filter((c) => isCustomerStale(c.lastContactAt, c.isVip));
    }

    return list;
  }, [state.customers, query?.type, query?.assignedRepId, query?.search, query?.isStale]);

  return {
    customers,
    totalCount: state.customers.length,
    isLoading: false,
  };
}

export function useCustomer(id: string): {
  customer: Customer | null;
  isLoading: boolean;
} {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);
  const customer = useMemo(() => {
    return state.customers.find((c) => c.id === id) || null;
  }, [state.customers, id]);

  return {
    customer,
    isLoading: false,
  };
}
