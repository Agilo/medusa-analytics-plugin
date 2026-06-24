import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { createConfiguredGateway } from '../gateway-key';
import { gateway } from 'ai';

const ALLOWED_PROVIDERS = new Set(['openai', 'anthropic', 'vertex']);

const MAX_AVG_PRICE_PER_INPUT_TOKEN = 0.000001;
const MAX_AVG_PRICE_PER_OUTPUT_TOKEN = 0.000005;

function isAffordableModel(model: AvailableModel) {
  if (model.modelType !== 'language') return false;

  if (!ALLOWED_PROVIDERS.has(model.specification.provider.toLowerCase()))
    return false;

  if (!model.pricing?.input || !model.pricing?.output) return false;

  return (
    +model.pricing.input <= MAX_AVG_PRICE_PER_INPUT_TOKEN &&
    +model.pricing.output <= MAX_AVG_PRICE_PER_OUTPUT_TOKEN
  );
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const gateway = await createConfiguredGateway(req.scope);
  const { models } = await gateway.getAvailableModels();
  return res.json(models.filter(isAffordableModel));
}

export type AvailableModelsResponse = Awaited<
  ReturnType<typeof gateway.getAvailableModels>
>;

export type AvailableModel = AvailableModelsResponse['models'][number];
