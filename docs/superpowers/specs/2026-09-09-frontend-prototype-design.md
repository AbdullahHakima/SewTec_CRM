# SewTec CRM (El Mahalla Branch) — Frontend-First Prototype Design Specification

**Date:** 2026-09-09  
**Branch Context:** El Mahalla El Kubra (Garment manufacturing & industrial sewing equipment)  
**Timezone:** `Africa/Cairo`  
**Status:** Frozen & Approved for Implementation Planning  

---

## 1. Executive Summary & Philosophy

This specification defines the frontend-first prototype for **SewTec CRM**, specifically modeled around the operational workday of sales representatives and branch staff at the **El Mahalla El Kubra branch**. 

Rather than starting from database tables, APIs, or abstract Clean Architecture, this system starts from the daily human workflows of the branch:
- Triaging morning calls and overdue follow-ups.
- Managing quotations and high-stake negotiations for sewing machines (e.g., JACK A4, HIKARI HK2900ASS, SIRUBA).
- Looking up factory owners and workshop managers by phone number or machine model in seconds.
- Logging interactions in under 15 seconds without losing UI context.

The prototype is built with **Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, React Hook Form, Zod, and Lucide Icons**. It runs in the browser using an atomic **`CrmStore` reactive bridge with LocalStorage persistence** and realistic, deterministic El Mahalla demo data. The architecture guarantees that transitioning to an ASP.NET Core backend later requires **minimal, localized UI changes**.

---

## 2. Architectural Blueprint & Layering

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React UI Components                             │
│       (Pages, Dense Data Tables, Kanban Cards, Slide-Over Drawers)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (calls clean domain hooks)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Feature Hooks & Application Services                     │
│         (useCustomers, useFollowUps, useOpportunities, etc.)           │
│   • Subscribes reactively via React useSyncExternalStore               │
│   • Orchestrates multi-entity business actions                         │
│   • Manages optimistic UI updates and validation                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Domain Repository Interfaces                           │
│   (ICustomerRepository, IFollowUpRepository, IOpportunityRepository)   │
│   • Minimal async UI-driven contracts returning Promise<T>             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   LocalStorageRepository (NOW)    │ │      HttpRepository (LATER)     │
│ • Reads/mutates reactive CrmStore │ │ • Calls ASP.NET Core REST API    │
│ • Persists atomic CrmState        │ │ • TanStack Query caching         │
│ • Zero network latency in demos   │ └──────────────────────────────────┘
└───────────────────────────────────┘
```

### 2.1 State Segregation Rules
1. **Persistent Business State**: Stored in a single atomic root object in `localStorage` (`CrmState`), managed reactively via `CrmStore`.
2. **Temporary UI State**: Component-level React state (`isOpen`, `activeTab`, `hoveredRow`, form inputs).
3. **URL & Navigation State**: Managed via Next.js search parameters (`?type=factory`, `?view=today`, `?stage=quotation`) ensuring back-button support and shareable views.

### 2.2 Reactive `CrmStore` Bridge (`useSyncExternalStore`)
Because `localStorage` is not natively reactive across React components, a lightweight in-memory store coordinates changes:
```text
React Hooks (useCustomers, useFollowUps, etc.)
     │
     ▼ (subscribe via useSyncExternalStore)
CrmStore
├── getSnapshot(): CrmState
├── subscribe(listener: () => void): () => void
├── update(mutator: (draft: CrmState) => void): void
├── reset(): void
└── persist(): void (debounced write to localStorage)
```
- Repositories mutate domain state by invoking `CrmStore.update()`.
- When an action modifies multiple entities (e.g. completing a follow-up, updating customer `lastContactAt`, and scheduling the next follow-up), `CrmStore.update()` updates them in-memory and flushes an atomic state to `localStorage`.
- All subscribed components (Dashboard counters, Customer 360 timeline, and Follow-up lists) re-render immediately and synchronously without manual page refreshes or heavy React Context trees.

### 2.3 SSR Boundary & Hydration Strategy
LocalStorage is browser-only. Next.js App Router pages define explicit client boundaries to avoid hydration mismatches:
```text
app/page.tsx               → <DashboardScreen />     ("use client")
app/customers/page.tsx     → <CustomersScreen />     ("use client")
app/customers/[id]/page.tsx→ <Customer360Screen />   ("use client")
app/follow-ups/page.tsx    → <FollowUpsScreen />     ("use client")
app/opportunities/page.tsx → <OpportunitiesScreen /> ("use client")
```
An `app/providers.tsx` root component mounts on the client and executes hydration:
```text
Client Mount
    ↓
