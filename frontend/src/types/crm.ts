export type CustomerType = "factory" | "workshop" | "trader" | "individual";
export type CustomerStatus = "active" | "dormant" | "inactive";

export interface InstalledMachine {
  model: string;
  quantity: number;
  serialNumber?: string;
  purchaseYear: number;
  purchasedFromSewTec: boolean;
}

export interface Customer {
  revision?: string;
  id: string;
  branchId: "mahalla";
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  isVip: boolean;
  phone: string;
  phoneSecondary?: string;
  contactPerson?: string;
  address: string;
  city: string;
  assignedRepId: string;
  assignedRepName: string;
  lifetimeSales: number;
  openPipelineValue: number;
  lastContactAt: string; // ISO
  nextFollowUpAt?: string; // ISO
  installedMachines: InstalledMachine[];
  notes?: string;
  createdAt: string;
}

export type OpportunityStage =
  | "new"
  | "contacted"
  | "interested"
  | "quotation"
  | "negotiation"
  | "won"
  | "lost";

export interface Opportunity {
  revision?: string;
  id: string;
  branchId: "mahalla";
  customerId: string;
  customerName: string;
  title: string;
  machineModel: string;
  quantity: number;
  estimatedValue?: number;
  stage: OpportunityStage;
  stageUpdatedAt: string; // ISO
  assignedRepId: string;
  assignedRepName: string;
  expectedCloseDate?: string;
  quotationRef?: string;
  notes?: string;
  createdAt: string;
}

export type FollowUpStatus = "scheduled" | "completed" | "missed" | "cancelled";
export type FollowUpChannel = "call" | "visit" | "whatsapp" | "email";

export type InteractionChannel = "call" | "visit" | "whatsapp" | "email" | "note";
export type InteractionOutcome =
  | "interested"
  | "quotation_requested"
  | "needs_time"
  | "no_answer"
  | "not_interested";

export interface FollowUp {
  revision?: string;
  id: string;
  branchId: "mahalla";
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: FollowUpChannel;
  scheduledAt: string; // ISO
  topic: string;
  status: FollowUpStatus;
  assignedRepId: string;
  assignedRepName: string;
  completedAt?: string;
  outcome?: InteractionOutcome;
  outcomeNote?: string;
  nextFollowUpId?: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  customerName: string;
  channel: InteractionChannel;
  outcome: InteractionOutcome;
  summary: string;
  uninterestedReason?: string;
  performedBy: string;
  occurredAt: string; // ISO
  followUpId?: string;
  opportunityId?: string;
}

export interface Activity {
  id: string;
  customerId: string;
  type: "interaction" | "quotation" | "stage_change" | "followup_completed";
  title: string;
  description: string;
  occurredAt: string; // ISO
  performedBy: string;
  metadata?: {
    channel?: string;
    machineModel?: string;
    quotationRef?: string;
    opportunityId?: string;
    amount?: number;
    outcome?: string;
  };
}

export type MachineBrand = "JACK" | "HIKARI" | "SIRUBA" | "JUKI" | "BROTHER";
export type MachineCategory = "single_needle" | "overlock" | "interlock" | "buttonhole" | "special" | "embroidery";

export interface Product {
  id: string;
  model: string;
  brand: MachineBrand | string;
  category: MachineCategory | string;
  suggestedPriceEgp: number;
  descriptionArabic: string;
  speedRpm?: number;
  maxStitchLengthMm?: number;
  needleSystem?: string;
  motorType?: string;
  hasAutomaticTrimmer?: boolean;
  hasAutoFootLifter?: boolean;
  hasReverseStitch?: boolean;
  lubricationType?: string;
  warrantyMonths?: number;
  inStock?: boolean;
  stockCount?: number;
  application?: string;
  features?: string[];
}

export interface CrmState {
  version: number;
  customers: Customer[];
  opportunities: Opportunity[];
  followUps: FollowUp[];
  interactions: Interaction[];
  activities: Activity[];
  products: Product[];
}
