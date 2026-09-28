import { gateway, generateText, streamText } from 'ai';
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
export type Tier = 'fast' | 'balanced' | 'dev-cheap';

export type ModelOption = {
  key: string;
  // Dev-cheap options aren't restricted to Provider — e.g. meta, xai
  provider: string;
  tier: Tier;
  modelId: string;
  name: string;
};

const GEMINI_LOW_THINKING: ProviderOptions = {
  google: { thinkingConfig: { thinkingLevel: 'low' } },
};

// Each family resolves to its newest model; the version is captured from the id.
export const FAMILIES: {
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

// Segment-wise so 3.10 > 3.8 (always picks up the newest version of some model)
export function compareVersions(a: string, b: string) {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export type Family = (typeof FAMILIES)[number];

// Every model in the family, best first: newest version, then earlier pattern on a tie
export function familyCandidates(family: Family, models: AvailableModel[]) {
  const matches: { model: AvailableModel; version: string; rank: number }[] =
    [];

  for (const model of models) {
    if (model.modelType !== 'language') continue;

    const rank = family.patterns.findIndex((p) => p.test(model.id));
    if (rank === -1) continue;

    matches.push({
      model,
      version: model.id.match(family.patterns[rank])![1],
      rank,
    });
  }

  return matches
    .sort((a, b) => compareVersions(b.version, a.version) || a.rank - b.rank)
    .map((m) => m.model);
}

// `chosen[i]` is the model picked for FAMILIES[i]; default option (first Balanced) goes first
function toFamilyOptions(
  chosen: (AvailableModel | undefined)[],
): ModelOption[] {
  const options: ModelOption[] = [];

  FAMILIES.forEach(({ provider, tier }, i) => {
    const model = chosen[i];
    if (!model) return;
    options.push({
      key: `${provider}:${tier}`,
      provider,
      tier,
      modelId: model.id,
      name: model.name,
    });
  });

  const defaultIndex = options.findIndex((o) => o.tier === 'balanced');
  if (defaultIndex > 0) options.unshift(...options.splice(defaultIndex, 1));

  return options;
}

// Newest model per family, Anthropic's Balanced as the default when available
export function resolveModelOptions(models: AvailableModel[]): ModelOption[] {
  return toFamilyOptions(FAMILIES.map((f) => familyCandidates(f, models)[0]));
}

export function getProviderOptions(option: ModelOption) {
  return FAMILIES.find((f) => `${f.provider}:${f.tier}` === option.key)
    ?.providerOptions;
}

// --- Dev-only: usable models for free-tier Gateway keys, for local testing without real spend ---
// Free-tier keys get 403 (RestrictedModelsError) on the newest models, e.g. every Anthropic one

const DEV_CHEAP_PROVIDERS = [
  'anthropic',
  'openai',
  'google',
  'meta',
  'xai',
] as const;
const DEV_CHEAP_MAX_PROBES = 10;

type Gateway = Awaited<ReturnType<typeof createConfiguredGateway>>;

// 400 too: an older fallback model may reject the family's providerOptions (e.g. reasoningEffort 'none')
async function isModelUsable(
  gateway: Gateway,
  modelId: string,
  providerOptions?: ProviderOptions,
) {
  try {
    await generateText({
      model: gateway(modelId),
      providerOptions,
      prompt: 'hi',
      maxOutputTokens: 16,
      maxRetries: 0,
    });
    return true;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return status !== 403 && status !== 400;
  }
}

async function firstUsable(
  gateway: Gateway,
  candidates: AvailableModel[],
  providerOptions?: ProviderOptions,
) {
  for (const model of candidates) {
    if (await isModelUsable(gateway, model.id, providerOptions)) return model;
  }
}

// ponytail: sequential probes per family/provider, ~a few seconds once per cache TTL; dev only, so fine.
// Each family falls back to its newest usable version, plus the cheapest usable model per provider.
async function resolveDevModelOptions(
  gateway: Gateway,
  models: AvailableModel[],
): Promise<ModelOption[]> {
  const [chosen, devCheap] = await Promise.all([
    Promise.all(
      FAMILIES.map((f) =>
        firstUsable(gateway, familyCandidates(f, models), f.providerOptions),
      ),
    ),
    Promise.all(
      DEV_CHEAP_PROVIDERS.map(async (provider): Promise<ModelOption | null> => {
        const candidates = models
          .filter(
            (m) =>
              m.modelType === 'language' &&
              m.specification.provider.toLowerCase() === provider &&
              !Number.isNaN(Number(m.pricing?.output ?? NaN)),
          )
          .sort((a, b) => Number(a.pricing!.output) - Number(b.pricing!.output))
          .slice(0, DEV_CHEAP_MAX_PROBES);

        const model = await firstUsable(gateway, candidates);
        return model
          ? {
              key: `${provider}:dev-cheap`,
              provider,
              tier: 'dev-cheap',
              modelId: model.id,
              name: model.name,
            }
          : null;
      }),
    ),
  ]);

  return [
    ...toFamilyOptions(chosen),
    ...devCheap.filter((o): o is ModelOption => o !== null),
  ];
}

export async function getModelOptions(
  scope: MedusaContainer,
  userId: string,
): Promise<ModelOption[]> {
  const cache = scope.resolve<ICacheService>(Modules.CACHE);

  // Before the cache read so a user without a key never gets the shared cached list
  const gateway = await createConfiguredGateway(scope, userId);

  const cached = await cache.get<ModelOption[]>(MODEL_OPTIONS_CACHE_KEY);
  if (cached) return cached;

  const { models } = await gateway.getAvailableModels();
  const options =
    process.env.NODE_ENV === 'development'
      ? await resolveDevModelOptions(gateway, models)
      : resolveModelOptions(models);

  if (options.length > 0) {
    await cache.set(
      MODEL_OPTIONS_CACHE_KEY,
      options,
      MODEL_OPTIONS_CACHE_TTL_SECONDS,
    );
  }

  return options;
}
