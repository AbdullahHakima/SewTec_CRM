import { CrmState } from "@/types/crm";
import { INITIAL_CRM_STATE } from "@/data/demo/seed-data";

const STORAGE_KEY = "sewtec_crm_state_v1";

type Listener = () => void;

class CrmStore {
  private state: CrmState = INITIAL_CRM_STATE;
  private listeners: Set<Listener> = new Set();
  private isHydrated = false;

  public initClient() {
    if (this.isHydrated || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.version === INITIAL_CRM_STATE.version) {
          this.state = parsed;
        } else {
          // Schema version changed or invalid - reset to fresh seed
          this.reset();
          return;
        }
      } else {
        this.reset();
        return;
      }
    } catch {
      this.reset();
      return;
    }
    this.isHydrated = true;
    this.notify();
  }

  public getSnapshot = (): CrmState => {
    return this.state;
  };

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public update(mutator: (draft: CrmState) => void) {
    const next = structuredClone(this.state);
    mutator(next);
    this.state = next;
    this.persist();
    this.notify();
  }

  public reset() {
    this.state = structuredClone(INITIAL_CRM_STATE);
    this.isHydrated = true;
    this.persist();
    this.notify();
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error("Failed to persist SewTec CRM state to localStorage", err);
      }
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in CrmStore listener", err);
      }
    });
  }
}

export const crmStore = new CrmStore();
