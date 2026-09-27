import { MedusaError } from '@medusajs/framework/utils';

export type AiGatewayModuleOptions = {
  aiGatewayApiKey?: string;
};

export class AiGatewayModuleService {
  protected readonly apiKey_?: string;

  constructor(_container: unknown, options?: AiGatewayModuleOptions) {
    this.apiKey_ = options?.aiGatewayApiKey;
  }

  isEnabled(): boolean {
    return !!this.apiKey_;
  }

  // The Gateway key is optional: without it the AI dashboard stays off, so fail only when the key is actually needed.
  getApiKey(): string {
    if (!this.apiKey_) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'AI dashboard is not enabled. Set the AI_GATEWAY_API_KEY environment variable and pass it as the aiGatewayApiKey option of @agilo/medusa-analytics-plugin in medusa-config.',
      );
    }

    return this.apiKey_;
  }
}
