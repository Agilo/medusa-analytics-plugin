import { model } from '@medusajs/framework/utils';

export const AiGatewayKey = model.define('ai_gateway_key', {
  id: model.id().primaryKey(),
  type: model.text().unique(),
  key_hash: model.text(),
  key_last_four: model.text().nullable(),
});
