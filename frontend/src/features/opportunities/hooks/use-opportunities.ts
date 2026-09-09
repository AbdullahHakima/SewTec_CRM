"use client";

import { useSyncExternalStore, useMemo } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { OpportunityQuery } from "@/features/opportunities/repositories/opportunity.repository";

export function useOpportunities(query?: OpportunityQuery) {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);

  const opportunities = useMemo(() => {
    let list = state.opportunities;

    if (query?.customerId) {
      list = list.filter((op) => op.customerId === query.customerId);
    }

    if (query?.assignedRepId && query.assignedRepId !== "all") {
      list = list.filter((op) => op.assignedRepId === query.assignedRepId);
    }

    if (query?.stage) {
      if (query.stage === "active") {
        list = list.filter((op) => op.stage !== "won" && op.stage !== "lost");
      } else if (query.stage !== "all") {
        list = list.filter((op) => op.stage === query.stage);
      }
    }

    return list;
  }, [state.opportunities, query?.customerId, query?.assignedRepId, query?.stage]);

  const stats = useMemo(() => {
    const active = state.opportunities.filter(
      (o) => o.stage !== "won" && o.stage !== "lost"
    );
    const totalActiveValue = active.reduce(
      (sum, o) => sum + (o.estimatedValue || 0),
      0
    );

    const won = state.opportunities.filter((o) => o.stage === "won");
    const totalWonValue = won.reduce(
      (sum, o) => sum + (o.estimatedValue || 0),
      0
    );

    const lost = state.opportunities.filter((o) => o.stage === "lost");

    const stageCounts: Record<OpportunityStage, { count: number; totalValue: number }> = {
      new: { count: 0, totalValue: 0 },
      contacted: { count: 0, totalValue: 0 },
      interested: { count: 0, totalValue: 0 },
      quotation: { count: 0, totalValue: 0 },
      negotiation: { count: 0, totalValue: 0 },
      won: { count: 0, totalValue: 0 },
      lost: { count: 0, totalValue: 0 },
    };

    state.opportunities.forEach((o) => {
      stageCounts[o.stage].count += 1;
      stageCounts[o.stage].totalValue += o.estimatedValue || 0;
    });

    return {
      activeCount: active.length,
      totalActiveValue,
      wonCount: won.length,
      totalWonValue,
      lostCount: lost.length,
      stageCounts,
    };
  }, [state.opportunities]);

  return {
    opportunities,
    stats,
    isLoading: false,
  };
}
