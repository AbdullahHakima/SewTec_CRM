# SewTec CRM (El Mahalla Branch) Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully interactive, responsive, desktop-first, Arabic-first (`dir="rtl"`) Next.js CRM prototype for the SewTec El Mahalla branch, powered by a reactive `CrmStore` with LocalStorage persistence and realistic sewing factory seed data.

**Architecture:** Next.js App Router inside `frontend/` directory. React UI components consume feature-level hooks, which interact with thin application services backed by asynchronous domain repository interfaces (`ICustomerRepository`, `IFollowUpRepository`, etc.). Data operations mutate an atomic `CrmStore` utilizing React's `useSyncExternalStore` for instantaneous, multi-component reactivity, backed by browser `localStorage`.

**Tech Stack:** Next.js 14/15, TypeScript, Tailwind CSS, shadcn/ui primitives, TanStack Table, Lucide React, date-fns (ar-EG), React Hook Form, Zod.

## Global Constraints
- Target workspace directory: `d:/SewTec_CRM/frontend/`
- Arabic-first RTL: Root layout has `dir="rtl"` with IBM Plex Sans Arabic font.
- Numbers: Regular numbers and currency in `tabular-nums`; LTR monospace isolation strictly for machine models (e.g. `JACK A4`, `HK2900ASS`) and serial numbers. Phone numbers use `dir="ltr"` and `unicode-bidi: isolate`.
- Timezone: All business date calculations strictly relative to `Africa/Cairo` using helpers in `lib/dates/`.
- No heavy state libraries: No Redux, Zustand, or TanStack Query in V1. Use `useSyncExternalStore` inside `CrmStore`.
- Swappable persistence: Repositories are asynchronous (`Promise<T>`), UI components never touch `localStorage` directly.

---

### Task 1: Project Scaffolding & Design Token Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/lib/utils.ts`

**Interfaces:**
- Produces: Base Tailwind utility `cn(...)` in `src/lib/utils.ts`, semantic color tokens in `globals.css`, RTL root layout.

- [ ] **Step 1: Scaffold Next.js project inside `frontend/`**

Initialize Next.js with TypeScript and Tailwind inside `d:/SewTec_CRM/frontend`:
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```
Expected: `frontend/` directory created with `package.json`, `tailwind.config.ts`, `src/app/layout.tsx`.

- [ ] **Step 2: Install core dependencies**

Install Lucide icons, date-fns, clsx, tailwind-merge, and class-variance-authority:
```bash
cd d:/SewTec_CRM/frontend
npm install lucide-react clsx tailwind-merge class-variance-authority @tanstack/react-table date-fns
```

- [ ] **Step 3: Configure Tailwind tokens & IBM Plex Sans Arabic**

Update `frontend/tailwind.config.ts` to include the semantic colors and radius scale:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "#0f2744", // Deep Navy
          accent: "#1d6cdb",  // Vivid blue
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        border: "#e2e8f0",
        status: {
          won: "#10b981",
          active: "#2563eb",
          quotation: "#6366f1",
          negotiation: "#f59e0b",
          overdue: "#ef4444",
          dormant: "#64748b",
        }
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-arabic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

Update `frontend/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family: var(--font-ibm-plex-arabic), system-ui, sans-serif;
  direction: rtl;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

Update `frontend/src/app/layout.tsx` to set `dir="rtl"` and import Google Font `IBM_Plex_Sans_Arabic`:
```tsx
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
});

export const metadata: Metadata = {
  title: "SewTec CRM — فرع المحلة الكبرى",
  description: "نظام إدارة علاقات العملاء والمبيعات — فرع المحلة الكبرى",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build` inside `frontend/`.  
