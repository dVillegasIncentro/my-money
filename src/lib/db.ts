import { createClient } from '@libsql/client';

// Configuración de conexión: Turso (remoto) o SQLite local para desarrollo.
const env = import.meta.env as { TURSO_DATABASE_URL?: string; TURSO_AUTH_TOKEN?: string };
const url = env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({ url, authToken });