Check localStorage for existing CrmState
 ├── Compatible state found? → Hydrate CrmStore
 └── Missing or outdated?    → Seed fixed El Mahalla demo dataset
```

---

## 3. Design System & Foundations

### 3.1 Visual Density & Token Hierarchy
* **Industrial Business Palette**:
  * **Brand / Primary**: Deep Navy (`#0f2744`) with vivid blue interaction accent (`#1d6cdb`).
  * **Surface / Cards**: Pure White (`#ffffff`) over crisp background slate (`#f8fafc`).
  * **Borders**: Hairline slate (`#e2e8f0` / `border-slate-200`).
  * **Semantic Status**:
    * **Won / Completed**: Emerald green (`#10b981` / `#ecfdf5`).
    * **Active / Interested**: Primary blue (`#2563eb` / `#eff6ff`).
    * **Quotation**: Indigo (`#6366f1` / `#eef2ff`).
    * **Negotiation**: Amber (`#f59e0b` / `#fffbeb`) — visually signals *Needs Immediate Attention*.
    * **Overdue / Lost / Urgent**: Crimson (`#ef4444` / `#fef2f2`).
    * **Dormant**: Cool slate (`#64748b` / `#f8fafc`).
* **Geometry**:
  * Cards / Sheets / Dialogs: `8px` (`rounded-lg`).
  * Buttons / Inputs / Badges: `6px` (`rounded-md`).
  * Minimal shadows: `shadow-xs` / `shadow-sm`. No heavy glows or consumer-fintech glassmorphism.

### 3.2 Arabic Typography & Mixed-Direction Rules
* **Font Family**: **IBM Plex Sans Arabic** for all UI elements.
* **Numeral Formatting**:
  * Currency & general counters: IBM Plex Sans Arabic with `tabular-nums` (e.g., `125,000 ج.م`).
  * Phone numbers: IBM Plex Sans Arabic with `dir="ltr"` and `unicode-bidi: isolate` (e.g., `010-0000-1122`).
  * Technical identifiers (machine models, serial numbers, quote IDs): Monospace with `dir="ltr"` (e.g., `HK2900ASS`, `JACK A4B`, `Q-2026-0041`).
* **Directionality**: Document root is strictly `dir="rtl"`. In RTL layout, the sidebar sits on the **right edge**, and the main content expands towards the **left**.

### 3.3 Date & Time Semantics (`Africa/Cairo`)
To eliminate time drift, DST discrepancies, and timezone ambiguities:
* **Persisted Format**: Standard ISO 8601 UTC strings (`2026-09-10T08:30:00.000Z`).
* **Calculation Timezone**: Strictly calculated relative to Egypt standard time (`Africa/Cairo`).
* **Centralized Helpers** in `lib/dates/`:
  * `branch-time.ts`: Retrieves current Cairo date/time for branch comparisons.
  * `is-overdue.ts`: Compares scheduled time against Cairo current time.
  * `format-date.ts`: Egyptian Arabic formatting via `date-fns/locale/ar-EG` (e.g., `الأربعاء، 9 سبتمبر`).
  * `relative-date.ts`: Human-scannable labels (`اليوم`, `أمس`, `منذ 4 أيام`, `⚠ منذ 21 يوماً`).

---

## 4. Application Shell

