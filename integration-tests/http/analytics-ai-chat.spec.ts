import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminHeaders } from '../fixtures/auth';

jest.setTimeout(30000);

// Vercel AI gateway is not covered here, but all other testable cases are covered here:
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai/chat', () => {
      const validBody = {
        prompt: 'How many orders did we get this month?',
        context: { modelId: 'openai/gpt-5' },
      };

      let headers: Record<string, string>;

      beforeEach(async () => {
        headers = await createAdminHeaders({
          container: getContainer(),
          emailPrefix: 'test-ai-chat',
        });
      });

      it('should return 401 if no authorization header', async () => {
        await expect(
          api.post('/admin/agilo-analytics/analytics-ai/chat', validBody),
        ).rejects.toMatchObject({ response: { status: 401 } });
      });

      it('should return 400 when the body is empty', async () => {
        await expect(
          api.post('/admin/agilo-analytics/analytics-ai/chat', {}, { headers }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('should return 400 when prompt is missing', async () => {
        await expect(
          api.post(
            '/admin/agilo-analytics/analytics-ai/chat',
            { context: { modelId: 'openai/gpt-5' } },
            { headers },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('should return 400 when prompt is an empty string', async () => {
        await expect(
          api.post(
            '/admin/agilo-analytics/analytics-ai/chat',
            { prompt: '', context: { modelId: 'openai/gpt-5' } },
            { headers },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('should return 400 when context is missing', async () => {
        await expect(
          api.post(
            '/admin/agilo-analytics/analytics-ai/chat',
            { prompt: 'How many orders did we get this month?' },
            { headers },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('should return 400 when context.modelId is missing', async () => {
        await expect(
          api.post(
            '/admin/agilo-analytics/analytics-ai/chat',
            {
              prompt: 'How many orders did we get this month?',
              context: {},
            },
            { headers },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('should return 400 when no gateway key is configured', async () => {
        await expect(
          api.post('/admin/agilo-analytics/analytics-ai/chat', validBody, {
            headers,
          }),
        ).rejects.toMatchObject({
          response: {
            status: 400,
            data: {
              message: expect.stringContaining('Missing AI Gateway key'),
            },
          },
        });
      });
    });
  },
});
