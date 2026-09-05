// Mutaciones del presupuesto expuestas como Astro Actions (tipadas + Zod).
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { parseEuroToCents } from '../lib/money';
import { addItem, deleteItem, renameItem, setEntry, setStartingBalance } from '../lib/budget';
import { auth, createSessionCookie, verifyPassword } from '../lib/auth';

const nonEmptyName = z.string().trim().min(1, 'El nombre no puede estar vacío').max(100);
const yearMonth = {
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
};

export const server = {
  // Guarda el importe de una partida (vacío = borrar la entrada).
  setEntry: defineAction({
    input: z.object({
      itemId: z.number().int().positive(),
      ...yearMonth,
      amount: z.string().max(32),
    }),
    handler: async ({ itemId, year, month, amount }) => {
      await setEntry(itemId, year, month, parseEuroToCents(amount));
      return { ok: true };
    },
  }),

  // Actualiza el saldo de partida del mes.
  setStartingBalance: defineAction({
    input: z.object({ ...yearMonth, amount: z.string().max(32) }),
    handler: async ({ year, month, amount }) => {
      await setStartingBalance(year, month, parseEuroToCents(amount) ?? 0);
      return { ok: true };
    },
  }),

  // Añade una nueva partida a una categoría.
  addItem: defineAction({
    input: z.object({ categoryId: z.number().int().positive(), name: nonEmptyName }),
    handler: async ({ categoryId, name }) => ({ id: await addItem(categoryId, name) }),
  }),

  // Renombra una partida existente.
  renameItem: defineAction({
    input: z.object({ itemId: z.number().int().positive(), name: nonEmptyName }),
    handler: async ({ itemId, name }) => {
      await renameItem(itemId, name);
      return { ok: true };
    },
  }),

  // Borra una partida (y sus importes en cascada).
  deleteItem: defineAction({
    input: z.object({ itemId: z.number().int().positive() }),
    handler: async ({ itemId }) => {
      await deleteItem(itemId);
      return { ok: true };
    },
  }),

  // Inicia sesión: verifica la contraseña y firma la cookie de sesión.
  login: defineAction({
    input: z.object({ password: z.string().min(1).max(200), remember: z.boolean() }),
    handler: async ({ password, remember }, context) => {
      const env = import.meta.env as { MM_PASSWORD_HASH?: string };
      if (!env.MM_PASSWORD_HASH) return { ok: false as const, error: 'Setup incompleto: define MM_PASSWORD_HASH.' };
      if (!verifyPassword(password, env.MM_PASSWORD_HASH)) {
        return { ok: false as const, error: 'Contraseña incorrecta.' };
      }
      const cookie = createSessionCookie(env);
      context.cookies.set(auth.SESSION_COOKIE, cookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: remember ? auth.SESSION_DURATION : undefined,
      });
      return { ok: true as const };
    },
  }),

  // Cierra la sesión: borra la cookie firmada.
  logout: defineAction({
    handler: async (_input, context) => {
      context.cookies.delete(auth.SESSION_COOKIE, { path: '/' });
      return { ok: true as const };
    },
  }),
};
