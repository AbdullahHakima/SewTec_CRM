"use client";

import { useSyncExternalStore, useMemo } from "react";
import { crmStore } from "@/lib/storage/crm-store";

export function useCustomerTimeline(customerId: string) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);

  const activities = useMemo(() => {
    return state.activities
      .filter((act) => act.customerId === customerId)
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
  }, [state.activities, customerId]);

  const interactions = useMemo(() => {
    return state.interactions
      .filter((int) => int.customerId === customerId)
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
  }, [state.interactions, customerId]);

  return {
    activities,
    interactions,
    isLoading: false,
  };
}
