---
name: project
description: Always load at the start of every conversation for baseline project context, architecture, and conventions
---

# medusa-analytics-plugin — Project Context

## What This Is

A **Medusa v2 plugin** (`@agilo/medusa-analytics-plugin`) that adds an analytics dashboard and AI assistant to the Medusa admin. **Read-only by design** — it aggregates existing store data (orders, customers, products) on demand. The only data it ever writes is a single Vercel AI Gateway API key.

Stack: TypeScript, Medusa v2, Recharts, TanStack Query v5, Vercel AI SDK, React Hook Form + Zod, Tailwind CSS, Yarn 4, Node ≥20.

---

## Project Layout

```
src/
├── api/admin/agilo-analytics/   ← All REST endpoints (admin-only)
├── modules/ai-gateway/          ← Only custom Medusa module (stores gateway key)
├── utils/orders.ts              ← Date range helpers + exchange rate fetch
├── admin/
│   ├── routes/analytics/        ← Main dashboard page + AI dashboard page
│   ├── components/              ← Charts, cards, tables, forms
│   ├── hooks/                   ← TanStack Query wrappers + UI hooks
│   ├── lib/
│   │   ├── ai/catalog.ts        ← Zod schemas for AI-renderable components
│   │   ├── ai/registry.tsx      ← Maps AI schema names → React components (CRITICAL)
│   │   └── data/                ← Raw API fetch functions
│   └── widgets/                 ← KPI cards injected into Medusa admin zones
├── jobs/, subscribers/, workflows/, providers/, links/   ← All empty stubs
```

---

## API Endpoints

All under `/admin/agilo-analytics/` (admin-protected):

| Route                  | Method         | Purpose                                           |
| ---------------------- | -------------- | ------------------------------------------------- |
| `/orders`              | GET            | Revenue, counts, regions, status breakdown, YoY % |
| `/customers`           | GET            | New vs returning, groups, top spenders            |
| `/products`            | GET            | Top variants by qty sold, low-stock flagging      |
| `/analytics-ai`        | GET/POST/PATCH | Vercel AI Gateway key management                  |
| `/analytics-ai/chat`   | POST           | Streams JSON-render UI spec from AI               |
| `/analytics-ai/models` | GET            | Available models (filtered by provider + price)   |

---

## Critical Architecture Rules

**1. No data collection.** Never add subscribers, jobs, or writes that persist analytics events. All analytics are computed live from Medusa's existing tables via Query Graph.

**2. The AI outputs JSON specs, not text.** The chat endpoint streams a typed JSON-render spec. `lib/ai/catalog.ts` defines the Zod schema of what the AI can produce. `lib/ai/registry.tsx` maps those schema names to actual React components. **Adding a new AI-renderable component requires updating both files.**

**3. Single DB table.** `ai_gateway_key` (in `modules/ai-gateway/`) is the only table this plugin (currently) owns. It stores hashed key + last 4 digits. Soft-delete enabled.

**4. Order queries always exclude `draft` + `canceled`** (`$nin: ['draft', 'canceled']`). Do not remove this filter.

**5. Exchange rates are the only cached data.** Medusa Cache module, 24h TTL, resets 16:00 Berlin time. Nothing else is cached server-side.

---

## Frontend Patterns

- **URL-as-state:** Date range, active tab, and interval are all stored in URL query params. Use `useDateRangeParams()` to read/write date range.
- **TanStack Query:** All data fetching goes through hooks in `hooks/`. Query keys include the date range so cache invalidates automatically on filter change.
- **Stable colors:** Use `generateStableColor(string)` from `lib/utils.ts` for chart colors — hash-based HSL, consistent across re-renders.
- **Dark mode:** `useDarkMode()` watches `document.documentElement.dark` via MutationObserver. All chart components use it.
- **Card wrappers:** Use `ChartPanelCard` for charts (handles loading/error/empty states), `StatCard` for KPIs, `PanelCard` for tables/generic content. Do not build inline wrappers.

---

## Key Conventions

- **No unnecessary comments** — code should be self-documenting; only add a comment when the WHY is non-obvious
- **TypeScript strict mode** — do not disable strict checks or use `any` without a good reason
- **One responsibility per function** — keep functions small and focused
- **Don't repeat yourself** — avoid duplicating logic; extract shared code into a helper function or module. Also if some one-two line logic is only going to be used once, don't extract it into a function or some variable, just leave it in place. Don't over-engineer.
- **Follow existing code style** — match indentation, naming, and module format of the surrounding code.

---

## Dependency Caveats

- **Zod v4 + React 19 peer tension** with `@ai-sdk/react` / `ai` — check for peer dep warnings before upgrading either.
- **`@json-render/react`** drives the AI streaming UI — `useUIStream()` is the key hook.
- Medusa admin SDK version: `2.13.3` — breaking changes in minor versions are common in Medusa v2.

---

## Testing

- Integration tests in `integration-tests/` — hit real HTTP endpoints, use `.env.test`
- Unit tests in `unit-tests/` — isolated, SWC-transpiled
- No mock DB in integration tests (real DB required)
