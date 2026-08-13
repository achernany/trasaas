# Diseño — Trasaas White-Label SaaS v1

**Fecha:** 2026-08-11
**Estado:** propuesta para revisión
**Objetivo:** dejar Trasaas como un SaaS multi-tenant real, en producción, con un
primer cliente (el prospecto de la exhibición) como tenant funcional: su login
con su marca, su tenant sembrado, y los flujos existentes andando aislados de
cualquier otro tenant. Si el cliente avanza, se continúa; si no, se remueve su
tenant.

Referencia de estado y deuda: `docs/SAAS-ROADMAP.md`.

---

## 1. Alcance

### Entra en v1 (va a prod)
1. **Baseline limpio (sin Alfaco).** Alfaco deja de ser marca y deja de estar
   hardcodeado; todo lo suyo pasa a ser configuración de tenant o se elimina.
2. **Aislamiento real por tenant** (bloque A del roadmap): RLS en todas las
   tablas core, eliminación de fugas por service role, Storage particionado.
3. **Branding por tenant**: login y panel muestran logo, nombre y color del
   tenant.
4. **Resolución de tenant por slug** (path-based ahora, migrable a subdominio).
5. **Provisioning del cliente**: script/seed que crea empresa + primer admin +
   catálogos base.
6. **Entitlements mínimos**: prender/apagar módulos por tenant.
7. **Deploy a prod** en la infra actual (Vercel + Supabase `udrlswivsjywttktevci`)
   con el tenant del prospecto listo.

### NO entra en v1 (fase 2, si el cliente avanza)
- Onboarding self-serve con UI (en v1 el alta la hacemos nosotros por script).
- Panel de administración de entitlements/planes/facturación.
- Subdominios / dominios propios por tenant (queda la puerta abierta, ver §4).
- Migración a infra dedicada / enterprise (ver §9).

---

## 2. Decisión de infraestructura

Se mantiene **Vercel + Supabase** (Supabase = Postgres administrado sobre AWS).
No se migra a AWS "puro" en v1: no diferencia frente al cliente y agrega
operación. La migración a instancia dedicada se reserva para clientes
enterprise/on-premise (modelo *silo*), como opción premium. Disparadores para
mover: cliente que exige instancia propia, residencia de datos, o costo a gran
escala — ninguno aplica al primer cliente.

Al tener cliente pagando: subir Supabase a **Pro** (PITR/backups, sin pausa) y
Vercel a **Pro** (levanta la restricción de autor de commit del plan Hobby).

---

## 3. Modelo de datos

### 3.1 Columnas nuevas en `empresas`
Hoy: `id, nombre, ruc, logo_url, creado_en`. Se agregan (migración `db/fase3.sql`):

| Columna | Tipo | Uso |
|---|---|---|
| `slug` | `text unique not null` | Resolución de tenant en la URL (`/c/<slug>/login`) |
| `nombre_comercial` | `text` | Marca visible del tenant (fallback a `nombre`) |
| `color_primario` | `text` (hex) | Acento de marca (CSS var `--brand`) |
| `tasa_impuesto` | `numeric(5,4)` default `0.18` | Reemplaza el `IGV = 0.18` hardcodeado |
| `moneda` | `text` default `'PEN'` | Símbolo/formato en cuadros y exports |
| `modulos` | `jsonb` default `'[]'` | Entitlements: lista de módulos habilitados |
| `areas` | `jsonb` default `'[]'` | Reemplaza el hardcode de `lib/areas.ts` |

`logo_url` ya existe → apunta a un objeto en Storage (bucket `branding`, ver §6).

### 3.2 Áreas por tenant
`lib/areas.ts` deja de exportar las 15 áreas de Alfaco como constante. Las áreas
pasan a `empresas.areas` (jsonb) y se leen del tenant del usuario. `ROLES` (que
es del producto, no del tenant) puede seguir en `lib/`.

Los componentes que consumen `AREAS` (aprobadores, requerimientos) reciben las
áreas del tenant vía props/server, no de la constante.

---

## 4. Resolución de tenant (slug, migrable a subdominio)

**Principio:** una sola función resuelve el tenant a partir del request; hoy lee
un **slug del path**, mañana puede leer el **host (subdominio)** sin tocar el
resto.

- **Pre-login (branded):** ruta nueva `app/c/[slug]/login/page.tsx`. El prefijo
  `c/` evita colisión con las rutas existentes (`panel`, `registro`,
  `satisfaccion`, `login`, `api`). El server resuelve `empresas` por `slug` y
  pinta logo/nombre/color. Si el slug no existe → 404 de marca neutra Trasaas.
