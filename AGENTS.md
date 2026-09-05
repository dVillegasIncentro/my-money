# my-money — Guía del proyecto para agentes

> Este archivo es la fuente de verdad para TODAS las sesiones (esta y las venideras).
> Léelo completo antes de tocar código.

## Qué es

Aplicación web **mobile-first** para llevar la **economía del hogar**. Rápida, intuitiva, sin fricción.

## Stack (no cambiar sin permiso explícito del usuario)

- **Astro** con SSR (`output: 'server'`) y adaptador `@astrojs/node`.
- **Base de datos: Turso** (tier free) vía `@libsql/client`.
- **TypeScript estricto** (`strict: true`), todo bien tipado, mejores prácticas.
- Sin framework de UI ni CSS-in-JS: CSS puro con variables globales + estilos scoped de Astro.

## Dinero

- Moneda: **€** (EUR), formato `es-ES`.
- **Los importes se guardan SIEMPRE en céntimos** (`INTEGER`) para evitar errores de coma flotante.
- Nunca usar `number` flotante para dinero en la capa de datos.

## Usuarios

- **Dos usuarios** (el dueño y su mujer) comparten el MISMO presupuesto.
- Ambos pueden **añadir partidas/campos** (y editarlos/borrarlos).
- **Sin autenticación**: es una app privada del hogar (no sobre-ingenierizar).

## Idioma

- **UI y textos visibles: español** (registro neutro/profesional).
- **Código, identificadores, nombres de archivo y comentarios: inglés**.
- Comentarios: **UNA línea máximo**, explicaciones sencillas.

## Diseño (reglas duras)

- **Mobile-first** y rápido.
- **NADA de look "IA"**: sin gradientes excesivos, sin glassmorphism de moda, sin ilustraciones genéricas.
- **SIN emojis** en la interfaz.
- Donde iría un icono, se deja un **hueco vacío** (componente `IconSlot`) para que el usuario ponga después sus propios iconos/imágenes.
- Colores **atractivos, no chillones, no apastelados**. Paleta definida en `src/styles/global.css` (teal profundo + ámbar, verde=ingresos, naranja=gastos, azul=ahorro).

## Modelo de datos (derivado de HOGAR_2026.xlsx)

El presupuesto tiene **12 meses** (1–12) por año + totales calculados (TOTAL y MEDIA).

Secciones:
1. **Ingresos** (tipo `income`): Salario, Ingresos por intereses, Dividendos, Alquileres, Otros.
2. **Gastos del hogar** (`expense`).
3. **Gastos de transporte** (`expense`).
4. **Gasto sanitario** (`expense`).
5. **Gastos vida diaria** (`expense`).
6. **Gastos en entretenimiento** (`expense`).
7. **Ahorro** (`savings`) — el Excel lo incluye dentro de "Total gastos" (dinero apartado).

Cálculos (mismas fórmulas que el Excel):
- **Total ingresos** = suma de partidas de ingresos.
- **Total gastos** = suma de partidas de gastos + ahorro.
- **Resultado neto** = ingresos − gastos.
- **Resultado** = saldo de partida (opcional) + resultado neto.

Tablas: `categories` (type, name, sort_order) → `items` (category_id, name, sort_order) → `entries` (item_id, year, month, amount_cents, UNIQUE item+year+month). Además `starting_balances` (year, month, amount_cents).

## El dinero en el Excel es solo ejemplo

Las partidas/categorías sí se respetan y se siembran. Los **valores monetarios NO**: los usuarios los rellenarán después.

## Convenciones de código

- Mutaciones vía **Astro Actions** (`src/actions/index.ts`) con validación **Zod**.
- Acceso a datos centralizado en `src/lib/budget.ts`; cliente Turso singleton en `src/lib/db.ts`.
- Año por defecto: el actual (proyecto nace para 2026). Se puede cambiar con `?year=`.
- Navegación por mes: selector de mes (el grid de 12 columnas no cabe en móvil).

## IA y README

- El README debe ser bonito y **nombrar a la IA**: **"Olivo"**.
- No añadir "Co-Authored-By" ni atribución de IA en commits.

## No sobre-ingenierizar

Aplicación sostenible y mantenible por un programador. Si algo se puede hacer simple, se hace simple.
