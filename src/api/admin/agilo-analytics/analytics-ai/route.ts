import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { MedusaError, Modules } from '@medusajs/framework/utils';
import type { ICacheService } from '@medusajs/framework/types';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';
import { adminSetGatewayKeySchema } from './validators';
import { assertValidGatewayKey } from './gateway-key';
import { MODELS_CACHE_KEY } from './models/route';

// TODO: support multiple keys/types in the future if needed, only one key rn (vercel ai gateway)
const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const result = adminSetGatewayKeySchema.safeParse(req.body);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.issues.map((err) => err.message).join(', '),
    );
  }

  const apiKey = result.data.api_key.trim();
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'api_key is required',
    );
  }

  // Reject bogus keys before persisting so an invalid key never unlocks the dashboard.
  await assertValidGatewayKey(apiKey);

  const keyLastFour = apiKey.length >= 4 ? apiKey.slice(-4) : null;

  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  await aiGatewayModuleService.createAiGatewayKeys({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
    key_hash: apiKey,
    key_last_four: keyLastFour,
  });

  // The model list is per-key, so drop any cached list from a previous key.
  await req.scope
    .resolve<ICacheService>(Modules.CACHE)
    .invalidate(MODELS_CACHE_KEY);

  res.status(201).json({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
    key_last_four: keyLastFour,
  });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const result = adminSetGatewayKeySchema.safeParse(req.body);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.issues.map((err) => err.message).join(', '),
    );
  }

  const apiKey = result.data.api_key.trim();
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'api_key is required',
    );
  }

  // Validate the replacement key before overwriting — a bad key must not clobber the working one.
  await assertValidGatewayKey(apiKey);

  const keyLastFour = apiKey.length >= 4 ? apiKey.slice(-4) : null;

  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  await aiGatewayModuleService.updateAiGatewayKeys({
    selector: { type: VERCEL_AI_GATEWAY_KEY_TYPE },
    data: {
      key_hash: apiKey,
      key_last_four: keyLastFour,
    },
  });

  // The model list is per-key, so drop the cached list from the replaced key.
  await req.scope
    .resolve<ICacheService>(Modules.CACHE)
    .invalidate(MODELS_CACHE_KEY);

  res.status(200).json({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
    key_last_four: keyLastFour,
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  const [existing] = await aiGatewayModuleService.listAiGatewayKeys({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
  });

  res.status(200).json({
    key: existing
      ? {
          type: existing.type,
          key_last_four: existing.key_last_four,
        }
      : null,
  } satisfies GetGatewayConfigResponse);
}

export type GetGatewayConfigResponse = {
  key: {
    type: string;
    key_last_four: string | null;
  } | null;
};
