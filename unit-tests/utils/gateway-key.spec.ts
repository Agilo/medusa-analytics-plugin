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
  it("builds the gateway from the module's api key", () => {
    const getApiKey = jest.fn().mockReturnValue('vck_env');
    const scope = { resolve: jest.fn(() => ({ getApiKey })) };
    const gateway = {};
    jest.mocked(createGateway).mockReturnValue(gateway as never);

    expect(createConfiguredGateway(scope as never)).toBe(gateway);
    expect(scope.resolve).toHaveBeenCalledWith(AI_GATEWAY_MODULE);
    expect(createGateway).toHaveBeenCalledWith({ apiKey: 'vck_env' });
  });
});
