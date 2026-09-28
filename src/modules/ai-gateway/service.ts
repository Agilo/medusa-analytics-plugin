import { MedusaError, MedusaService } from '@medusajs/framework/utils';

import { AiGatewayKey, AiGatewayKeyType } from './models/ai-gateway-key';
import type { AdminSetGatewayKeyInputArgs } from '../../api/admin/agilo-analytics/analytics-ai/validators';
import { encryptApiKey, decryptApiKey } from './utils/crypto';

export type SetKeyForUserInput = Pick<AiGatewayKeyType, 'user_id'> &
  AdminSetGatewayKeyInputArgs;

export type AiGatewayModuleOptions = {
  aiGatewayEncryptionKey?: string;
};

export type GatewayKeyStatus = {
  encryption_key_configured: boolean;
  configured: boolean;
  key_last_four: AiGatewayKeyType['key_last_four'];
};

export class AiGatewayModuleService extends MedusaService({
  AiGatewayKey,
}) {
  protected readonly encryptionKey_?: string;

  constructor(container: any, options?: AiGatewayModuleOptions) {
    super(container, options);
    this.encryptionKey_ = options?.aiGatewayEncryptionKey;
  }

  // The Encryption key is optional: without it the AI dashboard stays off, so fail only when a key is actually needed.
  assertEncryptionKeyConfigured(): string {
    if (!this.encryptionKey_) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'AI dashboard is not enabled. Set the aiGatewayEncryptionKey option of @agilo/medusa-analytics-plugin in medusa-config.',
      );
    }

    return this.encryptionKey_;
  }
  async createKeyForUser({
    user_id,
    api_key,
  }: SetKeyForUserInput): Promise<
    Pick<AiGatewayKeyType, 'id' | 'key_last_four'>
  > {
    const [existing] = await this.listAiGatewayKeys({ user_id });

    if (existing) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        'An AI Gateway key is already configured for your user. Replace it instead.',
      );
    }

    const keyLastFour = api_key.length >= 4 ? api_key.slice(-4) : null;

    const created = await this.createAiGatewayKeys({
      user_id,
      key_encrypted: encryptApiKey(
        api_key,
        this.assertEncryptionKeyConfigured(),
      ),
      key_last_four: keyLastFour,
    });

    return { id: created.id, key_last_four: keyLastFour };
  }

  async updateKeyForUser({
    user_id,
    api_key,
  }: SetKeyForUserInput): Promise<Pick<AiGatewayKeyType, 'key_last_four'>> {
    const [existing] = await this.listAiGatewayKeys({ user_id });

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'No AI Gateway key is configured for your user. Save one first.',
      );
    }

    const keyLastFour = api_key.length >= 4 ? api_key.slice(-4) : null;

    await this.updateAiGatewayKeys({
      id: existing.id,
      key_encrypted: encryptApiKey(
        api_key,
        this.assertEncryptionKeyConfigured(),
      ),
      key_last_four: keyLastFour,
    });

    return { key_last_four: keyLastFour };
  }

  async getKeyStatusForUser(
    userId: AiGatewayKeyType['user_id'],
  ): Promise<GatewayKeyStatus> {
    const [existing] = await this.listAiGatewayKeys({ user_id: userId });

    return {
      encryption_key_configured: !!this.encryptionKey_,
      configured: !!existing,
      key_last_four: existing?.key_last_four ?? null,
    };
  }

  async getDecryptedKeyForUser(
    userId: AiGatewayKeyType['user_id'],
  ): Promise<string> {
    const encryptionKey = this.assertEncryptionKeyConfigured();
    const [existing] = await this.listAiGatewayKeys({ user_id: userId });

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Missing AI Gateway key. Save a Vercel AI Gateway key in the admin dashboard.',
      );
    }

    return decryptApiKey(existing.key_encrypted, encryptionKey);
  }
}
