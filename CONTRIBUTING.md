# Convenciones de trabajo

Guía para cualquier persona (o agente) que mantenga o extienda Trasaas.

## Flujo de cambios

1. Trabajar sobre `main` (equipo pequeño; migrar a feature branches + PR cuando haya
   más de dos personas escribiendo código).
2. Antes de commitear: `npx tsc --noEmit` debe pasar sin errores.
3. Commits en español, en presente, describiendo el *qué* funcional:
   `Panel de administracion: matrices versionadas, destinatarios de correos`.
4. Push a `main` despliega automáticamente a producción (Vercel).

## Base de datos

- Un cambio de esquema = un archivo SQL **nuevo** en `db/` con comentario de propósito
  y fecha. Los archivos ya ejecutados en Supabase son historia inmutable: no se editan.
- Toda tabla nueva lleva `empresa_id`, RLS habilitado y policies por tenant
  (`mi_empresa()`). Sin excepciones: el aislamiento multi-tenant vive en la base.
- Las tablas de configuración que el negocio pueda querer cambiar (matrices, criterios,
  destinatarios) se administran desde `/panel/configuracion`, no por SQL.

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` existe solo en variables de entorno de Vercel y se usa
  únicamente en código server-side (`app/api/*`, páginas server que lo justifiquen).
- Nunca commitear secretos. `.env.local` está en `.gitignore`; `.env.local.example`
  documenta las variables sin valores sensibles.
- La cookie de sesión se llama `sb-trasaas-auth` en `lib/supabase/client.ts`,
  `lib/supabase/server.ts` y `middleware.ts`. Renombrarla invalida todas las sesiones.
- Todo acceso del navegador a Supabase pasa por el proxy `/sbproxy` (compatibilidad
  con firewalls corporativos). No introducir llamadas directas a `*.supabase.co`
  desde el cliente.

## UI

- Los tokens de marca viven en `tailwind.config.ts` y `app/globals.css`; no usar
  colores/fuentes hardcodeados en componentes.
- Formularios de varios pasos: patrón wizard con `components/Stepper.tsx`.
- Dropdowns: `components/Select.tsx` (no usar `<select>` nativo).
- Modales: header/footer fijos en `bg-ink-950`, scroll solo en `.modal-body`.
- Tablas: clases `.th`/`.td`, thead sticky, paginación con `components/Paginator.tsx`
  sin saltos de layout.

## Auditoría

- Toda acción de escritura relevante inserta en `audit_log` (empresa, usuario, acción,
  entidad, detalle JSON).
- Las entidades con versiones (matrices) nunca se modifican en sitio: se crea una
  versión nueva y se archiva la anterior.

## Estado del proyecto

`docs/CHECKPOINT.md` es la fuente de verdad del estado: qué está hecho, qué está
pendiente y por qué, decisiones tomadas y trampas conocidas. **Actualizarlo al cierre
de cada tanda significativa de cambios.**
