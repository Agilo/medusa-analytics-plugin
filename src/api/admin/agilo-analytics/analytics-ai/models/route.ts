import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework';
import { getModelOptions } from '../../../../../utils/ai-models';

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const options = await getModelOptions(req.scope);

  return res.json(options);
}
