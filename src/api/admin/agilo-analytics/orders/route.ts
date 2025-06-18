import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  BigNumber,
  ContainerRegistrationKeys,
} from '@medusajs/framework/utils';
import { z } from 'zod';
import _ from 'lodash';
import { format, parseISO, differenceInCalendarDays, subDays } from 'date-fns';
import { generateKeyRange, getGroupKey } from '../../../../utils/orders';

export const adminOrdersListQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

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
      : p.resolve === '@agilo/medusa-analytics-plugin'
  );
  const currencyCode =
    typeof pluginConfig === 'string'
      ? DEFAULT_CURRENCY
      : pluginConfig?.options?.currency_code || DEFAULT_CURRENCY;

  const response = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=${currencyCode}`
  );
  const exchangeRates = await response.json();

  const start = parseISO(validatedQuery.date_from);
  const end = parseISO(validatedQuery.date_to);
  const days = differenceInCalendarDays(end, start) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  const prevFrom = format(prevStart, 'yyyy-MM-dd');
  const prevTo = format(prevEnd, 'yyyy-MM-dd');

  const { data } = await query.graph({
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
        $gte: validatedQuery.date_from + 'T00:00:00Z',
        $lte: validatedQuery.date_to + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
  });

  const { data: prevData } = await query.graph({
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
        $gte: prevFrom + 'T00:00:00Z',
        $lte: prevTo + 'T23:59:59.999Z',
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

  const keyRange = generateKeyRange(
    groupBy,
    validatedQuery.date_from,
    validatedQuery.date_to
  );

  let regions: Record<string, number> = {};
  let totalSales = 0;
  let statuses: Record<string, number> = {};

  const groupedByKey: Record<string, { orderCount: number; sales: number }> =
    {};

  data.forEach((order) => {
    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;

    const key = getGroupKey(
      new Date(order.created_at),
      groupBy,
      validatedQuery.date_from,
      validatedQuery.date_to
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
  });

  let prevTotalSales = 0;
  prevData.forEach((order) => {
    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;
    prevTotalSales += orderTotal;
  });
  const prevTotalOrders = prevData.length;

  const percentOrders = getPercentChange(data.length, prevTotalOrders);
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
    total_orders: data.length,
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
