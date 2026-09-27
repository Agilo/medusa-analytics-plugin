import { createGateway } from 'ai';
import { GatewayAuthenticationError } from '@ai-sdk/gateway';
import { MedusaError } from '@medusajs/framework/utils';
import {
  assertValidGatewayKey,
  createConfiguredGateway,
} from '../../src/utils/gateway-key';
import { AI_GATEWAY_MODULE } from '../../src/modules/ai-gateway';

jest.mock('ai', () => ({ createGateway: jest.fn() }));

describe('assertValidGatewayKey', () => {
  const getCredits = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createGateway).mockReturnValue({ getCredits } as never);
  });

  it('resolves when the Gateway accepts the key', async () => {
    getCredits.mockResolvedValue({ balance: '0' });

    await expect(assertValidGatewayKey('vck_valid')).resolves.toBeUndefined();
    expect(createGateway).toHaveBeenCalledWith({ apiKey: 'vck_valid' });
  });

  it('maps an authentication error to NOT_ALLOWED', async () => {
    getCredits.mockRejectedValue(
      new GatewayAuthenticationError({ message: 'bad key', statusCode: 401 }),
    );

    await expect(assertValidGatewayKey('vck_bad')).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
      message: expect.stringContaining('not a valid Vercel AI Gateway key'),
    });
  });

  it('maps any other failure to UNEXPECTED_STATE', async () => {
    getCredits.mockRejectedValue(new Error('ECONNRESET'));

    await expect(assertValidGatewayKey('vck_any')).rejects.toMatchObject({
      type: MedusaError.Types.UNEXPECTED_STATE,
      message: expect.stringContaining('Could not verify'),
    });
  });
});

describe('createConfiguredGateway', () => {
  it("builds the gateway from the user's decrypted key", async () => {
    const getDecryptedKeyForUser = jest.fn().mockResolvedValue('vck_stored');
    const scope = { resolve: jest.fn(() => ({ getDecryptedKeyForUser })) };
    const gateway = {};
    jest.mocked(createGateway).mockReturnValue(gateway as never);

    await expect(
      createConfiguredGateway(scope as never, 'user_1'),
    ).resolves.toBe(gateway);
    expect(scope.resolve).toHaveBeenCalledWith(AI_GATEWAY_MODULE);
    expect(getDecryptedKeyForUser).toHaveBeenCalledWith('user_1');
    expect(createGateway).toHaveBeenCalledWith({ apiKey: 'vck_stored' });
  });
});
