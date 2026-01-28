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
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

import {
  addCustomerToGroup,
  createCustomerGroup,
  createTestCustomer,
} from '../fixtures/customers';
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
        seeder: Awaited<ReturnType<typeof createOrderSeeder>>,
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
          { expiresIn: '1d' },
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
          await expect(
            api.get('/admin/agilo-analytics/orders?preset=last-month'),
          ).rejects.toMatchObject({
            response: { status: 401 },
          });
        });

        it('should return 400 for invalid preset', async () => {
          await expect(
            api.get('/admin/agilo-analytics/orders?preset=nonexistent', {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it('should return 400 when custom preset is missing date_from or date_to', async () => {
          await expect(
            api.get(
              '/admin/agilo-analytics/orders?preset=custom&date_from=2024-01-01',
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
          await expect(
            api.get(
              '/admin/agilo-analytics/orders?preset=custom&date_to=2024-01-31',
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it('should return 500 for invalid date format', async () => {
          await expect(
            api.get(
              '/admin/agilo-analytics/orders?preset=custom&date_from=not-a-date&date_to=2024-01-31',
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 500 },
          });
        });

        it('should return 200 and include expected keys', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers },
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
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toEqual(0);
          expect(res.data.total_sales).toEqual(0);
        });

        it('should work with last-3-months preset and have arrays with correct keys', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=last-3-months',
            { headers },
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
            { headers },
          );

          expect(res.status).toEqual(200);
        });

        it('should return statuses array with valid format', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers },
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
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toEqual(0);
          expect(res.data.total_sales).toEqual(0);
        });
        it('should return correct total orders and total sales based on seeded order', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers },
          );

          expect(res.status).toEqual(200);

          expect(res.data.total_orders).toBeGreaterThanOrEqual(1);

          const expectedTotal = order?.total || 0;

          expect(res.data.total_sales).toBeGreaterThanOrEqual(expectedTotal);

          const anySalesAboveZero = res.data.order_sales.some(
            (d) => d.sales > 0,
          );
          expect(anySalesAboveZero).toBe(true);

          expect(res.data.currency_code).toBe('EUR');
        });
        it('should return correct status and region on seeded order', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers },
          );

          const expectedTotal = (order?.total || 0) / 100;
          expect(res.status).toEqual(200);

          expect(res.data.statuses?.[0]?.name).toBe(order.status);
          expect(res.data.statuses?.[0]?.count).toBe(1);

          expect(res.data.regions?.[0]?.name).toBe(region.name);
          expect(res.data.regions?.[0]?.sales).toBeGreaterThanOrEqual(
            expectedTotal,
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
            },
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toBeGreaterThanOrEqual(6);
          expect(res.data.total_sales).toBeGreaterThanOrEqual(
            (order?.total || 0) * 6,
          );
        });
        it('should correctly handle orders with different created_at dates in different months', async () => {
          const prevMonth = subMonths(new Date(), 1);
          const dates: string[] = [];
          dates.push(
            format(startOfMonth(prevMonth), 'yyyy-MM-dd') + 'T00:00:00Z',
          );
          dates.push(
            format(endOfMonth(prevMonth), 'yyyy-MM-dd') + 'T23:59:59.999Z',
          );
          dates.push(
            format(startOfMonth(new Date()), 'yyyy-MM-dd') + 'T00:00:00Z',
          );
          dates.push(
            format(endOfMonth(new Date()), 'yyyy-MM-dd') + 'T23:59:59.999Z',
          );
          await Promise.all(
            dates.map(async (d) => {
              return createOrderSeeder({
                api,
                container: getContainer(),
                adminHeaders: { headers },
                createdAt: d,
                productOverride: product,
                stockChannelOverride: stockLocation,
                inventoryItemOverride: inventoryItem,
                salesChannelOverride: salesChannel,
                shippingProfileOverride: shippingProfile,
                fulfillmentSetOverride: fulfillmentSet,
                fulfillmentSetsOverride: fulfillmentSets,
                regionOverride: region,
              });
            }),
          );
          const res1 = await api.get(
            `/admin/agilo-analytics/orders?preset=this-month`,
            { headers },
          );
          const res2 = await api.get(
            `/admin/agilo-analytics/orders?preset=last-month`,
            { headers },
          );
          const expectedTotal1 = order?.total * 3 || 0;
          const expectedTotal2 = order?.total * 2 || 0;
          const sales1 = res1.data.order_sales.reduce((acc, curr) => {
            acc += curr.sales;
            return acc;
          }, 0);
          const sales2 = res2.data.order_sales.reduce((acc, curr) => {
            acc += curr.sales;
            return acc;
          }, 0);

          expect(res1.status).toEqual(200);
          expect(res1.data.total_orders).toEqual(3);
          expect(res1.data.total_sales).toEqual(expectedTotal1);
          expect(sales1).toEqual(expectedTotal1);

          expect(res2.status).toEqual(200);
          expect(res2.data.total_orders).toEqual(2);
          expect(res2.data.total_sales).toEqual(expectedTotal2);
          expect(sales2).toEqual(expectedTotal2);
        });
        it('should correctly handle orders in month format', async () => {
          const dates: string[] = [];
          for (let i = 0; i < 6; i++) {
            const prevMonth = subMonths(new Date(), i + 1);
            dates.push(
              format(endOfMonth(prevMonth), 'yyyy-MM-dd') + 'T23:59:59.999Z',
            );
            dates.push(
              format(startOfMonth(prevMonth), 'yyyy-MM-dd') + 'T00:00:00Z',
            );
          }

          await Promise.all(
            dates.map(async (d) => {
              return createOrderSeeder({
                api,
                container: getContainer(),
                adminHeaders: { headers },
                createdAt: d,
                productOverride: product,
                stockChannelOverride: stockLocation,
                inventoryItemOverride: inventoryItem,
                salesChannelOverride: salesChannel,
                shippingProfileOverride: shippingProfile,
                fulfillmentSetOverride: fulfillmentSet,
                fulfillmentSetsOverride: fulfillmentSets,
                regionOverride: region,
              });
            }),
          );
          const res = await api.get(
            `/admin/agilo-analytics/orders?preset=custom&date_from=${
              dates[dates.length - 1]
            }&date_to=${dates[0]}`,
            { headers },
          );

          const expectedTotal = order?.total * 12 || 0;
          const sales = res.data.order_sales.reduce((acc, curr) => {
            acc += curr.sales;
            return acc;
          }, 0);
          const count = res.data.order_count.reduce((acc, curr) => {
            acc += curr.count;
            return acc;
          }, 0);

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toEqual(12);
          expect(count).toEqual(12);
          expect(res.data.total_sales).toEqual(expectedTotal);
          expect(sales).toEqual(expectedTotal);
        });
      });
      describe('/products', () => {
        it('should return 401 if no authorization header', async () => {
          await expect(
            api.get('/admin/agilo-analytics/products?preset=last-month'),
          ).rejects.toMatchObject({
            response: { status: 401 },
          });
        });

        it('should return 400 when custom preset is missing date_from or date_to', async () => {
          await expect(
            api.get('/admin/agilo-analytics/products?date_from=2024-01-01', {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
          await expect(
            api.get('/admin/agilo-analytics/orders?date_to=2024-01-31', {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
        it('should return 500 for invalid date format', async () => {
          await expect(
            api.get(
              '/admin/agilo-analytics/products?date_from=not-a-date&date_to=2024-01-31',
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 500 },
          });
        });
        it('should return 200 and expected keys', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/products?date_from=${start}&date_to=${end}`,
            { headers },
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
            { headers },
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
            { headers },
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
            { headers },
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
            { headers },
          );
          const variant = product.variants[0];

          expect(res.status).toEqual(200);

          const lowStockVariants = res.data.lowStockVariants;

          const foundVariant = lowStockVariants.find(
            (v) => v.sku === variant.sku,
          );

          expect(foundVariant).toBeDefined();
          expect(foundVariant.sku).toBe(variant.sku);
          expect(foundVariant.inventoryQuantity).toBe(0);
        });
      });
      describe('/customers', () => {
        it('should return 401 if no authorization header', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);
          await expect(
            api.get(
              `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            ),
          ).rejects.toMatchObject({
            response: { status: 401 },
          });
        });

        it('should return 400 when custom preset is missing date_from or date_to', async () => {
          await expect(
            api.get('/admin/agilo-analytics/customers?date_from=2024-01-01', {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
          await expect(
            api.get('/admin/agilo-analytics/customers?date_to=2024-01-31', {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
        it('should return 500 for invalid date format', async () => {
          await expect(
            api.get(
              '/admin/agilo-analytics/customers?date_from=not-a-date&date_to=2024-01-31',
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 500 },
          });
        });
        it('should return 200 and expected keys', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty('total_customers');
          expect(res.data).toHaveProperty('new_customers');
          expect(res.data).toHaveProperty('returning_customers');
          expect(res.data).toHaveProperty('customer_count');
          expect(res.data).toHaveProperty('customer_group');
          expect(res.data).toHaveProperty('customer_sales');
          expect(res.data).toHaveProperty('currency_code');
        });
        it('should return correct total customers based on seeded order', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_customers).toBeGreaterThanOrEqual(1);
          expect(res.data.new_customers).toBeGreaterThanOrEqual(1);
          expect(res.data.returning_customers).toBeGreaterThanOrEqual(0);
          expect(res.data.currency_code).toBe('EUR');
        });
        it('should return correct returning customers based on seeded order', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

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
            createdAt: addDays(new Date(), -10),
          });

          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.new_customers).toBeGreaterThanOrEqual(0);
          expect(res.data.returning_customers).toBeGreaterThanOrEqual(1);
        });
        it('should return correct new customer number based on multiple orders from different customers', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const customer1 = await createTestCustomer({
            api,
            adminHeaders: { headers },
          });
          const customer2 = await createTestCustomer({
            api,
            adminHeaders: { headers },
            customerOverride: { email: 'customer2@example.com' },
          });
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
            createdAt: addDays(new Date(), -2),
            customerEmail: customer1.email,
          });
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
            createdAt: addDays(new Date(), -1),
            customerEmail: customer2.email,
          });
          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.new_customers).toBeGreaterThanOrEqual(3);
          expect(res.data.returning_customers).toBeGreaterThanOrEqual(0);
        });
        it('should return correct new and returning customer numbers based on multiple orders from the same customer', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const customer1 = await createTestCustomer({
            api,
            adminHeaders: { headers },
          });
          const customer2 = await createTestCustomer({
            api,
            adminHeaders: { headers },
            customerOverride: { email: 'customer2@example.com' },
          });
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
            createdAt: addDays(new Date(), -2),
            customerEmail: customer1.email,
          });
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
            createdAt: addDays(new Date(), -1),
            customerEmail: customer2.email,
          });
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
            createdAt: addDays(new Date(), -15),
            customerEmail: customer2.email,
          });
          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.new_customers).toEqual(2);
          expect(res.data.returning_customers).toEqual(1);
        });
        it('should correctly calculate sales per customer', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const customer = await createTestCustomer({
            api,
            adminHeaders: { headers },
          });

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
            createdAt: addDays(new Date(), -2),
            customerEmail: customer.email,
          });

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
            createdAt: addDays(new Date(), -1),
            customerEmail: customer.email,
          });

          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);

          const firstCustomer = res.data.customer_sales[0];
          const secondCustomer = res.data.customer_sales[1];
          expect(firstCustomer).toBeDefined();
          expect(firstCustomer.sales).toEqual(2400);
          expect(secondCustomer).toBeDefined();
          expect(secondCustomer.sales).toEqual(1200);
        });
        it('should correctly calculate sales for a specific customer', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const customer = await createTestCustomer({
            api,
            adminHeaders: { headers },
          });

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
            createdAt: addDays(new Date(), -2),
            customerEmail: customer.email,
          });

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
            createdAt: addDays(new Date(), -10),
            customerEmail: customer.email,
          });

          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);

          const firstCustomer = res.data.customer_sales.find(
            (c) => c.email === customer.email,
          );

          expect(firstCustomer).toBeDefined();
          expect(firstCustomer.sales).toEqual(1200);
        });
        it('should correctly calculate sales for customer groups', async () => {
          const start = addDays(new Date(), -7);
          const end = addDays(new Date(), 0);

          const customer = await createTestCustomer({
            api,
            adminHeaders: { headers },
          });
          const group = await createCustomerGroup({
            api,
            adminHeaders: { headers },
          });
          const group2 = await createCustomerGroup({
            api,
            adminHeaders: { headers },
            name: 'VIP Customers',
          });

          await addCustomerToGroup({
            api,
            customerId: customer.id,
            groupId: [group.id, group2.id],
            adminHeaders: { headers },
          });
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
            createdAt: addDays(new Date(), -2),
            customerEmail: customer.email,
          });
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
            createdAt: addDays(new Date(), -5),
            customerEmail: customer.email,
          });
          const res = await api.get(
            `/admin/agilo-analytics/customers?date_from=${start}&date_to=${end}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          const groupData = res.data.customer_group.find(
            (g) => g.name === group.name,
          );
          const groupData2 = res.data.customer_group.find(
            (g) => g.name === group2.name,
          );
          expect(groupData).toBeDefined();
          expect(groupData.total).toEqual(2400);
          expect(groupData2).toBeDefined();
          expect(groupData2.total).toEqual(2400);
        });
      });
    });
  },
});
