import { MedusaService } from '@medusajs/framework/utils';

import AiGatewayKey from './models/ai-gateway-key';

class AiGatewayModuleService extends MedusaService({
  AiGatewayKey,
}) {}

export default AiGatewayModuleService;
