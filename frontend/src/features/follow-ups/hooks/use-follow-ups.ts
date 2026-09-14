"use client";
import { FollowUp } from "@/types/crm";
import { FollowUpQuery } from "../repositories/follow-up.repository";
import { useApiPage } from "@/infrastructure/http/use-api-page";
export function useFollowUps(query?: FollowUpQuery) {
  const result = useApiPage<FollowUp, {today: number; overdue: number; upcoming: number; completed: number; completedToday: number}>("/follow-ups", {...query}, {today: 0, overdue: 0, upcoming: 0, completed: 0, completedToday: 0});
  return { ...result, followUps: result.items, counts: result.summary };
}
