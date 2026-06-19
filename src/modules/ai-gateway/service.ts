import { MedusaService } from '@medusajs/framework/utils';

import AiGatewayKey from './models/ai-gateway-key';

export class AiGatewayModuleService extends MedusaService({
  AiGatewayKey,
}) {}
