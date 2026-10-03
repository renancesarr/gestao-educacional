import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 256) throw new Error('A senha deve ter entre 12 e 256 caracteres.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(encoded);
  if (!match) return false;
  const actual = await derive(password, match[1]!);
  return timingSafeEqual(actual, Buffer.from(match[2]!, 'hex'));
}