Expected: Build passes with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(scaffold): initialize Next.js project with RTL and design tokens"
```

---

### Task 2: Domain Types, Date Semantics & Deterministic Seed Data

**Files:**
- Create: `frontend/src/types/crm.ts`
- Create: `frontend/src/lib/dates/branch-time.ts`
- Create: `frontend/src/lib/dates/format-date.ts`
- Create: `frontend/src/lib/currency/format-currency.ts`
- Create: `frontend/src/data/demo/seed-data.ts`

**Interfaces:**
- Produces: `Customer`, `Opportunity`, `FollowUp`, `Interaction`, `Activity`, `Product`, `CrmState` interfaces.
- Produces: `formatEgp(amount: number): string`
- Produces: `formatBranchDate(iso: string): string`, `isOverdue(iso: string): boolean`, `getDaysInStage(date: string): number`
- Produces: `INITIAL_CRM_STATE: CrmState`

- [ ] **Step 1: Define CRM domain types in `src/types/crm.ts`**

```typescript
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

export type OpportunityStage = "new" | "contacted" | "interested" | "quotation" | "negotiation" | "won" | "lost";

export interface Opportunity {
  id: string;
  branchId: "mahalla";
  customerId: string;
  customerName: string;
  title: string;
  machineModel: string;
  quantity: number;
  estimatedValue?: number;
  stage: OpportunityStage;
  stageUpdatedAt: string; // ISO (for days-in-stage calculation)
  assignedRepId: string;
  assignedRepName: string;
  expectedCloseDate?: string;
  quotationRef?: string;
  notes?: string;
  createdAt: string;
}

export type FollowUpStatus = "scheduled" | "completed" | "missed" | "cancelled";
export type FollowUpChannel = "call" | "visit" | "whatsapp" | "email";

export interface FollowUp {
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

export type InteractionChannel = "call" | "visit" | "whatsapp" | "note";
export type InteractionOutcome = "interested" | "quotation_requested" | "needs_time" | "no_answer" | "not_interested";

export interface Interaction {
  id: string;
  customerId: string;
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
  occurredAt: string;
  performedBy: string;
  metadata?: {
    channel?: string;
    machineModel?: string;
    quotationRef?: string;
    opportunityId?: string;
    amount?: number;
  };
}

export interface Product {
  id: string;
  model: string;
  brand: "JACK" | "HIKARI" | "SIRUBA" | "JUKI" | "BROTHER";
  category: "single_needle" | "overlock" | "interlock" | "embroidery" | "special";
  suggestedPriceEgp: number;
  descriptionArabic: string;
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
```

- [ ] **Step 2: Implement timezone-safe date helpers in `src/lib/dates/`**

Create `src/lib/dates/branch-time.ts`:
```typescript
import { format, formatDistanceToNow, parseISO, isBefore, differenceInDays } from "date-fns";
import { arEG } from "date-fns/locale";

export function formatBranchDate(isoString: string): string {
  if (!isoString) return "-";
  return format(parseISO(isoString), "EEEE، d MMMM yyyy", { locale: arEG });
}

export function formatBranchTime(isoString: string): string {
  if (!isoString) return "-";
  return format(parseISO(isoString), "hh:mm a", { locale: arEG });
}

export function formatBranchRelative(isoString: string): string {
  if (!isoString) return "-";
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: arEG });
}

export function isOverdue(isoString: string): boolean {
  if (!isoString) return false;
  return isBefore(parseISO(isoString), new Date());
}

export function getDaysInStage(stageUpdatedAt: string): number {
  if (!stageUpdatedAt) return 0;
  return differenceInDays(new Date(), parseISO(stageUpdatedAt));
}

