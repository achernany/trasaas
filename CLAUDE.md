# AlfaSource — contexto del proyecto

SaaS de evaluación de proveedores y compras auditables para **Alfa Co S.A.C.**
(constructora, Perú). Producto de Hernany + Francys "Fran" Nava (coordinadora de
logística, la stakeholder que define requerimientos). Se venderá white-label a
otras constructoras. **El producto ES la auditoría**: todo cambio sensible deja
rastro en `audit_log` con usuario, fecha y detalle.

**Historial completo y decisiones: `docs/CHECKPOINT.md` (fuente de verdad viva —
ACTUALIZARLO al cerrar cada tanda de trabajo).**

## Stack e infraestructura

- Next.js 14.2.21 App Router + TypeScript + Tailwind (tokens custom en
  `tailwind.config.ts`), deploy en **Vercel Hobby**
  (https://procurement-scorecard-providers-erp.vercel.app).
- **Supabase** (proyecto `udrlswivsjywttktevci`, São Paulo): Postgres con RLS
  multi-tenant (`empresa_id` + función `mi_empresa()`), Auth, Storage (buckets
  privados `registro-docs` y `compras-docs`, signed URLs).
- Proxy first-party `/sbproxy/:path*` → Supabase (evita firewalls corporativos).
  Cookie de auth fija: `sb-alfasource-auth`. **NUNCA renombrar ninguna de las dos.**
- Migraciones en `db/*.sql` (schema, settings, fase2, fase2b, fase2c, fase2d —
  todas YA ejecutadas). Las nuevas se corren a mano en el SQL Editor de Supabase
  y el archivo queda versionado en `db/`.
- Excel: `exceljs` (import DATA SIG y exportes membretados con
  `public/logo-alfaco.png`).
- `tsconfig` target es2017. Verificar SIEMPRE con `npx tsc --noEmit` antes de
  entregar.

## Reglas de seguridad (INQUEBRANTABLES)

- NUNCA pegar ni pedir en el chat: contraseña de la base de datos ni
  `service_role` key. La service key vive SOLO en variables de entorno de Vercel
  (`SUPABASE_SERVICE_ROLE_KEY`). La anon key es pública, esa sí puede verse.
- Los `git push` los ejecuta **el usuario** en su terminal (su PAT). El agente
  solo entrega el bloque de comandos: `git add -A && git commit -m "..." && git push`.
- Autor de commits: `scorecardproveedores@gmail.com`.
- Tras cada push del usuario, verificar el deploy en producción.

## Regla de dominio ABSOLUTA (corrección fuerte de Fran, 19-jul)

**En el flujo de compras solo existen TRES estados/clasificaciones de proveedor:
Crítico, No crítico y Aprobado. Ninguna otra referencia en ninguna vista.**

- DB: `proveedores.clasificacion` guarda `'critico' | 'regular'` — `'regular'`
  es SOLO storage, la UI SIEMPRE muestra **"No crítico"**. No migrar el valor.
- Estados del flujo: `registrado → seleccionado → aprobado`.
- La calificación **Confiable / Medianamente / No confiable** existe ÚNICAMENTE
  en el dominio de evaluación periódica (matrices, evaluaciones) y siempre
  etiquetada como "evaluación periódica". Jamás como estado del proveedor.
- Clasificación: desde **Registro**, uno por uno, con la guía CUALITATIVA de la
  matriz **LOG-GN-A-P02-02** (`components/ClasificarProveedor.tsx`) → pasa a
  Selección. Selección tiene SOLO 3 filtros: Críticos / No críticos / Aprobados.
- **Cadena documental**: los docs subidos en el registro del proveedor deben
  poder abrirse desde Registro y Selección (`docsPorRuc` con signed URLs).
- **SIN CORREO** (decisión de la llamada: "no es trackeable"). No configurar
  Resend. El comparativo se cierra de dos formas: (a) resolución interna del
  aprobador en el sistema, o (b) el comprador adjunta el PDF de aprobación en el
  Expediente y selecciona al proveedor ganador (esa es "la llave"), con
  observación opcional. Coordinación audita que el PDF coincida.

## Flujo de compras (LOG-GN-P-02)

Registro por link público (`/registro/[token]`, lobby con fotos + modal wizard)
→ validación → clasificación (Crítico/No crítico) → Selección → cuadro
comparativo (`LOG-GN-F-P02-07` / LOGFP0202) → aprobación → el ganador pasa a
**Aprobado** → evaluación periódica.

- **Matriz de puntajes APROBADA del comparativo** (en `components/NuevoCuadro.tsx`,
  no cambiar sin nueva versión oficial): PRECIO 30 por ranking (1°=30/2°=20/
  3°=10/resto 0), PAGO 20 (61-90+:20 / 31-60:15 / 30:10 / 15:5 / contado:0),
  LUGAR 15 (destino/agencia/recojo), TIEMPO 15 binario vs
  `tiempo_requerido_dias`, GARANTÍA 10, FEEDBACK 10 (por calificación de
  evaluación periódica; sin evaluación = 5; capado a 5 si supera precio
  histórico). El desglose se CONGELA en `cotizaciones.puntajes` (jsonb).
- Rutinario mínimo 3 cotizaciones; emergencia mínimo 1.
- Detalle del cuadro (`/panel/cuadros/[id]`): formato oficial con Cód. SIG,
  fecha última compra, precio/total histórico, P.U./Total/Espec. por proveedor,
  SUBTOTAL/IGV 18%/TOTAL, celdas ROJAS si superan histórico, condiciones
  comerciales + puntajes por criterio, dashboard de decisión, seleccionado +
  justificación.
- Aprobador interno (`components/AprobarCuadro.tsx`): aprobar todo / **aprobar
  parcialmente por ítem** (check + observación por ítem) / rechazar. Ítems no
  aprobados → bandeja `/panel/pendientes` (descartar o llevar a nuevo
  comparativo vía `?pendientes=ids`; el original queda `recomprado` con
  `origen_item_id`).
- Catálogo de ítems (códigos SIG): import masivo del Excel DATA SIG del ERP en
  Configuración → Códigos SIG (`/api/items/import`); cabecera "COD Material…",
  códigos repetidos → se toma la ÚLTIMA fila. Alerta si un precio supera el
  `ultimo_costo` → escala al aprobador máximo.
- SLA: días desde `enviado_en` sin resolver (gris <1d, ámbar 1-2d, rojo ≥3d).

## Reglas UX (codificadas tras varias correcciones — respetarlas)

- **One View**: nada de scroll de página en vistas del panel. Tablas con altura
  fija `h-[calc(100vh-350px)]` y scroll interno + `thead` sticky. Única
  excepción: documentos imprimibles (detalle de cuadro, matriz imprimible).
- Procesos de crear/editar = **modal wizard centrado** (Stepper arriba, header y
  footer `bg-ink-950` con botones blancos invertidos, scroll solo en
  `.modal-body`, `max-w-3xl`, `border-line`). Consulta también en modal.
- `components/Select` custom SIEMPRE (nunca `<select>` nativo). No poner
  `overflow-hidden` en cards que contengan un Select (se corta el dropdown).
- Acciones sensibles: modal `components/Confirmar` + dirty-check ("Sin cambios"
  desactiva guardar).
- `ConfigHeader` (breadcrumb + botón ArrowLeft cuadrado junto al título + Hint)
  en las vistas de configuración. Tooltips pedagógicos `components/Hint` con
  prop `roles`.
- Iconos: solo lucide-react. Un solo CTA por acción por vista.
- Brand: Space Grotesk/Manrope/IBM Plex Mono; brand.900 #2743C0, alfa.red
  #E23A5E, ink.950 #0B0D13, page #F5F6F9, line #E4E7EE.
- Sidebar oscuro w-[232px] (`app/panel/layout.tsx` + `components/NavItem`).

## Estado actual (20-jul) y pendientes

Hecho y en producción: flujo completo de registro→clasificación→selección→
comparativo oficial→aprobación (interna y por PDF)→bandeja de pendientes;
filtros en Comparativos (buscador ticket/código/proveedor + chips por estado);
import DATA SIG; exportes membretados; dashboard con KPIs.

**Esperando de Fran:** matriz de ítems con precios reales (ella la sube),
correos/lista de aprobadores, matriz de permisos por rol, tiempos de
re-evaluación por clasificación, membrete/acta oficial de Auditoría.
**Backlog nuestro:** leer a fondo `LOG-GN-P-02 Adq. de Bienes y Servicios
VD.docx`; catálogo de tiempos re-eval configurables; subcategorías (espera su
estructura); adjuntar PDF de cotización (hoy `archivo_url='pendiente-adjuntar'`);
manuales de usuario; módulo de tickets (venta aparte de Hernany); web Alfaco
(desde cero, propuestas previas rechazadas). **NO hacer motor de correos.**

## Gotchas

- Login caído en redes corporativas → revisar `/sbproxy/auth/v1/health`.
- Renombrar proyecto en Vercel NO migra el dominio `.vercel.app`.
- Tipos explícitos en callbacks de cookies de `@supabase/ssr`.
- No proponer rankings "top proveedores" (decisión: promedio por categoría).
- Archivos oficiales de Fran decodificados (detalle en CHECKPOINT §ARCHIVOS):
  DATA SIG, LOG-GN-A-P02-02 (criterios críticos/no críticos + aprobadores por
  monto), LOGFP0202 (cuadro oficial + matriz de puntajes), LOG-GN-P-02 (docx del
  procedimiento).
