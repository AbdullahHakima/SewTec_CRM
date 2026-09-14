import { crmStore } from "@/lib/storage/crm-store";
import {
  FollowUp,
  FollowUpChannel,
  Interaction,
  InteractionOutcome,
} from "@/types/crm";
import { getTomorrowMorningIso } from "@/lib/dates/branch-time";
import { apiClient } from "@/infrastructure/http/api-client";

export interface CompleteFollowUpParams {
  followUpId: string;
  outcome: InteractionOutcome;
  outcomeNote?: string;
  uninterestedReason?: string;
  nextFollowUp?: {
    scheduledAt: string;
    channel: FollowUpChannel;
    topic: string;
  };
}

export class FollowUpService {
  static async completeFollowUp(params: CompleteFollowUpParams): Promise<{
    followUp: FollowUp;
    interaction: Interaction;
    nextFollowUp?: FollowUp;
  }> {
    if (typeof window !== "undefined") {
      const result = await apiClient.post<{followUp: FollowUp; interaction: Interaction; nextFollowUp?: FollowUp}>(`/follow-ups/${params.followUpId}/complete`, params);
      await crmStore.syncWithBackend();
      await crmStore.refreshCustomer(result.followUp.customerId);
      return result;
    }
    const now = new Date().toISOString();
    let completedFollowUp: FollowUp | null = null;
    let createdInteraction: Interaction | null = null;
    let createdNextFollowUp: FollowUp | undefined = undefined;

    crmStore.update((state) => {
      const fu = state.followUps.find((f) => f.id === params.followUpId);
      if (!fu) {
        throw new Error(`FollowUp ${params.followUpId} not found`);
      }

      // 1. Mark current follow-up completed
      fu.status = "completed";
      fu.completedAt = now;
      fu.outcome = params.outcome;
      fu.outcomeNote = params.outcomeNote;
      completedFollowUp = fu;

      // 2. Create Interaction
      const interactionId = `int_${Date.now()}`;
      const interaction: Interaction = {
        id: interactionId,
        customerId: fu.customerId,
        customerName: fu.customerName,
        channel: fu.channel,
        outcome: params.outcome,
        summary:
          params.outcomeNote ||
          (params.outcome === "no_answer"
            ? "محاولة تواصل — لم يرد العميل"
            : "تم التواصل بنجاح"),
        uninterestedReason: params.uninterestedReason,
        performedBy: fu.assignedRepName,
        occurredAt: now,
        followUpId: fu.id,
      };
      state.interactions.unshift(interaction);
      createdInteraction = interaction;

      // 3. Create Timeline Activity
      state.activities.unshift({
        id: `act_${Date.now()}`,
        customerId: fu.customerId,
        type: "followup_completed",
        title: `إنجاز متابعة: ${fu.topic}`,
        description: interaction.summary,
        occurredAt: now,
        performedBy: fu.assignedRepName,
        metadata: {
          channel: fu.channel,
          outcome: params.outcome,
        },
      });

      // 4. Update Customer lastContactAt
      const customer = state.customers.find((c) => c.id === fu.customerId);
      if (customer) {
        customer.lastContactAt = now;
      }

      // 5. Handle Next Follow-Up
      let nextSchedule = params.nextFollowUp;
      if (!nextSchedule && params.outcome === "no_answer") {
        nextSchedule = {
          scheduledAt: getTomorrowMorningIso(11, 0),
          channel: fu.channel,
          topic: `إعادة محاولة اتصال (لم يرد سابقاً): ${fu.topic}`,
        };
      }

      if (nextSchedule) {
        const nextFuId = `fu_${Date.now() + 1}`;
        const newFu: FollowUp = {
          id: nextFuId,
          branchId: "mahalla",
          customerId: fu.customerId,
          customerName: fu.customerName,
          customerPhone: fu.customerPhone,
          channel: nextSchedule.channel,
          scheduledAt: nextSchedule.scheduledAt,
          topic: nextSchedule.topic,
          status: "scheduled",
          assignedRepId: fu.assignedRepId,
          assignedRepName: fu.assignedRepName,
        };
        state.followUps.unshift(newFu);
        fu.nextFollowUpId = nextFuId;
        createdNextFollowUp = newFu;

        if (customer) {
          customer.nextFollowUpAt = nextSchedule.scheduledAt;
        }
      }
    });

    if (!completedFollowUp || !createdInteraction) {
      throw new Error("Failed to complete follow up");
    }

    // Sync to backend asynchronously if online & authenticated

    return {
      followUp: completedFollowUp,
      interaction: createdInteraction,
      nextFollowUp: createdNextFollowUp,
    };
  }
}
