// Acceso a variables de entorno: process.env (Vercel) con fallback a import.meta.env (dev).
const metaEnv = import.meta.env as Record<string, string | undefined>;

// process no existe en edge runtime; en Node (Vercel serverless) sí.
const procEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : {};

export function env(key: string): string | undefined {
  return procEnv[key] ?? metaEnv[key];
}
