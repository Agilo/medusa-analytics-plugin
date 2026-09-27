import {
  encryptApiKey,
  decryptApiKey,
} from '../../../src/modules/ai-gateway/utils/crypto';

const PLAINTEXT = 'sk-gateway-test-abcd1234';
const KEY = 'unit-test-secret';

describe('ai-gateway crypto', () => {
  it('round-trips a key through encrypt and decrypt', () => {
    expect(decryptApiKey(encryptApiKey(PLAINTEXT, KEY), KEY)).toBe(PLAINTEXT);
  });

  it('does not contain the plaintext in the ciphertext', () => {
    expect(encryptApiKey(PLAINTEXT, KEY)).not.toContain(PLAINTEXT);
  });

  it('produces different ciphertexts for the same input', () => {
    expect(encryptApiKey(PLAINTEXT, KEY)).not.toBe(
      encryptApiKey(PLAINTEXT, KEY),
    );
  });

  it('throws on a tampered payload', () => {
    const [iv, authTag, ciphertext] = encryptApiKey(PLAINTEXT, KEY).split(':');
    const tampered = Buffer.from(ciphertext, 'base64');
    tampered[0] ^= 0xff;

    expect(() =>
      decryptApiKey([iv, authTag, tampered.toString('base64')].join(':'), KEY),
    ).toThrow('could not be decrypted');
  });

  it('throws when decrypting with a different secret', () => {
    const payload = encryptApiKey(PLAINTEXT, KEY);

    expect(() => decryptApiKey(payload, 'another-secret')).toThrow(
      'could not be decrypted',
    );
  });

  it('throws on a malformed payload', () => {
    expect(() => decryptApiKey('not-a-valid-payload', KEY)).toThrow(
      'could not be decrypted',
    );
  });
});
