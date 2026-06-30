import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminHeaders } from '../fixtures/auth';
import { AI_GATEWAY_MODULE } from '../../src/modules/ai-gateway';
import { AiGatewayModuleService } from '../../src/modules/ai-gateway/service';

jest.setTimeout(30000);

const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

// Vercel AI gateway is not covered here, but all other testable cases are covered here:
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai (gateway key)', () => {
      let headers: Record<string, string>;

      beforeEach(async () => {
        headers = await createAdminHeaders({
          container: getContainer(),
          emailPrefix: 'test-ai-key',
        });
      });

      describe('GET', () => {
        it('should return 401 if no authorization header', async () => {
          await expect(
            api.get('/admin/agilo-analytics/analytics-ai'),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it('should return 200 with key: null when no key is configured', async () => {
          const res = await api.get('/admin/agilo-analytics/analytics-ai', {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty('key', null);
        });

        it('should return the stored key metadata when a key exists', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createAiGatewayKeys({
            type: VERCEL_AI_GATEWAY_KEY_TYPE,
            key_hash: 'sk-gateway-test-abcd1234',
            key_last_four: '1234',
          });

          const res = await api.get('/admin/agilo-analytics/analytics-ai', {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data.key).toMatchObject({
            type: VERCEL_AI_GATEWAY_KEY_TYPE,
            key_last_four: '1234',
          });
        });

        it('should never expose the raw key hash', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createAiGatewayKeys({
            type: VERCEL_AI_GATEWAY_KEY_TYPE,
            key_hash: 'sk-gateway-test-abcd1234',
            key_last_four: '1234',
          });

          const res = await api.get('/admin/agilo-analytics/analytics-ai', {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data.key).not.toHaveProperty('key_hash');
          expect(JSON.stringify(res.data)).not.toContain(
            'sk-gateway-test-abcd1234',
          );
        });
      });

      describe('POST', () => {
        it('should return 401 if no authorization header', async () => {
          await expect(
            api.post('/admin/agilo-analytics/analytics-ai', {
              api_key: 'sk-gateway-test-abcd1234',
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it('should return 400 when api_key is missing', async () => {
          await expect(
            api.post('/admin/agilo-analytics/analytics-ai', {}, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 400 when api_key is shorter than 10 characters', async () => {
          await expect(
            api.post(
              '/admin/agilo-analytics/analytics-ai',
              { api_key: 'short' },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 400 when api_key is only whitespace', async () => {
          await expect(
            api.post(
              '/admin/agilo-analytics/analytics-ai',
              { api_key: '               ' },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      describe('PATCH', () => {
        it('should return 401 if no authorization header', async () => {
          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', {
              api_key: 'sk-gateway-test-abcd1234',
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it('should return 400 when api_key is missing', async () => {
          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', {}, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 400 when api_key is shorter than 10 characters', async () => {
          await expect(
            api.patch(
              '/admin/agilo-analytics/analytics-ai',
              { api_key: 'short' },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 400 when api_key is only whitespace', async () => {
          await expect(
            api.patch(
              '/admin/agilo-analytics/analytics-ai',
              { api_key: '               ' },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });
    });
  },
});
