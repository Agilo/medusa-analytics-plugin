import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminActor } from '../fixtures/auth';
import { AI_GATEWAY_MODULE } from '../../src/modules/ai-gateway';
import { AiGatewayModuleService } from '../../src/modules/ai-gateway/service';

jest.setTimeout(30000);

const TEST_API_KEY = 'sk-gateway-test-abcd1234';

// Vercel AI gateway is not covered here, but all other testable cases are covered here:
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe('/admin/agilo-analytics/analytics-ai (gateway key)', () => {
      let userId: string;

      beforeEach(async () => {
        const actor = await createAdminActor({
          container: getContainer(),
          emailPrefix: 'test-ai-key',
        });
        userId = actor.userId;
        api.defaults.headers.common.Authorization = actor.headers.Authorization;
      });

      describe('GET', () => {
        it('should return 401 if no authorization header', async () => {
          delete api.defaults.headers.common.Authorization;
          await expect(
            api.get('/admin/agilo-analytics/analytics-ai'),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it('should return configured: false when no key is configured', async () => {
          const res = await api.get('/admin/agilo-analytics/analytics-ai');

          expect(res.status).toEqual(200);
          expect(res.data).toEqual({
            encryption_key_configured: true,
            configured: false,
            key_last_four: null,
          });
        });

        it('should return the stored key metadata when a key exists', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createKeyForUser({
            user_id: userId,
            api_key: TEST_API_KEY,
          });

          const res = await api.get('/admin/agilo-analytics/analytics-ai');

          expect(res.status).toEqual(200);
          expect(res.data).toEqual({
            encryption_key_configured: true,
            configured: true,
            key_last_four: '1234',
          });
        });

        it("should not expose another user's key", async () => {
          const container = getContainer();
          const service = container.resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createKeyForUser({
            user_id: userId,
            api_key: TEST_API_KEY,
          });

          const otherActor = await createAdminActor({
            container,
            emailPrefix: 'test-ai-key-other',
          });

          const res = await api.get('/admin/agilo-analytics/analytics-ai', {
            headers: otherActor.headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data).toEqual({
            encryption_key_configured: true,
            configured: false,
            key_last_four: null,
          });
        });

        it('should never expose the raw or encrypted key', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createKeyForUser({
            user_id: userId,
            api_key: TEST_API_KEY,
          });

          const [row] = await service.listAiGatewayKeys({ user_id: userId });

          const res = await api.get('/admin/agilo-analytics/analytics-ai');

          expect(res.status).toEqual(200);
          expect(JSON.stringify(res.data)).not.toContain(TEST_API_KEY);
          expect(JSON.stringify(res.data)).not.toContain(row.key_encrypted);
        });
      });

      describe('encryption at rest', () => {
        it('should store the key encrypted and decrypt it back', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createKeyForUser({
            user_id: userId,
            api_key: TEST_API_KEY,
          });

          const [row] = await service.listAiGatewayKeys({ user_id: userId });

          expect(row.key_encrypted).not.toBe(TEST_API_KEY);
          expect(row.key_encrypted).not.toContain(TEST_API_KEY);
          await expect(service.getDecryptedKeyForUser(userId)).resolves.toBe(
            TEST_API_KEY,
          );
        });
      });

      describe('POST', () => {
        it('should return 401 if no authorization header', async () => {
          delete api.defaults.headers.common.Authorization;
          await expect(
            api.post('/admin/agilo-analytics/analytics-ai', {
              api_key: TEST_API_KEY,
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it.each([
          ['missing', undefined],
          ['shorter than 10 characters', 'short'],
          ['only whitespace', '               '],
        ])('should return 400 when api_key is %s', async (_, api_key) => {
          await expect(
            api.post('/admin/agilo-analytics/analytics-ai', { api_key }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 422 when the caller already has a key', async () => {
          const service = getContainer().resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          await service.createKeyForUser({
            user_id: userId,
            api_key: TEST_API_KEY,
          });

          await expect(
            api.post('/admin/agilo-analytics/analytics-ai', {
              api_key: TEST_API_KEY,
            }),
          ).rejects.toMatchObject({ response: { status: 422 } });
        });
      });

      describe('PATCH', () => {
        it('should return 401 if no authorization header', async () => {
          delete api.defaults.headers.common.Authorization;
          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', {
              api_key: TEST_API_KEY,
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it.each([
          ['missing', undefined],
          ['shorter than 10 characters', 'short'],
          ['only whitespace', '               '],
        ])('should return 400 when api_key is %s', async (_, api_key) => {
          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', { api_key }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it('should return 404 when the caller has no key', async () => {
          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', {
              api_key: TEST_API_KEY,
            }),
          ).rejects.toMatchObject({ response: { status: 404 } });
        });

        it("should not touch another user's key", async () => {
          const container = getContainer();
          const service = container.resolve(
            AI_GATEWAY_MODULE,
          ) as AiGatewayModuleService;

          const otherActor = await createAdminActor({
            container,
            emailPrefix: 'test-ai-key-other',
          });
          await service.createKeyForUser({
            user_id: otherActor.userId,
            api_key: TEST_API_KEY,
          });
          const [before] = await service.listAiGatewayKeys({
            user_id: otherActor.userId,
          });

          await expect(
            api.patch('/admin/agilo-analytics/analytics-ai', {
              api_key: 'sk-gateway-test-other9999',
            }),
          ).rejects.toMatchObject({ response: { status: 404 } });

          const [after] = await service.listAiGatewayKeys({
            user_id: otherActor.userId,
          });
          expect(after.key_encrypted).toEqual(before.key_encrypted);
          expect(after.key_last_four).toEqual('1234');
        });
      });
    });
  },
});
