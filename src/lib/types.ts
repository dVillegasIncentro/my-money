// Tipos compartidos del dominio (economía del hogar).

export type CategoryType = 'income' | 'expense' | 'savings';

export interface Category {
  id: number;
  type: CategoryType;
  name: string;
  sortOrder: number;
}

export interface Item {
  id: number;
  categoryId: number;
  name: string;
  sortOrder: number;
}

// Fila de partida con su importe para el mes seleccionado (null = sin entrada).
export interface ItemRow {
  id: number;
  name: string;
  amountCents: number | null;
}

export interface CategoryGroup {
  id: number;
  type: CategoryType;
  name: string;
  totalCents: number;
  items: ItemRow[];
}

export interface Totals {
  incomeCents: number;
  expenseCents: number; // incluye ahorro
  netCents: number;
  resultCents: number;
}

export interface BudgetData {
  year: number;
  month: number;
  income: CategoryGroup[];
  expenses: CategoryGroup[];
  startingBalanceCents: number;
  totals: Totals;
  annual: AnnualTracking;
}

// Punto de un mes dentro del seguimiento anual acumulado.
export interface AnnualPoint {
  month: number;
  incomeCents: number;
  expenseCents: number; // incluye ahorro
  netCents: number;
  resultCents: number; // saldo de partida + neto (el "que te va quedando")
}

// Seguimiento acumulado del año completo + cierre anual.
export interface AnnualTracking {
  months: AnnualPoint[];
  yearTotal: Totals; // cierre: lo que queda tras todo el año
}
