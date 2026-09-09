import { Customer, CustomerType } from "@/types/crm";

export interface CustomerQuery {
  search?: string;
  type?: CustomerType | "all";
  assignedRepId?: string;
  isStale?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  type: CustomerType;
  phone: string;
  phoneSecondary?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  assignedRepId: string;
  assignedRepName: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  type?: CustomerType;
  phone?: string;
  phoneSecondary?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  assignedRepId?: string;
  assignedRepName?: string;
  notes?: string;
  isVip?: boolean;
}

export interface ICustomerRepository {
  getAll(query?: CustomerQuery): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(input: CreateCustomerInput): Promise<Customer>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer>;
}
