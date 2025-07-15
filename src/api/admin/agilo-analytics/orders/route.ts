import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  BigNumber,
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from '@medusajs/framework/utils';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  calculateDateRangeMethod,
  getAllDateGroupingKeys,
  getDateGroupingKey,
} from '../../../../utils/orders';
import { DateTime } from 'luxon';

export const adminOrdersListQuerySchema = z.discriminatedUnion('preset', [
  z.object({
    preset: z.literal('custom'),
    date_from: z.string(),
    date_to: z.string(),
  }),
  z.object({
    preset: z.literal('this-month'),
  }),
  z.object({
    preset: z.literal('last-month'),
  }),
  z.object({
    preset: z.literal('last-3-months'),
  }),
]);
const DEFAULT_CURRENCY = 'EUR';

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminOrdersListQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.errors.map((err) => err.message).join(', ')
    );
  }
  const validatedQuery = result.data;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const cacheModuleService = req.scope.resolve(Modules.CACHE);

  const fetchOrders = async (dateRange: { from: string; to: string }) => {
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
          $gte: dateRange.from + 'T00:00:00Z',
          $lte: dateRange.to + 'T23:59:59.999Z',
        },
        status: { $nin: ['draft'] },
      },
    });
    return orders;
  };

  const stores = await storeModuleService.listStores(
    {},
    { relations: ['supported_currencies'] }
  );

  const store = stores?.[0];
  const currencyCode =
    store?.supported_currencies
      ?.find((c) => c.is_default)
      ?.currency_code?.toUpperCase() || DEFAULT_CURRENCY;

  const cacheKey = `exchange_rates_${currencyCode}`;

  let exchangeRates: { rates: Record<string, any> } | null =
    await cacheModuleService.get(cacheKey);

  if (!exchangeRates) {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${currencyCode}`
    );
    exchangeRates = await response.json();

    const now = DateTime.now().setZone('Europe/Berlin');
    let expireAt = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
    if (now >= expireAt) {
      expireAt = expireAt.plus({ days: 1 });
    }

    const ttl = Math.floor(expireAt.diff(now, 'seconds').seconds);

    await cacheModuleService.set(cacheKey, exchangeRates, ttl);
  }

  const calculateDateRange = calculateDateRangeMethod[validatedQuery.preset];

  if (!calculateDateRange) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid preset value'
    );
  }

  const { current, previous, days } = calculateDateRange(validatedQuery);

  const currentFrom = format(current.start, 'yyyy-MM-dd');
  const currentTo = format(current.end, 'yyyy-MM-dd');
  const previousFrom = format(previous.start, 'yyyy-MM-dd');
  const previousTo = format(previous.end, 'yyyy-MM-dd');

  const orders = await fetchOrders({
    from: currentFrom,
    to: currentTo,
  });

  const prevRangeOrders = await fetchOrders({
    from: previousFrom,
    to: previousTo,
  });

  let groupBy: 'day' | 'week' | 'month' = 'day';
  if (days > 120) {
    groupBy = 'month';
  } else if (days > 30) {
    groupBy = 'week';
  }

  const keyRange = getAllDateGroupingKeys(groupBy, currentFrom, currentTo);

  let regions: Record<string, number> = {};
  let totalSales = 0;
  let statuses: Record<string, number> = {};

  const groupedByKey: Record<string, { orderCount: number; sales: number }> =
    {};

  for (const order of orders) {
    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates?.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;

    const key = getDateGroupingKey(
      new Date(order.created_at),
      groupBy,
      currentFrom,
      currentTo
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
        ? exchangeRates?.rates[order.currency_code.toUpperCase()]
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
