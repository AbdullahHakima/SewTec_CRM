"use client";

import { useSyncExternalStore, useMemo } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { FollowUp } from "@/types/crm";
import { FollowUpQuery } from "@/features/follow-ups/repositories/follow-up.repository";
import { isOverdue } from "@/lib/dates/branch-time";
import { isToday } from "date-fns";

export function useFollowUps(query?: FollowUpQuery) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);

  const followUps = useMemo(() => {
    let list = state.followUps;

    if (query?.customerId) {
      list = list.filter((f) => f.customerId === query.customerId);
    }

    if (query?.assignedRepId && query.assignedRepId !== "all") {
      list = list.filter((f) => f.assignedRepId === query.assignedRepId);
    }

    if (query?.view) {
      switch (query.view) {
        case "today":
          list = list.filter(
            (f) => f.status === "scheduled" && isToday(new Date(f.scheduledAt))
          );
          break;
        case "overdue":
          list = list.filter(
            (f) =>
              f.status === "scheduled" &&
              isOverdue(f.scheduledAt) &&
              !isToday(new Date(f.scheduledAt))
          );
          break;
        case "upcoming":
          list = list.filter(
            (f) =>
              f.status === "scheduled" &&
              !isOverdue(f.scheduledAt) &&
              !isToday(new Date(f.scheduledAt))
          );
          break;
        case "completed":
          list = list.filter((f) => f.status === "completed");
          break;
      }
    }

    return list.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [state.followUps, query?.customerId, query?.assignedRepId, query?.view]);

  const counts = useMemo(() => {
    const today = state.followUps.filter(
      (f) => f.status === "scheduled" && isToday(new Date(f.scheduledAt))
    ).length;

    const overdue = state.followUps.filter(
      (f) =>
        f.status === "scheduled" &&
        isOverdue(f.scheduledAt) &&
        !isToday(new Date(f.scheduledAt))
    ).length;

    const upcoming = state.followUps.filter(
      (f) =>
        f.status === "scheduled" &&
        !isOverdue(f.scheduledAt) &&
        !isToday(new Date(f.scheduledAt))
    ).length;

    const completed = state.followUps.filter((f) => f.status === "completed").length;

    return { today, overdue, upcoming, completed };
  }, [state.followUps]);

  return {
    followUps,
    counts,
    isLoading: false,
  };
}
