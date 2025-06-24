<p align="center">
  <a href="https://www.medusajs.com">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
  </a>
</p>
<h1 align="center">
  Medusa Analytics Plugin
</h1>

<p align="center">
  Actionable analytics for Medusa Admin focused on Orders and Products
</p>

## Overview

The Medusa Analytics Plugin is a lightweight analytics extension for the Medusa admin dashboard. It provides store admins with actionable insights into orders and products through a clean, focused dashboard. This MVP is designed for rapid deployment and easy use, with no reporting/export features.

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
    - Out-of-Stock Variants (Table: SKU, Variant Name, Inventory)
    - Low Stock Variants (Table: SKU, Variant Name, Inventory)

## Getting Started

1. **Install the plugin** in your Medusa project:
   ```bash
   npx medusa plugin:add @agilo/medusa-analytics-plugin
   ```
2. **Add the plugin** to your Medusa backend configuration. In your `medusa-config.js` or `medusa-config.ts`, add the following to the `plugins` array:

   ```js
   plugins: [
     {
       resolve: '@agilo/medusa-analytics-plugin',
       options: {},
     },
     // ...other plugins
   ],
   ```

3. **Install dependencies:**
   ```bash
   yarn
   ```
4. **Start your Medusa server:**
   ```bash
   yarn dev
   ```
5. **Access the Analytics page** from the Medusa Admin dashboard.

## Tech Stack

- [Medusa](https://medusajs.com/)
- [Recharts](https://recharts.org/) for charts
- Medusa UI DataTable for tables

## Contributing

We welcome contributions! Please open issues or pull requests on [GitHub](https://github.com/Agilo/medusa-analytics-plugin).
