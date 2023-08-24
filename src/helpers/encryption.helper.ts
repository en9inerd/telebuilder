import crypto from 'crypto';

const keyLength = 32;

function padKey(key: string): Buffer {
  return Buffer.concat([Buffer.from(key), Buffer.alloc(keyLength)], keyLength);
}

export function encrypt(text: string, key: string): string {
  const iv = Buffer.from(crypto.randomBytes(16)).toString('hex').slice(0, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', padKey(key), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv + ':' + encrypted.toString('hex');
}

export function decrypt(text: string, key: string): string {
  const textParts: string[] = text.includes(':') ? text.split(':') : [];
  const iv = Buffer.from(textParts.shift() || '', 'binary');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', padKey(key), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export * as EncryptionHelper from './encryption.helper.js';
