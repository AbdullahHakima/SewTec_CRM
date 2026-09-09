"use client";

import { useSyncExternalStore, useMemo } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { Customer } from "@/types/crm";
import { CustomerQuery } from "@/features/customers/repositories/customer.repository";
import { isCustomerStale } from "@/lib/dates/branch-time";

export function useCustomers(query?: CustomerQuery) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);
  const type = query?.type;
  const assignedRepId = query?.assignedRepId;
  const search = query?.search;
  const isStale = query?.isStale;

  const customers = useMemo(() => {
    let list = state.customers;

    if (type && type !== "all") {
      list = list.filter((c) => c.type === type);
    }

    if (assignedRepId && assignedRepId !== "all") {
      list = list.filter((c) => c.assignedRepId === assignedRepId);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          c.installedMachines.some((m) => m.model.toLowerCase().includes(q))
      );
    }

    if (isStale) {
      list = list.filter((c) => isCustomerStale(c.lastContactAt, c.isVip));
    }

    return list;
  }, [state.customers, type, assignedRepId, search, isStale]);

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
