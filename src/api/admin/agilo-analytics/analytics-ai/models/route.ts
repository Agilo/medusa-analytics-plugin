import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { Modules } from '@medusajs/framework/utils';
import type { ICacheService } from '@medusajs/framework/types';
import { createConfiguredGateway } from '../../../../../utils/gateway-key';
import { gateway } from 'ai';

export const MODELS_CACHE_KEY = 'agilo-analytics:ai-models';
const MODELS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'google', 'xai', 'vertex'];

const MAX_AVG_PRICE_PER_INPUT_TOKEN = 0.000003;
const MAX_AVG_PRICE_PER_OUTPUT_TOKEN = 0.000015;

const EXCLUDED_KEYWORDS = [
  /(?<!non-)reasoning/i,
  /\bo\d+/i,
  /nano/i,
  /codex/i,
  /multi-agent/i,
  /thinking/i,
  /preview/i,
  /banana/i,
];

const VERSION_REQUIREMENTS = [
  { pattern: /gpt-(\d+)/i, min: 5 },
  { pattern: /claude-\D*?(\d+)/i, min: 4 },
  { pattern: /gemini-(\d+)/i, min: 3 },
];

function isAffordableModel(model: AvailableModel) {
  if (model.modelType !== 'language') return false;

  const idLower = model.id.toLowerCase();
  if (!ALLOWED_PROVIDERS.some((provider) => idLower.includes(provider)))
    return false;

  if (!ALLOWED_PROVIDERS.includes(model.specification.provider.toLowerCase()))
    return false;

  const text = `${model.id} ${model.name}`;

  if (EXCLUDED_KEYWORDS.some((pattern) => pattern.test(text))) return false;

  for (const { pattern, min } of VERSION_REQUIREMENTS) {
    const match = text.match(pattern);
    if (match && parseInt(match[1]) < min) return false;
  }

  if (!model.pricing?.input || !model.pricing?.output) return false;

  return (
    +model.pricing.input <= MAX_AVG_PRICE_PER_INPUT_TOKEN &&
    +model.pricing.output <= MAX_AVG_PRICE_PER_OUTPUT_TOKEN
  );
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cache = req.scope.resolve<ICacheService>(Modules.CACHE);

  const cached =
    await cache.get<AvailableModelsResponse['models']>(MODELS_CACHE_KEY);
  if (cached) {
    return res.json(cached);
  }

  const gateway = await createConfiguredGateway(req.scope);
  const { models } = await gateway.getAvailableModels();
  const affordableModels = models.filter(
    isAffordableModel,
  ) satisfies AvailableModelsResponse['models'];

  await cache.set(MODELS_CACHE_KEY, affordableModels, MODELS_CACHE_TTL_SECONDS);

  return res.json(affordableModels);
}

export type AvailableModelsResponse = Awaited<
  ReturnType<typeof gateway.getAvailableModels>
>;

export type AvailableModel = AvailableModelsResponse['models'][number];
