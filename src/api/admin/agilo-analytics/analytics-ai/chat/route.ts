import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { streamText, tool, stepCountIs } from 'ai';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { z } from 'zod';
import { createConfiguredGateway } from '../../../../../utils/gateway-key';
import { catalog } from '../../../../../admin/lib/ai/catalog';
import { analyticsChatRequestSchema } from './validators';
import { isDataValid } from '../../../../../utils/data-validation';

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    prompt,
    context: { modelId },
  } = isDataValid({
    data: req.body,
    schema: analyticsChatRequestSchema,
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const gateway = await createConfiguredGateway(req.scope);

  const today = new Date().toISOString().split('T')[0];

  const result = streamText({
    model: gateway(modelId),
    stopWhen: stepCountIs(12),
    prompt,
    system: `${catalog.prompt()}

You are an analytics assistant for a Medusa commerce store. You have read access to
the whole store database through the \`queryDatabase\` tool, plus a quick overview via
\`getStoreSnapshot\`.

Workflow:
1. Call getStoreSnapshot first to learn the store currency and headline totals.
2. Call queryDatabase as many times as you need to gather the exact data the user's
   question requires (orders, customers, products, line items, regions, carts, sales
   channels, …). Do the aggregation, bucketing and sorting yourself from the returned
   rows — never dump raw rows straight into a chart.
3. Then output ONLY the UI spec described above to render a dashboard that answers the
   question. Do not write any prose, explanations or commentary — emit only the spec.

Layout rules:
- The root node is a single Dashboard. Put everything inside it.
- Use a Grid (columns 1-4) to lay cards out side by side. Group related StatCards in
  one Grid row.
- Every chart (LineChart, BarChart, PieChart, StackedBarChart) MUST be wrapped in its
  own ChartCard, and a ChartCard holds EXACTLY ONE chart. Never place a chart directly
  inside a Dashboard or Grid, and never put two charts in one ChartCard.
- Put Tables and standalone Text inside a Card.

Chart data rules — this is where most mistakes happen, follow exactly:
- Each chart's \`data\` is an array of flat row objects, and EVERY row has the SAME keys.
- Every key referenced by xKey / yKey / nameKey / valueKey / seriesKeys must exist
  verbatim (case-sensitive) on every row, otherwise the chart renders empty.
- Numeric values (the y value, the pie slice value, every stacked series value) MUST be
  raw JSON numbers — e.g. 12400, never the string "12400" and NEVER a formatted string
  like "€12,400". A formatted or currency string in chart data breaks the axes.
- Only the x-axis / category / slice LABELS may be strings (e.g. "Jan", "Germany").
- Keep charts readable: aggregate into a small number of rows (roughly ≤12 for a time
  series, top N for category/bar charts) and sort sensibly (chronological for time,
  descending value for rankings).
- Pick the right type: LineChart for trends over time, BarChart to compare categories,
  PieChart for share/distribution, StackedBarChart for multiple numeric series per
  category.

Example of a correct BarChart \`data\` payload (wrapped in a ChartCard titled e.g.
"Revenue by region"):
  data: [
    { "region": "Germany", "revenue": 18400 },
    { "region": "France",  "revenue": 12950 },
    { "region": "Spain",   "revenue":  8300 }
  ], xKey: "region", yKey: "revenue"

Currency & formatting:
- The store currency comes from the snapshot. Pre-format currency as a string ONLY where
  it is displayed as text: StatCard.value (e.g. "€12,400"), Table cells and Text. Do NOT
  format currency inside chart data — keep those raw numbers (see the chart data rules).
- If a query returns no rows, render a short Text saying there is no data for that
  question instead of inventing numbers.
- Today's date is ${today}.`,
    tools: {
      getStoreSnapshot: tool({
        description:
          'High-level snapshot of the store: order count and total sales, customer count, product count, and the default currency. Call this first for context.',
        inputSchema: z.object({}),
        execute: async () => {
          // Optimization for AI, important data + fetches in parallel so the AI can get the snapshot more quickly
          const [ordersRes, customersRes, productsRes] = await Promise.all([
            query.graph({
              entity: 'order',
              fields: ['id', 'total', 'currency_code', 'created_at', 'status'],
              filters: { status: { $nin: ['draft'] } },
            }),
            query.graph({ entity: 'customer', fields: ['id', 'created_at'] }),
            query.graph({ entity: 'product', fields: ['id', 'status'] }),
          ]);

          const orders = ordersRes.data;
          const currency = orders[0]?.currency_code?.toUpperCase() || 'USD';
          const totalSales = orders.reduce(
            (acc: number, o) => acc + (Number(o.total) || 0),
            0,
          );

          return {
            currency,
            today,
            orders: {
              count: orders.length,
              total_sales: Number(totalSales.toFixed(2)),
            },
            customers: { count: customersRes.data.length },
            products: { count: productsRes.data.length },
          };
        },
      }),
      queryDatabase: tool({
        description:
          'Run a read-only query against the store database via the Medusa graph. Specify an entity, the fields/relations to return (dot-paths), optional filters and ordering, and a row limit. Use it to pull any data you need before composing the dashboard.',
        inputSchema: z.object({
          entity: z
            .string()
            .describe(
              'Entity name, e.g. "order", "customer", "product", "cart", "region", "sales_channel".',
            ),
          fields: z
            .array(z.string())
            .min(1)
            .describe(
              'Fields/relations as dot-paths, e.g. ["id","total","created_at","customer.email","items.quantity"].',
            ),
          filters: z
            .record(z.string(), z.unknown())
            .nullable()
            .describe(
              'Optional Medusa filters, e.g. { "status": { "$nin": ["draft"] } }. Use null for none.',
            ),
          limit: z.number().min(1).max(500).default(100),
          order: z
            .record(z.string(), z.enum(['ASC', 'DESC']))
            .nullable()
            .describe(
              'Optional ordering, e.g. { "created_at": "DESC" }. Use null for none.',
            ),
        }),
        execute: async ({ entity, fields, filters, limit, order }) => {
          try {
            const { data } = await query.graph({
              entity,
              fields,
              filters: filters ?? undefined,
              pagination: {
                take: limit,
                ...(order ? { order } : {}),
              },
            });
            return { entity, count: data.length, rows: data };
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      }),
    },
  });
  result.pipeTextStreamToResponse(res);
}