export function isCustomerStale(lastContactAt: string, isVip = false): boolean {
  if (!lastContactAt) return true;
  const days = differenceInDays(new Date(), parseISO(lastContactAt));
  return isVip ? days > 7 : days > 14;
}
```

Create `src/lib/currency/format-currency.ts`:
```typescript
export function formatEgp(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return "0 ج.م";
  return `${amount.toLocaleString("ar-EG")} ج.م`;
}
```

- [ ] **Step 3: Create deterministic El Mahalla seed dataset in `src/data/demo/seed-data.ts`**

Include:
- 5 Fictionalized customers (`cust_01` Al-Nour with HK2900ASS deal, `cust_02` Al-Safwa with Jack A4B deal, `cust_03` Al-Mostaqbal stale lead, `cust_04` Al-Hoda large factory, `cust_05` individual tailor).
- Follow-ups including 3 overdue items (Al-Nour, Al-Rowad, Al-Najah) for morning triage.
- Active opportunities in New, Contacted, Interested, Quotation, Negotiation.
- Rich activities timeline for `cust_01`.
- Catalog of machines (`HIKARI HK2900ASS`, `JACK A4B`, `SIRUBA 747K`, `JACK F4`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/lib/ frontend/src/data/
git commit -m "feat(domain): add CRM domain types, Cairo date helpers, and El Mahalla seed data"
```

---

### Task 3: Reactive `CrmStore`, Hydration Provider & Repositories

**Files:**
- Create: `frontend/src/lib/storage/crm-store.ts`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/features/customers/repositories/customer.repository.ts`
- Create: `frontend/src/features/follow-ups/repositories/follow-up.repository.ts`
- Create: `frontend/src/features/opportunities/repositories/opportunity.repository.ts`
- Create: `frontend/src/infrastructure/local-storage/local-storage-customer.repository.ts`
- Create: `frontend/src/infrastructure/local-storage/local-storage-follow-up.repository.ts`
- Create: `frontend/src/infrastructure/local-storage/local-storage-opportunity.repository.ts`
- Create: `frontend/src/features/customers/hooks/use-customers.ts`
- Create: `frontend/src/features/follow-ups/hooks/use-follow-ups.ts`
- Create: `frontend/src/features/opportunities/hooks/use-opportunities.ts`

**Interfaces:**
- Produces: `crmStore` singleton with `useSyncExternalStore` subscription.
- Produces: `useCustomers()`, `useCustomer(id)`, `useFollowUps()`, `useOpportunities()`.
- Produces: Asynchronous repository interfaces and implementations.

- [ ] **Step 1: Implement `CrmStore` with `useSyncExternalStore` bridge**

Create `src/lib/storage/crm-store.ts`:
```typescript
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
        if (parsed.version === INITIAL_CRM_STATE.version) {
          this.state = parsed;
        } else {
          this.reset();
        }
      } else {
        this.reset();
      }
    } catch {
      this.reset();
    }
    this.isHydrated = true;
    this.notify();
  }

  public getSnapshot = (): CrmState => {
    return this.state;
  };

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
    this.persist();
    this.notify();
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error("Failed to persist CRM state", err);
      }
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const crmStore = new CrmStore();
```

- [ ] **Step 2: Implement Client Hydration in `src/app/providers.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { crmStore } from "@/lib/storage/crm-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    crmStore.initClient();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 font-medium">
        جاري تحميل SewTec CRM...
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Implement repository interfaces and LocalStorage implementations**

Implement `ICustomerRepository`, `IFollowUpRepository`, `IOpportunityRepository` in features, and wire their concrete methods to `crmStore.update()` in `infrastructure/local-storage/`.

- [ ] **Step 4: Create reactive feature hooks using `useSyncExternalStore`**

Example `useCustomers`:
```typescript
import { useSyncExternalStore } from "react";
import { crmStore } from "@/lib/storage/crm-store";

export function useCustomers() {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot);
  return {
    customers: state.customers,
    isLoading: false,
  };
}
```

- [ ] **Step 5: Verify build & tests pass**

Run: `npm run build`  
Expected: Clean compilation with types and store verified.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/storage/ frontend/src/app/providers.tsx frontend/src/features/ frontend/src/infrastructure/
git commit -m "feat(store): implement reactive CrmStore with useSyncExternalStore and LocalStorage repositories"
```

---

### Task 4: Application Shell (Collapsible Right Sidebar & TopBar with Search)

**Files:**
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/GlobalSearchDialog.tsx`
- Create: `frontend/src/components/layout/QuickActionMenu.tsx`

