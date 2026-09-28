import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { AI_GATEWAY_MODULE } from '../../../../modules/ai-gateway';
import { AiGatewayModuleService } from '../../../../modules/ai-gateway/service';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const aiGatewayModuleService = req.scope.resolve(
    AI_GATEWAY_MODULE,
  ) as AiGatewayModuleService;

  res.status(200).json({
    enabled: aiGatewayModuleService.isEnabled(),
  } satisfies GetGatewayConfigResponse);
}

export type GetGatewayConfigResponse = { enabled: boolean };
