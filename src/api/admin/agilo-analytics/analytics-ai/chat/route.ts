import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { streamText, tool, stepCountIs } from 'ai';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { z } from 'zod';
import { createConfiguredGateway } from '../gateway-key';
import { catalog } from '../../../../../admin/lib/ai/catalog';

// useUIStream POSTs { prompt, context, currentSpec }. The selected model id
// is carried in `context` (set on the client via send(prompt, { modelId })).
const requestSchema = z.object({
  prompt: z.string().min(1, 'Please enter a question'),
  context: z.object({
    modelId: z.string().min(1, 'Please select a model'),
  }),
  currentSpec: z.unknown().optional(),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.issues.map((err) => err.message).join(', '),
    );
  }

  const { prompt } = parsed.data;
  const { modelId } = parsed.data.context;

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

Follow this workflow:
1. Call getStoreSnapshot first to learn the store currency and headline totals.
2. Call queryDatabase as many times as you need to gather the exact data the user's
   question requires (orders, customers, products, line items, regions, carts, sales
   channels, …). Do the aggregation/shaping yourself from the returned rows.
3. Then output ONLY the UI spec described above to render a dashboard that answers the
   question. Do not write any prose, explanations or commentary — emit only the spec.

Guidelines:
- Compose the dashboard freely: mix StatCards, ChartCards (containing Line/Bar/Pie/
  StackedBar charts), Tables and Text inside a Dashboard/Grid. You are NOT limited to
  any fixed layout from the existing pages.
- Pre-format every currency value as a string using the store currency from the snapshot.
- Today's date is ${today}.`,
    tools: {
      getStoreSnapshot: tool({
        description:
          'High-level snapshot of the store: order count and total sales, customer count, product count, and the default currency. Call this first for context.',
        inputSchema: z.object({}),
        execute: async () => {
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

  // Stream the raw JSONL spec (text deltas) — useUIStream parses it line by line.
  result.pipeTextStreamToResponse(res);
}