**Interfaces:**
- Produces: Pinned right-side navigation in RTL (`dir="rtl"`).
- Produces: Collapsible sidebar (230px $\rightarrow$ 60px).
- Produces: `Ctrl+K` Global Command Search searching across customers, opportunities, and machine catalog.
- Produces: Context-aware `+ إجراء جديد` menu.

- [ ] **Step 1: Implement `Sidebar.tsx`**

Build the right-side drawer/nav:
- Brand: `SewTec CRM` + `فرع المحلة الكبرى`.
- Links: الرئيسية (`/`), العملاء (`/customers`), الفرص البيعية (`/opportunities`), المتابعات (`/follow-ups` with overdue badge), الإعدادات (`/settings`).
- Collapse button toggle saving state in React state.

- [ ] **Step 2: Implement `TopBar.tsx` & `GlobalSearchDialog.tsx`**

Build top navigation bar:
- Search trigger input button with keyboard shortcut badge (`Ctrl + K`).
- Quick Action Dropdown (`+ إجراء جديد`).
- Overdue badge notifications bell showing active overdue count.
- Salesperson profile: `أحمد شحاتة — مبيعات فرع المحلة`.

- [ ] **Step 3: Implement `AppShell.tsx` wrapping main page content**

Ensure proper flex direction:
```tsx
<div className="flex min-h-screen bg-slate-50">
  {/* Pinned Right Sidebar */}
  <Sidebar />
  {/* Main content expands to the left */}
  <div className="flex flex-1 flex-col overflow-hidden">
    <TopBar />
    <main className="flex-1 overflow-y-auto p-6">{children}</main>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat(shell): create collapsible right sidebar, topbar, and global search modal"
```

---

### Task 5: Screen 1 — Dashboard ("What should I do today?")

**Files:**
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/features/dashboard/components/DashboardScreen.tsx`
- Create: `frontend/src/features/dashboard/components/KpiCard.tsx`
- Create: `frontend/src/features/dashboard/components/ActionSchedule.tsx`
- Create: `frontend/src/features/dashboard/components/UrgentDeals.tsx`

**Interfaces:**
- Produces: Dashboard screen mounted at `/`.
- Features: 4 Action KPIs (متابعات اليوم, متأخرة ⚠, عروض تنتظر الرد, صفقات عالية الأولوية).
- Features: 60/40 Split: Today's direct action schedule + Urgent deals column.
- Features: Inline `[✓ إنجاز]` quick-action linking directly to the Structured Outcome modal.

- [ ] **Step 1: Build `KpiCard.tsx`**

Create compact, high-contrast KPI cards with semantic border indicators (red for overdue, amber for negotiation, blue for active).

- [ ] **Step 2: Build `ActionSchedule.tsx`**

Render scheduled tasks for today grouped by presentation headers:
- الفترة الصباحية (09:00 ص – 11:59 ص)
- الفترة المسائية (12:00 م – 05:00 م)
Each card shows: Time, Channel icon, Customer name, Topic, Phone, and `[✓ إنجاز]` button.

- [ ] **Step 3: Build `UrgentDeals.tsx`**

Render high-priority negotiation opportunities with days-in-stage warning badges and stale client alerts.

- [ ] **Step 4: Connect `DashboardScreen.tsx` to `app/page.tsx`**

- [ ] **Step 5: Verify build & render in browser**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/dashboard/ frontend/src/app/page.tsx
git commit -m "feat(dashboard): implement daily action-oriented dashboard with schedule and KPIs"
```

---

### Task 6: Screen 2 — Customer Directory (Dense TanStack Data Table)

**Files:**
- Create: `frontend/src/app/customers/page.tsx`
- Create: `frontend/src/features/customers/components/CustomersScreen.tsx`
- Create: `frontend/src/features/customers/components/CustomerTable.tsx`
- Create: `frontend/src/features/customers/components/CustomerFilters.tsx`
- Create: `frontend/src/features/customers/components/MachineFleetPopover.tsx`

