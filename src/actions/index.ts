// Mutaciones del presupuesto expuestas como Astro Actions (tipadas + Zod).
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { parseEuroToCents } from '../lib/money';
import { addItem, deleteItem, renameItem, setEntry, setStartingBalance } from '../lib/budget';

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
};
