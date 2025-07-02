import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  BigNumber,
  ContainerRegistrationKeys,
} from '@medusajs/framework/utils';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  calculateDateRangeMethod,
  generateKeyRange,
  getGroupKey,
} from '../../../../utils/orders';

export const adminOrdersListQuerySchema = z.discriminatedUnion("preset", [
  z.object({
    preset: z.literal("custom"),
    date_from: z.string(),
    date_to: z.string(),
  }),
  z.object({
    preset: z.literal("this-month"),
  }),
  z.object({
    preset: z.literal("last-month"),
  }),
  z.object({
    preset: z.literal("last-3-months"),
  }),
]);
const DEFAULT_CURRENCY = 'EUR';

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const validatedQuery = adminOrdersListQuerySchema.parse(req.query);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  const pluginConfig = config.plugins.find((p) =>
    typeof p === 'string'
      ? p === '@agilo/medusa-analytics-plugin'
      : p.resolve === '@agilo/medusa-analytics-plugin',
  );

  // TODO: replace with store default currency
  const currencyCode =
    typeof pluginConfig === 'string'
      ? DEFAULT_CURRENCY
      : pluginConfig?.options?.currency_code || DEFAULT_CURRENCY;

  // TODO: cache response for 1 day (research caching strategies)
  const response = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=${currencyCode}`,
  );
  const exchangeRates = await response.json();

  const calculateDateRange = calculateDateRangeMethod[validatedQuery.preset];

  if (!calculateDateRange) {
    throw new Error('Invalid preset value');
  }

  const { current, previous, days } = calculateDateRange(validatedQuery);

  const currentFrom = format(current.start, 'yyyy-MM-dd');
  const currentTo = format(current.end, 'yyyy-MM-dd');
  const previousFrom = format(previous.start, 'yyyy-MM-dd');
  const previousTo = format(previous.end, 'yyyy-MM-dd');

  // TODO: move this to a service
  const { data: orders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'total',
      'created_at',
      'status',
      'currency_code',
      'region.name',
    ],
    pagination: {
      order: {
        created_at: 'asc',
      },
    },
    filters: {
      created_at: {
        $gte: currentFrom + 'T00:00:00Z',
        $lte: currentTo + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
  });

  const { data: prevRangeOrders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'total',
      'created_at',
      'status',
      'currency_code',
      'region.name',
    ],
    pagination: {
      order: {
        created_at: 'asc',
      },
    },
    filters: {
      created_at: {
        $gte: previousFrom + 'T00:00:00Z',
        $lte: previousTo + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
  });

  let groupBy: 'day' | 'week' | 'month' = 'day';
  if (days > 120) {
    groupBy = 'month';
  } else if (days > 30) {
    groupBy = 'week';
  }

  const keyRange = generateKeyRange(groupBy, currentFrom, currentTo,);

  let regions: Record<string, number> = {};
  let totalSales = 0;
  let statuses: Record<string, number> = {};

  const groupedByKey: Record<string, { orderCount: number; sales: number }> =
    {};

  for (const order of orders) {
    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;

    const key = getGroupKey(
      new Date(order.created_at),
      groupBy,
      currentFrom,
      currentTo,
    );

    if (!groupedByKey[key]) {
      groupedByKey[key] = { orderCount: 0, sales: 0 };
    }

    groupedByKey[key].orderCount += 1;
    groupedByKey[key].sales += orderTotal;

    totalSales += orderTotal;

    if (order.region?.name) {
      regions[order.region.name] =
        (regions[order.region.name] ?? 0) + orderTotal;
    }

    if (order.status) {
      statuses[order.status] = (statuses[order.status] ?? 0) + 1;
    }
  }

  let prevTotalSales = 0;
  for (const order of prevRangeOrders) {
    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;
    prevTotalSales += orderTotal;
  }
  const prevTotalOrders = prevRangeOrders.length;

  const percentOrders = getPercentChange(orders.length, prevTotalOrders);
  const percentSales = getPercentChange(totalSales, prevTotalSales);

  const salesArray = keyRange.map((date) => ({
    name: date,
    sales: groupedByKey[date]?.sales ?? 0,
  }));

  const orderCountArray = keyRange.map((date) => ({
    name: date,
    count: groupedByKey[date]?.orderCount ?? 0,
  }));

  const regionsArray = Object.entries(regions)
    .map(([region, amount]) => ({
      name: region,
      sales: Number(amount.toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const statusesArray = Object.entries(statuses).map(([status, count]) => ({
    name: status,
    count,
  }));

  const orderData = {
    total_orders: orders.length,
    prev_orders_percent: percentOrders,
    regions: regionsArray,
    total_sales: totalSales,
    prev_sales_percent: percentSales,
    statuses: statusesArray,
    order_sales: salesArray,
    order_count: orderCountArray,
    currency_code: currencyCode,
  };

  res.json(orderData);
}
