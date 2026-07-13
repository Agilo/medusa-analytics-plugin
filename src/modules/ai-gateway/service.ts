import { MedusaError, MedusaService } from '@medusajs/framework/utils';

import { AiGatewayKey, AiGatewayKeyType } from './models/ai-gateway-key';
import type { AdminSetGatewayKeyInputArgs } from '../../api/admin/agilo-analytics/analytics-ai/validators';
import { encryptApiKey, decryptApiKey } from './utils/crypto';

export type SetKeyForUserInput = Pick<AiGatewayKeyType, 'user_id'> &
  AdminSetGatewayKeyInputArgs;

export type GatewayKeyStatus = {
  configured: boolean;
  key_last_four: AiGatewayKeyType['key_last_four'];
};

export class AiGatewayModuleService extends MedusaService({
  AiGatewayKey,
}) {
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
      key_encrypted: encryptApiKey(api_key),
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
      key_encrypted: encryptApiKey(api_key),
      key_last_four: keyLastFour,
    });

    return { key_last_four: keyLastFour };
  }

  async getKeyStatusForUser(
    userId: AiGatewayKeyType['user_id'],
  ): Promise<GatewayKeyStatus> {
    const [existing] = await this.listAiGatewayKeys({ user_id: userId });

    return {
      configured: !!existing,
      key_last_four: existing?.key_last_four ?? null,
    };
  }

  async getDecryptedKeyForUser(
    userId: AiGatewayKeyType['user_id'],
  ): Promise<string> {
    const [existing] = await this.listAiGatewayKeys({ user_id: userId });

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Missing AI Gateway key. Save a Vercel AI Gateway key in the admin dashboard.',
      );
    }

    return decryptApiKey(existing.key_encrypted);
  }
}
