import { Modules } from '@medusajs/framework/utils';
import {
  compareVersions,
  FAMILIES,
  familyCandidates,
  getModelOptions,
  getProviderOptions,
  resolveModelOptions,
} from '../../src/utils/ai-models';
import {
  assertValidGatewayKey,
  createConfiguredGateway,
} from '../../src/utils/gateway-key';
import { AI_GATEWAY_MODULE } from '../../src/modules/ai-gateway';

jest.mock('../../src/utils/gateway-key', () => ({
  assertValidGatewayKey: jest.fn(),
  createConfiguredGateway: jest.fn(),
}));

type AvailableModel = Parameters<typeof resolveModelOptions>[0][number];

// Only the fields the resolver reads; versions are made up on purpose to test the naming structure
const model = (id: string, modelType = 'language') =>
  ({ id, name: `name:${id}`, modelType }) as AvailableModel;

const modelIdsByKey = (models: AvailableModel[]) =>
  Object.fromEntries(
    resolveModelOptions(models).map((o) => [o.key, o.modelId]),
  );

describe('compareVersions', () => {
  it('compares segment-wise, not as strings or floats', () => {
    expect(compareVersions('3.10', '3.8')).toBeGreaterThan(0);
    expect(compareVersions('3.8', '3.10')).toBeLessThan(0);
  });

  it('treats missing segments as 0', () => {
    expect(compareVersions('4', '4.0')).toBe(0);
    expect(compareVersions('4.0.1', '4')).toBeGreaterThan(0);
  });

  it('returns 0 for equal versions', () => {
    expect(compareVersions('4.5', '4.5')).toBe(0);
  });

  it('compares major before minor', () => {
    expect(compareVersions('5', '4.99')).toBeGreaterThan(0);
  });
});

