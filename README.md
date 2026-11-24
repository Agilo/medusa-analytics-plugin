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
- **Tabbed Interface**: Switch between Orders, Products, Customers and Returns analytics
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
  - **Customers Tab**:
    - Total, New and Returning Customers (KPIs)
    - Average Sales per Customer (KPI)
    - New vs. Returning Customers (Chart)
    - Top Customer Groups by Sales (Chart)
    - Top Customers by Sales (Table)
  - **Returns Tab**:
    - Total Returns (KPI)
    - Return Rate (KPI)
    - Returned Value (KPI)
    - Returns Over Time (Line Chart)
    - Return Reasons (Bar Chart)
    - Most-Returned Products (Table)

### How returns are counted

- A return counts once it's confirmed: its status is **requested**, **received** or **partially received**. Returns that were started but not confirmed (**open**) and **canceled** returns are left out. Returns created as part of exchanges and claims are included.
- **Total Returns**, **Returned Value**, **Returns Over Time** and **Return Reasons** use the **date the return was created**: they cover returns created in the selected period, whenever the order was placed.
  - Returned Value is the value of the returned units (their share of the line item total), converted to the store's default currency.
  - Return Reasons sums the requested quantity per reason. Items without a reason are shown as "No reason".
- **Return Rate** and **Most-Returned Products** are based on the **orders placed in the selected period** (draft and canceled orders excluded), whenever they were returned:
  - Return Rate is the share of those orders with at least one return.
  - Most-Returned Products lists every returned variant, most returned first, with the quantity sold in those same orders and the resulting return rate. The table can be searched, sorted and paged.
- Because Return Rate follows the orders placed in the period, it can rise later as more of those orders are returned. Recent periods may therefore show a lower rate than they will end up with, and the change against the previous period tends to look negative, because the previous period's orders have had more time to be returned.

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