### 4.1 Layout Architecture
* **Sidebar (Pinned on Right in RTL)**:
  * **Brand**: `SEWTEC CRM` + `فرع المحلة الكبرى`.
  * **Navigation Links**:
    1. **الرئيسية (`/`)**: Daily action center.
    2. **العملاء (`/customers`)**: Dense customer table.
    3. **الفرص البيعية (`/opportunities`)**: Sales pipeline Kanban.
    4. **المتابعات (`/follow-ups`)**: Task schedule with badge for overdue count `(3)`.
    5. **الإعدادات (`/settings`)**: Branch configuration and Demo reset.
  * **Collapsible Behavior**: 230px expanded, collapses smoothly to 60px (icon-only with tooltips) for smaller screens (`1366×768`).
* **Persistent TopBar**:
  * **Global Search (`Ctrl + K`)**: Grouped Command Palette searching across:
    * *العملاء (Customers)*: Name, phone, or workshop name.
    * *الفرص (Opportunities)*: Deal name, machine model.
    * *المنتجات (Products)*: Sewing machine catalog codes.
  * **Context-Aware `+ إجراء جديد` Button**:
    * Global menu: `تسجيل مكالمة`, `تسجيل زيارة`, `متابعة جديدة`, `فرصة جديدة`, `عميل جديد`.
    * If invoked while viewing `/customers/123`, the customer is automatically pre-bound.
  * **Overdue Notifications Bell**: Instant counter badge for past-due follow-ups.
  * **User Profile & Branch Badge**: `أحمد شحاتة — مبيعات فرع المحلة`.

---

## 5. The Five Core Screens

### 5.1 Dashboard — "What should I do today?" (`/`)
An operational cockpit that prioritizes immediate actionable tasks over vanity metrics.

* **Top 4 Action-Oriented KPI Cards**:
  1. **متابعات اليوم**: Total scheduled tasks today (e.g., `12`).
  2. **متابعات متأخرة ⚠**: Overdue tasks needing immediate recovery (e.g., `3 متأخرة`).
  3. **عروض تنتظر الرد**: Active quotes pending client decision (e.g., `6 عروض`).
  4. **صفقات عالية الأولوية**: High-ticket deals in active negotiation (e.g., `4 صفقات — 520,000 ج.م`).
