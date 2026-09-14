import { HttpFollowUpRepository } from "../http/http-follow-up.repository";
import { crmStore } from "@/lib/storage/crm-store";
import { FollowUp } from "@/types/crm";
import {
  CreateFollowUpInput,
  FollowUpQuery,
  IFollowUpRepository,
} from "@/features/follow-ups/repositories/follow-up.repository";
import { isOverdue } from "@/lib/dates/branch-time";
import { isToday } from "date-fns";
import { apiClient } from "@/infrastructure/http/api-client";

export class LocalStorageFollowUpRepository implements IFollowUpRepository {
  async getAll(query?: FollowUpQuery): Promise<FollowUp[]> {
    let list = crmStore.getSnapshot().followUps;

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

    // Sort scheduled items by scheduledAt ascending
    return list.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }

  async getById(id: string): Promise<FollowUp | null> {
    const found = crmStore.getSnapshot().followUps.find((f) => f.id === id);
    return found ? structuredClone(found) : null;
  }

  async getByCustomerId(customerId: string): Promise<FollowUp[]> {
    return crmStore
      .getSnapshot()
      .followUps.filter((f) => f.customerId === customerId);
  }

  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    if (typeof window !== "undefined" && apiClient.getToken()) {
      try {
        const created = await apiClient.post<FollowUp>("/follow-ups", input);
        crmStore.update((state) => {
          const idx = state.followUps.findIndex((f) => f.id === created.id);
          if (idx === -1) {
            state.followUps.unshift(created);
          } else {
            state.followUps[idx] = created;
          }
          const customer = state.customers.find((c) => c.id === input.customerId);
          if (customer) {
            customer.nextFollowUpAt = input.scheduledAt;
          }
        });
        return created;
      } catch (err) {
        console.warn("Backend request failed, falling back to local store", err);
      }
    }

    const newFollowUp: FollowUp = {
      id: `fu_${Date.now()}`,
      branchId: "mahalla",
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      topic: input.topic,
      status: "scheduled",
      assignedRepId: input.assignedRepId,
      assignedRepName: input.assignedRepName,
    };

    crmStore.update((state) => {
      state.followUps.unshift(newFollowUp);
      // Update customer nextFollowUpAt
      const customer = state.customers.find((c) => c.id === input.customerId);
      if (customer) {
        customer.nextFollowUpAt = input.scheduledAt;
      }
    });

    return newFollowUp;
  }

  async reschedule(id: string, newScheduledAt: string): Promise<FollowUp> {
    if (typeof window !== "undefined" && apiClient.getToken()) {
      try {
        const updated = await apiClient.patch<FollowUp>(`/follow-ups/${id}/reschedule`, {
          newScheduledAt,
        });
        crmStore.update((state) => {
          const fu = state.followUps.find((f) => f.id === id);
          if (fu) {
            fu.scheduledAt = newScheduledAt;
            const customer = state.customers.find(
              (c) => c.id === fu.customerId
            );
            if (customer) {
              customer.nextFollowUpAt = newScheduledAt;
            }
          }
        });
        return updated;
      } catch (err) {
        console.warn("Backend request failed, falling back to local store", err);
      }
    }

    let updated: FollowUp | null = null;

    crmStore.update((state) => {
      const followUp = state.followUps.find((f) => f.id === id);
      if (followUp) {
        followUp.scheduledAt = newScheduledAt;
        updated = followUp;

        const customer = state.customers.find(
          (c) => c.id === followUp.customerId
        );
        if (customer) {
          customer.nextFollowUpAt = newScheduledAt;
        }
      }
    });

    if (!updated) {
      throw new Error(`FollowUp with id ${id} not found`);
    }

    return updated;
  }
}

export const followUpRepository = typeof window === "undefined" ? new LocalStorageFollowUpRepository() : new HttpFollowUpRepository();
