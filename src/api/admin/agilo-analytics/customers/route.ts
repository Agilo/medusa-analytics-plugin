import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  BigNumber,
} from '@medusajs/framework/utils';
import { format } from 'date-fns';
import { z } from 'zod';

import {
  calculateDateRangeMethod,
  getAllDateGroupingKeys,
  getDateGroupingKey,
} from '../../../../utils/orders';
import { DateTime } from 'luxon';

export const adminCustomerAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

const DEFAULT_CURRENCY = 'EUR';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminCustomerAnalyticsQuerySchema.safeParse(req.query);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const cacheModuleService = req.scope.resolve(Modules.CACHE);
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

  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.errors.map((err) => err.message).join(', ')
    );
  }
  const { data: orders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'created_at',
      'customer.*',
      'customer.orders.*',
      'currency_code',
      'customer.groups.*',
      'total',
    ],
    filters: {
      created_at: {
        $gte: result.data.date_from + 'T00:00:00Z',
        $lte: result.data.date_to + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft', 'canceled'] },
    },
  });

  const customers = Object.values(
    orders.reduce((acc, { customer }) => {
      if (customer && !acc[customer.id]) {
        acc[customer.id] = customer;
      }
      return acc;
    }, {})
  );

  const newCustomers = customers.filter((customer) =>
    //@ts-ignore
    customer?.orders?.every(
      (order) =>
        new Date(order.created_at) >=
        new Date(result.data.date_from + 'T00:00:00Z')
    )
  );

  const calculateDateRange = calculateDateRangeMethod['custom'];
  if (!calculateDateRange) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid preset value'
    );
  }

  const { days, current } = calculateDateRange({
    ...result.data,
    preset: 'custom',
  });

  const currentFrom = format(current.start, 'yyyy-MM-dd');
  const currentTo = format(current.end, 'yyyy-MM-dd');

  let groupBy: 'day' | 'week' | 'month' = 'day';
  if (days > 120) {
    groupBy = 'month';
  } else if (days > 30) {
    groupBy = 'week';
  }

  const keyRange = getAllDateGroupingKeys(groupBy, currentFrom, currentTo);

  const groupedByKey: Record<
    string,
    { returningCustomers: Set<string>; newCustomers: Set<string> }
  > = {};

  const customerGroup: Record<string, number> = {};
  const customerSales: Record<
    string,
    {
      sales: number;
      name: string;
      groups: string[];
      count: number;
      last_order: Date;
      email: string;
    }
  > = {};

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
      groupedByKey[key] = {
        returningCustomers: new Set<string>(),
        newCustomers: new Set<string>(),
      };
    }
    //@ts-ignore
    if (newCustomers.some((c) => c?.id === order.customer?.id)) {
      groupedByKey[key].newCustomers.add(order.customer?.id);
      //@ts-ignore
    } else if (order.customer?.id) {
      groupedByKey[key].returningCustomers.add(order.customer.id);
    }

    if (order.customer?.groups?.length) {
      for (const group of order.customer.groups) {
        if (!customerGroup[group.name]) {
          customerGroup[group.name] = 0;
        }
        customerGroup[group.name] += orderTotal;
      }
    } else {
      if (!customerGroup['No Group']) {
        customerGroup['No Group'] = 0;
      }
      customerGroup['No Group'] += orderTotal;
    }
    if (order?.customer?.id && !customerSales[order.customer.id]) {
      customerSales[order.customer.id] = {
        sales: 0,
        name:
          (order.customer?.first_name || '') +
          ' ' +
          (order.customer?.last_name || ''),
        groups: order.customer?.groups?.map((g) => g.name) || [],
        count: 0,
        last_order: new Date(order.created_at),
        email: order.customer?.email || '',
      };
    }
    if (order.customer?.id) {
      customerSales[order.customer.id].sales += orderTotal;
      customerSales[order.customer.id].count += 1;
      if (
        new Date(order.created_at) > customerSales[order.customer.id].last_order
      ) {
        customerSales[order.customer.id].last_order = new Date(
          order.created_at
        );
      }
    }
  }

  const customerCountArray = keyRange.map((date) => ({
    name: date,
    returning_customers: groupedByKey[date]?.returningCustomers.size || 0,
    new_customers: groupedByKey[date]?.newCustomers.size || 0,
  }));

  const customerGroupArray = Object.entries(customerGroup).map(
    ([name, total]) => ({
      name,
      total,
    })
  );

  const customerSalesArray = Object.entries(customerSales)
    .map(([customerId, customer]) => ({
      customer_id: customerId,
      sales: customer.sales,
      name: customer.name,
      groups: customer.groups,
      order_count: customer.count,
      last_order: customer.last_order,
      email: customer.email,
    }))
    .sort((a, b) => b.sales - a.sales);

  const customerData = {
    total_customers: customers.length,
    new_customers: newCustomers.length,
    returning_customers: customers.length - newCustomers.length,
    customer_count: customerCountArray,
    customer_group: customerGroupArray,
    customer_sales: customerSalesArray,
    currency_code: currencyCode,
  };

  res.json(customerData);
}
