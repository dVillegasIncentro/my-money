# my-money

> La economía de tu hogar, sencilla y sin fricción.

**my-money** es una aplicación web **mobile-first** para llevar el presupuesto doméstico de tu familia:
ingresos, gastos (hogar, transporte, sanitario, vida diaria, entretenimiento) y ahorro, mes a mes.

Está pensada para tu móvil: rápida, intuitiva, sin registros ni complicaciones. Tú y tu pareja
compartís el mismo presupuesto y podéis añadir, editar o borrar partidas en cualquier momento.

---

## Qué hace

- **Acceso con contraseña** (privada): tú y tu pareja, misma clave. Con **"Recuérdame"** para no iniciar sesión cada vez.
- **Presupuesto por meses**, con las mismas secciones del clásico Excel de presupuesto doméstico.
- **Seguimiento anual**: lo que te va quedando mes a mes y el total que te queda al final del año.
- Cálculo automático de **ingresos**, **gastos** (incluido el ahorro) y **resultado** del mes.
- **Saldo de partida** opcional para arrastrar el resultado de un mes a otro.
- Añadir, renombrar y borrar **partidas** directamente desde la pantalla.
- Guardado al momento: escribe un importe y se guarda solo al salir del campo.

## Tecnología

| Pieza        | Elección                                  |
| ------------ | ----------------------------------------- |
| Framework    | [Astro](https://astro.build) con SSR      |
| Servidor     | Adapter `@astrojs/vercel` (Vercel)        |
| Base de datos| [Turso](https://turso.tech) (SQLite)      |
| Tipado       | TypeScript estricto (`strict: true`)      |
| Validación   | [Zod](https://zod.dev) en Astro Actions   |

Sin frameworks de UI ni CSS-in-JS: CSS puro con variables globales y estilos scoped.

> **Nota sobre el dinero**: los importes se guardan **siempre en céntimos** (enteros) para evitar
> errores de coma flotante. La moneda es el **euro (€)** con formato es-ES.

## Puesta en marcha

Necesitas Node.js 22+.

```bash
npm install

# Base de datos local de desarrollo (SQLite)
npm run db:init

# Servidor de desarrollo
npm run dev
```

Abre `http://localhost:4321`.

### Conectar Turso

1. Crea tu base de datos en [Turso](https://turso.tech) (el tier gratuito es suficiente).
2. Copia `.env.example` a `.env` y rellena:

```env
TURSO_DATABASE_URL=libsql://tu-base-datos.turso.io
TURSO_AUTH_TOKEN=tu-token-de-autenticacion
MM_PASSWORD_HASH=el-hash-de-tu-contraseña
```

3. Vuelve a ejecutar `npm run db:init` para crear el esquema y las partidas iniciales.

### Desplegar en Vercel

1. Sube este repositorio a GitHub (sin `.env` ni `local.db`, ya ignorados en `.gitignore`).
2. En [Vercel](https://vercel.com), importa el repo. Detecta Astro automáticamente.
3. Configura las variables de entorno en **Settings → Environment Variables**:

```env
TURSO_DATABASE_URL=libsql://tu-base-datos.turso.io
TURSO_AUTH_TOKEN=tu-token-de-turso
MM_PASSWORD_HASH=el-hash-de-tu-contraseña
```

4. Despliega. Vercel ejecuta `npm run build` (que ya incluye `astro check`).

### Configurar la contraseña

La app funciona con **una sola contraseña compartida** (la de tu hogar). Genera su hash con:

```bash
node db/hash.mjs "tu-contraseña-secreta"
```

Copia la salida (formato `salt:hash`) en `MM_PASSWORD_HASH` dentro de `.env`. Sin esto, el
login devolverá "Setup incompleto".

- **Recuérdame marcado** → la sesión dura 30 días.
- **Sin marcar** → la sesión se cierra al cerrar el navegador.

## Estructura del proyecto

```
src/
  actions/index.ts   # Mutaciones (Astro Actions + Zod): login/logout + presupuesto
  middleware.ts      # Protege las rutas (redirige a /login si no hay sesión)
  components/        # AnnualCard, SummaryCard, Section, IconSlot
  layouts/Layout.astro
  lib/
    auth.ts          # Hash scrypt y verificación de contraseña
    budget.ts        # Acceso a datos del presupuesto
    db.ts            # Cliente Turso (singleton)
    money.ts         # Utilidades de dinero (céntimos ↔ €)
    types.ts         # Tipos del dominio
  pages/index.astro  # Pantalla principal (mobile-first)
  pages/login.astro  # Pantalla de inicio de sesión
  styles/global.css  # Paleta y estilos globales
db/
  schema.sql         # Esquema de la base de datos
  setup.mjs          # Creación del esquema + seed inicial
  hash.mjs           # Generador del hash de contraseña
```

## Convenciones

- **UI en español**, código e identificadores en inglés.
- Los importes en **céntimos** (`INTEGER`), nunca flotantes.
- Sin look "IA", sin emojis: donde iría un icono queda un **hueco reservado** (`IconSlot`)
  para que añadas tus propios iconos o imágenes.

---

Hecha con cariño junto a **Olivo**, una IA que ayuda a construir software sencillo y sostenible. 🌿
