import { crmStore } from "@/lib/storage/crm-store";
import { Customer } from "@/types/crm";
import {
  CreateCustomerInput,
  CustomerQuery,
  ICustomerRepository,
  UpdateCustomerInput,
} from "@/features/customers/repositories/customer.repository";
import { isCustomerStale } from "@/lib/dates/branch-time";

export class LocalStorageCustomerRepository implements ICustomerRepository {
  async getAll(query?: CustomerQuery): Promise<Customer[]> {
    let list = crmStore.getSnapshot().customers;

    if (query?.type && query.type !== "all") {
      list = list.filter((c) => c.type === query.type);
    }

    if (query?.assignedRepId && query.assignedRepId !== "all") {
      list = list.filter((c) => c.assignedRepId === query.assignedRepId);
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          c.installedMachines.some((m) => m.model.toLowerCase().includes(q))
      );
    }

    if (query?.isStale) {
      list = list.filter((c) => isCustomerStale(c.lastContactAt, c.isVip));
    }

    return list;
  }

  async getById(id: string): Promise<Customer | null> {
    const found = crmStore.getSnapshot().customers.find((c) => c.id === id);
    return found ? structuredClone(found) : null;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      branchId: "mahalla",
      name: input.name,
      type: input.type,
      status: "active",
      isVip: false,
      phone: input.phone,
      phoneSecondary: input.phoneSecondary,
      contactPerson: input.contactPerson,
      address: input.address || "المحلة الكبرى",
      city: input.city || "المحلة الكبرى",
      assignedRepId: input.assignedRepId,
      assignedRepName: input.assignedRepName,
      lifetimeSales: 0,
      openPipelineValue: 0,
      lastContactAt: new Date().toISOString(),
      installedMachines: [],
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    crmStore.update((state) => {
      state.customers.unshift(newCustomer);
    });

    return newCustomer;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    let updated: Customer | null = null;

    crmStore.update((state) => {
      const index = state.customers.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.customers[index] = {
          ...state.customers[index],
          ...input,
        };
        updated = state.customers[index];
      }
    });

    if (!updated) {
      throw new Error(`Customer with id ${id} not found`);
    }

    return updated;
  }
}

export const customerRepository = new LocalStorageCustomerRepository();
