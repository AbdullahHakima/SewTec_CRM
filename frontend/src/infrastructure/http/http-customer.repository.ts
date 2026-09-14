import { Customer } from "@/types/crm";
import {
  CreateCustomerInput,
  CustomerQuery,
  ICustomerRepository,
  UpdateCustomerInput,
} from "@/features/customers/repositories/customer.repository";
import { apiClient } from "./api-client";
import { crmStore } from "@/lib/storage/crm-store";

export class HttpCustomerRepository implements ICustomerRepository {
  async getAll(query?: CustomerQuery): Promise<Customer[]> {
    try {
      const customers = await apiClient.get<import("./api-client").PageResult<Customer>>("/customers", {
        search: query?.search,
        type: query?.type,
        assignedRepId: query?.assignedRepId,
        isStale: query?.isStale,
      });

      // Synchronize into crmStore cache
      crmStore.update((state) => {
        state.customers = customers.items;
      });

      return customers.items;
    } catch (err) { throw err;
    }
  }

  async getById(id: string): Promise<Customer | null> {
    try {
      const customer = await apiClient.get<Customer>(`/customers/${id}`);
      crmStore.update((state) => {
        const idx = state.customers.findIndex((c) => c.id === id);
        if (idx !== -1) {
          state.customers[idx] = customer;
        } else {
          state.customers.push(customer);
        }
      });
      return customer;
    } catch (err) { throw err;
    }
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    try {
      const created = await apiClient.post<Customer>("/customers", input);
      await crmStore.syncWithBackend().catch(() => false);
      return created;
    } catch (err) { throw err;
    }
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    try {
      const updated = await apiClient.put<Customer>(`/customers/${id}`, input);
      await crmStore.syncWithBackend().catch(() => false);
      return updated;
    } catch (err) { throw err;
    }
  }
}

export const customerRepository = new HttpCustomerRepository();
