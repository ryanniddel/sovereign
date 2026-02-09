import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(hexKey: string): Buffer {
  if (!hexKey || hexKey.length < 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Cannot start in production without it.',
      );
    }
    console.warn(
      '[token-encryption] WARNING: TOKEN_ENCRYPTION_KEY not set or too short. Using insecure fallback — DO NOT use in production.',
    );
    return Buffer.from('0'.repeat(64), 'hex');
  }
  return Buffer.from(hexKey, 'hex');
}

export function encrypt(plaintext: string, hexKey: string): string {
  const key = getKey(hexKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(ciphertext: string, hexKey: string): string {
  const key = getKey(hexKey);
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}
