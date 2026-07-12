import { createGateway } from 'ai';
import { GatewayAuthenticationError } from '@ai-sdk/gateway';
import { MedusaError } from '@medusajs/framework/utils';
import { AI_GATEWAY_MODULE } from '../modules/ai-gateway';
import { AiGatewayModuleService } from '../modules/ai-gateway/service';

// Checking if the provided key is valid by making a request to the credits of each user. According to docs (https://vercel.com/docs/concepts/ai/gateway#api-keys), this is the only endpoint that can be used to verify the key.
export async function assertValidGatewayKey(apiKey: string) {
  try {
    const gateway = createGateway({ apiKey });
    await gateway.getCredits();
  } catch (error) {
    if (GatewayAuthenticationError.isInstance(error)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'The provided key is not a valid Vercel AI Gateway key. Double-check the key and try again.',
      );
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'Could not verify the AI Gateway key right now. Please try again in a moment.',
    );
  }
}

export async function createConfiguredGateway(
  scope: {
    resolve: (key: string) => AiGatewayModuleService;
  },
  userId: string,
) {
  const aiGatewayModuleService = scope.resolve(AI_GATEWAY_MODULE);

  return createGateway({
    apiKey: await aiGatewayModuleService.getDecryptedKeyForUser(userId),
  });
}
