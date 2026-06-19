import { sdk } from '../utils';
import type { AdminSetGatewayKeyInputArgs } from '../../../api/admin/agilo-analytics/analytics-ai/validators';

export async function setGatewayKey(payload: AdminSetGatewayKeyInputArgs) {
  return await sdk.client.fetch<AdminSetGatewayKeyInputArgs>(
    `/admin/agilo-analytics/analytics-ai`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export async function updateGatewayKey(payload: AdminSetGatewayKeyInputArgs) {
  return await sdk.client.fetch<AdminSetGatewayKeyInputArgs>(
    `/admin/agilo-analytics/analytics-ai`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function getGatewayConfig() {
  return await sdk.client.fetch<{
    key: {
      type: string;
      key_last_four: string | null;
    } | null;
  }>(`/admin/agilo-analytics/analytics-ai`);
}
