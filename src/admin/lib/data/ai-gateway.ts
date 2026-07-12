import { sdk } from '../utils/general-utils';
import type { AdminSetGatewayKeyInputArgs } from '../../../api/admin/agilo-analytics/analytics-ai/validators';
import type { GetGatewayConfigResponse } from '../../../api/admin/agilo-analytics/analytics-ai/route';

export async function setGatewayKey(payload: AdminSetGatewayKeyInputArgs) {
  return await sdk.client.fetch<GetGatewayConfigResponse>(
    `/admin/agilo-analytics/analytics-ai`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export async function updateGatewayKey(payload: AdminSetGatewayKeyInputArgs) {
  return await sdk.client.fetch<GetGatewayConfigResponse>(
    `/admin/agilo-analytics/analytics-ai`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function getGatewayConfig() {
  return await sdk.client.fetch<GetGatewayConfigResponse>(
    `/admin/agilo-analytics/analytics-ai`,
  );
}
