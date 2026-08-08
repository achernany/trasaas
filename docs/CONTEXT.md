# AlfaSource — Contexto completo del producto y del código

> Documento de handoff para cualquier agente o desarrollador. Leyendo esto se
> entiende qué es el producto, cómo funciona el dominio, cómo está construido el
> código, qué reglas son inquebrantables y cómo se trabaja en este repo.
> Historial cronológico de decisiones: `docs/CHECKPOINT.md` (fuente de verdad
> viva, se actualiza al cerrar cada tanda). Reglas condensadas para el agente:
> `CLAUDE.md` en la raíz.

---

## 1. El producto

**AlfaSource** es un SaaS de gestión de proveedores y compras auditables
construido para **Alfa Co S.A.C.** (constructora peruana, RUC 20601832390,
sedes Ate e Ica, ~7 líneas de negocio, certificada ISO 9001/14001/45001).

- **Dueños del producto:** Hernany Acosta (construye, decide técnica y
  comercialmente) y Francys "Fran" Nava (Coordinadora de Logística de Alfaco;
  define los requerimientos funcionales desde la operación real). El plan es
  venderlo white-label a otras constructoras — la arquitectura multi-tenant ya
  lo soporta.
- **Tesis del producto: la auditoría ES el producto.** Alfaco pasa auditorías
  ISO y de clientes (Calidda, Contugas, Electrodunas...). Cada acción sensible
  (clasificar, aprobar, adjuntar, descartar, cambiar matriz) queda firmada en
  `audit_log` con usuario, fecha y detalle jsonb. Las matrices se versionan:
  editar una crea la versión N+1 y archiva la anterior, para poder demostrar
  con qué criterios se evaluó a cada proveedor en cada momento.
- **Documentos oficiales que el sistema implementa** (enviados por Fran, están
  decodificados en CHECKPOINT §ARCHIVOS):
  - `LOG-GN-P-02` — procedimiento de Adquisición de Bienes y Servicios.
  - `LOG-GN-A-P02-02` — matriz de clasificación Crítico / No Crítico
    (cualitativa, 9 criterios de comparación).
  - `LOG-GN-F-P02-07` / "LOGFP0202" — formato oficial del cuadro comparativo +
    matriz de puntajes aprobada.
  - `LOG-P-03` — selección y evaluación periódica de proveedores (matrices,
    umbrales, fichas).
  - DATA SIG — export del ERP con el catálogo de materiales y precios
    históricos.

### Decisiones de negocio ya tomadas (no reabrir sin pedido explícito)

- **Sin correo por ahora.** El flujo de aprobación NO usa email porque "no es
  trackeable". No configurar Resend ni motor de correos.
- La calificación **Confiable / Medianamente confiable / No confiable** es
  EXCLUSIVA del dominio de evaluación periódica. En el flujo de compras solo
  existen **Crítico, No crítico y Aprobado** (regla absoluta, ver §3).
- No hay rankings "top proveedores" en dashboard (sesgo); se usa promedio por
  categoría + radial de cumplimiento.
- El módulo de tickets (reemplazo de AvanDesk) es una venta aparte de Hernany a
  un interesado externo — no está en este repo todavía.
- La web pública de Alfaco es otro proyecto (propuestas previas rechazadas; se
  hará desde cero).

---

## 2. Stack e infraestructura

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend/SSR | Next.js 14.2.21 App Router + TypeScript | `tsconfig` target es2017 |
| Estilos | Tailwind con tokens custom | `tailwind.config.ts` |
| Hosting | Vercel Hobby | https://procurement-scorecard-providers-erp.vercel.app |
| Backend | Supabase (proyecto `udrlswivsjywttktevci`, São Paulo) | Postgres + RLS, Auth, Storage |
| Excel | exceljs | import DATA SIG y exportes membretados |
| Iconos | lucide-react (únicos permitidos) | |

**Detalles críticos de infraestructura:**

- **Proxy first-party** `/sbproxy/:path*` → Supabase (rewrite en
  `next.config`). Existe para atravesar firewalls corporativos que bloquean
  `*.supabase.co`. La cookie de sesión tiene nombre fijo `sb-alfasource-auth`.
  **NUNCA renombrar ni el proxy ni la cookie** — rompe el login de todos.
