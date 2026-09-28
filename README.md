<p align="center">
  <a href="https://www.medusajs.com">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
  </a>
</p>
<h1 align="center">
  Medusa Analytics Plugin
</h1>

<p align="center">
  Get actionable insights into your store's performance and make data-driven decisions right from the Medusa Admin dashboard.
</p>

## Overview

The Medusa Analytics Plugin is a lightweight analytics extension for the Medusa Admin dashboard. It provides store admins with a clear view of sales and product performance using focused KPIs, charts, and tables, all accessible directly within the Medusa Admin panel.

✅ Compatible with Medusa v2.11.0 and above

### Requirements

- **Medusa v2.11.0+** - This plugin requires Medusa v2.11.0 or later due to its dependency on the [Caching Module](https://docs.medusajs.com/resources/infrastructure-modules/caching), which was introduced in that version.

## Features

- **Date Range Picker** with presets: This Month, Last Month, Last 3 Months, Custom Range (applies to all analytics)
- **Tabbed Interface**: Switch between Orders and Products analytics
- **Charts & KPIs**:
  - **Orders Tab**:
    - Total Orders (KPI)
    - Total Sales (KPI)
    - Orders Over Time (Line Chart)
    - Sales Over Time (Line Chart)
    - Top Regions by Sales (Bar Chart)
    - Order Status Breakdown (Pie Chart)
  - **Products Tab**:
    - Top-Selling Products (Bar Chart)
    - Out-of-Stock Variants (Table)
    - Low Stock Variants (Table)

### Widgets

The plugin also injects analytics widgets directly into existing admin list pages, so you can view key metrics without leaving your current context:

- **Orders Widget** — appears at the top of the Orders list page (`order.list.before` zone):
  - Total Sales (KPI)
  - Total Orders (KPI)
  - Average Order Value (KPI)

- **Products Widget** — appears at the top of the Products list page (`product.list.before` zone):
  - Top-Selling Products (Bar Chart)
  - Low Stock Variants (Table)
  - Bottom-Selling Products (Bar Chart)

- **Customers Widget** — appears at the top of the Customers list page (`customer.list.before` zone):
  - New vs. Returning Customers (Chart)
  - Top Customer Groups by Sales (Chart)
  - Average Sales per Customer (Chart)

Each widget includes its own interval selector (This Month, Last Month, Last 3 Months, Custom Range) for quick filtering.

## Getting Started

1. **Install the plugin** in your Medusa project:
   ```bash
   yarn add @agilo/medusa-analytics-plugin
   ```
2. **Add the plugin** to your Medusa backend configuration. In `medusa-config.ts`, add the following to the `plugins` array:

   ```js
   plugins: [
     {
       resolve: '@agilo/medusa-analytics-plugin',
       options: {
         // Optional: leave out to disable the AI dashboard (see step 4)
         aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
       },
     },
     // ...other plugins
   ],
   ```

3. **Install dependencies:**
   ```bash
   yarn
   ```
4. **Set the Vercel AI Gateway API key** (optional, only needed for the AI dashboard). Create a key in your [Vercel AI Gateway dashboard](https://vercel.com/docs/ai-gateway), then add it to your `.env` and pass it as the `aiGatewayApiKey` plugin option (step 2):
   ```bash
   AI_GATEWAY_API_KEY=<your Vercel AI Gateway key>
   ```
   Without it, the rest of the plugin works and the AI dashboard shows a "not enabled" notice. If the option is set but empty, the server fails to start. All admins of the store share this key, and its usage is billed to your Vercel account.
5. **Run migrations and start your Medusa server:**
   ```bash
   npx medusa db:migrate
   yarn dev
   ```
6. **Access the Analytics page** from the Medusa Admin dashboard.

## Contributing

We welcome contributions and feedback.
To get involved, [open an issue](https://github.com/Agilo/medusa-analytics-plugin/issues) or [submit a pull request](https://github.com/Agilo/medusa-analytics-plugin/pulls) on [GitHub →](https://github.com/Agilo/medusa-analytics-plugin)
