# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@agilo/medusa-analytics-plugin` — a Medusa v2 (>=2.11.0) admin plugin that adds an analytics dashboard (Orders/Products tabs, list-page widgets) plus an AI-generated analytics dashboard backed by the Vercel AI Gateway. Published to npm; consuming Medusa apps install it and add it to `medusa-config.ts`'s `plugins` array.

## Commands

```bash
yarn dev                # medusa plugin:develop — local dev/watch loop
yarn build               # medusa plugin:build — compiles to .medusa/server (this is what gets published)
yarn test                # integration tests (HTTP), needs local Postgres — TEST_TYPE=integration:http
yarn test:unit           # unit tests — TEST_TYPE=unit, no DB needed
yarn lint                # prettier --check .
yarn lint:fix             # prettier --write .
```

Run a single test file with jest directly, e.g.:

```bash
TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules yarn jest unit-tests/utils/orders.spec.ts
TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules yarn jest integration-tests/http/orders.spec.ts
```

Integration tests read `integration-tests/.env.test` (DB_HOST/DB_USERNAME/DB_PASSWORD, `AI_GATEWAY_ENCRYPTION_KEY`, etc.), spin up a per-worker temp Postgres DB (`pg-god`), and drop it in `afterAll`. Unit tests (`unit-tests/`) don't touch a DB.

## Architecture

### Two dashboards, two data paths

- **Fixed dashboard** (`src/admin/routes/analytics/page.tsx`, `src/admin/components/analytics/{Orders,Products,Customers}Tab.tsx`): hand-built charts/KPIs/tables driven by admin API routes under `src/api/admin/agilo-analytics/{orders,products,customers}/route.ts`. Date range state flows through `src/admin/hooks/use-date-range-params.tsx` / `use-interval-range.tsx`.
- **AI dashboard** (`src/admin/routes/analytics/ai-dashboard/page.tsx`): the model streams a JSON UI tree that is validated and rendered client-side via `@json-render`. `src/admin/lib/ai/catalog.ts` is the zod schema of allowed components/props (Dashboard, Grid, StatCard, ChartCard, etc.); `src/admin/lib/ai/registry.tsx` maps each catalog component to an actual React renderer (reusing the same chart/card components as the fixed dashboard). Chat/streaming goes through `src/api/admin/agilo-analytics/analytics-ai/chat/route.ts`; model listing through `.../analytics-ai/models/route.ts`.

When changing what the AI can render, `catalog.ts` and `registry.tsx` must be updated together — the catalog is both the LLM's tool schema and the client-side validator, the registry is the only thing that turns a valid tree into UI.

### AI Gateway key (`ai_gateway` module)

One Vercel AI Gateway key per install, supplied by whoever installs the plugin — admins never see or enter it:

- The consuming app passes `aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY` in the plugin `options`; Medusa hands plugin options to every module in the plugin. Plugin code never reads `process.env` directly.
- `src/modules/ai-gateway/` is a model-less module: `AiGatewayModuleService` is a plain class exposing `isEnabled()` and `getApiKey()`. Routes reach the key only through it (`createConfiguredGateway` in `src/utils/gateway-key.ts`).
- Missing option = AI dashboard disabled, not a boot error: `GET .../analytics-ai` returns `{ enabled: false }` and chat/models return 400 via `getApiKey()`. Empty-string option throws at boot (`loaders/validate-options.ts`). No network check at boot; a wrong key surfaces from `assertValidGatewayKey` on the first models-cache miss.
- The repo's `medusa-config.js` (integration tests only) deliberately passes no key, so tests cover the disabled path and never call Vercel.

### Analytics query pattern

Admin analytics routes (`src/api/admin/agilo-analytics/{orders,products,customers}/route.ts`) follow the same shape: validate query params with a zod schema in the sibling `validators.ts` (via `isDataValid` in `src/utils/data-validation.ts`), resolve `ContainerRegistrationKeys.QUERY` to run `query.graph(...)`, compute current vs. previous period from `date_from`/`date_to`/`preset` using `calculateDateRangeMethod` (`src/utils/orders.ts`), and group results into day/week/month buckets with `getDateGroupingKey`/`getAllDateGroupingKeys`. The Cache module (`Modules.CACHE`, requires Medusa >=2.11.0) is used to avoid recomputing expensive aggregations on repeat requests — this is the plugin's hard minimum-Medusa-version dependency.

### Admin UI build boundary

`tsconfig.json` explicitly excludes `src/admin` — admin/frontend code has its own `src/admin/tsconfig.json` and is built separately (Vite, referenced via `medusa plugin:build`/`plugin:develop`) from the backend TS that compiles to `.medusa/server`. Don't assume one tsconfig governs both.

### Widgets vs. routes

`src/admin/widgets/{Orders,Products,Customers}.tsx` inject into existing Medusa admin list pages (`order.list.before`, `product.list.before`, `customer.list.before` zones) and are separate entry points from the dedicated `/analytics` and `/analytics/ai-dashboard` routes — they reuse the same data hooks (`src/admin/hooks/*-analytics.tsx`) and lib fetchers (`src/admin/lib/data/*.ts`) but render a reduced subset of KPIs/charts.