- **Multi-tenant por RLS:** toda tabla lleva `empresa_id`; las policies usan la
  función SQL `mi_empresa()` (lee la empresa del usuario autenticado). El
  cliente anónimo/autenticado solo ve su tenant. El **admin client** (service
  role) se usa únicamente server-side para casos puntuales (ej. `docsPorRuc` en
  Selección) — la key vive SOLO en la env var `SUPABASE_SERVICE_ROLE_KEY` de
  Vercel.
- **Storage:** buckets privados `registro-docs` (docs del registro del
  proveedor) y `compras-docs` (expediente del comparativo). Acceso siempre por
  `createSignedUrl(ruta, 3600)`.
- **Migraciones:** archivos en `db/` (orden: `schema.sql`, `policies.sql`,
  `settings.sql`, `fase2.sql`, `fase2b.sql`, `fase2c.sql`, `fase2d.sql` — TODOS
  ya ejecutados en Supabase). Las nuevas se corren a mano en el SQL Editor del
  dashboard de Supabase y el archivo queda versionado en `db/`.

### Flujo de trabajo del equipo (cómo se opera este repo)

1. El agente construye y verifica con `npx tsc --noEmit` (debe dar EXIT:0).
2. Si hay SQL nuevo: se crea `db/faseX.sql` y se ejecuta en el SQL Editor de
   Supabase (vía navegador) hasta ver "Success. No rows returned".
3. El agente actualiza `docs/CHECKPOINT.md` con la tanda cerrada.
4. El agente entrega el bloque de comandos git; **el push lo ejecuta Hernany en
   su Mac** con su PAT. El agente nunca pushea.
5. Tras el push, el agente verifica el deploy en producción (curl al login /
   navegación real).

**Seguridad (inquebrantable):** jamás pegar ni pedir en el chat la contraseña
de la DB ni la `service_role` key. La anon key es pública y sí puede verse.
Autor de commits: `scorecardproveedores@gmail.com`.

---

## 3. El dominio

### 3.1 Regla absoluta de estados

> "No puede haber por ningún lado en el app ningún otro estado o referencia de
> clasificación que no sea: Crítico, No Crítico o Aprobado." — Fran/Hernany

- `proveedores.estado`: `invitado → registrado → seleccionado → aprobado`
  (+ `homologado_externo`, `inactivo`). "Aprobado" se GANA al ganar un
  comparativo aprobado.
- `proveedores.clasificacion`: `'critico' | 'regular'`. **`'regular'` es solo
  storage** (no migrar el valor); la UI muestra SIEMPRE "No crítico".
- La calificación confiable/medianamente/no confiable aparece únicamente en
  matrices/evaluaciones y siempre enmarcada como "evaluación periódica".

### 3.2 Flujo completo de compras

```
Link público de registro (/registro/[token])
  └─ proveedor llena wizard 11 pasos + sube documentos (DJ veracidad, sustento)
       └─ Registro (/panel/registros): Coordinación VALIDA el registro
            └─ CLASIFICA uno por uno (modal ClasificarProveedor,
               guía cualitativa LOG-GN-A-P02-02) → Crítico o No crítico
                 └─ Selección (/panel/seleccion): SOLO 3 filtros
                    (Críticos / No críticos / Aprobados) + cadena documental
                      └─ Cuadro comparativo (/panel/cuadros/nuevo):
                         ticket AvanDesk + ítems (catálogo SIG) + ≥3 cotizaciones
                         (rutinario) o ≥1 (emergencia) → matriz de puntajes
                         automática → se envía (estado 'enviado', corre SLA)
                           ├─ (a) Aprobador interno resuelve en el sistema:
                           │      aprobar todo / PARCIAL por ítem / rechazar
                           ├─ (b) Comprador adjunta PDF de aprobación al
                           │      Expediente + selecciona ganador ("la llave")
                           │      + observación opcional
                           └─ ganador → proveedor 'aprobado';
                              ítems no aprobados → bandeja /panel/pendientes
                                └─ descartar o llevar a nuevo comparativo
                                   (precarga + origen_item_id, original queda
                                   'recomprado')
Evaluación periódica (dominio aparte, LOG-P-03):
  matrices versionadas por clasificación → evaluaciones con nota →
  calificación confiable/med./no confiable → fecha de re-evaluación (6/3/1 meses)
  → encuesta de satisfacción del área usuaria (alimenta criterio postventa)
```

