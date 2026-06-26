import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  stepCountIs,
  streamText,
  tool,
  pipeUIMessageStreamToResponse,
} from 'ai';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { calculateDateRangeMethod } from '../../../../../utils/orders';
import { createConfiguredGateway } from '../gateway-key';
import { AnalyticsAIArgs, analyticsAISchema } from './validators';
import { analyticsChatSchema } from './validators';

// TODO: Add more fields, so that we can spit out to the user more data
type OrderItem = {
  quantity: number;
  product_title?: string;
  product?: { title: string };
  variant?: { title: string; product?: { title: string } };
};

function resolveDateRange(params: AnalyticsAIArgs) {
  if (params.date_from && params.date_to) {
    return calculateDateRangeMethod.custom({
      date_from: params.date_from,
      date_to: params.date_to,
      preset: 'custom',
    }).current;
  }

  if (params.preset === 'all-time') {
    return {
      start: new Date('1970-01-01T00:00:00.000Z'),
      end: new Date(),
    };
  }

  return calculateDateRangeMethod[params.preset ?? 'this-month']({
    ...params,
    preset: params.preset ?? 'this-month',
  }).current;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const result = analyticsChatSchema.safeParse(req.body);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.errors.map((err) => err.message).join(', '),
    );
  }

  const { prompt, modelId } = result.data;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const gateway = await createConfiguredGateway(req.scope);

  // TODO: See if there is a direct way to get a certain model by ID form the gateway, and only then check if it is available
  const { models: availableModels } = await gateway.getAvailableModels();
  if (!availableModels.some((model) => model.id === modelId)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Model "${modelId}" is not available.`,
    );
  }

  // Each request carries exactly one user prompt => there are no previous messages in the conversations
  const data = streamText({
    model: gateway(modelId),
    prompt,
    stopWhen: stepCountIs(5),
    system: `You are an AI analytics assistant for a Medusa store.
    Your goal is to help users understand their store data.
    You can fetch analytics for orders, customers, and products using various tools.
    When users ask questions, always use the tools to get fresh data.
    Once you have the data, summarize it clearly and mention that a visualization has been prepared.
    
    If you're asked for sales or orders, use getOrdersAnalytics.
    If you're asked for customer growth or demographics, use getCustomersAnalytics.
    If you're asked for product performance or top products, use getProductsAnalytics.
    
    Current date is ${new Date().toISOString().split('T')[0]}.`,
    tools: {
      getOrdersAnalytics: tool({
        description:
          'Get order analytics including total sales, order count, and sales over time.',
        inputSchema: analyticsAISchema,
        execute: async (params) => {
          const current = resolveDateRange(params);

          const { data: orders } = await query.graph({
            entity: 'order',
            fields: ['id', 'total', 'created_at', 'status', 'currency_code'],
            filters: {
              created_at: {
                $gte: current.start.toISOString(),
                $lte: current.end.toISOString(),
              },
              status: { $nin: ['draft', 'canceled'] },
            },
          });

          const orderCounts = orders.reduce(
            (acc: Record<string, number>, order) => {
              const date = new Date(order.created_at)
                .toISOString()
                .split('T')[0];

              acc[date] = (acc[date] ?? 0) + 1;

              return acc;
            },
            {},
          );

          return {
            total_orders: orders.length,
            total_sales: orders.reduce(
              (acc: number, o) => acc + (Number(o.total) || 0),
              0,
            ),
            currency: orders[0]?.currency_code || 'USD',
            order_count: Object.entries(orderCounts).map(([name, count]) => ({
              name,
              count,
            })),
            hasMore: orders.length > 10,
            date_range: {
              from: current.start.toISOString(),
              to: current.end.toISOString(),
            },
          };
        },
      }),
      getCustomersAnalytics: tool({
        description:
          'Get customer analytics such as total customers and new customers.',
        inputSchema: analyticsAISchema,
        execute: async (params) => {
          const current = resolveDateRange(params);

          const { data: customers } = await query.graph({
            entity: 'customer',
            fields: ['id', 'created_at', 'email'],
            filters: {
              created_at: {
                $gte: current.start.toISOString(),
                $lte: current.end.toISOString(),
              },
            },
          });

          return {
            new_customers: customers.length,
            customers: customers
              .map((c) => ({ id: c.id, created_at: c.created_at }))
              .slice(0, 10),
            date_range: {
              from: current.start.toISOString(),
              to: current.end.toISOString(),
            },
          };
        },
      }),
      getProductsAnalytics: tool({
        description:
          'Get product analytics including top selling products and inventory status.',
        inputSchema: analyticsAISchema,
        execute: async (params) => {
          const current = resolveDateRange(params);

          const { data: orders } = await query.graph({
            entity: 'order',
            fields: [
              'id',
              'items.quantity',
              'items.variant.title',
              'items.product.title',
            ],
            filters: {
              created_at: {
                $gte: current.start.toISOString(),
                $lte: current.end.toISOString(),
              },
              status: { $nin: ['draft', 'canceled'] },
            },
          });

          const productSales: Record<string, number> = {};
          orders.forEach((o) => {
            (o.items as OrderItem[] | undefined)?.forEach((i) => {
              const title =
                i.product_title ||
                i.product?.title ||
                i.variant?.product?.title ||
                i.variant?.title ||
                'Unknown Product';
              productSales[title] =
                (productSales[title] || 0) + (i.quantity || 0);
            });
          });

          const topProducts = Object.entries(productSales)
            .map(([title, quantity]) => ({ title, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

          return {
            topProducts,
            date_range: {
              from: current.start.toISOString(),
              to: current.end.toISOString(),
            },
          };
        },
      }),
    },
  });

  pipeUIMessageStreamToResponse({
    response: res,
    stream: data.toUIMessageStream(),
  });
}
