// Crea el esquema y siembra categorías/partidas iniciales (idempotente).
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Carga .env si existe (Node >= 20.12).
try {
  process.loadEnvFile(join(process.cwd(), '.env'));
} catch {
  // Sin .env: se usan las variables ya presentes en el entorno.
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({ url, authToken });

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.sql');
const schema = readFileSync(schemaPath, 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

// Partidas del Excel HOGAR_2026 (los importes los rellenan los usuarios).
const SEED = [
  {
    type: 'income',
    name: 'Ingresos',
    items: ['Salario', 'Ingresos por intereses', 'Dividendos', 'Alquileres', 'Otros'],
  },
  {
    type: 'expense',
    name: 'Gastos del hogar',
    items: [
      'Cuota hipoteca/Alquiler',
      'Seguro del hogar',
      'Electricidad',
      'Gas',
      'Agua',
      'Teléfono',
      'Televisión de pago',
      'Internet',
      'Muebles/Aparatos',
      'Mantenimiento/Suministros',
      'Mejoras en el hogar',
      'Otros gastos',
    ],
  },
  {
    type: 'expense',
    name: 'Gastos de transporte',
    items: [
      'Cuota del préstamo del vehículo',
      'Seguro del vehículo',
      'Combustible',
      'Autobús/Taxi/Tren/Avión',
      'Reparaciones',
      'Otros gastos',
    ],
  },
  {
    type: 'expense',
    name: 'Gasto sanitario',
    items: ['Seguro de salud', 'Dentista', 'Gasto en medicinas', 'Seguro de vida', 'Otros gastos'],
  },
  {
    type: 'expense',
    name: 'Gastos vida diaria',
    items: [
      'Comestibles',
      'Gastos personales',
      'Ropa',
      'Limpieza',
      'Educación',
      'Comer fuera de casa',
      'Peluquería',
      'Mascota',
      'Otros',
    ],
  },
  {
    type: 'expense',
    name: 'Gastos en entretenimiento',
    items: [
      'Videos/DVDs',
      'Música',
      'Juegos',
      'Cine/Teatro',
      'Conciertos',
      'Libros/Revistas',
      'Deporte',
      'Juguetes/Gadgets',
      'Vacaciones',
      'Otros',
    ],
  },
  {
    type: 'savings',
    name: 'Ahorro',
    items: ['Fondo de emergencia', 'Cuantía de ahorro', 'Jubilación', 'Inversiones', 'Educación', 'Otros'],
  },
];

async function main() {
  for (const stmt of schema) {
    await client.execute(stmt);
  }

  const existing = await client.execute('SELECT COUNT(*) AS n FROM categories');
  const count = Number(existing.rows[0]?.n ?? 0);
  if (count > 0) {
    console.log(`Categorías ya sembradas (${count}). No se hace nada.`);
    return;
  }

  for (const [ci, category] of SEED.entries()) {
    const result = await client.execute({
      sql: 'INSERT INTO categories (type, name, sort_order) VALUES (?, ?, ?)',
      args: [category.type, category.name, ci],
    });
    const categoryId = Number(result.lastInsertRowid);
    for (const [ii, itemName] of category.items.entries()) {
      await client.execute({
        sql: 'INSERT INTO items (category_id, name, sort_order) VALUES (?, ?, ?)',
        args: [categoryId, itemName, ii],
      });
    }
  }

  console.log(`Esquema creado y ${SEED.length} categorías sembradas.`);
}

main().catch((err) => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
