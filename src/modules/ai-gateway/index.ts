import { Module } from '@medusajs/framework/utils';

import AiGatewayModuleService from './service';

export const AI_GATEWAY_MODULE = 'ai_gateway';

export default Module(AI_GATEWAY_MODULE, {
  service: AiGatewayModuleService,
});
