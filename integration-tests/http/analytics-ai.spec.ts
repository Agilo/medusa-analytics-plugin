import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminHeaders } from '../fixtures/auth';

jest.setTimeout(30000);

// medusa-config.js passes no aiGatewayApiKey, so the AI dashboard is disabled here
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai', () => {
      it('should return 401 if no authorization header', async () => {
        await expect(
          api.get('/admin/agilo-analytics/analytics-ai'),
        ).rejects.toMatchObject({ response: { status: 401 } });
      });

      it('should report the AI dashboard as disabled', async () => {
        const headers = await createAdminHeaders({
          container: getContainer(),
          emailPrefix: 'test-ai-status',
        });

        const res = await api.get('/admin/agilo-analytics/analytics-ai', {
          headers,
        });

        expect(res.status).toEqual(200);
        expect(res.data).toEqual({ enabled: false });
      });

      it.each(['post', 'patch'] as const)(
        'should no longer accept %s',
        async (method) => {
          const headers = await createAdminHeaders({
            container: getContainer(),
            emailPrefix: `test-ai-${method}`,
          });

          await expect(
            api[method](
              '/admin/agilo-analytics/analytics-ai',
              { api_key: 'vck_1234567890' },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 404 } });
        },
      );
    });
  },
});
