// Acceso a datos del presupuesto (única puerta a la base de datos).
import { db } from './db';
import type {
  AnnualPoint,
  AnnualTracking,
  BudgetData,
  Category,
  CategoryGroup,
  CategoryType,
  Item,
  ItemRow,
  Totals,
} from './types';

const VALID_TYPES = new Set<CategoryType>(['income', 'expense', 'savings']);

// Coerciona valores de fila de @libsql a primitivos tipados.
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  return 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toCategoryType(value: unknown): CategoryType {
  return VALID_TYPES.has(value as CategoryType) ? (value as CategoryType) : 'expense';
}

export async function listCategories(): Promise<Category[]> {
  const rs = await db.execute('SELECT id, type, name, sort_order FROM categories ORDER BY sort_order, id');
  return rs.rows.map((r) => ({
    id: toNumber(r.id),
    type: toCategoryType(r.type),
    name: toText(r.name),
    sortOrder: toNumber(r.sort_order),
  }));
}

export async function listItems(): Promise<Item[]> {
  const rs = await db.execute('SELECT id, category_id, name, sort_order FROM items ORDER BY sort_order, id');
  return rs.rows.map((r) => ({
    id: toNumber(r.id),
    categoryId: toNumber(r.category_id),
    name: toText(r.name),
    sortOrder: toNumber(r.sort_order),
  }));
}

async function listAmounts(year: number, month: number): Promise<Map<number, number>> {
  const rs = await db.execute({
    sql: 'SELECT item_id, amount_cents FROM entries WHERE year = ? AND month = ?',
    args: [year, month],
  });
  const map = new Map<number, number>();
  for (const r of rs.rows) map.set(toNumber(r.item_id), toNumber(r.amount_cents));
  return map;
}

async function getStartingBalance(year: number, month: number): Promise<number> {
  const rs = await db.execute({
    sql: 'SELECT amount_cents FROM starting_balances WHERE year = ? AND month = ?',
    args: [year, month],
  });
  return rs.rows[0] ? toNumber(rs.rows[0].amount_cents) : 0;
}

// Construye la vista completa de un mes (agrupada por categoría).
export async function getBudget(year: number, month: number): Promise<BudgetData> {
  const [categories, items, amounts, startingBalance] = await Promise.all([
    listCategories(),
    listItems(),
    listAmounts(year, month),
    getStartingBalance(year, month),
  ]);

  const groups = new Map<number, CategoryGroup>();
  for (const category of categories) {
    groups.set(category.id, { id: category.id, type: category.type, name: category.name, totalCents: 0, items: [] });
  }

  for (const item of items) {
    const group = groups.get(item.categoryId);
    if (!group) continue;
    const amountCents = amounts.get(item.id) ?? null;
    const row: ItemRow = { id: item.id, name: item.name, amountCents };
    group.items.push(row);
    group.totalCents += amountCents ?? 0;
  }

  const income = categories.filter((c) => c.type === 'income').map((c) => groups.get(c.id)!);
  const expenses = categories.filter((c) => c.type !== 'income').map((c) => groups.get(c.id)!);

  const incomeCents = income.reduce((sum, g) => sum + g.totalCents, 0);
  const expenseCents = expenses.reduce((sum, g) => sum + g.totalCents, 0);
  const netCents = incomeCents - expenseCents;

  const totals: Totals = {
    incomeCents,
    expenseCents,
    netCents,
    resultCents: startingBalance + netCents,
  };

  const annual = await getAnnualTracking(year);

  return { year, month, income, expenses, startingBalanceCents: startingBalance, totals, annual };
}

// Cierra el seguimiento anual: acumulado mes a mes + total del año.
async function getAnnualTracking(year: number): Promise<AnnualTracking> {
  const [categories, items] = await Promise.all([listCategories(), listItems()]);
  const itemToCategory = new Map<number, boolean>(); // true = income
  for (const item of items) {
    const cat = categories.find((c) => c.id === item.categoryId);
    itemToCategory.set(item.id, cat?.type === 'income');
  }

  // Leer todas las entradas del año de una vez.
  const entries = await db.execute({
    sql: 'SELECT item_id, month, amount_cents FROM entries WHERE year = ?',
    args: [year],
  });
  const balances = await db.execute({
    sql: 'SELECT month, amount_cents FROM starting_balances WHERE year = ?',
    args: [year],
  });

  const balanceByMonth = new Map<number, number>();
  for (const r of balances.rows) balanceByMonth.set(toNumber(r.month), toNumber(r.amount_cents));

  const months: AnnualPoint[] = [];
  let accIncome = 0;
  let accExpense = 0;

  for (let m = 1; m <= 12; m++) {
    let income = 0;
    let expense = 0;
    for (const r of entries.rows) {
      if (toNumber(r.month) !== m) continue;
      const cents = toNumber(r.amount_cents);
      if (itemToCategory.get(toNumber(r.item_id))) income += cents;
      else expense += cents;
    }
    // Acumulado del año (el Excel suma resultados mensuales en el TOTAL).
    accIncome += income;
    accExpense += expense;
    const net = income - expense;
    months.push({
      month: m,
      incomeCents: income,
      expenseCents: expense,
      netCents: net,
      resultCents: (balanceByMonth.get(m) ?? 0) + net,
    });
  }

  const yearTotal: Totals = {
    incomeCents: accIncome,
    expenseCents: accExpense,
    netCents: accIncome - accExpense,
    resultCents: accIncome - accExpense,
  };

  return { months, yearTotal };
}

// Guarda (o borra) el importe de una partida en un mes concreto.
export async function setEntry(itemId: number, year: number, month: number, amountCents: number | null): Promise<void> {
  if (amountCents === null) {
    await db.execute({
      sql: 'DELETE FROM entries WHERE item_id = ? AND year = ? AND month = ?',
      args: [itemId, year, month],
    });
    return;
  }
  await db.execute({
    sql: `INSERT INTO entries (item_id, year, month, amount_cents) VALUES (?, ?, ?, ?)
          ON CONFLICT (item_id, year, month) DO UPDATE SET amount_cents = excluded.amount_cents`,
    args: [itemId, year, month, amountCents],
  });
}

export async function addItem(categoryId: number, name: string): Promise<number> {
  const rs = await db.execute({
    sql: 'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM items WHERE category_id = ?',
    args: [categoryId],
  });
  const next = toNumber(rs.rows[0]?.next);
  const insert = await db.execute({
    sql: 'INSERT INTO items (category_id, name, sort_order) VALUES (?, ?, ?)',
    args: [categoryId, name, next],
  });
  return Number(insert.lastInsertRowid ?? 0);
}

export async function renameItem(itemId: number, name: string): Promise<void> {
  await db.execute({ sql: 'UPDATE items SET name = ? WHERE id = ?', args: [name, itemId] });
}

export async function deleteItem(itemId: number): Promise<void> {
  await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [itemId] });
}

export async function setStartingBalance(year: number, month: number, amountCents: number): Promise<void> {
  await db.execute({
    sql: `INSERT INTO starting_balances (year, month, amount_cents) VALUES (?, ?, ?)
          ON CONFLICT (year, month) DO UPDATE SET amount_cents = excluded.amount_cents`,
    args: [year, month, amountCents],
  });
}
