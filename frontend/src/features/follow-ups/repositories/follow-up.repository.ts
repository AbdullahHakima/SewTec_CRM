import { FollowUp, FollowUpChannel, InteractionOutcome } from "@/types/crm";

export interface FollowUpQuery {
  view?: "today" | "overdue" | "upcoming" | "completed";
  customerId?: string;
  assignedRepId?: string;
}

export interface CreateFollowUpInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: FollowUpChannel;
  scheduledAt: string;
  topic: string;
  assignedRepId: string;
  assignedRepName: string;
}

export interface CompleteFollowUpInput {
  outcome: InteractionOutcome;
  outcomeNote?: string;
  uninterestedReason?: string;
  nextFollowUp?: {
    scheduledAt: string;
    channel: FollowUpChannel;
    topic: string;
  };
}

export interface IFollowUpRepository {
  getAll(query?: FollowUpQuery): Promise<FollowUp[]>;
  getById(id: string): Promise<FollowUp | null>;
  getByCustomerId(customerId: string): Promise<FollowUp[]>;
  create(input: CreateFollowUpInput): Promise<FollowUp>;
  reschedule(id: string, newScheduledAt: string): Promise<FollowUp>;
}