- **Post-login (panel):** el tenant sale del `empresa_id` del usuario logueado
  (server-side), no del path. El panel no necesita slug en la URL.
- **`/login` genérico** se mantiene como fallback neutro (marca Trasaas) para
  usuarios que ya tienen sesión o para acceso sin slug.
- **Migración a subdominio (fase 2):** se agrega lógica en `middleware.ts` que,
  si el host es `<slug>.dominio`, inyecta el slug; la misma página de login
  sirve. Cero reescritura de componentes.

**Nota de seguridad:** la página de login es server-rendered, así que el branding
por slug se lee **server-side** (service role) y sólo se pasan al cliente las
columnas de branding (nombre comercial, logo, color). No se abre policy pública
sobre `empresas` ni se expone `ruc` ni nada sensible a un request no autenticado.

---

## 5. Branding aplicado

- **Logo/nombre:** `components/Logo.tsx` ya centraliza el isólogo Trasaas (marca
  del producto). Para el tenant se agrega un componente/prop que, cuando hay
  branding de tenant, muestra el logo del cliente (imagen) + su nombre comercial,
  cayendo al isólogo Trasaas si no hay.
- **Color:** el acento hoy es el token `brand.900 #2743C0`. En v1 se expone una
  CSS var `--brand` seteada desde `empresas.color_primario` en el layout (login y
  panel). Los elementos clave (botón primario, chips activos, indicadores) usan
  `--brand`. No se re-tematiza toda la paleta en v1 — solo el acento, logo y
  nombre. Theming total de tokens = fase 2.
- **Exports Excel** (`app/api/export/route.ts`): membrete (`nombre`, `ruc`,
  `logo`) sale del tenant, no del hardcode "ALFA CO S.A.C." ni de
  `public/logo-alfaco.png`.

---

## 6. Aislamiento (bloque A — innegociable en prod)

1. **RLS en tablas core.** `db/fase3.sql` corre `enable row level security`
   (idempotente) en las ~20 tablas core que hoy no lo tienen versionado
   (empresas, usuarios, proveedores, proveedor_registros, proveedor_documentos,
   proyectos, categorias, proveedor_categorias, matrices, criterios,
   criterio_opciones, matriz_documentos, evaluaciones, evaluacion_respuestas,
   evaluacion_documentos, satisfaccion_respuestas, requerimientos, cuadros,
   cuadro_items, cotizaciones, cotizacion_precios, niveles_aprobacion,
   aprobaciones, audit_log). Se verifica con
   `select relname, relrowsecurity from pg_class …` antes y después.
2. **Fugas por service role.** `app/panel/registros/page.tsx` y
   `app/panel/seleccion/page.tsx` consultan `proveedor_registros` con service
   role **sin** filtro de tenant. Se corrigen: filtrar por el `empresa_id` del
   usuario, o mejor eliminar el service role y resolver la cadena documental con
   RLS + policy de Storage por tenant.
3. **Storage por tenant.** Rutas de subida prefijadas con `<empresa_id>/…` y
   policies de `storage.objects` que validan
   `(storage.foldername(name))[1] = mi_empresa()::text` para `registro-docs` y
   `compras-docs`. Bucket nuevo `branding` (público de solo-lectura para logos).
4. **Test de aislamiento** (ver §8).

---

## 7. Limpieza de Alfaco

- **Migraciones/seed:** `db/import.sql` (300+ proveedores de Alfaco) y la porción
  Alfaco de `db/seed.sql` salen del baseline. Queda un `db/seed.example.sql` con
  la estructura mínima (categorías/áreas/matrices plantilla) parametrizable por
  tenant.
- **Data viva:** purga de la data de Alfaco del proyecto Supabase actual. Es
  **destructivo** → se ejecuta con OK explícito y **dump previo** (`pg_dump` /
  export del dashboard) por las dudas. Lo corre Hernany en el SQL Editor.
- **Hardcodes:** membrete/RUC/logo en export, IGV, áreas → todos a config de
  tenant (§3, §5).
- **`public/web-alfaco/`** (sitio estático de Alfaco) se elimina del repo.

---

## 8. Provisioning del primer cliente

Script/seed idempotente (`db/provision_tenant.sql` + pasos documentados) que:
1. Inserta `empresas` (slug, nombre_comercial, color, logo_url, modulos, areas,
   tasa_impuesto, moneda).
