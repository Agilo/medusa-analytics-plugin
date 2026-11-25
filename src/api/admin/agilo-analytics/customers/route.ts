import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { CustomerDTO, OrderDTO } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  MedusaError,
  BigNumber,
} from '@medusajs/framework/utils';
import { format } from 'date-fns';
import { z } from 'zod';

import {
  calculateDateRangeMethod,
  formatZodIssues,
  getAllDateGroupingKeys,
  getDateGroupingKey,
} from '../../../../utils/orders';
import {
  createStoreCurrencyConverter,
  getStoreCurrencyAndRates,
} from '../../../../utils/currency';

export const adminCustomerAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminCustomerAnalyticsQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodIssues(result.error),
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { currencyCode, exchangeRates } = await getStoreCurrencyAndRates(
    req.scope,
  );
  const toStoreCurrency = createStoreCurrencyConverter({
    currencyCode,
    exchangeRates,
    logger,
  });

  const { data: orders } = (await query.graph({
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
  })) as { data: (OrderDTO & { customer?: CustomerDTO | null })[] };

  const customers = Object.values(
    orders.reduce(
      (acc, { customer }) => {
        if (customer && !acc[customer.id]) {
          acc[customer.id] = customer;
        }
        return acc;
      },
      {} as Record<string, CustomerDTO>,
    ),
  );

  const newCustomers = customers.filter(
    (customer) =>
      customer &&
      typeof customer === 'object' &&
      'orders' in customer &&
      Array.isArray(customer.orders) &&
      customer?.orders?.every(
        (order) =>
          new Date(order.created_at) >=
          new Date(result.data.date_from + 'T00:00:00Z'),
      ),
  );

  const calculateDateRange = calculateDateRangeMethod['custom'];
  if (!calculateDateRange) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid preset value',
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
    // Amounts that can't be converted are left out of the sales sums.
    const orderTotal =
      toStoreCurrency(
        new BigNumber(order.total).numeric,
        order.currency_code,
      ) ?? 0;
    const key = getDateGroupingKey(
      new Date(order.created_at),
      groupBy,
      currentFrom,
      currentTo,
    );
    if (!groupedByKey[key]) {
      groupedByKey[key] = {
        returningCustomers: new Set<string>(),
        newCustomers: new Set<string>(),
      };
    }
    if (
      order.customer &&
      order.customer.id &&
      newCustomers.some(
        (c) =>
          c &&
          typeof c === 'object' &&
          'id' in c &&
          c.id === order.customer?.id,
      )
    ) {
      groupedByKey[key].newCustomers.add(order.customer.id);
    } else if (order.customer && order.customer.id) {
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
          order.created_at,
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
    }),
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

  res.json(customerData satisfies CustomerAnalyticsResponse);
}

export type CustomerAnalyticsResponse = {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  customer_count: {
    name: string;
    returning_customers: number;
    new_customers: number;
  }[];
  customer_group: { name: string; total: number }[];
  customer_sales: {
    customer_id: string;
    sales: number;
    name: string;
    groups: string[];
    order_count: number;
    last_order: Date | string;
    email: string;
  }[];
  currency_code: string;
};
