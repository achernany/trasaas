# Trasaas — Roadmap SaaS multi-tenant

> Auditoría del repo con evidencia de código (`archivo:línea` / `db/*.sql`) para
> pasar de "un solo cliente en producción" (Alfaco) a "varias empresas a la vez".
> Prioridad en tres bloques: **(A)** bloqueante para vender al **segundo** cliente,
> **(B)** necesario para el **quinto**, **(C)** puede esperar. Cada punto lleva
> archivo/tabla afectada y estimación gruesa.
>
> Método: `rg` sobre el repo + lectura de `db/*.sql` y de las páginas server.
> `npx tsc --noEmit` = 0 errores al momento de escribir esto. No se consultó la
> base productiva (sin service key en el chat): los puntos que dependen del
> estado real de Supabase están marcados **[verificar en Supabase]** con una
> consulta de solo lectura.

---

## ⚠️ Verificación urgente antes que nada (RLS)

El aislamiento entre empresas de Trasaas depende **100% de RLS**: el README lo
dice explícito — *"La aplicación no filtra por tenant en código"*. Pero en el SQL
versionado, `enable row level security` solo aparece para 4 tablas:

```
$ rg -i 'enable row level' db/
db/settings.sql:28  notificacion_destinatarios
db/fase2.sql:37     items
db/fase2.sql:55     aprobadores
db/fase2.sql:78     cuadro_documentos
db/schema.sql:317   -- (comentario-plantilla, NO ejecuta nada)
```

`db/policies.sql` **crea policies** pero crear una policy **no** activa RLS. Si
en la base productiva no se activó a mano en las ~20 tablas core
(`proveedores`, `cuadros`, `evaluaciones`, `usuarios`, `audit_log`, …), esas
tablas están **abiertas a cualquier usuario autenticado de cualquier empresa**
(y potencialmente al rol anónimo). Como la app no agrega ningún `.eq(empresa_id)`
de respaldo, no habría **nada** conteniendo la fuga.

**Verificar (solo lectura, corrés vos en el SQL Editor):**

```sql
select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by rls_activo, tabla;
```

Toda tabla con `rls_activo = false` es un agujero. Ver **A1** para el fix
versionado.

---

## Bloque A — Bloqueante para vender al SEGUNDO cliente

### A1. Activar RLS en las tablas core y versionarlo
- **Evidencia:** ver sección anterior. `db/schema.sql:317` es comentario;
  `db/policies.sql` define policies sin `enable row level security`.
- **Impacto:** exposición total cross-tenant si no está activo en prod. Y aun si
  estuviera activo, no está en las migraciones → un entorno nuevo (staging,
  on-premise, otro proyecto Supabase) nace inseguro.
- **Acción:** `db/fase3.sql` idempotente con
  `alter table <t> enable row level security;` (+ `force row level security`)
  para: empresas, usuarios, proyectos, categorias, proveedores,
  proveedor_registros, proveedor_documentos, proveedor_categorias, matrices,
  criterios, criterio_opciones, matriz_documentos, evaluaciones,
  evaluacion_respuestas, evaluacion_documentos, satisfaccion_respuestas,
  requerimientos, cuadros, cuadro_items, cotizaciones, cotizacion_precios,
  niveles_aprobacion, aprobaciones, audit_log. Revisar que cada una tenga policy
  de tenant (varias solo tienen SELECT/INSERT — ver B2).
- **Estimación:** 0.5–1 día (SQL + verificación con la consulta de arriba).

### A2. Service role sin filtro de tenant en dos páginas del panel
- **Evidencia:** `app/panel/registros/page.tsx:30-36` y
  `app/panel/seleccion/page.tsx:42-45` usan `createAdmin(...SERVICE_ROLE_KEY)` —
  que **salta RLS** — y consultan `proveedor_registros` **sin** `.eq('empresa_id', …)`.
  En Selección eso alimenta `docsPorRuc` con **URLs firmadas de documentos de
  todos los tenants**, cruzado por RUC (y los mismos proveedores se repiten entre
  constructoras → colisión real).
- **Impacto:** un usuario logueado de la empresa B ve registros y descarga
  documentos de la empresa A.
