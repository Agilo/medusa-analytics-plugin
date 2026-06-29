import { createGateway } from 'ai';
import { GatewayAuthenticationError } from '@ai-sdk/gateway';
import { MedusaError } from '@medusajs/framework/utils';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';

export const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

/**
 * Verify that the provided key is a real Vercel AI Gateway key before we
 * persist it. We hit the account-scoped credits endpoint, which actually
 * authenticates the key (unlike the public models/`/config` endpoint, which
 * returns the full catalog for any key). Only an authentication failure means
 * the key is bad — other failures (network, gateway 5xx) are transient and
 * must not be reported to the user as an invalid key.
 */
export async function assertValidGatewayKey(apiKey: string) {
  try {
    const gateway = createGateway({ apiKey });
    await gateway.getCredits();
  } catch (error) {
    if (GatewayAuthenticationError.isInstance(error)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'The provided key is not a valid Vercel AI Gateway key. Double-check the key and try again.',
      );
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'Could not verify the AI Gateway key right now. Please try again in a moment.',
    );
  }
}

type RequestScope = {
  resolve: (key: string) => unknown;
};

export async function getStoredGatewayKey(scope: RequestScope) {
  const aiGatewayModuleService = scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  const [existing] = await aiGatewayModuleService.listAiGatewayKeys({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
  });

  return existing?.key_hash ?? null;
}

export async function createConfiguredGateway(scope: RequestScope) {
  const apiKey = await getStoredGatewayKey(scope);

  if (!apiKey) {
    throw new Error(
      'Missing AI Gateway key. Save a Vercel AI Gateway key in the admin dashboard.',
    );
  }

  return createGateway({ apiKey });
}