describe('resolveModelOptions', () => {
  const fullCatalog = [
    model('anthropic/claude-sonnet-9.1'),
    model('anthropic/claude-haiku-9.1'),
    model('openai/gpt-9'),
    model('openai/gpt-9-mini'),
    model('google/gemini-9-pro'),
    model('google/gemini-9-flash'),
  ];

  it('returns one option per family, keyed provider:tier, in family order', () => {
    expect(resolveModelOptions(fullCatalog)).toEqual([
      {
        key: 'anthropic:balanced',
        provider: 'anthropic',
        tier: 'balanced',
        modelId: 'anthropic/claude-sonnet-9.1',
        name: 'name:anthropic/claude-sonnet-9.1',
      },
      {
        key: 'anthropic:fast',
        provider: 'anthropic',
        tier: 'fast',
        modelId: 'anthropic/claude-haiku-9.1',
        name: 'name:anthropic/claude-haiku-9.1',
      },
      {
        key: 'openai:balanced',
        provider: 'openai',
        tier: 'balanced',
        modelId: 'openai/gpt-9',
        name: 'name:openai/gpt-9',
      },
      {
        key: 'openai:fast',
        provider: 'openai',
        tier: 'fast',
        modelId: 'openai/gpt-9-mini',
        name: 'name:openai/gpt-9-mini',
      },
      {
        key: 'google:balanced',
        provider: 'google',
        tier: 'balanced',
        modelId: 'google/gemini-9-pro',
        name: 'name:google/gemini-9-pro',
      },
      {
        key: 'google:fast',
        provider: 'google',
        tier: 'fast',
        modelId: 'google/gemini-9-flash',
        name: 'name:google/gemini-9-flash',
      },
    ]);
  });

  it('only ever returns Fast or Balanced tiers', () => {
    for (const option of resolveModelOptions(fullCatalog)) {
      expect(['fast', 'balanced']).toContain(option.tier);
    }
  });

  it('returns no options when nothing matches', () => {
    expect(resolveModelOptions([])).toEqual([]);
    expect(resolveModelOptions([model('meta/llama-9')])).toEqual([]);
  });

  it('skips a family with no match without affecting the others', () => {
    expect(
      modelIdsByKey([
        model('anthropic/claude-haiku-9'),
        model('google/gemini-9-flash'),
      ]),
    ).toEqual({
      'anthropic:fast': 'anthropic/claude-haiku-9',
      'google:fast': 'google/gemini-9-flash',
    });
  });

  it('ignores non-language models', () => {
    expect(
      resolveModelOptions([model('anthropic/claude-sonnet-9', 'embedding')]),
    ).toEqual([]);
  });

  describe('default option ordering', () => {
    it('moves the first Balanced option to the front', () => {
      const keys = resolveModelOptions([
        model('openai/gpt-9-mini'),
        model('google/gemini-9-pro'),
      ]).map((o) => o.key);

      expect(keys).toEqual(['google:balanced', 'openai:fast']);
    });

    it('prefers Anthropic Balanced as default when present', () => {
      const [first] = resolveModelOptions([...fullCatalog].reverse());
      expect(first.key).toBe('anthropic:balanced');
    });

    it('keeps family order when there is no Balanced option', () => {
      const keys = resolveModelOptions([
        model('google/gemini-9-flash'),
        model('anthropic/claude-haiku-9'),
      ]).map((o) => o.key);

      expect(keys).toEqual(['anthropic:fast', 'google:fast']);
    });
  });

  describe('version selection', () => {
    it('picks the newest version segment-wise', () => {
      expect(
        modelIdsByKey([
          model('anthropic/claude-sonnet-9.8'),
          model('anthropic/claude-sonnet-9.10'),
          model('anthropic/claude-sonnet-9'),
        ])['anthropic:balanced'],
      ).toBe('anthropic/claude-sonnet-9.10');
    });

    it('accepts versions without a dot', () => {
      expect(
        modelIdsByKey([model('anthropic/claude-sonnet-9')])[
          'anthropic:balanced'
        ],
      ).toBe('anthropic/claude-sonnet-9');
    });

    it('prefers a newer version over an earlier pattern', () => {
      expect(
        modelIdsByKey([model('openai/gpt-9-sol'), model('openai/gpt-9.1')])[
          'openai:balanced'
        ],
      ).toBe('openai/gpt-9.1');
    });
  });

  describe('pattern priority on a version tie', () => {
    it('OpenAI Balanced: -sol beats -terra beats plain', () => {
      const ids = [
        model('openai/gpt-9'),
        model('openai/gpt-9-terra'),
        model('openai/gpt-9-sol'),
      ];
      expect(modelIdsByKey(ids)['openai:balanced']).toBe('openai/gpt-9-sol');
      expect(modelIdsByKey(ids.slice(0, 2))['openai:balanced']).toBe(
        'openai/gpt-9-terra',
      );
    });

    it('OpenAI Fast: -luna beats -mini', () => {
      expect(
        modelIdsByKey([model('openai/gpt-9-mini'), model('openai/gpt-9-luna')])[
          'openai:fast'
        ],
      ).toBe('openai/gpt-9-luna');
    });

    it('Gemini Pro: -pro and -pro-preview share a pattern, so input order breaks the tie', () => {
      expect(
        modelIdsByKey([
          model('google/gemini-9-pro-preview'),
          model('google/gemini-9-pro'),
        ])['google:balanced'],
      ).toBe('google/gemini-9-pro-preview');
      expect(
        modelIdsByKey([
          model('google/gemini-9-pro'),
          model('google/gemini-9-pro-preview'),
        ])['google:balanced'],
      ).toBe('google/gemini-9-pro');
    });
  });

  describe('naming structure boundaries', () => {
    it.each([
      ['dated snapshot', 'anthropic/claude-sonnet-9.1-20990101'],
      ['different family', 'anthropic/claude-opus-9'],
      ['missing provider prefix', 'claude-sonnet-9'],
      ['wrong provider prefix', 'bedrock/claude-sonnet-9'],
      ['non-numeric version', 'openai/gpt-9o'],
      ['OpenAI nano', 'openai/gpt-9-nano'],
      ['OpenAI unknown suffix', 'openai/gpt-9-pro'],
      ['Gemini flash-lite', 'google/gemini-9-flash-lite'],
      ['Gemini flash-preview', 'google/gemini-9-flash-preview'],
      ['Gemini with no tier suffix', 'google/gemini-9'],
    ])('excludes %s (%s)', (_, id) => {
      expect(resolveModelOptions([model(id)])).toEqual([]);
    });

    it.each([
      ['anthropic:balanced', 'anthropic/claude-sonnet-9.1'],
      ['anthropic:fast', 'anthropic/claude-haiku-9.1'],
      ['openai:balanced', 'openai/gpt-9.1'],
      ['openai:balanced', 'openai/gpt-9-sol'],
      ['openai:balanced', 'openai/gpt-9-terra'],
      ['openai:fast', 'openai/gpt-9-mini'],
      ['openai:fast', 'openai/gpt-9-luna'],
      ['google:balanced', 'google/gemini-9-pro'],
      ['google:balanced', 'google/gemini-9-pro-preview'],
      ['google:fast', 'google/gemini-9.5-flash'],
    ])('maps to %s: %s', (key, id) => {
      expect(modelIdsByKey([model(id)])).toEqual({ [key]: id });
    });
  });
});