### 3.3 Matriz de puntajes del comparativo (APROBADA — no cambiar sin versión oficial nueva)

Implementada en `components/NuevoCuadro.tsx` (constantes `PESOS`, `LUGARES`,
`PAGOS`, `GARANTIAS`, `FEEDBACK_PTS`, `PRECIO_RANK`):

| Criterio | Peso | Regla |
|---|---|---|
| PRECIO | 30 | Por RANKING del total: 1° más barato = 30, 2° = 20, 3° = 10, resto 0 |
| PAGO | 20 | Crédito 61-90+ días = 20 · 31-60 = 15 · 30 = 10 · 15 = 5 · contado = 0 |
| LUGAR | 15 | Entrega en destino = 15 · agencia = 10 · recojo = 0 |
| TIEMPO | 15 | BINARIO: dentro de `tiempo_requerido_dias` = 15, fuera = 0 |
| GARANTÍA | 10 | Total+postventa+certificados = 10 · básica = 5 · sin = 0 |
| FEEDBACK | 10 | Por calificación de evaluación periódica (confiable=10, med.=5, no=0); sin evaluación = 5 neutro; **capado a 5** si algún ítem supera su precio histórico |

El desglose por criterio se **congela** en `cotizaciones.puntajes` (jsonb) al
crear el cuadro — trazabilidad aunque la matriz cambie después. Si algún precio
del ganador supera el `ultimo_costo` del ERP → `cuadros.alerta_precio = true` y
la aprobación escala al aprobador máximo (`monto_max null`).

### 3.4 SLA

Días desde `cuadros.enviado_en` sin `resuelto_en`: gris <1d, ámbar 1-2d,
rojo ≥3d. Visible en la lista de comparativos.

### 3.5 Aprobadores (LOG-GN-A-P02-01 v1, datos reales de Alfaco)

Configurables en `/panel/configuracion/aprobadores` (tabla `aprobadores`:
nombre, email, área, `monto_max`; `null` = máximo aprobador). Referencia real:
GG Camilo Gómez >100k · Country Manager Mauricio González ≤100k · Directores
Redes ≤50k · Gerentes Fin/Admin ≤40k · Dir. Administrativo y Dir. Logística/TI
Blanca Jaramillo ≤8k · Jefa Valorizaciones Mónica Gómez >100k. Montos sin IGV.

### 3.6 Catálogo de ítems (códigos SIG)

