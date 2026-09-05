// Autenticación: contraseña compartida del hogar + cookie firmada (stateless).
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SESSION_COOKIE = 'mm_session';
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 días ("recuérdame")

// Hash de la contraseña en formato "salt:hash" (hex).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

// Compara la contraseña contra un hash almacenado ("salt:hash").
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// Firma HMAC derivada del hash de contraseña (clave compartida del hogar).
function signingKey(env: { MM_PASSWORD_HASH?: string }): Buffer {
  const hash = env.MM_PASSWORD_HASH ?? '';
  return createHmac('sha256', 'mm-session').update(hash).digest();
}

// Crea una cookie firmada "valor.firma" válida para autenticar.
export function createSessionCookie(env: { MM_PASSWORD_HASH?: string }): string {
  const value = Date.now().toString(36);
  const sig = createHmac('sha256', signingKey(env)).update(value).digest('hex');
  return `${value}.${sig}`;
}

// Verifica la firma de una cookie de sesión (timing-safe).
export function verifySessionCookie(cookie: string, env: { MM_PASSWORD_HASH?: string }): boolean {
  const dot = cookie.lastIndexOf('.');
  if (dot <= 0) return false;
  const value = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = createHmac('sha256', signingKey(env)).update(value).digest('hex');
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export const auth = { SESSION_COOKIE, SESSION_DURATION };
