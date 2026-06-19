import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/framework/utils';
import { randomBytes, scryptSync } from 'crypto';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';
import { adminSetGatewayKeySchema } from './validators';

// TODO:support multiple keys/types in the future if needed, only one key rn
const VERCEL_AI_GATEWAY_KEY_TYPE = 'vercel_ai_gateway';

function hashToStoredString(value: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(value, salt, 64);

  // Format user for hashing: scrypt$<salt_b64>$<hash_b64>
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = adminSetGatewayKeySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.errors.map((err) => err.message).join(', '),
    );
  }

  const apiKey = parsed.data.api_key.trim();
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'api_key is required',
    );
  }

  const key_hash = hashToStoredString(apiKey);

  const keyLastFour = apiKey.length >= 4 ? apiKey.slice(-4) : null;

  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  const existing = await aiGatewayModuleService.listAiGatewayKeys();

  if (existing.length) {
    await aiGatewayModuleService.updateAiGatewayKeys({
      selector: { type: VERCEL_AI_GATEWAY_KEY_TYPE },
      data: {
        key_hash,
        key_last_four: keyLastFour,
      },
    });
  } else {
    await aiGatewayModuleService.createAiGatewayKeys({
      type: VERCEL_AI_GATEWAY_KEY_TYPE,
      key_hash,
      key_last_four: keyLastFour,
    });
  }

  res.status(201).json({
    type: VERCEL_AI_GATEWAY_KEY_TYPE,
    key_last_four: keyLastFour,
  });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {}

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
