import { randomBytes } from 'crypto';

export function generateSecureKey(length: number): string {
  // Сгенерировать случайные байты и сконвертировать в base64 или hex
  return randomBytes(length).toString('hex').slice(0, length);
}