2. Crea el primer **admin**: usuario en Supabase Auth (dashboard o Admin API con
   service role) + fila en `usuarios` con `empresa_id` y rol `admin`.
3. Siembra catálogos base del tenant: categorías, áreas, y matrices plantilla
   (selección/evaluación) para que los flujos tengan de dónde tomar.
4. Sube el logo del cliente al bucket `branding` y setea `logo_url`.

En v1 esto es un script que corremos nosotros (no UI). El logo/colores/nombre del
cliente los necesitamos antes de la exhibición.

---

## 9. Fases de implementación

El v1 se implementa en tres tandas secuenciales (el plan detallado lo genera
`writing-plans`):

- **SP1 — Baseline + aislamiento:** limpieza Alfaco (código + migraciones),
  columnas nuevas en `empresas`, RLS core, fugas de service role, Storage por
  tenant. `db/fase3.sql`. Verificación de aislamiento.
- **SP2 — White-label:** slug + login branded (`/c/[slug]/login`), CSS var de
  color, logo/nombre por tenant en login y panel, export membretado por tenant.
- **SP3 — Provisioning + entitlements:** script de alta del tenant, seed de
  catálogos, `empresas.modulos` + gate de módulos en el nav; provisionar al
  prospecto y desplegar a prod.

---

## 10. Errores y bordes

- **Slug inexistente / inactivo** → 404 neutro Trasaas (no filtra existencia de
  tenants).
- **Tenant sin color/logo** → cae al branding Trasaas por defecto.
- **Usuario sin `empresa_id`** (no debería pasar) → se bloquea el panel y se
  loguea el incidente.
- **Migración RLS sobre tabla ya con RLS** → idempotente (`if not exists` /
  chequeo), no rompe.
- **Purga de Alfaco** → sólo tras dump; se acota por `empresa_id` de Alfaco para
  no tocar otros tenants.

---

## 11. Testing

- **Aislamiento (crítico):** test de integración que crea dos tenants con data,
  loguea a cada uno y verifica que ninguno ve filas ni documentos del otro
  (proveedores, cuadros, evaluaciones, Storage). Es la regresión de todo el
  bloque de aislamiento.
- **Resolución de tenant:** slug válido pinta branding correcto; slug inválido →
  404.
- **Entitlements:** módulo apagado no aparece en el nav ni es accesible por URL.
- **`npx tsc --noEmit` = 0** antes de cada entrega (regla del repo).

---

## 12. Stack y adopción de shadcn/ui

**Estado actual:** Next.js 14 (App Router) + React + TypeScript + Tailwind con
tokens custom y un **kit de UI propio** (`Select`, `Confirmar`, `Stepper`,
`Modal`, `Hint`, `ConfigHeader`, clases utilitarias en `globals.css`). No hay
shadcn.

**Decisión:** adoptar **shadcn/ui de forma incremental y con tokens mapeados**,
NO en un big-bang. Un reemplazo total de golpe rompería el One-View, los modales
wizard y las tablas sticky (reglas de UX ya validadas) justo antes de la demo.

Plan de adopción:
1. `npx shadcn init` + `components.json`; mapear los colores de marca
   (`brand.900 #2743C0`, `ink`, `alfa.red`, etc.) al theme de shadcn (CSS vars)
   para que los componentes salgan on-brand. Esto convive con `--brand` por
   tenant (§5).
2. Usar shadcn para **componentes nuevos** y para primitivos donde aporta
   accesibilidad (dialog, dropdown-menu, popover, toast, tooltip, command).
3. Migrar los componentes propios **uno por uno**, verificando el layout en cada
   reemplazo (`tsc` + revisión visual). Prioridad a los que se benefician de
   Radix (Select → shadcn Select/Combobox; Modal → Dialog). Los que encodean
   reglas de UX propias (modal wizard One-View) se migran con cuidado o se
   mantienen si el riesgo/beneficio no da.

**Regla:** ningún reemplazo de componente entra sin `npx tsc --noEmit` en 0 y sin
verificar que la vista afectada mantiene su layout.

## 13. Riesgos y decisiones abiertas

- **Purga de data viva** es irreversible sin el dump → gate humano explícito.
- **Cambio de cookie ya hecho** (`sb-trasaas-auth`): cuando esto llegue a prod
  cierra sesiones abiertas (ya documentado).
- **Theming parcial en v1** (solo acento + logo + nombre): si el cliente espera
  su paleta completa, sube a fase 2.
- **Pendiente del cliente:** logo, color primario, nombre comercial, y qué
  módulos van habilitados para su demo.
</content>
