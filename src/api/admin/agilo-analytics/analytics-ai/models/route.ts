import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { gateway } from 'ai';

const allowedProviders = new Set(['openai', 'anthropic', 'google']);

const preferredModelPatterns: Record<string, RegExp> = {
  openai: /\bgpt-(?:[5-9]|[1-9]\d+)(?:[.\-]\S*)?\b/i,
  anthropic: /\bclaude-(?:[4-9]|[1-9]\d+)(?:[.\-]\S*)?\b/i,
  google: /\bgemini-(?:[3-9]|[1-9]\d+)(?:[.\-]\S*)?\b/i,
};
function isPreferredModel(model: AvailableModel) {
  const provider = model.specification.provider.toLowerCase();

  if (!allowedProviders.has(provider)) {
    return false;
  }

  const searchableText = [model.id, model.name, model.specification.modelId]
    .join(' ')
    .toLowerCase();

  return preferredModelPatterns[provider]?.test(searchableText) ?? false;
}

function filterPopularModels(models: AvailableModel[]) {
  const providerModels = models.filter((model) =>
    allowedProviders.has(model.specification.provider.toLowerCase()),
  );

  const preferredModels = providerModels.filter(isPreferredModel);

  return preferredModels.length > 0 ? preferredModels : providerModels;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('Missing AI_GATEWAY_API_KEY environment variable');
  }

  const { models } = await gateway.getAvailableModels();
  return res.json(filterPopularModels(models));
}

export type AvailableModelsResponse = Awaited<
  ReturnType<typeof gateway.getAvailableModels>
>;

export type AvailableModel = AvailableModelsResponse['models'][number];
