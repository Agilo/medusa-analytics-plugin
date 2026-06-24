import { AvailableModel } from '../../api/admin/agilo-analytics/analytics-ai/models/route';

export const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  vertex: 'Google',
};

export const normalizeGatewayModels = (models: AvailableModel[]) =>
  models
    .map((model) => {
      const providerKey = model.specification.provider.toLowerCase();
      return {
        id: model.id,
        label: model.name,
        provider: providerLabels[providerKey],
        context: model.specification.modelId,
        description: model.description ?? undefined,
      };
    })
    .sort((left, right) => {
      const leftIndex = Object.values(providerLabels).indexOf(left.provider);
      const rightIndex = Object.values(providerLabels).indexOf(right.provider);

      return leftIndex - rightIndex || left.label.localeCompare(right.label);
    });
