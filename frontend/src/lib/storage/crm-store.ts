import { CrmState, Customer, Opportunity, FollowUp, Product, Activity, Interaction } from "@/types/crm";
import { INITIAL_CRM_STATE } from "@/data/demo/seed-data";
import { apiClient, PageResult } from "@/infrastructure/http/api-client";

const empty = (): CrmState => ({ version: INITIAL_CRM_STATE.version, customers: [], opportunities: [], followUps: [], interactions: [], activities: [], products: [] });
class CrmStore {
  private state: CrmState = empty();
  private listeners = new Set<() => void>();
  private generation = 0;
  public initClient() {
    if (typeof window !== "undefined") localStorage.removeItem("sewtec_crm_state_v1");
  }
  public clear() { this.generation++; this.state = empty(); this.notify(); }
  public async syncWithBackend(): Promise<boolean> {
    if (!apiClient.getToken()) return false;
    const generation = ++this.generation;
    const [customers, opportunities, followUps, products] = await Promise.all([
      apiClient.get<PageResult<Customer>>("/customers"), apiClient.get<PageResult<Opportunity>>("/opportunities"),
      apiClient.get<PageResult<FollowUp>>("/follow-ups"), apiClient.get<PageResult<Product>>("/products", { pageSize: 100 })
    ]);
    if (generation !== this.generation) return false;
    this.update(draft => { draft.customers = customers.items; draft.opportunities = opportunities.items; draft.followUps = followUps.items; draft.products = products.items; });
    return true;
  }
  public async refreshCustomer(id: string) {
    const generation = this.generation;
    const [customer, activities, interactions] = await Promise.all([
      apiClient.get<Customer>(`/customers/${id}`), apiClient.get<Activity[]>(`/activities/customer/${id}`), apiClient.get<Interaction[]>(`/interactions/customer/${id}`)
    ]);
    if (generation !== this.generation) return;
    this.update(draft => {
      draft.customers = [...draft.customers.filter(c => c.id !== id), customer];
      draft.activities = [...draft.activities.filter(a => a.customerId !== id), ...activities];
      draft.interactions = [...draft.interactions.filter(i => i.customerId !== id), ...interactions];
    });
  }
  public getSnapshot = (): CrmState => this.state;
  public subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  public update(mutator: (draft: CrmState) => void) { const next = structuredClone(this.state); mutator(next); this.state = next; this.notify(); }
  public reset() {
    if (typeof window !== "undefined") throw new Error("Demo reset is unavailable in the application.");
    this.state = structuredClone(INITIAL_CRM_STATE); this.notify();
  }
  private notify() { this.listeners.forEach(listener => listener()); }
}
export const crmStore = new CrmStore();
