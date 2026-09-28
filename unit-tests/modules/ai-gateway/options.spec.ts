import { AiGatewayModuleService } from '../../../src/modules/ai-gateway/service';
import validateOptionsLoader from '../../../src/modules/ai-gateway/loaders/validate-options';

describe('ai-gateway api key option', () => {
  describe('loader', () => {
    const run = (options: Record<string, unknown>) =>
      validateOptionsLoader({ options } as any);

    it('allows a missing key (AI dashboard disabled)', async () => {
      await expect(run({})).resolves.toBeUndefined();
    });

    it('allows a non-empty key', async () => {
      await expect(
        run({ aiGatewayApiKey: 'vck_123' }),
      ).resolves.toBeUndefined();
    });

    it.each(['', '   ', 123])('throws on invalid key %p', async (key) => {
      await expect(run({ aiGatewayApiKey: key })).rejects.toThrow(
        'must be a non-empty string',
      );
    });
  });

  describe('service', () => {
    it('is disabled and throws NOT_ALLOWED without the key', () => {
      const service = new AiGatewayModuleService({});

      expect(service.isEnabled()).toBe(false);
      expect(() => service.getApiKey()).toThrow(
        expect.objectContaining({
          type: 'not_allowed',
          message: expect.stringContaining('AI_GATEWAY_API_KEY'),
        }),
      );
    });

    it('is enabled and returns the key when configured', () => {
      const service = new AiGatewayModuleService(
        {},
        { aiGatewayApiKey: 'vck_123' },
      );

      expect(service.isEnabled()).toBe(true);
      expect(service.getApiKey()).toBe('vck_123');
    });
  });
});