**Interfaces:**
- Produces: `/customers` page.
- Features: Dense TanStack table with segment pills (`الكل`, `مصانع`, `ورش`, `تجار`, `أفراد`) synced with URL search params.
- Features: Truncated machine fleets with hover popover.
- Features: Stale client indicators (`⚠ منذ 21 يوماً`).
- Features: Direct call and WhatsApp icons with event isolation (preventing row navigation).

- [ ] **Step 1: Build `CustomerFilters.tsx`**

Segment pill buttons and search input that update URL params (`?type=factory&search=النور`).

- [ ] **Step 2: Build `MachineFleetPopover.tsx`**

Truncate models in row (e.g. `JACK A4, HK2900ASS +2`) and render popover showing all owned machines on click/hover.

- [ ] **Step 3: Build `CustomerTable.tsx` using `@tanstack/react-table`**

Implement dense rows (40px height), sorting, pagination, and action icons `[📞] [💬] [⋯]`. Ensure action buttons call `e.stopPropagation()`.

- [ ] **Step 4: Wire to `app/customers/page.tsx`**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/customers/ frontend/src/app/customers/
git commit -m "feat(customers): implement dense customer directory table with filters and fleet popover"
```

---

### Task 7: Screen 3 — Customer 360 Hero Screen (`/customers/[id]`)

**Files:**
- Create: `frontend/src/app/customers/[id]/page.tsx`
- Create: `frontend/src/features/customers/components/Customer360Screen.tsx`
- Create: `frontend/src/features/customers/components/CustomerHeader.tsx`
- Create: `frontend/src/features/customers/components/ContextRail.tsx`
- Create: `frontend/src/features/interactions/components/QuickLogger.tsx`
- Create: `frontend/src/features/interactions/components/ActivityTimeline.tsx`

**Interfaces:**
- Produces: `/customers/[id]` Hero Screen.
- Layout: 3-tier clean header + Context Rail (~35% on right in RTL) + Main Workspace (~65% on left in RTL).
- Features: Quick Logger (logs calls/visits in 15 seconds) and Unified Timeline with clickable linked objects (deals, quotes).

- [ ] **Step 1: Build `CustomerHeader.tsx`**

3-tier header:
- Tier 1: Customer Name + VIP Star + Status badge.
- Tier 2: Type + City + Rep.
- Tier 3: Phone + Direct WhatsApp button + Contextual action buttons `[+ تسجيل تواصل]`, `[+ متابعة]`.

- [ ] **Step 2: Build `ContextRail.tsx` (35% Right Column)**

- Next action alert card (highlighted red if overdue) with inline `[✓ إنجاز]` button.
- Facility metadata card (address, tax ID, technical contact).
- Lifetime sales (`إجمالي المبيعات`) vs Open pipeline (`الفرص المفتوحة`) cards.
- Installed machine fleet table (Model, Quantity, Purchase Year, Purchased from SewTec).

- [ ] **Step 3: Build `QuickLogger.tsx` & `ActivityTimeline.tsx` (65% Left Column)**

- Inline logger: Note input + Channel pills (مكالمة, زيارة, واتساب, ملاحظة) + Save.
- Chronological timeline feed: Calls, visits, WhatsApp notes, sent quotes, and completed follow-ups with badges for linked quote numbers (`Q-2026-0041`) and deal codes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/customers/components/ frontend/src/features/interactions/ frontend/src/app/customers/[id]/
git commit -m "feat(customer360): implement hero screen with context rail, quick logger, and timeline"
```

---

### Task 8: Screen 4 — Follow-ups Engine & Structured Outcome Modal

