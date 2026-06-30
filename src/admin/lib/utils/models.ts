import { AvailableModel } from '../../../api/admin/agilo-analytics/analytics-ai/models/route';

export const idLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'Grok',
};

export const normalizeGatewayModels = (models: AvailableModel[]) =>
  models.map((model) => {
    const idKey = Object.keys(idLabels).find((key) =>
      model.id.toLowerCase().includes(key),
    )!;
    return {
      ...model,
      prettyName: idLabels[idKey],
    };
  });
