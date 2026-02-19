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

## Contributing

We welcome contributions and feedback.
To get involved, [open an issue](https://github.com/Agilo/medusa-analytics-plugin/issues) or [submit a pull request](https://github.com/Agilo/medusa-analytics-plugin/pulls) on [GitHub →](https://github.com/Agilo/medusa-analytics-plugin)
