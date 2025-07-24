import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import {
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { adminProductAnalyticsQuerySchema } from '../route';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminProductAnalyticsQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.errors.map((err) => err.message).join(', ')
    );
  }

  const { date_from, date_to } = result.data;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: orders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'items.quantity',
      'items.variant.id',
      'items.variant.title',
      'items.product.title',
      'items.*',
    ],
    pagination: {
      order: {
        created_at: 'asc',
      },
    },
    filters: {
      created_at: {
        $gte: date_from + 'T00:00:00Z',
        $lte: date_to + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
  });

  let variantQuantitySold: Record<string, { title: string; quantity: number }> =
    {};

  orders.forEach((o) => {
    o.items?.forEach((i) => {
      if (i?.variant?.id) {
        if (!variantQuantitySold[i?.variant?.id]) {
          variantQuantitySold[i?.variant.id] = {
            title: i.product?.title + ' ' + i.variant.title,
            quantity: 0,
          };
        }
        variantQuantitySold[i.variant.id].quantity += i.quantity;
      }
    });
  });

  const sortedVariants = Object.values(variantQuantitySold)
    .map(({ title, quantity }) => ({ title, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const csvHeader = 'Variant,Quantity Sold';
  const csvRows = sortedVariants.map(
    (v) => `"${v.title.replace(/"/g, '""')}",${v.quantity}`
  );

  const csv = [csvHeader, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=variant_sales_${date_from}_${date_to}.csv`
  );
  res.send(csv);
}
