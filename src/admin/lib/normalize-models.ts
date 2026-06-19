import { AvailableModel } from '../../api/admin/agilo-analytics/analytics-ai/models/route';

export const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  mistral: 'Mistral',
};

export const normalizeGatewayModels = (models: AvailableModel[]) =>
  models
    .map((model, index) => {
      const providerKey = model.specification.provider.toLowerCase();

      return {
        id: model.id,
        label: model.name,
        provider: providerLabels[providerKey] ?? model.specification.provider,
        context: model.specification.modelId,
        description: model.description ?? undefined,
        recommended: index < 2, // TODO: Change this to some other parameter (leave this now for testing purposes)
      };
    })
    .sort((left, right) => {
      const leftIndex = Object.values(providerLabels).indexOf(left.provider);
      const rightIndex = Object.values(providerLabels).indexOf(right.provider);

      return leftIndex - rightIndex || left.label.localeCompare(right.label);
    });