- **Acción:** derivar `empresa_id` del usuario (`mi_empresa()` / perfil) y
  filtrar; idealmente eliminar el service role de estas vistas y resolver la
  cadena documental con RLS + policy de Storage por tenant (A3).
- **Estimación:** 0.5 día.

### A3. Storage no está particionado por tenant
- **Evidencia:** `db/policies.sql:84-85` (`registro-docs`: lee cualquier
  `authenticated`) y `db/fase2.sql:87-90` (`compras-docs`: lee/escribe cualquier
  `authenticated`). Ninguna policy valida empresa ni prefijo de ruta.
- **Impacto:** cualquier usuario autenticado puede leer objetos de otro tenant si
  obtiene la ruta (y las vistas de A2 se la sirven).
- **Acción:** prefijar las rutas de subida con `<empresa_id>/…` y reescribir las
  policies de `storage.objects` para validar
  `(storage.foldername(name))[1] = mi_empresa()::text`. Migrar rutas existentes
  del bucket. Ajustar los `upload`/`createSignedUrl` en
  `components/ExpedienteCompra.tsx`, `RegistroForm`/`app/api/registro` y las dos
  páginas de A2.
- **Estimación:** 1 día.

### A4. No existe onboarding de una empresa nueva
- **Evidencia:** `db/policies.sql:88-96` documenta el alta **manual** (crear user
  en el dashboard + `insert into usuarios …`). `db/seed.sql` siembra solo a
  Alfaco (empresa, categorías, matrices, niveles). No hay endpoint ni flujo para
  crear un tenant.
- **Impacto:** sumar al cliente #2 hoy implica correr SQL a mano y tocar el
  dashboard de Supabase por cada empresa. No es vendible.
- **Acción:** provisioning de tenant (endpoint server con service role o script):
  crear fila en `empresas`, crear primer admin (Auth + `usuarios`), sembrar
  categorías base, matrices plantilla (selección/evaluación), áreas y aprobadores
  vacíos. Idempotente y auditado.
- **Estimación:** 3–5 días.

### A5. Datos del tenant hardcodeados en código/UI
- **Evidencia:**
  - `lib/areas.ts` — 15 áreas de Alfaco como constante TS, usadas en los
    dropdowns de aprobadores y requerimientos. Otra constructora tiene otras
    áreas.
  - `app/api/export/route.ts:133` — membrete `"ALFA CO S.A.C. — RUC 20601832390"`
    fijo; `:114-117` lee `public/logo-alfaco.png` fijo.
  - `app/panel/cuadros/[id]/page.tsx:12` — `const IGV = 0.18;` fijo.
  - `TrasaasLockup conEndoso` → texto `"Módulo de Alfaco"` en `components/Logo.tsx`.
- **Impacto:** el segundo cliente vería áreas ajenas, membrete y logo de Alfaco en
  sus exportes, y su IGV/impuesto podría no ser 18%.
- **Acción:** mover a configuración por tenant: tabla `areas` (o `empresas.areas`
  jsonb), columnas `razon_social`/`ruc`/`logo_path`/`tasa_impuesto`/`moneda` en
  `empresas`, y leer el logo por tenant desde Storage. Endoso del logo dinámico.
- **Estimación:** 2–3 días.

---

## Bloque B — Necesario para el QUINTO cliente

### B1. Invitación de usuarios self-service
- **Evidencia:** alta manual (A4). `db/policies.sql:15-16` da a `usuarios` solo
  `usuarios_self` (SELECT de la propia fila) → `components/UsuariosAdmin.tsx` no
  puede listar el equipo del tenant por RLS.
- **Acción:** policy de `usuarios` por empresa (SELECT/UPDATE con `mi_empresa()`) +
  flujo de invitación (magic link / set-password) que crea el Auth user y la fila
  `usuarios` con `empresa_id` correcto.
- **Estimación:** 2–3 días.

### B2. Policies de UPDATE/DELETE completas y escritura por rol
- **Evidencia:** `db/policies.sql` tiene SELECT + INSERT para casi todo, pero
  faltan UPDATE en varias tablas y DELETE en casi todas; la escritura no distingue
  rol ("fase demo: roles internos crean/editan; se afinará por rol", `:54`). La
  matriz de permisos por rol está pendiente de Fran (CLAUDE.md).
