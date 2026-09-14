# SewTec CRM UI System & Component Ecosystem

The UI is Arabic-first and RTL. The supplied SewTec artwork informs the red accents,
graphite navigation, and light working surfaces. Brand assets are in `public/images`.

## Typography

- **Primary Arabic**: **Alexandria** (`next/font/google`), weights 300 to 800 with natural letter spacing (`letter-spacing: normal`). Alexandria provides modern, high-readability digital glyphs that avoid the blocky heaviness of older Kufic fonts and prevent Arabic cursive ligature clipping.
- **Secondary Latin & Numerals**: **Inter** (`next/font/google`) with `font-feature-settings: "cv11", "ss01"` for clear tabular figures, machine codes, and international phone prefixes.

---

## Complete 15 Modern UI Libraries & Primitives Installation

All 15 modern application, CRM, micro-interaction, and shadcn registry libraries are installed and configured in the project.

### 1. Application & Enterprise CRM Primitives (Dense UI)

- **Kokonut UI** (`src/components/ui/kokonut-input.tsx`, `kokonut-card.tsx`, `kokonut-action-menu.tsx`):
  - Micro-components, profile cards, input groups with copy/clear/shortcut pills, and action menus designed specifically for modern SaaS dashboards.
  - Configured in `components.json` via `@kokonutui: "https://kokonutui.com/r/{name}"`.
- **CuiCui** (`src/components/ui/cuicui-badge.tsx`, `cuicui-button.tsx`):
  - Community-driven component library with ready-to-copy application UI, navigation bars, interactive buttons with shimmer and glow states, and status badges.
  - Configured in `components.json` via `@cuicui: "https://cuicui.dev/r/{name}.json"`.
- **Sailboat UI** (`src/components/ui/sailboat-stats.tsx`):
  - Over 150+ free Tailwind CSS components focused on data-dense admin panels, tables, metrics with sparkline progress, and advanced multi-tag filter panels.
- **HyperUI** (`src/components/ui/hyperui-stat-card.tsx`, `src/features/interactions/components/ActivityTimeline.tsx`):
  - Massive collection of Tailwind CSS components covering CRM stat cards, target progress bars, table layouts, and data-dense activity timeline feeds.

---

### 2. Specialized Micro-Interactions & Animation Registries

- **Motion Primitives** (`src/components/ui/motion-toolbar.tsx`, `fluid-tabs.tsx`, `expandable-card.tsx`, `motion-icon.tsx`):
  - Built on Framer Motion / Motion v13. Exceptional for fluid tab switches, floating action toolbars, drawer morphing, and smooth expandable cards with spring physics.
  - Configured in `components.json` via `@motion-primitives: "https://motion-primitives.com/c/{name}.json"`.
- **React Bits** (`src/components/ui/react-bits-mesh.tsx`):
  - Rich animation patterns, interactive gradient meshes, text scramble/reveal animations, and background micro-effects that bring flat dashboards to life.
- **Cult UI** (`src/components/ui/dynamic-island.tsx`):
  - High-end interactive components: dynamic island widgets morphing between idle, phone call, deal-won, and alert states, compatible with shadcn/ui.
  - Configured in `components.json` via `@cult-ui: "https://cult-ui.com/r/{name}.json"`.
- **Hover.dev** (`src/components/ui/hover-card-3d.tsx`, `src/components/ui/spotlight-card.tsx`):
  - Huge catalog of animated UI elements, 3D perspective tilt cards with glare lighting, magnetic attraction buttons, and radial cursor-spotlight cards.

---

### 3. Visual Effects & Hero Showcase Components

- **Magic UI** (`src/components/ui/number-ticker.tsx`, `border-beam.tsx`, `dot-pattern.tsx`, `bento-grid.tsx`, `dock.tsx`, `animated-gradient-text.tsx`, `ripple.tsx`):
  - Benchmark for visual flair in the shadcn ecosystem: Bento grids, macOS magnification dock, animated border beams, number ticker counters, and particle fields.
  - Configured in `components.json` via `@magicui: "https://magicui.design/r/{name}"`.
- **Uiverse.io** (`src/components/ui/uiverse-elements.tsx`):
  - Open-source custom CSS/Tailwind elements: orbit/wave/pulse loaders, interactive toggle switches, and custom animated checkboxes with SVG draw.
- **Fancy Components** (`src/components/ui/fancy-elements.tsx`):
  - Focused on creative and visual components: gradient shimmer text and glowing rotating conic-gradient badges for VIP accounts and high-value deals.
  - Configured in `components.json` via `@fancycomponents: "https://fancycomponents.dev/r/{name}.json"`.

---

### 4. Direct shadcn/ui Registries & Extensions

- **shadcn-phone-input** (`src/components/ui/phone-input.tsx`):
  - International phone input component with Egyptian flag 🇪🇬 and country selector, input masking (`010-0000-0000`), quick clipboard copy, direct WhatsApp launcher, and phone dialer.
- **AutoForm for shadcn** (`src/components/ui/auto-form.tsx`):
  - Automatically generates accessible forms with validation directly from Zod schemas using shadcn inputs, selects, textareas, and switches, with full Arabic error messages.
- **shadcn-data-table** (`src/components/ui/data-table.tsx`):
  - Production-ready data table with search filtering, column sorting, pagination controls, and row styling.
- **Plate.js** (`src/components/ui/plate-editor.tsx`):
  - Rich-text editor built on top of shadcn/ui design principles with toolbar formatting (bold, italic, headings, lists, quotes, code, RTL/LTR direction toggle), word count, and export for CRM communication notes, contract drafting, and quotation comments.

---

## Interactive Showcase Catalog

Visit `/design-system` in the app (linked from the main sidebar as "دليل المكونات") to explore live, interactive widgets for all 15 libraries with tabbed categorization, dark/light theme toggle, and Arabic RTL support.

