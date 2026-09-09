import { Opportunity, OpportunityStage } from "@/types/crm";

export interface OpportunityQuery {
  stage?: OpportunityStage | "active" | "all";
  customerId?: string;
  assignedRepId?: string;
}

export interface CreateOpportunityInput {
  customerId: string;
  customerName: string;
  title: string;
  machineModel: string;
  quantity: number;
  estimatedValue?: number;
  stage?: OpportunityStage;
  assignedRepId: string;
  assignedRepName: string;
  expectedCloseDate?: string;
  quotationRef?: string;
  notes?: string;
}

export interface UpdateOpportunityInput {
  title?: string;
  machineModel?: string;
  quantity?: number;
  estimatedValue?: number;
  stage?: OpportunityStage;
  expectedCloseDate?: string;
  quotationRef?: string;
  notes?: string;
}

export interface IOpportunityRepository {
  getAll(query?: OpportunityQuery): Promise<Opportunity[]>;
  getById(id: string): Promise<Opportunity | null>;
  getByCustomerId(customerId: string): Promise<Opportunity[]>;
  create(input: CreateOpportunityInput): Promise<Opportunity>;
  updateStage(id: string, stage: OpportunityStage, note?: string): Promise<Opportunity>;
  update(id: string, input: UpdateOpportunityInput): Promise<Opportunity>;
}
