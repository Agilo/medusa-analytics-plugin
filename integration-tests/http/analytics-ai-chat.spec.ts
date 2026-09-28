import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminHeaders } from '../fixtures/auth';

jest.setTimeout(30000);

// Vercel AI gateway is not covered here, but all other testable cases are covered here:
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai/chat', () => {
      const validBody = {
        prompt: 'How many orders did we get this month?',
        context: { optionKey: 'anthropic:balanced' },
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

      it('should return 400 when the AI dashboard is not enabled', async () => {
        await expect(
          api.post('/admin/agilo-analytics/analytics-ai/chat', validBody, {
            headers,
          }),
        ).rejects.toMatchObject({
          response: {
            status: 400,
            data: {
              message: expect.stringContaining('AI dashboard is not enabled'),
            },
          },
        });
      });

      it.each([
        ['the body is empty', {}],
        ['prompt is missing', { context: { optionKey: 'anthropic:balanced' } }],
        [
          'prompt is an empty string',
          { prompt: '', context: { optionKey: 'anthropic:balanced' } },
        ],
        [
          'context is missing',
          { prompt: 'How many orders did we get this month?' },
        ],
        [
          'context.optionKey is missing',
          { prompt: 'How many orders did we get this month?', context: {} },
        ],
      ])('should return 400 when %s', async (_description, body) => {
        await expect(
          api.post('/admin/agilo-analytics/analytics-ai/chat', body, {
            headers,
          }),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });
    });
  },
});
