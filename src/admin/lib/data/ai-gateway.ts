import { sdk } from '../utils/general-utils';
import type { GetGatewayConfigResponse } from '../../../api/admin/agilo-analytics/analytics-ai/route';

export async function getGatewayConfig() {
  return await sdk.client.fetch<GetGatewayConfigResponse>(
    `/admin/agilo-analytics/analytics-ai`,
  );
}
