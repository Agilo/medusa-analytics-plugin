import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { z } from 'zod';

const DEFAULT_THRESHOLD = 5;

export const adminProductAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const validatedQuery = adminProductAnalyticsQuerySchema.parse(req.query);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productService = req.scope.resolve(Modules.PRODUCT);
  const inventoryService = req.scope.resolve(Modules.INVENTORY);
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  const pluginConfig = config.plugins.find((p) =>
    typeof p === 'string'
      ? p === '@agilo/medusa-analytics-plugin'
      : p.resolve === '@agilo/medusa-analytics-plugin'
  );

  const threshold =
    typeof pluginConfig === 'string'
      ? DEFAULT_THRESHOLD
      : (pluginConfig?.options?.threshold as number) || DEFAULT_THRESHOLD;

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
        $gte: validatedQuery.date_from + 'T00:00:00Z',
        $lte: validatedQuery.date_to + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
  });

  let variantQuantitySold: Record<string, { title: string; quantity: number }> =
    {};

  orders.forEach((o) => {
    o.items?.forEach((i) => {
      if (i?.variant?.id && !variantQuantitySold[i?.variant?.id]) {
        variantQuantitySold[i?.variant.id] = {
          title: i.product?.title + ' ' + i.variant.title,
          quantity: 0,
        };
      } else if (i?.variant?.id) {
        variantQuantitySold[i.variant.id].quantity += i.quantity;
      }
    });
  });

  const sortedVariantQuantitySold = Object.values(variantQuantitySold)
    .map(({ title, quantity }) => ({ title, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const inventoryLevel = await inventoryService.listInventoryLevels(
    {
      stocked_quantity: { $lte: threshold },
    },
    { select: ['id', 'inventory_item_id', 'stocked_quantity'] }
  );
  const inventoryItems = await inventoryService.listInventoryItems(
    {
      id: inventoryLevel.map((i) => i.inventory_item_id),
    },
    { select: ['id', 'sku'] }
  );
  const productVariants = await productService.listProductVariants(
    {
      sku: inventoryItems
        .map((i) => i.sku)
        .filter((i) => i !== undefined && i !== null),
    },
    { select: ['id', 'title', 'sku'] }
  );

  const quantityByItemId: Record<string, number> = {};
  inventoryLevel.forEach((level) => {
    quantityByItemId[level?.inventory_item_id] = level.stocked_quantity;
  });

  const quantityBySku: Record<string, number> = {};
  inventoryItems.forEach((item) => {
    if (item.sku) {
      quantityBySku[item.sku] = quantityByItemId[item.id];
    }
  });

  const lowStockVariants: {
    sku: string;
    variantName: string;
    inventoryQuantity: number;
  }[] = [];

  productVariants.forEach((variant) => {
    if (variant.sku) {
      lowStockVariants.push({
        sku: variant.sku,
        inventoryQuantity: quantityBySku[variant.sku],
        variantName: variant.title,
      });
    }
  });

  res.json({
    lowStockVariants,
    variantQuantitySold: sortedVariantQuantitySold.slice(0, 10),
  });
}
