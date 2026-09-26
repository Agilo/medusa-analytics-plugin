import { sdk } from '../utils/general-utils';
import type { ModelOption } from '../../../utils/ai-models';

export async function retrieveAllAvailableModels() {
  const models = await sdk.client.fetch<ModelOption[]>(
    `/admin/agilo-analytics/analytics-ai/models`,
  );

  return models;
}
