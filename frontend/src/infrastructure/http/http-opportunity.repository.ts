import { Opportunity, OpportunityStage } from "@/types/crm";
import {
  CreateOpportunityInput,
  IOpportunityRepository,
  OpportunityQuery,
  UpdateOpportunityInput,
} from "@/features/opportunities/repositories/opportunity.repository";
import { apiClient } from "./api-client";
import { crmStore } from "@/lib/storage/crm-store";

export class HttpOpportunityRepository implements IOpportunityRepository {
  async getAll(query?: OpportunityQuery): Promise<Opportunity[]> {
    try {
      const opps = await apiClient.get<import("./api-client").PageResult<Opportunity>>("/opportunities", {
        stage: query?.stage,
        customerId: query?.customerId,
        assignedRepId: query?.assignedRepId,
      });

      crmStore.update((state) => {
        state.opportunities = opps.items;
      });

      return opps.items;
    } catch (err) { throw err;
    }
  }

  async getById(id: string): Promise<Opportunity | null> {
    try {
      const opp = await apiClient.get<Opportunity>(`/opportunities/${id}`);
      crmStore.update((state) => {
        const idx = state.opportunities.findIndex((o) => o.id === id);
        if (idx !== -1) {
          state.opportunities[idx] = opp;
        } else {
          state.opportunities.push(opp);
        }
      });
      return opp;
    } catch (err) { throw err;
    }
  }

  async getByCustomerId(customerId: string): Promise<Opportunity[]> {
    try {
      const opps = await apiClient.get<Opportunity[]>(`/opportunities/customer/${customerId}`);
      return opps;
    } catch (err) { throw err;
    }
  }

  async create(input: CreateOpportunityInput): Promise<Opportunity> {
    try {
      const created = await apiClient.post<Opportunity>("/opportunities", input);
      await crmStore.syncWithBackend().catch(() => false);
      return created;
    } catch (err) { throw err;
    }
  }

  async updateStage(
    id: string,
    stage: OpportunityStage,
    note?: string
  ): Promise<Opportunity> {
    try {
      const updated = await apiClient.patch<Opportunity>(`/opportunities/${id}/stage`, {
        stage,
        note,
      });

      await crmStore.syncWithBackend().catch(() => false);

      return updated;
    } catch (err) { throw err;
    }
  }

  async update(id: string, input: UpdateOpportunityInput): Promise<Opportunity> {
    try {
      const updated = await apiClient.put<Opportunity>(`/opportunities/${id}`, input);
      await crmStore.syncWithBackend().catch(() => false);
      return updated;
    } catch (err) { throw err;
    }
  }
}

export const opportunityRepository = new HttpOpportunityRepository();
