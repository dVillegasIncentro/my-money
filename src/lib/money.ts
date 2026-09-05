// Utilidades de dinero: céntimos (entero) y formato es-ES en euros.
const LOCALE = 'es-ES';

// Formatea céntimos como moneda con símbolo € (ej. "1.234,56 €").
export function formatCents(cents: number): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// Formatea céntimos para un input editable (sin símbolo; 0 o null → '').
export function centsToInput(cents: number | null): string {
  if (!cents) return '';
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

// Convierte texto "1.234,56" (es-ES) a céntimos; vacío o inválido → null.
export function parseEuroToCents(input: string): number | null {
  const raw = input.trim();
  if (raw === '') return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}
