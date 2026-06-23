import { createGateway } from 'ai';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';

export const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

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