- **Acción:** completar policies por operación y condicionar escritura al rol
  (`usuarios.rol`) según la matriz. Auditor = solo lectura real a nivel DB.
- **Estimación:** 2–4 días (depende de la matriz de permisos).

### B3. Migraciones versionadas y reproducibles
- **Evidencia:** el flujo corre SQL a mano en el dashboard y versiona el archivo
  después; el `enable row level security` core nunca se versionó (A1). No hay
  entorno de staging ni orden garantizado para un proyecto Supabase nuevo.
- **Acción:** adoptar `supabase` CLI migrations (o dbmate): `db/` como migraciones
  ordenadas + un proyecto de staging para probar antes de prod.
- **Estimación:** 2 días de setup + disciplina.

### B4. Impuesto y moneda configurables por tenant
- **Evidencia:** `IGV = 0.18` hardcode (`app/panel/cuadros/[id]/page.tsx:12`).
  `cuadros.moneda` ya existe (`db/schema.sql:223`) y `money(x, moneda)` se usa,
  pero la tasa no.
- **Acción:** `empresas.tasa_impuesto` + etiqueta del impuesto; usar en el cuadro
  y en el export.
- **Estimación:** 1 día.

### B5. Branding por tenant (logo, nombre, endoso) en UI y exports
- **Evidencia:** logo/membrete fijos (A5); endoso "Módulo de Alfaco" en `Logo.tsx`.
- **Acción:** leer logo y nombre visible del tenant desde `empresas`/Storage;
  aplicarlos en sidebar, login (si es por subdominio), exports y actas.
- **Estimación:** 2–3 días.

### B6. Verificación automatizada de aislamiento
- **Acción:** test de integración que loguea a dos tenants y asegura que ninguno
  ve datos/documentos del otro (regresión de A1–A3).
- **Estimación:** 1–2 días.

---

## Bloque C — Puede esperar

- **C1. Planes, límites y facturación.** Hoy no hay noción de plan, asientos ni
  cuotas de uso. Definir tiers, límites (usuarios, proveedores, storage) y cobro.
  Est: 1–2 semanas.
- **C2. Backups verificables y entornos separados.** Supabase da backups
  automáticos; falta PITR (plan Pro), un runbook de restore probado y separación
  dev/staging/prod. Est: variable.
- **C3. Observabilidad y auditoría de acceso.** Logging de operaciones con service
  role y alertas; `audit_log` cubre acciones de negocio, no accesos de
  infraestructura. Est: 3–5 días.
- **C4. Rate limiting / anti-abuso en endpoints públicos por token.**
  `app/api/registro` y `app/api/satisfaccion` no tienen throttling. Est: 1–2 días.
- **C5. On-premise / data residency como opción enterprise.** Ya prometido a la
  directora de TI de Alfaco (CHECKPOINT). El white-label por instancia propia lo
  habilita; formalizar el paquete. Est: variable.
- **C6. Offboarding y portabilidad por tenant.** Export completo y borrado
  verificable de una empresa (cumplimiento). Est: 3–5 días.

---

## Resumen de archivos/tablas tocados

| Área | Evidencia | Bloque |
|---|---|---|
| RLS core sin versionar | `db/schema.sql:317`, `db/policies.sql`, `rg 'enable row level'` | A1 |
| Service role sin tenant | `app/panel/registros/page.tsx:30`, `app/panel/seleccion/page.tsx:42` | A2 |
| Storage no particionado | `db/policies.sql:84`, `db/fase2.sql:87` | A3 |
| Sin onboarding | `db/policies.sql:88`, `db/seed.sql` | A4 |
| Tenant hardcodeado | `lib/areas.ts`, `app/api/export/route.ts:133`, `app/panel/cuadros/[id]/page.tsx:12` | A5, B4, B5 |
| Sin invitaciones / policy usuarios | `db/policies.sql:15`, `components/UsuariosAdmin.tsx` | B1 |
| Escritura sin rol | `db/policies.sql:54` | B2 |
| Migraciones a mano | flujo `db/*.sql` | B3 |
</content>
