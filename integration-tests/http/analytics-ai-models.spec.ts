import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminHeaders } from '../fixtures/auth';

jest.setTimeout(30000);

// Vercel AI gateway is not covered here, but all other testable cases are covered here:
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai/models', () => {
      let headers: Record<string, string>;

      beforeEach(async () => {
        headers = await createAdminHeaders({
          container: getContainer(),
          emailPrefix: 'test-ai-models',
        });
      });

      it('should return 401 if no authorization header', async () => {
        await expect(
          api.get('/admin/agilo-analytics/analytics-ai/models'),
        ).rejects.toMatchObject({ response: { status: 401 } });
      });

      it('should return 500 when no gateway key is configured', async () => {
        await expect(
          api.get('/admin/agilo-analytics/analytics-ai/models', { headers }),
        ).rejects.toMatchObject({ response: { status: 500 } });
      });
    });
  },
});