describe('familyCandidates', () => {
  it('returns every matching model, best first', () => {
    const anthropicBalanced = FAMILIES.find(
      (f) => f.provider === 'anthropic' && f.tier === 'balanced',
    )!;

    const ids = familyCandidates(anthropicBalanced, [
      model('anthropic/claude-sonnet-9.5'),
      model('anthropic/claude-haiku-9.9'),
      model('anthropic/claude-sonnet-9.10'),
      model('anthropic/claude-sonnet-9'),
    ]).map((m) => m.id);

    expect(ids).toEqual([
      'anthropic/claude-sonnet-9.10',
      'anthropic/claude-sonnet-9.5',
      'anthropic/claude-sonnet-9',
    ]);
  });
});

describe('getProviderOptions', () => {
  const option = (key: string) => {
    const [provider, tier] = key.split(':');
    return { key, provider, tier, modelId: 'x', name: 'x' } as Parameters<
      typeof getProviderOptions
    >[0];
  };

  it.each([
    [
      'anthropic:balanced',
      { anthropic: { thinking: { type: 'enabled', budgetTokens: 1024 } } },
    ],
    ['anthropic:fast', undefined],
    ['openai:balanced', { openai: { reasoningEffort: 'low' } }],
    ['openai:fast', { openai: { reasoningEffort: 'none' } }],
    [
      'google:balanced',
      { google: { thinkingConfig: { thinkingLevel: 'low' } } },
    ],
    ['google:fast', { google: { thinkingConfig: { thinkingLevel: 'low' } } }],
  ])('%s', (key, expected) => {
    expect(getProviderOptions(option(key))).toEqual(expected);
  });

  it('returns undefined for keys outside the families', () => {
    expect(getProviderOptions(option('meta:dev-cheap'))).toBeUndefined();
    expect(getProviderOptions(option('unknown'))).toBeUndefined();
  });
});

describe('getModelOptions', () => {
  const CACHE_KEY = 'agilo-analytics:ai-model-options';
  const cache = { get: jest.fn(), set: jest.fn() };
  const scope = {
    resolve: jest.fn((key: string) => {
      if (key === Modules.CACHE) return cache;
      if (key === AI_GATEWAY_MODULE) return { getApiKey: () => 'vck_env' };
      throw new Error(`Unexpected resolve: ${key}`);
    }),
  } as unknown as Parameters<typeof getModelOptions>[0];
  const getAvailableModels = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(createConfiguredGateway)
      .mockReturnValue({ getAvailableModels } as never);
  });

  it('returns cached options without fetching models', async () => {
    const cached = [{ key: 'anthropic:balanced' }];
    cache.get.mockResolvedValue(cached);

    await expect(getModelOptions(scope)).resolves.toBe(cached);
    expect(cache.get).toHaveBeenCalledWith(CACHE_KEY);
    expect(getAvailableModels).not.toHaveBeenCalled();
  });

  it('rejects a disabled install even when options are cached', async () => {
    cache.get.mockResolvedValue([{ key: 'anthropic:balanced' }]);
    jest.mocked(createConfiguredGateway).mockImplementation(() => {
      throw new Error('AI dashboard is not enabled');
    });

    await expect(getModelOptions(scope)).rejects.toThrow(
      'AI dashboard is not enabled',
    );
  });

  it('rejects an invalid key before fetching models', async () => {
    cache.get.mockResolvedValue(null);
    jest
      .mocked(assertValidGatewayKey)
      .mockRejectedValueOnce(new Error('not a valid Vercel AI Gateway key'));

    await expect(getModelOptions(scope)).rejects.toThrow(
      'not a valid Vercel AI Gateway key',
    );
    expect(assertValidGatewayKey).toHaveBeenCalledWith('vck_env');
    expect(getAvailableModels).not.toHaveBeenCalled();
  });

  it('resolves options with the install key and caches them for 24h', async () => {
    cache.get.mockResolvedValue(null);
    getAvailableModels.mockResolvedValue({
      models: [model('anthropic/claude-sonnet-9')],
    });

    const options = await getModelOptions(scope);

    expect(createConfiguredGateway).toHaveBeenCalledWith(scope);
    expect(options.map((o) => o.key)).toEqual(['anthropic:balanced']);
    expect(cache.set).toHaveBeenCalledWith(CACHE_KEY, options, 60 * 60 * 24);
  });

  it('does not cache an empty result', async () => {
    cache.get.mockResolvedValue(null);
    getAvailableModels.mockResolvedValue({ models: [model('meta/llama-9')] });

    await expect(getModelOptions(scope)).resolves.toEqual([]);
    expect(cache.set).not.toHaveBeenCalled();
  });
});
