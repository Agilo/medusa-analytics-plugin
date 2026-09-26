import {
  compareVersions,
  resolveModelOptions,
} from '../../src/utils/ai-models';

const model = (id: string, modelType = 'language') =>
  ({
    id,
    name: id,
    modelType,
    specification: { provider: id.split('/')[0] },
  }) as any;

describe('compareVersions', () => {
  it('compares segment-wise', () => {
    expect(compareVersions('3.10', '3.8')).toBeGreaterThan(0);
    expect(compareVersions('5', '4.6')).toBeGreaterThan(0);
    expect(compareVersions('4.5', '4.5')).toBe(0);
  });
});

describe('resolveModelOptions', () => {
  // Snapshot of real Gateway ids (Sep 2026), including variants that must not match
  const models = [
    'anthropic/claude-3-haiku',
    'anthropic/claude-haiku-4.5',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-sonnet-5',
    'anthropic/claude-opus-5.5',
    'openai/gpt-5.4-mini',
    'openai/gpt-5.5',
    'openai/gpt-5.6-terra',
    'openai/gpt-5.6-sol',
    'openai/gpt-6-luna',
    'openai/gpt-6-luna-fast',
    'openai/gpt-6-sol',
    'openai/gpt-6-astra',
    'openai/gpt-5.3-codex',
    'google/gemini-2.5-pro',
    'google/gemini-3.1-pro-preview',
    'google/gemini-3.5-flash-lite',
    'google/gemini-3.8-flash',
    'google/gemini-3.8-flash-tts',
    'google/gemini-3.1-flash-image',
    'xai/grok-4',
  ].map((id) => model(id));

  it('picks the newest model per family, default first', () => {
    expect(resolveModelOptions(models).map((o) => [o.key, o.modelId])).toEqual([
      ['anthropic:balanced', 'anthropic/claude-sonnet-5'],
      ['anthropic:fast', 'anthropic/claude-haiku-4.5'],
      ['openai:balanced', 'openai/gpt-6-sol'],
      ['openai:fast', 'openai/gpt-6-luna'],
      ['google:balanced', 'google/gemini-3.1-pro-preview'],
      ['google:fast', 'google/gemini-3.8-flash'],
    ]);
  });

  it('prefers the earlier pattern on a version tie', () => {
    const [option] = resolveModelOptions([
      model('openai/gpt-5.6-terra'),
      model('openai/gpt-5.6-sol'),
    ]);
    expect(option.modelId).toBe('openai/gpt-5.6-sol');
  });

  it('hides missing families and falls back to the first balanced default', () => {
    expect(
      resolveModelOptions([
        model('anthropic/claude-haiku-4.5'),
        model('google/gemini-3.8-flash'),
        model('google/gemini-3-pro', 'embedding'),
        model('openai/gpt-6-sol'),
      ]).map((o) => o.key),
    ).toEqual(['openai:balanced', 'anthropic:fast', 'google:fast']);
  });
});