**Files:**
- Create: `frontend/src/app/follow-ups/page.tsx`
- Create: `frontend/src/features/follow-ups/components/FollowUpsScreen.tsx`
- Create: `frontend/src/features/follow-ups/components/FollowUpCard.tsx`
- Create: `frontend/src/features/follow-ups/components/FollowUpCompletionModal.tsx`
- Create: `frontend/src/features/follow-ups/services/follow-up.service.ts`

**Interfaces:**
- Produces: `/follow-ups` page with views (`اليوم`, `المتأخرة ⚠`, `القادمة`, `المكتملة`).
- Produces: `FollowUpCompletionModal`:
  - Handles outcome pills (`مهتم`, `طلب عرض سعر`, `يحتاج وقت`, `لم يرد`, `غير مهتم`).
  - If `لم يرد` (No answer): 1-click retry tomorrow at 11:00 AM.
  - If `غير مهتم`: structured reason selection (السعر, الماكينة, اشترى من منافس, إلخ).
  - Atomically logs interaction, appends timeline activity, updates customer lastContactAt, and schedules next follow-up.

- [ ] **Step 1: Implement `FollowUpService.completeFollowUp(...)`**

Orchestrates multi-entity mutation inside `crmStore.update()` in a single transaction.

- [ ] **Step 2: Build `FollowUpCompletionModal.tsx`**

Build modal with conditional outcome views and smart next-action scheduler.

- [ ] **Step 3: Build `FollowUpsScreen.tsx` with Tab Views**

URL-synced tabs for `?view=today`, `?view=overdue`, `?view=upcoming`, `?view=completed`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/follow-ups/ frontend/src/app/follow-ups/
git commit -m "feat(followups): implement follow-ups engine with structured outcome completion modal"
```

---

### Task 9: Screen 5 — Opportunity Pipeline Kanban & Inspector Drawer

**Files:**
- Create: `frontend/src/app/opportunities/page.tsx`
- Create: `frontend/src/features/opportunities/components/OpportunitiesScreen.tsx`
- Create: `frontend/src/features/opportunities/components/KanbanBoard.tsx`
- Create: `frontend/src/features/opportunities/components/OpportunityCard.tsx`
- Create: `frontend/src/features/opportunities/components/OpportunityInspectorDrawer.tsx`

**Interfaces:**
- Produces: `/opportunities` page.
- Columns: Active Kanban (New, Contacted, Interested, Quotation, Negotiation) with totals.
- Top Tabs: `[الفرص النشطة]` [Default] vs `[تم البيع]` vs `[المفقودة]`.
- Features: "Days in stage" badge on cards (`تفاوض منذ 8 أيام ⚠`).
- Features: Clicking a card opens `OpportunityInspectorDrawer` to advance stages and modify amounts without drag-and-drop.

- [ ] **Step 1: Build `OpportunityCard.tsx`**

Customer name, LTR monospace machine tag (`HIKARI HK2900ASS ×3`), deal value, assigned rep, and days-in-stage badge.

- [ ] **Step 2: Build `KanbanBoard.tsx`**

5 active columns with semantic headers and sum of open deals per stage.

- [ ] **Step 3: Build `OpportunityInspectorDrawer.tsx`**

Slide-over drawer (~560px) displaying deal details, stage change selector, quotation link, and next meeting scheduler.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/opportunities/ frontend/src/app/opportunities/
git commit -m "feat(opportunities): implement active pipeline Kanban with days-in-stage and inspector drawer"
```

---

### Task 10: Slide-Over Drawers & Fast Creation Forms

**Files:**
- Create: `frontend/src/features/customers/components/CustomerDrawer.tsx`
- Create: `frontend/src/features/follow-ups/components/FollowUpDrawer.tsx`
- Create: `frontend/src/features/opportunities/components/OpportunityDrawer.tsx`
- Create: `frontend/src/features/interactions/components/LogInteractionDrawer.tsx`

**Interfaces:**
- Quick Drawers (~440px): `FollowUpDrawer`, `LogInteractionDrawer`.
- Detail Drawers (~560px): `CustomerDrawer` (20-second entry: Required vs Optional fields), `OpportunityDrawer` (allows optional estimated price).

