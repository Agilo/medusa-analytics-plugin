import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import jwt from 'jsonwebtoken';
import { createOrderSeeder } from '../fixtures/orders';

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin', () => {
      const headers: Record<string, string> = {};
      let order, seeder;

      beforeEach(async () => {
        const container = getContainer();
        const authModuleService = container.resolve('auth');
        const userModuleService = container.resolve('user');

        // Create admin user
        const user = await userModuleService.createUsers({
          email: 'test@test.com',
        });

        // Create auth identity for the user
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
      });

      describe('/agilo-analytics/orders', () => {
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

        it('should return order arrays with correct structure', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.order_sales)).toBe(true);
          expect(Array.isArray(res.data.order_count)).toBe(true);
          if (res.data.order_sales.length > 0) {
            expect(res.data.order_sales[0]).toHaveProperty('name');
            expect(res.data.order_sales[0]).toHaveProperty('sales');
          }
          if (res.data.order_count.length > 0) {
            expect(res.data.order_count[0]).toHaveProperty('name');
            expect(res.data.order_count[0]).toHaveProperty('count');
          }
        });

        it('should support custom preset with date_from and date_to', async () => {
          const from = new Date();
          from.setMonth(from.getMonth() - 1);
          const to = new Date();
          const fromStr = from.toISOString().slice(0, 10);
          const toStr = to.toISOString().slice(0, 10);

          const res = await api.get(
            `/admin/agilo-analytics/orders?preset=custom&date_from=${fromStr}&date_to=${toStr}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty('total_orders');
        });

        it('should return array of regions sorted by sales descending', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=last-3-months',
            { headers }
          );

          expect(res.status).toEqual(200);
          if (res.data.regions.length > 1) {
            const salesValues = res.data.regions.map((r) => r.sales);
            for (let i = 0; i < salesValues.length - 1; i++) {
              expect(salesValues[i]).toBeGreaterThanOrEqual(salesValues[i + 1]);
            }
          }
        });

        it('should include statuses as array with name and count', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=last-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.statuses)).toBe(true);
          if (res.data.statuses.length > 0) {
            expect(res.data.statuses[0]).toHaveProperty('name');
            expect(res.data.statuses[0]).toHaveProperty('count');
          }
        });

        it('should return analytics data for orders (this month preset)', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toBeGreaterThanOrEqual(1);
          expect(res.data).toHaveProperty('regions');
          expect(res.data).toHaveProperty('statuses');
          expect(res.data).toHaveProperty('currency_code');
        });

        it('should include correct region sales data', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(Array.isArray(res.data.regions)).toBe(true);

          res.data.regions.forEach((region) => {
            expect(region).toHaveProperty('name');
            expect(region).toHaveProperty('sales');
            expect(region.sales).toBeGreaterThanOrEqual(0);
          });
        });

        it('should contain statuses with valid names and counts', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          res.data.statuses.forEach((status) => {
            expect(status).toHaveProperty('name');
            expect(status).toHaveProperty('count');
            expect(status.count).toBeGreaterThanOrEqual(0);
          });
        });

        it('should filter orders by custom date range', async () => {
          const from = new Date();
          from.setDate(from.getDate() - 5);
          const to = new Date();

          const fromStr = from.toISOString().slice(0, 10);
          const toStr = to.toISOString().slice(0, 10);

          const res = await api.get(
            `/admin/agilo-analytics/orders?preset=custom&date_from=${fromStr}&date_to=${toStr}`,
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toBeGreaterThanOrEqual(1);
        });

        it('should return correct total_orders number', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(res.data.total_orders).toBe(1);
        });

        it('should handle multiple statuses correctly', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          const statusNames = res.data.statuses.map((s) => s.name);
          const uniqueStatusNames = [...new Set(statusNames)];
          expect(uniqueStatusNames.length).toBe(statusNames.length);
          res.data.statuses.forEach((status) => {
            expect(typeof status.name).toBe('string');
            expect(typeof status.count).toBe('number');
          });
        });

        it('should return 401 for invalid JWT token', async () => {
          const invalidHeaders = {
            Authorization: 'Bearer invalid.token.here',
          };

          const error = await api
            .get('/admin/agilo-analytics/orders?preset=this-month', {
              headers: invalidHeaders,
            })
            .catch((e) => e);

          expect(error.response.status).toEqual(401);
        });

        it('should return 400 for missing preset parameter', async () => {
          const error = await api
            .get('/admin/agilo-analytics/orders', {
              headers,
            })
            .catch((e) => e);

          expect([400, 422]).toContain(error.response.status);
        });

        it('should return prev_orders_percent and prev_sales_percent as numbers', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(typeof res.data.prev_orders_percent).toBe('number');
          expect(typeof res.data.prev_sales_percent).toBe('number');
        });

        it('should return currency_code as a non-empty string', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/orders?preset=this-month',
            { headers }
          );

          expect(res.status).toEqual(200);
          expect(typeof res.data.currency_code).toBe('string');
          expect(res.data.currency_code.length).toBeGreaterThan(0);
        });
      });
    });
  },
});
