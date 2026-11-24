import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  BigNumber,
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { format } from 'date-fns';
import {
  adminOrdersListQuerySchema,
  calculateDateRangeMethod,
  formatZodIssues,
  getAllDateGroupingKeys,
  getDateGroupingKey,
  getPercentChange,
} from '../../../../utils/orders';
import {
  createStoreCurrencyConverter,
  getStoreCurrencyAndRates,
} from '../../../../utils/currency';

// Kept for backwards compatibility; the schema now lives in `utils/orders`.
export { adminOrdersListQuerySchema };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminOrdersListQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodIssues(result.error),
    );
  }
  const validatedQuery = result.data;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

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

  const { currencyCode, exchangeRates } = await getStoreCurrencyAndRates(
    req.scope,
  );
  const toStoreCurrency = createStoreCurrencyConverter({
    currencyCode,
    exchangeRates,
    logger,
  });

  const calculateDateRange = calculateDateRangeMethod[validatedQuery.preset];

  if (!calculateDateRange) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid preset value',
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
    const orderTotal = toStoreCurrency(
      new BigNumber(order.total).numeric,
      order.currency_code,
    );

    const key = getDateGroupingKey(
      new Date(order.created_at),
      groupBy,
      currentFrom,
      currentTo,
    );

    if (!groupedByKey[key]) {
      groupedByKey[key] = { orderCount: 0, sales: 0 };
    }

    groupedByKey[key].orderCount += 1;

    if (orderTotal !== null) {
      groupedByKey[key].sales += orderTotal;
      totalSales += orderTotal;

      if (order.region?.name) {
        regions[order.region.name] =
          (regions[order.region.name] ?? 0) + orderTotal;
      }
    }

    if (order.status) {
      statuses[order.status] = (statuses[order.status] ?? 0) + 1;
    }
  }

  let prevTotalSales = 0;
  for (const order of prevRangeOrders) {
    const orderTotal = toStoreCurrency(
      new BigNumber(order.total).numeric,
      order.currency_code,
    );
    if (orderTotal !== null) {
      prevTotalSales += orderTotal;
    }
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

  res.json({
    total_orders: orders.length,
    prev_orders_percent: percentOrders,
    regions: regionsArray,
    total_sales: totalSales,
    prev_sales_percent: percentSales,
    statuses: statusesArray,
    order_sales: salesArray,
    order_count: orderCountArray,
    currency_code: currencyCode,
  } satisfies OrderAnalyticsResponse);
}

export type OrderAnalyticsResponse = {
  total_orders: number;
  regions: { name: string; sales: number }[];
  total_sales: number;
  statuses: { name: string; count: number }[];
  order_sales: { name: string; sales: number }[];
  prev_sales_percent: number;
  order_count: { name: string; count: number }[];
  prev_orders_percent: number;
  currency_code: string;
};
