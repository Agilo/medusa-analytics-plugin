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

### AI Gateway key storage (`ai_gateway` module)
Per-admin-user Vercel AI Gateway API keys are stored server-side, never returned to the client after creation:
- `src/modules/ai-gateway/` is a standalone Medusa module (`AiGatewayModuleService` extends `MedusaService`) with its own model (`AiGatewayKey`) and migrations.
- `src/links/ai-gateway-key-user.ts` links `ai_gateway_key` to Medusa's core `user` module via `defineLink` — this is how a key is associated with an admin user without the module depending on the user module directly.
- Keys are AES-256-GCM encrypted at rest (`src/modules/ai-gateway/utils/crypto.ts`) using `AI_GATEWAY_ENCRYPTION_KEY` (sha256-derived key; env var is *not* the Gateway API key itself — see README's "Getting Started" step 4). Changing that secret invalidates all stored keys.
- `POST`/`PATCH` on `.../analytics-ai` route validate the key against the real Gateway (`assertValidGatewayKey` in `src/utils/gateway-key.ts`) before persisting; only `key_last_four` and `configured` ever go back to the client, never `key_encrypted` or the plaintext.
- After migration changes in this module, consuming apps must run `npx medusa db:migrate`.

### Analytics query pattern
Admin analytics routes (`src/api/admin/agilo-analytics/{orders,products,customers}/route.ts`) follow the same shape: validate query params with a zod schema in the sibling `validators.ts` (via `isDataValid` in `src/utils/data-validation.ts`), resolve `ContainerRegistrationKeys.QUERY` to run `query.graph(...)`, compute current vs. previous period from `date_from`/`date_to`/`preset` using `calculateDateRangeMethod` (`src/utils/orders.ts`), and group results into day/week/month buckets with `getDateGroupingKey`/`getAllDateGroupingKeys`. The Cache module (`Modules.CACHE`, requires Medusa >=2.11.0) is used to avoid recomputing expensive aggregations on repeat requests — this is the plugin's hard minimum-Medusa-version dependency.

### Admin UI build boundary
`tsconfig.json` explicitly excludes `src/admin` — admin/frontend code has its own `src/admin/tsconfig.json` and is built separately (Vite, referenced via `medusa plugin:build`/`plugin:develop`) from the backend TS that compiles to `.medusa/server`. Don't assume one tsconfig governs both.

### Widgets vs. routes
`src/admin/widgets/{Orders,Products,Customers}.tsx` inject into existing Medusa admin list pages (`order.list.before`, `product.list.before`, `customer.list.before` zones) and are separate entry points from the dedicated `/analytics` and `/analytics/ai-dashboard` routes — they reuse the same data hooks (`src/admin/hooks/*-analytics.tsx`) and lib fetchers (`src/admin/lib/data/*.ts`) but render a reduced subset of KPIs/charts.
