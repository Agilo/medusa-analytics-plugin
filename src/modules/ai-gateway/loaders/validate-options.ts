import type { LoaderOptions } from '@medusajs/framework/types';
import { MedusaError } from '@medusajs/framework/utils';
import type { AiGatewayModuleOptions } from '../service';

// Missing key = AI dashboard intentionally off. Present but empty/non-string = config mistake (e.g. empty env var), fail at boot.
export default async function validateOptionsLoader({
  options,
}: LoaderOptions<AiGatewayModuleOptions>) {
  const key = options?.aiGatewayApiKey;

  if (key === undefined) {
    return;
  }

  if (typeof key !== 'string' || !key.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'aiGatewayApiKey option of @agilo/medusa-analytics-plugin must be a non-empty string. Remove it to disable the AI dashboard.',
    );
  }
}
