import { model } from '@medusajs/framework/utils';

export const AiGatewayKey = model.define('ai_gateway_key', {
  id: model.id().primaryKey(),
  user_id: model.text().unique(),
  key_encrypted: model.text(),
  key_last_four: model.text().nullable(),
});
