import { createClient } from '@libsql/client';
import { env } from './env';

// Configuración de conexión: Turso (remoto) o SQLite local para desarrollo.
const url = env('TURSO_DATABASE_URL') || 'file:local.db';
const authToken = env('TURSO_AUTH_TOKEN') || undefined;

export const db = createClient({ url, authToken });