Tabla `items`: codigo (SIG), descripcion, tipo, grupo, unidad, `ultimo_costo`
(valor sin IGV), `precio_con_igv`, `fecha_ultima_compra`. **Import masivo** en
Configuración → Códigos SIG → "Carga masiva (Excel del ERP)"
(`/api/items/import`): acepta el Excel DATA SIG tal cual (detecta la cabecera
"COD Material | Descripción | Tipo | Grupo Material | U.M. | Valor (Sin IGV) |
Precio (Con IGV)" en cualquier fila); códigos repetidos → gana la ÚLTIMA fila
(precio más reciente); upsert por `(empresa_id, codigo)` en lotes de 200.

### 3.7 Roles y áreas

`lib/areas.ts`: 15 áreas oficiales de Alfaco. Roles de usuario: admin,
director, coordinador, analista, comprador, aprobador, auditor (solo lectura),
area_usuaria. Los tooltips `Hint` aceptan prop `roles` para mostrar ayuda
contextual por rol. (Matriz fina de permisos por rol: pendiente, la debe Fran.)

---

## 4. Modelo de datos (24+ tablas, todas con RLS por `empresa_id`)

### Tenants y usuarios
- `empresas` — tenant raíz.
- `usuarios` — perfil (id = auth.users.id), rol, empresa.

### Catálogos
- `proyectos` — CALIDDA, CONTUGAS, ELECTRODUNAS, TENGDA, GENERAL...
- `categorias` — Bienes, S. Generales, Transportes... (`tipo` bien|servicio).
- `items` — catálogo SIG con precios históricos (§3.6).
- `aprobadores` — matriz de aprobación por monto (§3.5).
- `notificacion_destinatarios` — destinatarios configurables (para cuando haya
  motor de notificaciones; hoy sin correo).

### Proveedores y registro
- `proveedores` — ruc, razón social, estado (§3.1), `clasificacion`.
- `proveedor_registros` — form público por `token_acceso`; `form_data` jsonb;
  estados pendiente→enviado→validado|observado.
- `proveedor_documentos` — adjuntos del registro (bucket `registro-docs`).
- `proveedor_categorias` — la relación proveedor×categoría (la calificación de
  evaluación periódica vive AQUÍ, no en proveedores): `calificacion_actual`,
  `nota_actual`, `proxima_evaluacion`.

### Matrices y evaluación periódica
- `matrices` — versionadas (`version`, `estado` borrador|vigente|archivada),
  `tipo` seleccion|evaluacion, `clasificacion` critico|regular, umbrales
  (≥71 confiable, 31-70 medianamente) y meses de re-evaluación (6/3/1).
- `criterios` + `criterio_opciones` — criterios con niveles y puntos.
- `matriz_documentos` — checklist documental eliminatorio.
- `evaluaciones` — código autogenerado, nota, calificación, pdf de ficha.
- `evaluacion_respuestas`, `evaluacion_documentos` — detalle.
- `satisfaccion_respuestas` — encuesta del área usuaria por token.

### Compras
- `requerimientos` — ticket AvanDesk único, tipo rutinario|emergencia, área,
  proyecto.
- `cuadros` — el comparativo: codigo `CC-<ticket>-<rand>`, `matriz_pesos`
  jsonb, estado borrador|enviado|aprobado|**aprobado_parcial**|rechazado|
  reenviado, `justificacion`, `proveedor_ganador_id`, `aprobador_id`,
  `alerta_precio`, `tiempo_requerido_dias`, `enviado_en`, `resuelto_en`.
- `cuadro_items` — ítems del cuadro: orden, descripcion, cantidad, unidad,
  `item_id`/`codigo_sig`, `precio_historico`, `fecha_ultima_compra`,
  **`estado_aprobacion`** (pendiente|aprobado|no_aprobado|descartado|
  recomprado), `observacion_aprobador`, `resuelto_en`, `origen_item_id`
  (self-FK: de qué ítem pendiente proviene).
- `cotizaciones` — una por proveedor: lugar_entrega, tiempo, pago, garantía,
  `archivo_url` (PDF, hoy 'pendiente-adjuntar'), `puntaje_total`, **`puntajes`
  jsonb** (desglose congelado).
- `cotizacion_precios` — precio unitario + `especificacion` (marca) por ítem.
- `cuadro_documentos` — expediente: ticket|cotizacion|**aprobacion**|oc|otro
  (bucket `compras-docs`).
- `niveles_aprobacion`, `aprobaciones` — resoluciones (accion aprobado|
  **aprobado_parcial**|rechazado, comentario, firmas de tiempo).

### Auditoría
- `audit_log` — entidad, entidad_id, accion, detalle jsonb, usuario, fecha.
  Acciones en uso: crear, validar, clasificar, aprobado, aprobado_parcial,
  rechazado, aprobado_por_correo, adjuntar, carga_masiva,
  descartar_pendiente...

---

## 5. Mapa del código

### Rutas (App Router)

| Ruta | Qué es |
|---|---|
| `/` | redirect según sesión |
| `/login` | login con carrusel de fotos de obra |
| `/registro/[token]` | **form público del proveedor**: lobby full-screen (FondoObra crossfade + Watermark "alfasource"), modal wizard 11 pasos (RegistroForm), sube docs |
| `/satisfaccion/[token]` | encuesta pública del área usuaria |
| `/panel` | dashboard: KPIs, banda de comparativos (elaborados/pendientes/aprobados/rechazados), calificación de evaluaciones (periódicas), próximas re-evaluaciones |
| `/panel/registros` | bandeja de registros: ValidarRegistro (estado enviado) y **ClasificarProveedor** (estado validado) |
| `/panel/seleccion` | clasificados: 3 chips (Críticos/No críticos/Aprobados), buscador, **docsPorRuc** (cadena documental con signed URLs, admin client) → SeleccionTabla |
| `/panel/cuadros` | lista de comparativos: buscador (ticket/código/proveedor) + chips por estado con conteos + SLA |
| `/panel/cuadros/nuevo` | modal wizard NuevoCuadro (4 pasos); acepta `?pendientes=ids` para precargar ítems de la bandeja |
| `/panel/cuadros/[id]` | **cuadro oficial LOGFP0202** (imprimible): tabla completa con históricos y celdas rojas, condiciones+puntajes por criterio, dashboard de decisión, AprobarCuadro, ExpedienteCompra |
| `/panel/pendientes` | bandeja de ítems no aprobados (PendientesTabla) |
| `/panel/proveedores` | padrón por categoría: chips Todas/Críticos/No críticos/Vencidas/Por vencer, paginado, export |
| `/panel/evaluaciones` (+`/nueva`, `/[id]`) | evaluación periódica: EvaluacionForm con matriz vigente, ficha imprimible |
| `/panel/configuracion` | hub: usuarios, matrices (lista+editor modal+imprimible), códigos SIG (ItemsAdmin+import), aprobadores, correos (destinatarios) |

### API routes

- `POST /api/registro` — recibe el form público del proveedor.
- `POST /api/items/import` — import masivo DATA SIG (exceljs, FormData
  'archivo', .xlsx/.csv).
- `GET /api/export?tipo=proveedores|evaluaciones&desde&hasta` — Excel
  membretado (logo Alfaco, periodo, autofiltro).
- `POST /api/satisfaccion` — respuesta de encuesta.

### Componentes clave

- **NuevoCuadro.tsx** (~1000 líneas) — wizard del comparativo: Requerimiento
  (ticket, tipo, área, proyecto, tiempo requerido) → Ítems (CatalogoPicker con
  búsqueda SIG o texto libre) → Cotizaciones (por proveedor: lugar/tiempo/pago/
  garantía + precio y espec. por ítem; precio en rojo si supera histórico) →
  Resumen (puntajes, ganador, justificación, aprobador sugerido por monto).
  Guarda todo el grafo (requerimiento→cuadro→items→cotizaciones→precios) +
  audit.
- **AprobarCuadro.tsx** — resolución del aprobador (§3.2), aprobación parcial
  por ítem.
- **ExpedienteCompra.tsx** — carpeta del comparativo; al subir tipo
  'aprobacion' con cuadro enviado abre el modal de cierre (ganador + obs).
- **ClasificarProveedor.tsx** — clasificación desde Registro con guía
  LOG-GN-A-P02-02.
- **SeleccionTabla.tsx** — tabla + modal de detalle con cadena documental.
- **PendientesTabla.tsx** — bandeja con selección múltiple.
- **MatricesLista / MatrizEditor** — consulta en modal wizard; editar crea
  versión N+1 (nunca muta la vigente); `/[id]` es SOLO la versión imprimible.
- **RegistroForm + FondoObra + Watermark** — experiencia pública de registro.
- **UI kit propio:** `Select` (custom, obligatorio), `Confirmar` (confirmación
  de acciones sensibles, tono brand|peligro), `Stepper`, `Hint` (tooltip
  pedagógico por roles), `ConfigHeader`, `NavItem`, `Paginator`, `Modal`,
  `CargandoAlfa` (loader de marca con tips), `Logo`, `PrintButton`,
  `ExportarPeriodo`.

### `lib/`

- `lib/supabase/client.ts` / `server.ts` — clientes (browser/SSR) apuntando al
  proxy `/sbproxy`.
- `lib/areas.ts` — AREAS y ROLES oficiales.
- `lib/registro-config.ts` — definición de pasos/campos del form público
  (campos con `ancho:"medio"` se emparejan en un row).

---

## 6. Sistema de diseño y reglas UX (obligatorias)

**Brand:** fuentes Space Grotesk (display) / Manrope (sans) / IBM Plex Mono.
Colores: `brand.900 #2743C0`, `alfa.red #E23A5E`, `ink.950 #0B0D13`,
`page #F5F6F9`, `line #E4E7EE`, más escalas ok/warn/danger. Logo = chevrones
con gradiente (Logo.tsx). Clases utilitarias en `globals.css`: `card`, `btn`,
`btn-secondary`, `chip`/`chip-active`, `input`, `th`/`td`, `badge-*`,
`page-head`, `step-enter`, `modal-body`.

Reglas (cada una nació de una corrección explícita del usuario — NO violarlas):

1. **One View:** sin scroll de página en el panel. Tablas con
   `h-[calc(100vh-350px)]` y scroll interno, `thead` sticky. Única excepción:
   vistas imprimibles.
2. **Crear/editar/consultar = modal wizard centrado**: header/footer
   `bg-ink-950`, botones invertidos blancos, Stepper arriba, scroll solo en
   `.modal-body`, `max-w-3xl`, borde `border-line`, animación `step-enter`.
3. `components/Select` custom SIEMPRE; nunca `<select>` nativo. Nunca
   `overflow-hidden` en cards que contengan un Select.
4. Acciones sensibles → `Confirmar` + dirty-check (sin cambios = guardar
   deshabilitado "Sin cambios").
5. Un solo CTA por acción por vista (no duplicar "+ Nuevo X").
6. Iconos lucide-react únicamente; flechas de navegación con ArrowLeft/Right,
   no caracteres.
7. Vistas de configuración con `ConfigHeader` (breadcrumb + back cuadrado junto
   al título + Hint).
8. `Hint` pedagógico con `roles` en cada vista principal (explica el
   procedimiento al usuario).
9. Dropdowns cerca del borde inferior abren hacia arriba (UserMenu:
   `bottom-full`).
10. Filtros = chips con conteos + buscador `<form>` GET (patrón de Selección y
    Comparativos).

---

## 7. Estado actual y qué sigue

**En producción (20-jul-2026):** todo el flujo del §3.2 funciona end-to-end,
con los filtros de Comparativos recién desplegados. Fran va a probar con casos
reales y cargará la matriz de ítems con precios reales vía import.

**Esperando insumos de Fran:** Excel de ítems con precios · lista/correos de
aprobadores (ella los carga en Configuración) · matriz de permisos por rol ·
tiempos de re-evaluación por clasificación · membrete/acta oficial con
requisitos de Auditoría · estructura de categorías/subcategorías (NO
implementar subcategorías antes de tener su listado).

**Backlog propio (por prioridad):**
1. Leer a fondo `LOG-GN-P-02 Adq. de Bienes y Servicios VD.docx` (está en los
   uploads de la sesión de cowork) y alinear el flujo a lo que falte del
   procedimiento (plazos rutinario 5-15 días hábiles, ingreso antes 14:00,
   emergencia 1-5 días, >S/50,000 aprueba Dirección de Logística, estados de OC).
2. Catálogo de tiempos de re-evaluación configurables por clasificación.
3. Adjuntar PDF real de cotización (hoy `archivo_url='pendiente-adjuntar'`).
4. Descarga directa de PDF de actas (hoy: imprimir del navegador).
5. Importación masiva de proveedores (después de subcategorías).
6. Dominio propio + agregar cuenta personal de Hernany (achernany) como
   colaborador del repo.

**NO hacer:** motor de correos (decisión explícita) · subcategorías sin el
listado de Fran · rankings de proveedores · tocar la matriz de puntajes
aprobada.

## 8. Gotchas conocidos

- Login caído en red corporativa → probar `/sbproxy/auth/v1/health`.
- Renombrar el proyecto en Vercel NO migra el dominio `.vercel.app`.
- El SQL Editor de Supabase tarda en cargar monaco: esperar 10-15s y reintentar.
- `git init`/operaciones git desde el sandbox del agente fallan en la carpeta
  montada: git real siempre en la Mac del usuario.
- Tipos explícitos en los callbacks de cookies de `@supabase/ssr` (target
  es2017).
- Los comparativos creados antes del 19-jul no tienen `cotizaciones.puntajes`
  (desglose): el detalle muestra "—" con nota al pie. Es esperado.
- El formato DATA SIG trae códigos repetidos por compra histórica: el import
  SIEMPRE toma la última fila.
