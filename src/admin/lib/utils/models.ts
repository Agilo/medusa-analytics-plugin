import type { Provider, Tier } from '../../../utils/ai-models';

// Object order is the order of groups in the model picker
export const providerLabels: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

export const tierLabels: Record<Tier, string> = {
  balanced: 'Balanced',
  fast: 'Fast',
};
