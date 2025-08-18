import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { format } from 'date-fns';
import { z } from 'zod';

import {
  calculateDateRangeMethod,
  getAllDateGroupingKeys,
  getDateGroupingKey,
} from '../../../../utils/orders';

export const adminCustomerAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminCustomerAnalyticsQuerySchema.safeParse(req.query);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.errors.map((err) => err.message).join(', ')
    );
  }
  const { data: orders } = await query.graph({
    entity: 'order',
    fields: ['id', 'created_at', 'customer.*', 'customer.orders.*'],
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

  for (const order of orders) {
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
  }

  const customerCountArray = keyRange.map((date) => ({
    name: date,
    returning_customers: groupedByKey[date]?.returningCustomers.size || 0,
    new_customers: groupedByKey[date]?.newCustomers.size || 0,
  }));

  const customerData = {
    total_customers: customers.length,
    new_customers: newCustomers.length,
    returning_customers: customers.length - newCustomers.length,
    customer_count: customerCountArray,
  };

  res.json(customerData);
}
