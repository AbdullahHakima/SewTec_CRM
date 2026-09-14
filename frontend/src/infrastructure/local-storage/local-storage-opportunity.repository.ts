import { HttpOpportunityRepository } from "../http/http-opportunity.repository";
import { crmStore } from "@/lib/storage/crm-store";
import { Opportunity, OpportunityStage } from "@/types/crm";
import {
  CreateOpportunityInput,
  IOpportunityRepository,
  OpportunityQuery,
  UpdateOpportunityInput,
} from "@/features/opportunities/repositories/opportunity.repository";
import { apiClient } from "@/infrastructure/http/api-client";

export class LocalStorageOpportunityRepository implements IOpportunityRepository {
  async getAll(query?: OpportunityQuery): Promise<Opportunity[]> {
    let list = crmStore.getSnapshot().opportunities;

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
  }

  async getById(id: string): Promise<Opportunity | null> {
    const found = crmStore
      .getSnapshot()
      .opportunities.find((op) => op.id === id);
    return found ? structuredClone(found) : null;
  }

  async getByCustomerId(customerId: string): Promise<Opportunity[]> {
    return crmStore
      .getSnapshot()
      .opportunities.filter((op) => op.customerId === customerId);
  }

  async create(input: CreateOpportunityInput): Promise<Opportunity> {
    if (typeof window !== "undefined" && apiClient.getToken()) {
      try {
        const created = await apiClient.post<Opportunity>("/opportunities", input);
        crmStore.update((state) => {
          const idx = state.opportunities.findIndex((o) => o.id === created.id);
          if (idx === -1) {
            state.opportunities.unshift(created);
          } else {
            state.opportunities[idx] = created;
          }

          const customer = state.customers.find((c) => c.id === input.customerId);
          if (customer && created.estimatedValue) {
            customer.openPipelineValue = (customer.openPipelineValue || 0) + created.estimatedValue;
          }
        });
        return created;
      } catch (err) {
        console.warn("Backend request failed, falling back to local store", err);
      }
    }

    const newOpportunity: Opportunity = {
      id: `op_${Date.now()}`,
      branchId: "mahalla",
      customerId: input.customerId,
      customerName: input.customerName,
      title: input.title,
      machineModel: input.machineModel,
      quantity: input.quantity,
      estimatedValue: input.estimatedValue,
      stage: input.stage || "new",
      stageUpdatedAt: new Date().toISOString(),
      assignedRepId: input.assignedRepId,
      assignedRepName: input.assignedRepName,
      expectedCloseDate: input.expectedCloseDate,
      quotationRef: input.quotationRef,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    crmStore.update((state) => {
      state.opportunities.unshift(newOpportunity);

      // Recalculate customer open pipeline value
      const customer = state.customers.find((c) => c.id === input.customerId);
      if (customer && newOpportunity.estimatedValue) {
        customer.openPipelineValue = (customer.openPipelineValue || 0) + newOpportunity.estimatedValue;
      }

      // Add Activity entry
      state.activities.unshift({
        id: `act_${Date.now()}`,
        customerId: input.customerId,
        type: "stage_change",
        title: `إنشاء فرصة جديدة: ${input.title}`,
        description: `ماكينة ${input.machineModel} (عدد ${input.quantity}) — مرحلة: جديد`,
        occurredAt: new Date().toISOString(),
        performedBy: input.assignedRepName,
        metadata: {
          machineModel: input.machineModel,
          amount: input.estimatedValue,
        },
      });
    });

    return newOpportunity;
  }

  async updateStage(
    id: string,
    stage: OpportunityStage,
    note?: string
  ): Promise<Opportunity> {
    if (typeof window !== "undefined" && apiClient.getToken()) {
      try {
        const updated = await apiClient.patch<Opportunity>(`/opportunities/${id}/stage`, {
          stage,
          note,
        });

        crmStore.update((state) => {
          const idx = state.opportunities.findIndex((o) => o.id === id);
          if (idx !== -1) {
            const prev = state.opportunities[idx];
            state.opportunities[idx] = updated;

            const customer = state.customers.find((c) => c.id === updated.customerId);
            if (customer && updated.estimatedValue) {
              if (stage === "won" && prev.stage !== "won") {
                customer.lifetimeSales = (customer.lifetimeSales || 0) + updated.estimatedValue;
                customer.openPipelineValue = Math.max(0, (customer.openPipelineValue || 0) - updated.estimatedValue);
              } else if (prev.stage === "won" && stage !== "won") {
                customer.lifetimeSales = Math.max(0, (customer.lifetimeSales || 0) - updated.estimatedValue);
                customer.openPipelineValue = (customer.openPipelineValue || 0) + updated.estimatedValue;
              } else if (stage === "lost" && prev.stage !== "lost") {
                customer.openPipelineValue = Math.max(0, (customer.openPipelineValue || 0) - updated.estimatedValue);
              } else if (prev.stage === "lost" && stage !== "lost") {
                customer.openPipelineValue = (customer.openPipelineValue || 0) + updated.estimatedValue;
              }
            }
          }
        });
        return updated;
      } catch (err) {
        console.warn("Backend request failed, falling back to local store", err);
      }
    }

    let updated: Opportunity | null = null;

    crmStore.update((state) => {
      const opp = state.opportunities.find((o) => o.id === id);
      if (opp) {
        const prevStage = opp.stage;
        opp.stage = stage;
        opp.stageUpdatedAt = new Date().toISOString();
        if (note) {
          opp.notes = opp.notes ? `${opp.notes}\n${note}` : note;
        }
        updated = opp;

        // If won, adjust lifetime sales
        if (stage === "won" && prevStage !== "won" && opp.estimatedValue) {
          const customer = state.customers.find((c) => c.id === opp.customerId);
          if (customer) {
            customer.lifetimeSales += opp.estimatedValue;
            customer.openPipelineValue = Math.max(
              0,
              (customer.openPipelineValue || 0) - opp.estimatedValue
            );
          }
        }

        // Add Activity record
        state.activities.unshift({
          id: `act_${Date.now()}`,
          customerId: opp.customerId,
          type: "stage_change",
          title: `تحديث مرحلة الصفقة: ${opp.title}`,
          description: `تم نقل الصفقة إلى مرحلة (${stage})${note ? ` — ملاحظة: ${note}` : ""}`,
          occurredAt: new Date().toISOString(),
          performedBy: opp.assignedRepName,
          metadata: {
            opportunityId: opp.id,
            machineModel: opp.machineModel,
            amount: opp.estimatedValue,
          },
        });
      }
    });

    if (!updated) {
      throw new Error(`Opportunity with id ${id} not found`);
    }

    return updated;
  }

  async update(id: string, input: UpdateOpportunityInput): Promise<Opportunity> {
    if (typeof window !== "undefined" && apiClient.getToken()) {
      try {
        const updated = await apiClient.put<Opportunity>(`/opportunities/${id}`, input);
        crmStore.update((state) => {
          const idx = state.opportunities.findIndex((o) => o.id === id);
          if (idx !== -1) {
            state.opportunities[idx] = updated;
          }
        });
        return updated;
      } catch (err) {
        console.warn("Backend request failed, falling back to local store", err);
      }
    }

    let updated: Opportunity | null = null;

    crmStore.update((state) => {
      const opp = state.opportunities.find((o) => o.id === id);
      if (opp) {
        Object.assign(opp, input);
        updated = opp;
      }
    });

    if (!updated) {
      throw new Error(`Opportunity with id ${id} not found`);
    }

    return updated;
  }
}

export const opportunityRepository = typeof window === "undefined" ? new LocalStorageOpportunityRepository() : new HttpOpportunityRepository();