* **Main Screen Split (60% / 40%)**:
  * **60% Primary Feed: جدول العمل اليومي المباشر (Today's Action Schedule)**:
    * Grouped by presentation periods: *الفترة الصباحية (09:00 ص – 11:59 ص)* and *الفترة المسائية (12:00 م – 05:00 م)*.
    * Action cards display: Scheduled time, channel icon (📞, 🏢, 💬), Customer name, machine topic, and direct `[✓ إنجاز]` button.
  * **40% Secondary Column**:
    * *صفقات تتطلب تدخلاً سريعاً (Urgent Deals)*: Top deals stuck in negotiation.
    * *تنبيه عملاء بدون متابعة (Stale Leads)*: High-value customers uncontacted for >14 days.

### 5.2 Customers Directory (`/customers`)
Dense, high-throughput TanStack data table for scanning and filtering the branch customer base.

* **Toolbar**:
  * Real-time search box (name, phone, area).
  * Segment pills: `[الكل]` `[مصانع]` `[ورش]` `[تجار]` `[أفراد]`.
  * Secondary filters: Sales Rep (`أحمد`, `محمد`, `الكل`), Machine model filter.
  * Primary CTA: `+ عميل جديد` (triggers Customer Drawer).
* **Table Columns**:
  1. **العميل**: Business name + Subtitle + VIP badge.
  2. **الهاتف**: Formatted with `dir="ltr"`.
  3. **النوع**: Segment badge (`مصنع`, `ورشة`, `تاجر`, `فرد`).
  4. **الماكينات الحالية**: Truncated badge list (e.g., `JACK A4, HK2900ASS +3`) with hover popover detailing the complete factory fleet.
  5. **المسؤول**: Assigned branch sales rep.
  6. **آخر تواصل**: Relative date (`اليوم`, `منذ 4 أيام`, `⚠ منذ 21 يوماً` in amber/red if stale).
  7. **المتابعة القادمة**: Date and channel tag (red highlight if overdue).
  8. **إجمالي المبيعات**: Historical closed revenue (`tabular-nums ج.م`).
  9. **إجراءات سريعة**: Hover/persistent actions `[📞] [💬] [⋯]`. Direct call and WhatsApp buttons stop event propagation; `[⋯]` menu offers Edit, Add Follow-up, Log Contact, and View Profile.
* **Row Click**: Entire row navigates to `/customers/[id]`.

### 5.3 Customer 360 — Hero Screen (`/customers/[id]`)
The definitive source of truth for a customer relationship.

* **Header (Structured in 3 Clean Tiers)**:
  * *Tier 1*: Customer Name (`مصنع النور للملابس الجاهزة`), VIP Star, Status badge (`نشط`).
  * *Tier 2*: Type (`مصنع ملابس`), City (`المحلة الكبرى - المنطقة الصناعية`), Assigned Rep (`أحمد شحاتة`).
  * *Tier 3*: Phone link (`010-0000-1122`), WhatsApp direct action (`🟢 واتساب مباشر`), Action buttons (`[+ تسجيل تواصل]`, `[+ متابعة]`).
* **Layout Split**:
  * **Context Rail (~35% on the Right in RTL)**:
    * *Next Action Alert Card*: Displays upcoming or overdue follow-up with inline `[✓ إنجاز]` or `[تأجيل]`.
    * *Facility Metadata*: Legal structure, production capacity, full address, technical contact person.
    * *Financial Metrics*: Distinct cards for `إجمالي المبيعات` (Lifetime sales) and `قيمة الفرص المفتوحة` (Active pipeline).
    * *Installed Machine Fleet (V1 Scope)*: Clean inventory of machines owned:
      * Model (e.g. `JACK A4`, `SIRUBA 747K`)
      * Quantity
      * Serial Number (where applicable)
      * Purchase Year
      * Purchased from SewTec? (Boolean badge)
      *(Note: Detailed maintenance logs, warranty tickets, and spare parts are deferred to after-sales phase).*
  * **Main Workspace (~65% on the Left in RTL)**:
    * *Lightweight Quick Logger*: Top input box allowing instant note entry, channel pill selection (📞, 🏢, 💬, 📝), and save button, followed by an optional prompt to schedule the next follow-up.
    * *Tabbed Views*:
      1. **سجل النشاط والتواصل (Unified Timeline)**: Chronological history integrating calls, branch visits, WhatsApp exchanges, sent quotes, and completed follow-ups. Related opportunities and quotes are clickable badges.
      2. **الفرص البيعية (Opportunities)**: List of active and historical deals for this customer.
      3. **المتابعات (Follow-ups)**: Upcoming and past scheduled tasks.

### 5.4 Follow-ups Management (`/follow-ups`)
* **Views via URL Tabs**:
  * `متابعات اليوم` (`?view=today` - Default).
  * `المتأخرة ⚠` (`?view=overdue` - Filtered to past-due items).
  * `القادمة` (`?view=upcoming` - Scheduled for future dates).
  * `المكتملة` (`?view=completed` - Archive of completed interactions).
* **Structured Outcome Modal**:
  Triggered when clicking `[✓ إنجاز المتابعة]`:
  * *Outcome Selection*:
    * `مهتم 👍`: Reveals prominent next follow-up scheduler.
    * `طلب عرض سعر 📄`: Reveals next follow-up + quotation note.
    * `يحتاج وقتاً للتفكير ⏳`: Reveals next follow-up scheduler.
    * `لم يرد 📵`: Marks attempt as logged and prompts immediate 1-click retry for tomorrow morning (`غداً 11:00 ص [تأكيد]`).
    * `غير مهتم ✕`: Replaces next follow-up with structured rejection reasons (`السعر مرتفع`, `الماكينة غير مناسبة`, `اشترى من منافس`, `تأجيل المشروع`, `سبب آخر`).

### 5.5 Opportunity Pipeline Kanban (`/opportunities`)
* **Top Bar**: View toggles `[لوحة المراحل (Kanban)]` vs `[قائمة الفرص (Table)]`, Rep filter, and Pipeline Tabs:
  * `[الفرص النشطة]` (Default active workflow).
  * `[تم البيع (Won)]` (Closed deals archive).
  * `[المفقودة (Lost)]` (Lost deals archive).
* **Active Kanban Columns**:
  1. **جديد (New)** [Slate]
  2. **تم التواصل (Contacted)** [Blue]
  3. **مهتم (Interested)** [Blue]
  4. **عرض سعر (Quotation)** [Indigo]
  5. **تفاوض (Negotiation)** [Amber - Attention!]
* **Opportunity Card Details**:
  * Customer Name + Machine Model (`HIKARI HK2900ASS ×3`).
  * Deal Value (`120,000 ج.م`).
  * Sales Rep badge.
  * **Days in Stage Indicator**: (e.g. `تفاوض منذ 8 أيام ⚠` highlighted in amber if stale).
  * Next follow-up status.
* **Stage Advance Workflow**: Clicking a card opens the **Detail Inspector Drawer**, allowing the rep to advance stages, update quote amounts, and schedule the next meeting without complex drag-and-drop.

---

## 6. Slide-Over Drawers (Context-Preserving Sheets)

To maintain user flow without full-page reloads, actions open right-sliding drawers:
1. **Quick Drawer (~440px)**:
   * **تسجيل تواصل فوري (Log Interaction)**: Channel, notes, outcome, optional next follow-up.
   * **متابعة جديدة (Create Follow-up)**: Customer selector (pre-filled if inside 360), Date/Time, channel, objective.
2. **Detail Drawer (~560px)**:
   * **إضافة عميل جديد (Create Customer)**:
     * *Required (20-second entry)*: Name, Type (`مصنع`, `ورشة`, `تاجر`, `فرد`), Phone number, Assigned Rep.
     * *Optional (Expandable)*: Contact person, District/Address, Owned machines, Notes.
   * **إضافة فرصة جديدة (Create Opportunity)**:
     * Customer, Machine model, Quantity.
     * *Estimated Value (Optional)*: Allows early lead creation before exact quotes are established.
     * Target Stage, Expected close date.

---

## 7. Deterministic Demo Dataset & Acceptance Journeys

### 7.1 Realistic Seed Data (Safely Fictionalized)
All seed data utilizes `branchId: "mahalla"` to safeguard future multi-branch extensions while fictionalizing identities safely:
* **مصنع النور للملابس الجاهزة (`cust_01`)**:
  * VIP Factory, Industrial Zone, Mahalla. Contact: الحاج محمود الشناوي (`010-0000-1122`).
  * Fleet: 5× `JACK A4` (2023), 2× `SIRUBA 747K` (2022). Lifetime Sales: 385,000 ج.م.
  * Deal: `HIKARI HK2900ASS` in **Negotiation** (120,000 ج.م).
  * Follow-up: Overdue from yesterday (Follow-up on 3% bulk discount).
* **شركة الصفوة لتجارة وتوريد الماكينات (`cust_02`)**:
  * Trader/Wholesaler, Shoukry El-Kowatly St. Contact: أ/ محمد غنيم (`011-0000-3344`).
  * Deal: 3× `JACK A4B` in **Quotation** (`Q-2026-0041`, 138,000 ج.م).
* **ورشة المستقبل للملابس الرياضية (`cust_03`)**:
  * Workshop, Mansheya. Contact: إبراهيم كمال (`012-0000-5566`).
  * Stale Lead: Last contact 22 days ago (`⚠ يحتاج تواصل`).
* **مصنع الهدى للتريكو والصباغة (`cust_04`)**:
  * Large Industrial Plant. Deal: Full line replacement (310,000 ج.م, Interested).
* **أحمد حسنين الكردي (`cust_05`)**:
  * Individual Tailor, Abu Radi (`010-0000-7788`).

### 7.2 Six Acceptance Journeys (V1 Integration Scenarios)
These six workflows represent the core acceptance criteria for the implementation:
1. **Journey 1: Morning Triage (Dashboard)**: View 3 overdue tasks → Click `[✓ إنجاز]` on Al-Nour call → Select `[مهتم 👍]` → Schedule visit for Sunday → Counters update.
2. **Journey 2: Instant Global Search (`Ctrl + K`)**: Type `010-00` or `HK2900` → Grouped results appear → Press Enter → Lands directly on Customer 360.
3. **Journey 3: Customer 360 Inspection & Inline Logger**: Inspect installed fleet in Context Rail → Write note in Quick Logger → Click Save → Note prepends to Timeline immediately.
4. **Journey 4: Opportunity Negotiation (Kanban)**: Navigate to `/opportunities` → Open Al-Nour card in Inspector Drawer → Move stage from `Quotation` to `Negotiation` → Pipeline totals recalculate.
5. **Journey 5: Negative Case — No Answer (Reality Flow)**: Open overdue follow-up → Click `[✓ إنجاز]` → Select `[لم يرد 📵]` → Click 1-click retry tomorrow at 11:00 AM → Call logged as missed attempt, new task scheduled.
6. **Journey 6: Developer Reset**: Navigate to Settings → Developer / Demo → Click `إعادة ضبط البيانات التجريبية` → Confirm dialog → All changes reset to initial seed state.

---

## 8. Directory & File Structure Plan

```text
d:/SewTec_CRM/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # HTML dir="rtl", IBM Plex Sans Arabic font, TopBar & Sidebar Shell
│   │   ├── providers.tsx           # Client hydration & CrmStore initialization
│   │   ├── page.tsx                # Dashboard screen (Today's action feed + KPIs)
│   │   ├── customers/
│   │   │   ├── page.tsx            # Customers directory (TanStack table)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Customer 360 Hero screen (Workspace + Context Rail)
│   │   ├── opportunities/
│   │   │   └── page.tsx            # Opportunity Pipeline Kanban
│   │   ├── follow-ups/
│   │   │   └── page.tsx            # Follow-ups schedule (Today, Overdue, Upcoming, Completed)
│   │   └── settings/
│   │       └── page.tsx            # Settings & Reset Demo Data dialog
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (Button, Dialog, Sheet, Table, Badge, etc.)
│   │   ├── layout/                 # AppShell, Sidebar (collapsible), TopBar, GlobalSearchDialog
│   │   └── shared/                 # StatusBadge, CurrencyDisplay, PhoneLink, WhatsAppButton
│   │
│   ├── features/
│   │   ├── customers/              # CustomerTable, CustomerHeader, FleetList, CustomerDrawer, hooks, services
│   │   │   └── repositories/       # ICustomerRepository interface
│   │   ├── follow-ups/             # FollowUpCard, CompletionModal, FollowUpDrawer, hooks, services
│   │   │   └── repositories/       # IFollowUpRepository interface
│   │   ├── opportunities/          # KanbanBoard, KanbanColumn, OpportunityCard, InspectorDrawer, hooks, services
│   │   │   └── repositories/       # IOpportunityRepository interface
│   │   ├── dashboard/              # ActionSchedule, UrgentDeals, StatCards
│   │   └── interactions/           # QuickLogger, ActivityTimeline, TimelineItem
│   │
│   ├── infrastructure/             # Concrete repository implementations
│   │   ├── local-storage/          # LocalStorageCustomerRepository, LocalStorageFollowUpRepository, etc.
│   │   └── http/                   # Future ASP.NET Core fetch implementations
│   │
│   ├── data/
│   │   └── demo/                   # Deterministic seed data (customers, products, opportunities, followUps)
│   │
│   ├── lib/
│   │   ├── storage/                # CrmStore reactive store (useSyncExternalStore bridge + localStorage)
│   │   ├── dates/                  # branch-time, format-date, is-overdue, relative-date (Africa/Cairo)
│   │   ├── currency/               # Tabular EGP currency formatters
│   │   └── utils.ts
│   │
│   └── types/                      # Domain interfaces (Customer, Opportunity, FollowUp, Interaction, Activity)
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-09-09-frontend-prototype-design.md
```
