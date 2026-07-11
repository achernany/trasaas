# AlfaSource — Procurement Scorecard

Plataforma SaaS multi-tenant de **evaluación y selección de proveedores** con trazabilidad
auditable, alineada a ISO 9001 e ISO 37001 (debida diligencia / antisoborno).
Cliente inicial: Alfa Co S.A.C. (Perú).

**Producción:** https://procurement-scorecard-providers-erp.vercel.app

## Funcionalidad

- **Registro de proveedores**: formulario público de debida diligencia (88 preguntas,
  formato LOG-GN-F-P02-09) con carga de declaración jurada y documentos de sustento.
- **Evaluación con matrices de puntuación** configurables y versionadas
  (Confiable ≥ 71 / Medianamente confiable 31–70 / No confiable ≤ 30; re-evaluación
  6/3/1 meses), clasificación de proveedores Regular / Crítico y documentos de
  legalidad eliminatorios.
- **Encuesta al área usuaria**: enlace público por token; la respuesta queda como
  evidencia dentro del acta de evaluación.
- **Cuadros comparativos** de cotizaciones con puntuación ponderada y flujo de aprobación.
- **Panel de administración** (`/panel/configuracion`): edición de matrices con versionado
  auditable y gestión de destinatarios de notificaciones, sin intervención de desarrollo.
- **Auditoría**: registro de acciones en `audit_log`, actas imprimibles con firma digital
  del sistema y exportación CSV por módulo.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend / SSR | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Backend | Supabase (PostgreSQL + RLS, Auth, Storage) |
| Hosting / CI | Vercel (deploy automático desde `main`) |

## Estructura del proyecto

```
app/                Rutas (App Router)
  login/            Autenticación
  panel/            Aplicación interna (protegida por middleware)
    configuracion/  Panel de administración (matrices, correos)
  registro/         Formulario público de proveedores (por link único)
  satisfaccion/     Encuesta pública del área usuaria (por token)
  api/              Endpoints server-side (service role)
components/         Componentes React reutilizables
lib/supabase/       Clientes Supabase (browser / server / middleware)
lib/registro-config.ts  Las 88 preguntas del formulario como configuración
db/                 SQL fuente: schema, seed, import, policies, settings
docs/               Especificaciones, decisiones y estado del proyecto
migracion/          Scripts one-off de la migración de datos histórica
```

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completar variables
npm run dev                        # http://localhost:3000
```

Verificación de tipos: `npx tsc --noEmit`.

### Variables de entorno

| Variable | Ámbito | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Clave anónima (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** | Solo en Vercel. Nunca commitear ni exponer al cliente |

## Base de datos

Los archivos de `db/` se ejecutan en el SQL Editor de Supabase **en orden**:

1. `schema.sql` — 24 tablas
2. `seed.sql` — empresa, categorías, proyectos, matrices, niveles de aprobación
3. `import.sql` — migración de datos históricos (105 proveedores, 339 evaluaciones)
4. `policies.sql` — RLS por tenant (`mi_empresa()`) y bucket de documentos
5. `settings.sql` — clasificación de proveedores, destinatarios de notificaciones,
   políticas de escritura del panel de administración

**Convención de migraciones:** los cambios de esquema se agregan como archivo nuevo en
`db/` (nunca se edita uno ya ejecutado) y se registran en `docs/CHECKPOINT.md`.

## Decisiones de arquitectura

- **Multi-tenant por fila**: toda tabla lleva `empresa_id`; el aislamiento lo garantiza
  RLS con la función `mi_empresa()`. La aplicación no filtra por tenant en código.
- **Proxy first-party** (`/sbproxy/*` → Supabase, ver `next.config.mjs`): permite operar
  detrás de firewalls corporativos que bloquean `*.supabase.co`. La cookie de sesión usa
  el nombre fijo `sb-alfasource-auth` en cliente, servidor y middleware — **no renombrar**.
- **Matrices versionadas**: editar una matriz crea una nueva versión y archiva la
  anterior; cada evaluación referencia la matriz exacta con la que se ejecutó
  (requisito de auditoría).
- **`proveedor_categorias`**: un mismo RUC se califica por categoría de suministro
  (refleja 99/105 casos reales de la base migrada).
- **Service role solo server-side**: rutas API y páginas server que lo requieren
  (registro público, encuestas por token, revisión de registros).
- **`audit_log` en cada acción de escritura** — la trazabilidad es el producto.

## Documentación

| Documento | Contenido |
| --- | --- |
| `docs/CHECKPOINT.md` | **Estado vivo del proyecto**: hecho, pendiente, decisiones, gotchas |
| `docs/registro-proveedores-spec.md` | Especificación del formulario de debida diligencia |
| `docs/ux-redesign-spec.md` | Sistema de diseño y patrones de UI |
| `docs/infraestructura.md` | Cuentas y servicios del producto |
| `docs/benchmark-ordon.md` | Análisis competitivo |
| `CONTRIBUTING.md` | Convenciones de trabajo |

## Despliegue

Push a `main` → build y deploy automáticos en Vercel. Las variables de entorno se
administran en Vercel (Settings → Environment Variables). El plan Hobby exige que el
autor del commit sea miembro del proyecto: el `git config user.email` local debe ser
el correo de la cuenta del producto.
