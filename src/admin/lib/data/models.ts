import { sdk } from '../utils/general-utils';
import type { AvailableModelsResponse } from '../../../api/admin/agilo-analytics/analytics-ai/models/route';

export async function retrieveAllAvailableModels() {
  const models = await sdk.client.fetch<AvailableModelsResponse['models']>(
    `/admin/agilo-analytics/analytics-ai/models`,
  );

  return models;
}
