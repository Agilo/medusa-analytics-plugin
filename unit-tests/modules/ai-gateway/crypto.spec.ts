import {
  encryptApiKey,
  decryptApiKey,
} from '../../../src/modules/ai-gateway/utils/crypto';

const PLAINTEXT = 'sk-gateway-test-abcd1234';

describe('ai-gateway crypto', () => {
  const originalSecret = process.env.AI_GATEWAY_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.AI_GATEWAY_ENCRYPTION_KEY = 'unit-test-secret';
  });

  afterEach(() => {
    process.env.AI_GATEWAY_ENCRYPTION_KEY = originalSecret;
  });

  it('round-trips a key through encrypt and decrypt', () => {
    expect(decryptApiKey(encryptApiKey(PLAINTEXT))).toBe(PLAINTEXT);
  });

  it('does not contain the plaintext in the ciphertext', () => {
    expect(encryptApiKey(PLAINTEXT)).not.toContain(PLAINTEXT);
  });

  it('produces different ciphertexts for the same input', () => {
    expect(encryptApiKey(PLAINTEXT)).not.toBe(encryptApiKey(PLAINTEXT));
  });

  it('throws on a tampered payload', () => {
    const [iv, authTag, ciphertext] = encryptApiKey(PLAINTEXT).split(':');
    const tampered = Buffer.from(ciphertext, 'base64');
    tampered[0] ^= 0xff;

    expect(() =>
      decryptApiKey([iv, authTag, tampered.toString('base64')].join(':')),
    ).toThrow('could not be decrypted');
  });

  it('throws when decrypting with a different secret', () => {
    const payload = encryptApiKey(PLAINTEXT);
    process.env.AI_GATEWAY_ENCRYPTION_KEY = 'another-secret';

    expect(() => decryptApiKey(payload)).toThrow('could not be decrypted');
  });

  it('throws on a malformed payload', () => {
    expect(() => decryptApiKey('not-a-valid-payload')).toThrow(
      'could not be decrypted',
    );
  });

  it('throws an actionable error when the env var is missing', () => {
    delete process.env.AI_GATEWAY_ENCRYPTION_KEY;

    expect(() => encryptApiKey(PLAINTEXT)).toThrow(
      'Set AI_GATEWAY_ENCRYPTION_KEY',
    );
  });
});
