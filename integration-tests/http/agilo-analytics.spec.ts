import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import {
  AdminFulfillmentSet,
  AdminInventoryItem,
  AdminOrder,
  AdminProduct,
  AdminRegion,
  AdminSalesChannel,
  AdminShippingProfile,
  AdminStockLocation,
} from '@medusajs/framework/types';
import jwt from 'jsonwebtoken';
import { createOrderSeeder } from '../fixtures/orders';
import { createProductVariant } from '../fixtures/products';

jest.setTimeout(30000);

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics', () => {
      const headers: Record<string, string> = {};
      let order: AdminOrder,
        seeder,
        salesChannel: AdminSalesChannel,
        stockLocation: AdminStockLocation,
        product: AdminProduct,
        inventoryItem: AdminInventoryItem,
        shippingProfile: AdminShippingProfile,
        fulfillmentSet: AdminFulfillmentSet,
        fulfillmentSets: AdminFulfillmentSet[],
        region: AdminRegion;

      beforeEach(async () => {
        const container = getContainer();
        const authModuleService = container.resolve('auth');
        const userModuleService = container.resolve('user');

        const user = await userModuleService.createUsers({
          email: 'test@test.com',
        });

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: 'emailpass',
              entity_id: 'test@test.com',
              provider_metadata: {
                password: process.env.JWT_SECRET || 'test',
              },
            },
          ],
          app_metadata: {
            user_id: user.id,
          },
        });

        const token = jwt.sign(
          {
            actor_id: user.id,
            actor_type: 'user',
            auth_identity_id: authIdentity.id,
          },
          process.env.JWT_SECRET || 'test',
          { expiresIn: '1d' }
        );

        headers['Authorization'] = `Bearer ${token}`;
        seeder = await createOrderSeeder({
          api,
          container: getContainer(),
          adminHeaders: { headers },
        });
        order = seeder.order;
        salesChannel = seeder.salesChannel;
        stockLocation = seeder.stockLocation;
        product = seeder.product;
        inventoryItem = seeder.inventoryItem;
        shippingProfile = seeder.shippingProfile;
        fulfillmentSet = seeder.fulfillmentSet;
        fulfillmentSets = seeder.fulfillmentSets;
        region = seeder.region;
      });

      describe('/orders', () => {
        it('should return 401 if no authorization header', async () => {
          const error = await api
            .get('/admin/agilo-analytics/orders?preset=last-month')
            .catch((e) => e);

          expect(error.response.status).toEqual(401);
        });

        it('should return 400 or 422 for invalid preset', async () => {
          const error = await api
            .get('/admin/agilo-analytics/orders?preset=nonexistent', {
              headers,
            })
            .catch((e) => e);

          expect([400, 422]).toContain(error.response.status);
        });

        it('should return 400 or 422 when custom preset is missing date_from or date_to', async () => {
          const err1 = await api
            .get(
              '/admin/agilo-analytics/orders?preset=custom&date_from=2024-01-01',
              { headers }
            )
            .catch((e) => e);
          const err2 = await api
            .get(
              '/admin/agilo-analytics/orders?preset=custom&date_to=2024-01-31',
              { headers }
            )
            .catch((e) => e);

          expect([400, 422]).toContain(err1.response.status);
          expect([400, 422]).toContain(err2.response.status);
        });

        it('should return 500 for invalid date format', async () => {
          const error = await api
            .get(
              '/admin/agilo-analytics/orders?preset=custom&date_from=not-a-date&date_to=2024-01-31',
              { headers }
            )
            .catch((e) => e);

          expect(error.response.status).toEqual(500);
        });

        it('should return 200 and include expected keys', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty('total_orders');
          expect(res.data).toHaveProperty('prev_orders_percent');
          expect(res.data).toHaveProperty('regions');
          expect(res.data).toHaveProperty('total_sales');
          expect(res.data).toHaveProperty('prev_sales_percent');
          expect(res.data).toHaveProperty('statuses');
          expect(res.data).toHaveProperty('order_sales');
          expect(res.data).toHaveProperty('order_count');
          expect(res.data).toHaveProperty('currency_code');
        });

        it('should return 200 for last-month preset and have zero sales and orders', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=last-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toEqual(0);
          expect(res.data.total_sales).toEqual(0);
        });

        it('should work with last-3-months preset and have arrays with correct keys', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=last-3-months',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.order_sales)).toBe(true);
          expect(Array.isArray(res.data.order_count)).toBe(true);

          if (res.data.order_sales.length > 0) {
            expect(res.data.order_sales[0]).toHaveProperty('name');
            expect(res.data.order_sales[0]).toHaveProperty('sales');
          }
        });

        it('should return 200 for custom preset with correct dates', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=custom&date_from=2024-01-01&date_to=2024-12-31',
            { headers }
          );

          expect(res.status).toEqual(200);
        });

        it('should return statuses array with valid format', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);

          res.data.statuses.forEach((status) => {
            expect(status).toHaveProperty('name');
            expect(status).toHaveProperty('count');
          });
        });

        it('should handle case with no orders (future date range)', async () => {
          const futureStart = addDays(new Date(), 5);
          const futureEnd = addDays(new Date(), 10);

          const res = await api.get(
            `/admin/agilo-analytics/orders?preset=custom&date_from=${futureStart}&date_to=${futureEnd}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toEqual(0);
          expect(res.data.total_sales).toEqual(0);
        });
        it('should return correct total orders and total sales based on seeded order', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);

          expect(res.data.total_orders).toBeGreaterThanOrEqual(1);

          const expectedTotal = (order?.total || 0) / 100;

          expect(res.data.total_sales).toBeGreaterThanOrEqual(expectedTotal);

          const anySalesAboveZero = res.data.order_sales.some(
            (d) => d.sales > 0
          );
          expect(anySalesAboveZero).toBe(true);

          expect(res.data.currency_code).toBe('EUR');
        });
        it('should return correct status and region on seeded order', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          const expectedTotal = (order?.total || 0) / 100;
          expect(res.status).toEqual(200);

          expect(res.data.statuses?.[0]?.name).toBe(order.status);
          expect(res.data.statuses?.[0]?.count).toBe(1);

          expect(res.data.regions?.[0]?.name).toBe(region.name);
          expect(res.data.regions?.[0]?.sales).toBeGreaterThanOrEqual(
            expectedTotal
          );
        });
        it('should correctly aggregate data with multiple orders', async () => {
          for (let i = 0; i < 5; i++) {
            await createOrderSeeder({
              api,
              container: getContainer(),
              adminHeaders: { headers },
              productOverride: product,
              stockChannelOverride: stockLocation,
              inventoryItemOverride: inventoryItem,
              salesChannelOverride: salesChannel,
              shippingProfileOverride: shippingProfile,
              fulfillmentSetOverride: fulfillmentSet,
              fulfillmentSetsOverride: fulfillmentSets,
              regionOverride: region,
            });
          }

          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            {
              headers,
            }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toBeGreaterThanOrEqual(6);
          expect(res.data.total_sales).toBeGreaterThanOrEqual(
            (order?.total || 0) * 6
          );
        });
      });
      describe('/products', () => {
        it('should return 401 if no authorization header', async () => {
          const error = await api
            .get('/admin/agilo-analytics/products?preset=last-month')
            .catch((e) => e);

          expect(error.response.status).toEqual(401);
        });

        it('should return 400 or 422 when custom preset is missing date_from or date_to', async () => {
          const err1 = await api
            .get('/admin/agilo-analytics/products?date_from=2024-01-01', {
              headers,
            })
            .catch((e) => e);
          const err2 = await api
            .get('/admin/agilo-analytics/orders?date_to=2024-01-31', {
              headers,
            })
            .catch((e) => e);

          expect([400, 422]).toContain(err1.response.status);
          expect([400, 422]).toContain(err2.response.status);
        });
        it('should return 500 for invalid date format', async () => {
          const error = await api
            .get(
              '/admin/agilo-analytics/products?date_from=not-a-date&date_to=2024-01-31',
              { headers }
            )
            .catch((e) => e);

          expect(error.response.status).toEqual(500);
        });
        it('should return 200 and expected keys', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty('lowStockVariants');
          expect(res.data).toHaveProperty('variantQuantitySold');

          expect(Array.isArray(res.data.lowStockVariants)).toBe(true);
          expect(Array.isArray(res.data.variantQuantitySold)).toBe(true);

          if (res.data.lowStockVariants.length > 0) {
            const variant = res.data.lowStockVariants[0];
            expect(variant).toHaveProperty('sku');
            expect(variant).toHaveProperty('inventoryQuantity');
            expect(variant).toHaveProperty('variantName');
            expect(variant).toHaveProperty('variantId');
            expect(variant).toHaveProperty('productId');
          }
          if (res.data.variantQuantitySold.length > 0) {
            const sold = res.data.variantQuantitySold[0];
            expect(sold).toHaveProperty('title');
            expect(sold).toHaveProperty('quantity');
            expect(typeof sold.quantity).toBe('number');
            expect(sold.quantity).toBeGreaterThanOrEqual(0);
          }
        });

        it('should return empty arrays if no data in range', async () => {
          const start = '1990-01-01';
          const end = '1990-01-05';

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.lowStockVariants)).toBe(true);
          expect(Array.isArray(res.data.variantQuantitySold)).toBe(true);

          expect(res.data.lowStockVariants.length).toBe(0);
          expect(res.data.variantQuantitySold.length).toBe(0);
        });
        it('should return correct product variant in variantQuantitySold from seeded order', async () => {
          const lineItem = order?.items[0];
          const variantTitle =
            lineItem?.product_title + ' ' + lineItem?.variant_title;
          const quantity = lineItem?.quantity || 0;

          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.variantQuantitySold)).toBe(true);

          const foundVariant = res.data.variantQuantitySold.find((v) => {
            return v.title === variantTitle;
          });

          expect(foundVariant).toBeDefined();
          expect(foundVariant.quantity).toBeGreaterThanOrEqual(quantity);

          if (foundVariant.title) {
            expect(typeof foundVariant.title).toBe('string');
          }
        });
        it('should return empty lowStockVariants when no low stock variants exist', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.lowStockVariants).toEqual([]);
        });
        it('should return lowStockVariants', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const { product } = await createProductVariant({
            api,
            stockLocation,
            salesChannel,
            adminHeaders: { headers },
          });

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers }
          );
          const variant = product.variants[0];

          expect(res.status).toEqual(200);

          const lowStockVariants = res.data.lowStockVariants;

          const foundVariant = lowStockVariants.find(
            (v) => v.sku === variant.sku
          );

          expect(foundVariant).toBeDefined();
          expect(foundVariant.sku).toBe(variant.sku);
          expect(foundVariant.inventoryQuantity).toBe(0);
        });
      });
    });
  },
});
