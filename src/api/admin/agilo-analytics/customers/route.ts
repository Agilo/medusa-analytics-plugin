import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { z } from 'zod';

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
      (order) => order.created_at >= result.data.date_from
    )
  );

  const customerData = {
    total_customers: customers.length,
    new_customers: newCustomers.length,
  };

  res.json(customerData);
}
