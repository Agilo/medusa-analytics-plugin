import { Module } from '@medusajs/framework/utils';

import { AiGatewayModuleService } from './service';
import validateOptionsLoader from './loaders/validate-options';

export const AI_GATEWAY_MODULE = 'ai_gateway';

export default Module(AI_GATEWAY_MODULE, {
  service: AiGatewayModuleService,
  loaders: [validateOptionsLoader],
});
