import { createGateway } from 'ai';
import { MedusaError } from '@medusajs/framework/utils';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';

export const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

/**
 * Verify that the provided key is a real Vercel AI Gateway key before we
 * persist it. We hit the gateway's models endpoint, which requires the key in
 * the Authorization header — an invalid key throws an error. This is done because we don't want user to add invalid api key.
 */
export async function assertValidGatewayKey(apiKey: string) {
  try {
    const gateway = createGateway({ apiKey });
    await gateway.getAvailableModels();
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'The provided key is not a valid Vercel AI Gateway key. Double-check the key and try again.',
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
