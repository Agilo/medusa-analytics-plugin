import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { AdminOrder } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  generateJwtToken,
} from '@medusajs/framework/utils';
import { createOrderSeeder } from '../fixtures/orders';
import {
  cancelReturn,
  createReturn,
  createReturnReason,
  fulfillOrder,
} from '../fixtures/returns';

jest.setTimeout(60000);

// A fixed past month, so the tests control every order and return date in it.
const RANGE_FROM = '2024-03-01';
const RANGE_TO = '2024-03-31';
const RANGE_URL = `/admin/agilo-analytics/returns?preset=custom&date_from=${RANGE_FROM}&date_to=${RANGE_TO}`;
const IN_RANGE = '2024-03-10T12:00:00Z';
const IN_RANGE_LATER = '2024-03-20T12:00:00Z';
const BEFORE_RANGE = '2024-02-10T12:00:00Z';
const AFTER_RANGE = '2024-04-10T12:00:00Z';

type ReturnedVariant = {
  variant_id: string | null;
  product_id: string | null;
  title: string;
  returned_quantity: number;
  sold_quantity: number;
  return_rate: number;
  reasons: { name: string; quantity: number }[];
};

function expectValidReturnedVariants(rows: ReturnedVariant[]) {
  for (const row of rows) {
    expect(row.return_rate).toBeLessThanOrEqual(100);
    expect(row.returned_quantity).toBeLessThanOrEqual(row.sold_quantity);
    // The reason breakdown always adds up to the returned quantity.
    expect(row.reasons.reduce((sum, r) => sum + r.quantity, 0)).toEqual(
      row.returned_quantity,
    );
  }
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/returns', () => {
      const headers: Record<string, string> = {};
      let seeder: Awaited<ReturnType<typeof createOrderSeeder>>;
      let reason: { id: string; label: string };

      const adminHeaders = () => ({ headers });

      /** Seeds another order that reuses the first seeder's product, region etc. */
      const seedOrder = async ({
        createdAt,
        extraUnits = 0,
      }: { createdAt?: string; extraUnits?: number } = {}) => {
        const { order } = await createOrderSeeder({
          api,
          container: getContainer(),
          adminHeaders: adminHeaders(),
          createdAt,
          additionalProducts: extraUnits
            ? [
                {
                  variant_id: seeder.product.variants![0].id,
                  quantity: extraUnits,
                },
              ]
            : undefined,
          productOverride: seeder.product,
          stockChannelOverride: seeder.stockLocation,
          inventoryItemOverride: seeder.inventoryItem,
          salesChannelOverride: seeder.salesChannel,
          shippingProfileOverride: seeder.shippingProfile,
          fulfillmentSetOverride: seeder.fulfillmentSet,
          fulfillmentSetsOverride: seeder.fulfillmentSets,
          regionOverride: seeder.region,
        });
        return order;
      };

      /**
       * Fulfills the order, then returns `quantity` units of one item (the
       * first by default) with the test's return reason.
       */
      const fulfillAndReturn = async (
        order: AdminOrder,
        {
          quantity = 1,
          itemIndex = 0,
          itemId,
          fulfill = true,
          withReason = true,
          ...options
        }: {
          quantity?: number;
          itemIndex?: number;
          itemId?: string;
          fulfill?: boolean;
          withReason?: boolean;
          confirm?: boolean;
          receive?: boolean;
          createdAt?: string;
        } = {},
      ) => {
        if (fulfill) {
          await fulfillOrder({
            api,
            adminHeaders: adminHeaders(),
            order,
            locationId: seeder.stockLocation.id,
          });
        }
        return createReturn({
          api,
          container: getContainer(),
          adminHeaders: adminHeaders(),
          orderId: order.id,
          locationId: seeder.stockLocation.id,
          items: [
            {
              id: itemId ?? order.items[itemIndex].id,
              quantity,
              reason_id: withReason ? reason.id : undefined,
            },
          ],
          ...options,
        });
      };

      const unitsOf = (order: AdminOrder) =>
        order.items.reduce((sum, item) => sum + item.quantity, 0);

      beforeEach(async () => {
        const container = getContainer();
        const authModuleService = container.resolve('auth');
        const userModuleService = container.resolve('user');

        const user = await userModuleService.createUsers({
          email: `test-returns-${Date.now()}@test.com`,
        });

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: 'emailpass',
              entity_id: user.email,
              provider_metadata: {
                password: process.env.JWT_SECRET || 'test',
              },
            },
          ],
          app_metadata: {
            user_id: user.id,
          },
        });

        const token = generateJwtToken(
          {
            actor_id: user.id,
            actor_type: 'user',
            auth_identity_id: authIdentity.id,
          },
          {
            secret: process.env.JWT_SECRET || 'test',
            expiresIn: '1d',
          },
        );

        headers['Authorization'] = `Bearer ${token}`;
        seeder = await createOrderSeeder({
          api,
          container,
          adminHeaders: adminHeaders(),
        });
        reason = await createReturnReason({
          api,
          adminHeaders: adminHeaders(),
        });
      });

      describe('validation', () => {
        it('returns 401 without auth', async () => {
          await expect(
            api.get('/admin/agilo-analytics/returns?preset=this-month'),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it('returns 400 for an invalid preset', async () => {
          await expect(
            api.get('/admin/agilo-analytics/returns?preset=nonexistent', {
              headers,
            }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('returns 400 for a custom preset without dates', async () => {
          await expect(
            api.get(
              '/admin/agilo-analytics/returns?preset=custom&date_from=2024-01-01',
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      describe('return-date-based metrics', () => {
        it('returns zeros when there are no returns', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data).toMatchObject({
            total_returns: 0,
            prev_returns_percent: 0,
            return_rate: 0,
            returned_value: 0,
            reasons: [],
            returned_variants: [],
            currency_code: 'EUR',
          });
          expect(res.data.returns_over_time.length).toBeGreaterThan(0);
          expect(
            res.data.returns_over_time.every(
              (b: { count: number }) => b.count === 0,
            ),
          ).toBe(true);
        });

        it('counts one requested return in every metric', async () => {
          const order = seeder.order;
          await fulfillAndReturn(order);

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          const item = order.items[0];
          expect(res.status).toEqual(200);
          expect(res.data.total_returns).toEqual(1);
          expect(res.data.prev_returns_percent).toEqual(100);
          expect(res.data.return_rate).toEqual(100);
          expect(res.data.returned_value).toBeCloseTo(
            Number(item.total) / item.quantity,
            2,
          );
          expect(res.data.reasons).toEqual([
            { name: reason.label, quantity: 1 },
          ]);
          expect(
            res.data.returns_over_time.reduce(
              (sum: number, b: { count: number }) => sum + b.count,
              0,
            ),
          ).toEqual(1);
          expect(res.data.returned_variants).toEqual([
            {
              variant_id: item.variant_id,
              product_id: item.product_id,
              title: expect.any(String),
              returned_quantity: 1,
              sold_quantity: 1,
              return_rate: 100,
              reasons: [{ name: reason.label, quantity: 1 }],
            },
          ]);
        });

        it('breaks a variant’s returns down by reason', async () => {
          const order = await seedOrder({ extraUnits: 2 });
          // One entry per unit, so each return can take a different unit,
          // whether the 3 units are on one line or several.
          const units = order.items.flatMap(
            (item: { id: string; quantity: number }) =>
              Array.from({ length: item.quantity }, () => item.id),
          );
          expect(units).toHaveLength(3);
          await fulfillAndReturn(order, { itemId: units[0] });
          await fulfillAndReturn(order, { itemId: units[1], fulfill: false });
          await fulfillAndReturn(order, {
            itemId: units[2],
            fulfill: false,
            withReason: false,
          });

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          const row = res.data.returned_variants[0];
          expect(row.returned_quantity).toEqual(3);
          expect(row.reasons).toEqual([
            { name: reason.label, quantity: 2 },
            { name: 'No reason', quantity: 1 },
          ]);
          expectValidReturnedVariants(res.data.returned_variants);
        });

        it('counts a received return', async () => {
          await fulfillAndReturn(seeder.order, { receive: true });

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          expect(res.data.total_returns).toEqual(1);
          expect(res.data.return_rate).toEqual(100);
        });

        it('values a partial return by the returned units only', async () => {
          const order = await seedOrder({ extraUnits: 1 });
          expect(unitsOf(order)).toEqual(2);
          await fulfillAndReturn(order, { quantity: 1 });

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          const item = order.items[0];
          expect(res.data.returned_value).toBeCloseTo(
            Number(item.total) / item.quantity,
            2,
          );
          // The first seeded order (1 unit, no return) is in the cohort too.
          const row = res.data.returned_variants[0];
          expect(row.returned_quantity).toEqual(1);
          expect(row.sold_quantity).toEqual(3);
          expect(row.return_rate).toEqual(33.33);
          expectValidReturnedVariants(res.data.returned_variants);
        });

        it('excludes a canceled return', async () => {
          const returnId = await fulfillAndReturn(seeder.order);
          await cancelReturn({ api, adminHeaders: adminHeaders(), returnId });

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          expect(res.data.total_returns).toEqual(0);
          expect(res.data.return_rate).toEqual(0);
          expect(res.data.returned_variants).toEqual([]);
        });

        it('excludes an open (unconfirmed) return', async () => {
          await fulfillAndReturn(seeder.order, { confirm: false });

          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=this-month',
            { headers },
          );

          expect(res.data.total_returns).toEqual(0);
          expect(res.data.return_rate).toEqual(0);
          expect(res.data.reasons).toEqual([]);
        });

        it('excludes a return created after the range from return-date metrics', async () => {
          const order = await seedOrder({ createdAt: IN_RANGE });
          await fulfillAndReturn(order, { createdAt: AFTER_RANGE });

          const res = await api.get(RANGE_URL, { headers });

          expect(res.data.total_returns).toEqual(0);
          expect(res.data.returned_value).toEqual(0);
          expect(res.data.reasons).toEqual([]);
        });
      });

      describe('return rate (order cohort)', () => {
        it('counts an order created and returned in the range', async () => {
          const order = await seedOrder({ createdAt: IN_RANGE });
          await fulfillAndReturn(order, { createdAt: IN_RANGE_LATER });

          const res = await api.get(RANGE_URL, { headers });

          expect(res.data.total_returns).toEqual(1);
          expect(res.data.return_rate).toEqual(100);
        });

        it('counts an order created in the range but returned after it', async () => {
          const order = await seedOrder({ createdAt: IN_RANGE });
          await fulfillAndReturn(order, { createdAt: AFTER_RANGE });

          const res = await api.get(RANGE_URL, { headers });

          expect(res.data.return_rate).toEqual(100);
          expect(res.data.returned_variants).toHaveLength(1);
          expect(res.data.returned_variants[0]).toMatchObject({
            returned_quantity: 1,
            sold_quantity: 1,
            return_rate: 100,
          });
        });

        it('ignores an order created before the range, even if returned in it', async () => {
          const oldOrder = await seedOrder({ createdAt: BEFORE_RANGE });
          await fulfillAndReturn(oldOrder, { createdAt: IN_RANGE });
          await seedOrder({ createdAt: IN_RANGE }); // in the cohort, no returns

          const res = await api.get(RANGE_URL, { headers });

          // Still a return in the period...
          expect(res.data.total_returns).toEqual(1);
          // ...but not part of the cohort: 0 of 1 orders returned.
          expect(res.data.return_rate).toEqual(0);
          // The product was sold before the range, so it's not in the table.
          expect(res.data.returned_variants).toEqual([]);
        });

        it('counts an order with several returns once', async () => {
          const order = await seedOrder({ createdAt: IN_RANGE, extraUnits: 1 });
          await fulfillAndReturn(order, { createdAt: IN_RANGE_LATER });
          await fulfillAndReturn(order, {
            fulfill: false,
            itemIndex: order.items[0].quantity >= 2 ? 0 : 1,
            createdAt: IN_RANGE_LATER,
          });
          await seedOrder({ createdAt: IN_RANGE }); // in the cohort, no returns

          const res = await api.get(RANGE_URL, { headers });

          expect(res.data.total_returns).toEqual(2);
          expect(res.data.return_rate).toEqual(50);
          expect(res.data.returned_variants[0]).toMatchObject({
            returned_quantity: 2,
            sold_quantity: 3,
            return_rate: 66.67,
          });
          expectValidReturnedVariants(res.data.returned_variants);
        });

        it('leaves draft and canceled orders out of the cohort', async () => {
          const returned = await seedOrder({ createdAt: IN_RANGE });
          await fulfillAndReturn(returned, { createdAt: IN_RANGE_LATER });

          const canceled = await seedOrder({ createdAt: IN_RANGE });
          await api.post(
            `/admin/orders/${canceled.id}/cancel`,
            {},
            adminHeaders(),
          );

          const draft = await seedOrder({ createdAt: IN_RANGE });
          await getContainer()
            .resolve(ContainerRegistrationKeys.PG_CONNECTION)
            .from('order')
            .update({ status: 'draft', is_draft_order: true })
            .where({ id: draft.id });

          const res = await api.get(RANGE_URL, { headers });

          expect(res.data.return_rate).toEqual(100);
          expect(res.data.returned_variants[0]).toMatchObject({
            returned_quantity: 1,
            sold_quantity: 1,
          });
        });

        it('returns 0 for a range without orders', async () => {
          const res = await api.get(
            '/admin/agilo-analytics/returns?preset=custom&date_from=2020-01-01&date_to=2020-01-31',
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.return_rate).toEqual(0);
          expect(res.data.prev_return_rate_percent).toEqual(0);
          expect(res.data.returned_variants).toEqual([]);
        });
      });
    });
  },
});
