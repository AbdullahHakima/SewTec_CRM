import { FollowUp } from "@/types/crm";
import {
  CreateFollowUpInput,
  FollowUpQuery,
  IFollowUpRepository,
} from "@/features/follow-ups/repositories/follow-up.repository";
import { apiClient } from "./api-client";
import { crmStore } from "@/lib/storage/crm-store";

export class HttpFollowUpRepository implements IFollowUpRepository {
  async getAll(query?: FollowUpQuery): Promise<FollowUp[]> {
    try {
      const followUps = await apiClient.get<import("./api-client").PageResult<FollowUp>>("/follow-ups", {
        view: query?.view,
        customerId: query?.customerId,
        assignedRepId: query?.assignedRepId,
      });

      crmStore.update((state) => {
        state.followUps = followUps.items;
      });

      return followUps.items;
    } catch (err) { throw err;
    }
  }

  async getById(id: string): Promise<FollowUp | null> {
    try {
      const fu = await apiClient.get<FollowUp>(`/follow-ups/${id}`);
      crmStore.update((state) => {
        const idx = state.followUps.findIndex((f) => f.id === id);
        if (idx !== -1) {
          state.followUps[idx] = fu;
        } else {
          state.followUps.push(fu);
        }
      });
      return fu;
    } catch (err) { throw err;
    }
  }

  async getByCustomerId(customerId: string): Promise<FollowUp[]> {
    try {
      const list = await apiClient.get<FollowUp[]>(`/follow-ups/customer/${customerId}`);
      return list;
    } catch (err) { throw err;
    }
  }

  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    try {
      const created = await apiClient.post<FollowUp>("/follow-ups", input);
      await crmStore.syncWithBackend().catch(() => false);
      return created;
    } catch (err) { throw err;
    }
  }

  async reschedule(id: string, newScheduledAt: string): Promise<FollowUp> {
    try {
      const updated = await apiClient.patch<FollowUp>(`/follow-ups/${id}/reschedule`, {
        newScheduledAt,
      });
      await crmStore.syncWithBackend().catch(() => false);
      return updated;
    } catch (err) { throw err;
    }
  }
}

export const followUpRepository = new HttpFollowUpRepository();
