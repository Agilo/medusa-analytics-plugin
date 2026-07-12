import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/framework/utils';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';
import { adminSetGatewayKeySchema } from './validators';
import { assertValidGatewayKey } from '../../../../utils/gateway-key';
import { isDataValid } from '../../../../utils/data-validation';

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const validatedData = isDataValid({
    data: req.body,
    schema: adminSetGatewayKeySchema,
  });

  const apiKey = validatedData.api_key.trim();

  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'api_key is required',
    );
  }

  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;
  const userId = req.auth_context.actor_id;

  const { configured } =
    await aiGatewayModuleService.getKeyStatusForUser(userId);

  if (configured) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      'An AI Gateway key is already configured for your user. Replace it instead.',
    );
  }

  await assertValidGatewayKey(apiKey);

  const { key_last_four } = await aiGatewayModuleService.createKeyForUser({
    user_id: userId,
    api_key: apiKey,
  });

  res.status(201).json({
    configured: true,
    key_last_four,
  } satisfies GetGatewayConfigResponse);
}

export async function PATCH(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const { api_key: rawKey } = isDataValid({
    data: req.body,
    schema: adminSetGatewayKeySchema,
  });
  const api_key = rawKey.trim();
  if (!api_key) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'api_key is required',
    );
  }

  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;
  const userId = req.auth_context.actor_id;

  const { configured } =
    await aiGatewayModuleService.getKeyStatusForUser(userId);

  if (!configured) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No AI Gateway key is configured for your user. Save one first.',
    );
  }

  await assertValidGatewayKey(api_key);

  const { key_last_four } = await aiGatewayModuleService.updateKeyForUser({
    user_id: userId,
    api_key,
  });

  res.status(200).json({
    configured: true,
    key_last_four,
  } satisfies GetGatewayConfigResponse);
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  res
    .status(200)
    .json(
      (await aiGatewayModuleService.getKeyStatusForUser(
        req.auth_context.actor_id,
      )) satisfies GetGatewayConfigResponse,
    );
}

export type GetGatewayConfigResponse = {
  configured: boolean;
  key_last_four: string | null;
};
