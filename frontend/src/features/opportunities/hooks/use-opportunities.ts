"use client";
import { Opportunity, OpportunityStage } from "@/types/crm";
import { OpportunityQuery } from "../repositories/opportunity.repository";
import { useApiPage } from "@/infrastructure/http/use-api-page";
interface Stats { activeCount: number; totalActiveValue: number; wonCount: number; totalWonValue: number; lostCount: number; stageCounts: Record<OpportunityStage, {count: number; totalValue: number}> }
const emptyStats: Stats = { activeCount: 0, totalActiveValue: 0, wonCount: 0, totalWonValue: 0, lostCount: 0, stageCounts: Object.fromEntries(["new", "contacted", "interested", "quotation", "negotiation", "won", "lost"].map(s => [s, {count: 0, totalValue: 0}])) as Stats["stageCounts"] };
export function useOpportunities(query?: OpportunityQuery) {
  const result = useApiPage<Opportunity, Stats>("/opportunities", {...query}, emptyStats);
  return { ...result, opportunities: result.items, stats: result.summary };
}
