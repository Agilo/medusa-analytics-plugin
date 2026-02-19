import {
  AdminProduct,
  AdminSalesChannel,
  AdminStockLocation,
} from '@medusajs/types';

export async function createProductVariant({
  api,
  productOverride,
  stockLocation,
  salesChannel,
  adminHeaders,
}: {
  api: any;
  productOverride?: AdminProduct;
  stockLocation: AdminStockLocation;
  salesChannel: AdminSalesChannel;
  adminHeaders: {};
}) {
  const inventoryItem = (
    await api.post(
      `/admin/inventory-items`,
      { sku: 'test-variant-2' },
      adminHeaders,
    )
  ).data.inventory_item;

  await api.post(
    `/admin/inventory-items/${inventoryItem.id}/location-levels`,
    {
      location_id: stockLocation.id,
      stocked_quantity: 0,
    },
    adminHeaders,
  );

  await api.post(
    `/admin/stock-locations/${stockLocation.id}/sales-channels`,
    { add: [salesChannel.id] },
    adminHeaders,
  );

  const product =
    productOverride ??
    (
      await api.post(
        '/admin/products',
        {
          title: `Test fixture 2`,
          status: 'published',
          shipping_profile_id: undefined,
          options: [
            { title: 'size', values: ['large', 'small'] },
            { title: 'color', values: ['green'] },
          ],
          variants: [
            {
              title: 'Test variant 2',
              sku: 'test-variant-2',
              inventory_items: [
                {
                  inventory_item_id: inventoryItem.id,
                  required_quantity: 1,
                },
              ],
              prices: [
                {
                  currency_code: 'eur',
                  amount: 100,
                },
              ],
              options: {
                size: 'large',
                color: 'green',
              },
            },
          ],
        },
        adminHeaders,
      )
    ).data.product;
  return {
    salesChannel,
    stockLocation,
    inventoryItem,
    product,
  };
}
