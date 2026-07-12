import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { MedusaError } from '@medusajs/framework/utils';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const secret = process.env.AI_GATEWAY_ENCRYPTION_KEY;

  if (!secret) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'Set AI_GATEWAY_ENCRYPTION_KEY in your environment to enable AI Gateway key storage.',
    );
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return [
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decryptApiKey(payload: string): string {
  try {
    const [iv, authTag, ciphertext] = payload
      .split(':')
      .map((segment) => Buffer.from(segment, 'base64'));

    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error;
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'Stored AI Gateway key could not be decrypted — it may have been encrypted with a different AI_GATEWAY_ENCRYPTION_KEY. Re-enter your key in the admin dashboard.',
    );
  }
}
