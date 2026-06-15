import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { gateway } from 'ai';

const allowedProviders = new Set(['openai', 'anthropic', 'vertex']); // vertex = google

const EXCLUDED_MODEL_SEGMENTS = /\b(opus|codex|pro|thinking|deep|o\d)\b/i;

const preferredModelPatterns: Record<string, RegExp> = {
  openai: /\/gpt-(?:[5-9]|[1-9]\d+)(?:[.\-]\S*)?\b/i,
  anthropic: /\/claude-(?:(?!opus)\w+)-(?:[4-9]|[1-9]\d+)(?:[.\-]\d+)?\b/i,
  vertex: /\/gemini-(?:[3-9]|[1-9]\d+)(?:[.\-]\d+)?(?:-\w+)*\b/i,
};

function isPreferredModel(model: AvailableModel) {
  const provider = model.specification.provider.toLowerCase();

  if (!allowedProviders.has(provider)) return false;

  const modelId = model.specification.modelId.toLowerCase();

  if (EXCLUDED_MODEL_SEGMENTS.test(modelId)) return false;

  return preferredModelPatterns[provider]?.test(modelId) ?? false;
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
