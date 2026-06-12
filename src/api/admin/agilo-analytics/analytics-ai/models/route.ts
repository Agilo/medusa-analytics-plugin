import { gateway } from 'ai';

export async function GET() {
  console.log('exist', process.env.AI_GATEWAY_API_KEY);
  const { models } = await gateway.getAvailableModels();
  return Response.json(models);
}

export type AvailableModelsResponse = Awaited<
  ReturnType<typeof gateway.getAvailableModels>
>;

export type AvailableModel = AvailableModelsResponse['models'][number];
