import { gateway, streamText } from 'ai';
import { Modules } from '@medusajs/framework/utils';
import type { ICacheService, MedusaContainer } from '@medusajs/framework/types';
import { createConfiguredGateway } from './gateway-key';

const MODEL_OPTIONS_CACHE_KEY = 'agilo-analytics:ai-model-options';
const MODEL_OPTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

type AvailableModel = Awaited<
  ReturnType<typeof gateway.getAvailableModels>
>['models'][number];
type ProviderOptions = Parameters<typeof streamText>[0]['providerOptions'];

export type Provider = 'anthropic' | 'openai' | 'google';
export type Tier = 'fast' | 'balanced';

export type ModelOption = {
  key: `${Provider}:${Tier}`;
  provider: Provider;
  tier: Tier;
  modelId: string;
  name: string;
};

const GEMINI_LOW_THINKING: ProviderOptions = {
  google: { thinkingConfig: { thinkingLevel: 'low' } },
};

// Each family resolves to its newest model; the version is captured from the id.
const FAMILIES: {
  provider: Provider;
  tier: Tier;
  patterns: RegExp[];
  providerOptions?: ProviderOptions;
}[] = [
  {
    provider: 'anthropic',
    tier: 'balanced',
    patterns: [/^anthropic\/claude-sonnet-([\d.]+)$/],
    providerOptions: {
      anthropic: { thinking: { type: 'enabled', budgetTokens: 1024 } },
    },
  },
  {
    provider: 'anthropic',
    tier: 'fast',
    patterns: [/^anthropic\/claude-haiku-([\d.]+)$/],
  },
  {
    provider: 'openai',
    tier: 'balanced',
    patterns: [
      /^openai\/gpt-([\d.]+)-sol$/,
      /^openai\/gpt-([\d.]+)-terra$/,
      /^openai\/gpt-([\d.]+)$/,
    ],
    providerOptions: { openai: { reasoningEffort: 'low' } },
  },
  {
    provider: 'openai',
    tier: 'fast',
    patterns: [/^openai\/gpt-([\d.]+)-luna$/, /^openai\/gpt-([\d.]+)-mini$/],
    providerOptions: { openai: { reasoningEffort: 'none' } },
  },
  {
    provider: 'google',
    tier: 'balanced',
    patterns: [/^google\/gemini-([\d.]+)-pro(?:-preview)?$/],
    providerOptions: GEMINI_LOW_THINKING,
  },
  {
    // Gemini 3+ can't turn thinking off, low is the minimum
    provider: 'google',
    tier: 'fast',
    patterns: [/^google\/gemini-([\d.]+)-flash$/],
    providerOptions: GEMINI_LOW_THINKING,
  },
];

// Segment-wise so 3.10 > 3.8
export function compareVersions(a: string, b: string) {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Default option (first Balanced, i.e. Anthropic's when available) is returned first
export function resolveModelOptions(models: AvailableModel[]): ModelOption[] {
  const options: ModelOption[] = [];

  for (const { provider, tier, patterns } of FAMILIES) {
    let best: { model: AvailableModel; version: string; rank: number } | null =
      null;

    for (const model of models) {
      if (model.modelType !== 'language') continue;

      for (const [rank, pattern] of patterns.entries()) {
        const version = model.id.match(pattern)?.[1];
        if (!version) continue;

        const diff = best ? compareVersions(version, best.version) : 1;
        if (diff > 0 || (diff === 0 && best && rank < best.rank)) {
          best = { model, version, rank };
        }
      }
    }

    if (best) {
      options.push({
        key: `${provider}:${tier}`,
        provider,
        tier,
        modelId: best.model.id,
        name: best.model.name,
      });
    }
  }

  const defaultIndex = options.findIndex((o) => o.tier === 'balanced');
  if (defaultIndex > 0) options.unshift(...options.splice(defaultIndex, 1));

  return options;
}

export function getProviderOptions(option: ModelOption) {
  return FAMILIES.find((f) => `${f.provider}:${f.tier}` === option.key)
    ?.providerOptions;
}

export async function getModelOptions(
  scope: MedusaContainer,
  userId: string,
): Promise<ModelOption[]> {
  const cache = scope.resolve<ICacheService>(Modules.CACHE);

  const cached = await cache.get<ModelOption[]>(MODEL_OPTIONS_CACHE_KEY);
  if (cached) return cached;

  const gateway = await createConfiguredGateway(scope, userId);
  const { models } = await gateway.getAvailableModels();
  const options = resolveModelOptions(models);

  if (options.length > 0) {
    await cache.set(
      MODEL_OPTIONS_CACHE_KEY,
      options,
      MODEL_OPTIONS_CACHE_TTL_SECONDS,
    );
  }

  return options;
}