- [ ] **Step 1: Build `CustomerDrawer.tsx`**

20-second fast entry: Required fields (Name, Type, Phone, Assigned Rep) at top; Optional expandable accordion for address, contact person, and notes.

- [ ] **Step 2: Build `OpportunityDrawer.tsx`**

Customer selector, machine catalog picker, optional estimated price field, target stage.

- [ ] **Step 3: Build `FollowUpDrawer.tsx` & `LogInteractionDrawer.tsx`**

Context-aware: pre-populates customer if currently inside `/customers/[id]`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/
git commit -m "feat(drawers): implement context-aware slide-over drawers with 20-second customer creation"
```

---

### Task 11: Settings Screen & Developer Reset Dialog

**Files:**
- Create: `frontend/src/app/settings/page.tsx`
- Create: `frontend/src/features/settings/components/SettingsScreen.tsx`
- Create: `frontend/src/features/settings/components/ResetDemoDialog.tsx`

**Interfaces:**
- Produces: `/settings` page.
- Features: Branch info display (`فرع المحلة الكبرى — مبيعات وصيانة ماكينات الخياطة`).
- Features: Discreet Developer / Demo section with `[إعادة ضبط البيانات التجريبية]` triggering confirmation dialog.

- [ ] **Step 1: Build `ResetDemoDialog.tsx`**

Warning dialog with confirmation buttons calling `crmStore.reset()`.

- [ ] **Step 2: Connect to `app/settings/page.tsx`**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/settings/ frontend/src/app/settings/
git commit -m "feat(settings): add branch settings and deterministic demo data reset dialog"
```

---

### Task 12: End-to-End Verification of the 6 Acceptance Journeys & Polish

**Files:**
- Test script / E2E checklist: `frontend/src/__tests__/acceptance-journeys.test.ts` (or manual test guide)
- Refinements across UI components.

- [ ] **Step 1: Verify Journey 1 (Morning Triage on Dashboard)**
  - Open Dashboard, observe overdue count (3).
  - Complete Al-Nour follow-up with `[مهتم 👍]`, schedule next visit for Sunday.
  - Verify dashboard counter decrements and schedule updates.

- [ ] **Step 2: Verify Journey 2 (Global Search `Ctrl + K`)**
  - Press `Ctrl + K`, search `010-00` or `HK2900`.
  - Verify grouped search results, navigate directly to Customer 360.

- [ ] **Step 3: Verify Journey 3 (Customer 360 Inspection & Quick Logger)**
  - Inspect fleet and lifetime sales in Context Rail.
  - Type note in Quick Logger, save, verify it instantly appears in Unified Timeline.

- [ ] **Step 4: Verify Journey 4 (Opportunity Negotiation Kanban)**
  - Open `/opportunities`, click Al-Nour deal in Inspector Drawer.
  - Move stage to `تفاوض (Negotiation)`, verify amber badge and updated column sums.

- [ ] **Step 5: Verify Journey 5 (Negative Case: "لم يرد" Flow)**
  - Open an overdue follow-up, click `[✓ إنجاز]`.
  - Select `[لم يرد 📵]`, confirm 1-click retry tomorrow at 11:00 AM.
  - Verify call logged as missed attempt and new task scheduled.

- [ ] **Step 6: Verify Journey 6 (Developer Demo Reset)**
  - Navigate to `/settings`, click `إعادة ضبط البيانات التجريبية`, confirm.
  - Verify state returns cleanly to initial deterministic El Mahalla seed data.

- [ ] **Step 7: Production build & final verification**
  Run: `npm run build && npm run lint` inside `frontend/`.
  Expected: Clean build with 0 errors and 0 warnings.

- [ ] **Step 8: Final commit**
  ```bash
  git add frontend/
  git commit -m "feat(crm): complete SewTec CRM frontend prototype with verified acceptance journeys"
  ```
