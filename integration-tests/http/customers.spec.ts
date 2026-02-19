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
import {
  addCustomerToGroup,
  createCustomerGroup,
  createTestCustomer,
} from '../fixtures/customers';

jest.setTimeout(30000);

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/customers', () => {
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
  },
});
