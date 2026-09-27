import { AiGatewayModuleService } from '../../../src/modules/ai-gateway/service';
import validateOptionsLoader from '../../../src/modules/ai-gateway/loaders/validate-options';

const makeService = (aiGatewayEncryptionKey?: string) =>
  Object.assign(Object.create(AiGatewayModuleService.prototype), {
    encryptionKey_: aiGatewayEncryptionKey,
    listAiGatewayKeys: jest.fn().mockResolvedValue([]),
  }) as AiGatewayModuleService;

describe('ai-gateway encryption key option', () => {
  describe('loader', () => {
    const run = (options: Record<string, unknown>) =>
      validateOptionsLoader({ options } as any);

    it('allows a missing key (AI dashboard disabled)', async () => {
      await expect(run({})).resolves.toBeUndefined();
    });

    it('allows a non-empty key', async () => {
      await expect(
        run({ aiGatewayEncryptionKey: 'secret' }),
      ).resolves.toBeUndefined();
    });

    it.each(['', '   ', 123])('throws on invalid key %p', async (key) => {
      await expect(run({ aiGatewayEncryptionKey: key })).rejects.toThrow(
        'must be a non-empty string',
      );
    });
  });

  describe('service without the key', () => {
    it('reports the key as not configured instead of throwing', async () => {
      await expect(
        makeService().getKeyStatusForUser('user_1'),
      ).resolves.toEqual({
        encryption_key_configured: false,
        configured: false,
        key_last_four: null,
      });
    });

    it('throws NOT_ALLOWED when a key is needed', async () => {
      const service = makeService();

      expect(() => service.assertEncryptionKeyConfigured()).toThrow(
        'aiGatewayEncryptionKey',
      );
      await expect(
        service.createKeyForUser({ user_id: 'user_1', api_key: 'vck_1234' }),
      ).rejects.toMatchObject({ type: 'not_allowed' });
      await expect(
        service.getDecryptedKeyForUser('user_1'),
      ).rejects.toMatchObject({ type: 'not_allowed' });
    });
  });

  it('returns the key when configured', () => {
    expect(makeService('secret').assertEncryptionKeyConfigured()).toBe(
      'secret',
    );
  });
});
