import UserModule from '@medusajs/medusa/user';
import AiGatewayModule from '../modules/ai-gateway';
import { defineLink } from '@medusajs/framework/utils';

export default defineLink(
  UserModule.linkable.user,
  AiGatewayModule.linkable.aiGatewayKey,
);
