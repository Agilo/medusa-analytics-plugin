import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

const chartRow = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .describe(
    'A data row keyed by field name, e.g. { "name": "Jan", "value": 1200 }',
  );

export const catalog = defineCatalog(schema, {
  components: {
    Dashboard: {
      props: z.object({}),
      slots: ['default'],
      description:
        'Root vertical stack for the whole generated dashboard. Place Grids, cards and charts inside it.',
    },
    Grid: {
      props: z.object({
        columns: z
          .number()
          .min(1)
          .max(4)
          .default(2)
          .describe(
            'Number of columns on desktop (1-4). Always stacks to 1 column on mobile.',
          ),
      }),
      slots: ['default'],
      description: 'Responsive grid. Put cards and charts as its children.',
    },
    StatCard: {
      props: z.object({
        label: z.string().describe('Metric name, e.g. "Total Sales".'),
        value: z
          .string()
          .describe('Pre-formatted value, e.g. "€12,400" or "128".'),
        trend: z
          .number()
          .nullable()
          .describe(
            'Percentage change vs previous period (e.g. 12.5 or -4). Use null if unknown.',
          ),
        icon: z
          .enum(['orders', 'sales', 'customers', 'products'])
          .nullable()
          .describe(
            'Optional icon hint matching the metric. Use null for none.',
          ),
      }),
      description: 'A single KPI tile for a headline number.',
    },
    ChartCard: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      slots: ['default'],
      description:
        'A titled card that frames exactly one chart (LineChart, BarChart, PieChart or StackedBarChart) as its only child.',
    },
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      slots: ['default'],
      description:
        'A generic titled card for arbitrary content such as a Table or Text.',
    },
    LineChart: {
      props: z.object({
        data: z
          .array(chartRow)
          .describe('Ordered rows, typically a time series.'),
        xKey: z.string().describe('Row field for the x-axis labels.'),
        yKey: z.string().describe('Row field for the numeric line value.'),
        color: z
          .string()
          .nullable()
          .describe('Optional hex line color, e.g. "#82ca9d".'),
      }),
      description: 'Line chart for trends over time.',
    },
    BarChart: {
      props: z.object({
        data: z.array(chartRow),
        xKey: z.string().describe('Row field for the category axis.'),
        yKey: z.string().describe('Row field for the numeric bar value.'),
        horizontal: z
          .boolean()
          .default(false)
          .describe('Render bars horizontally.'),
      }),
      description: 'Bar chart for comparing categories.',
    },
    PieChart: {
      props: z.object({
        data: z.array(chartRow),
        nameKey: z.string().describe('Row field used as the slice label.'),
        valueKey: z
          .string()
          .describe('Row field used as the numeric slice value.'),
      }),
      description: 'Pie chart for share / distribution breakdowns.',
    },
    StackedBarChart: {
      props: z.object({
        data: z.array(chartRow),
        xKey: z.string().describe('Row field for the category axis.'),
        seriesKeys: z
          .array(z.string())
          .describe(
            'Row fields to stack, e.g. ["new_customers", "returning_customers"].',
          ),
      }),
      description:
        'Stacked bar chart for comparing multiple numeric series per category.',
    },
    Table: {
      props: z.object({
        columns: z
          .array(z.object({ key: z.string(), label: z.string() }))
          .describe('Column definitions in display order.'),
        rows: z
          .array(chartRow)
          .describe('Row objects keyed by the column keys.'),
      }),
      description:
        'A simple data table for listings (top products, top customers, etc.).',
    },
    Text: {
      props: z.object({
        content: z.string(),
        muted: z
          .boolean()
          .default(false)
          .describe('Render in a muted/secondary color.'),
      }),
      description: 'A short paragraph of text or an insight.',
    },
  },
  actions: {},
});
