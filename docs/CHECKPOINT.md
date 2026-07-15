# CHECKPOINT — AlfaSource (actualizado 2026-07-14: FASE 2 CONSTRUIDA)

## ⚡ FASE 2.1 — UI shell (14-jul, tras feedback con screenshots)
- **SIDEBAR estilo Material** reemplaza al top navbar: `app/panel/layout.tsx` +
  `components/NavItem.tsx` (cliente, usePathname para activo, indicador de
  gradiente, badge de registros en "Registro"). Sidebar bg-ink-950 w-232px:
  logo, sección "Flujo de compra" (6 items con lucide), abajo Configuración +
  UserMenu. Shell: flex h-screen overflow-hidden; contenido = div flex-1
  overflow-y-auto (scroll SOLO en contenido). Bell eliminada (badge en nav).
  BottomNav móvil se mantiene.
- **REGLA UI "todo lisito"**: contenedores/tablas de listas con ALTO FIJO
  h-[calc(100vh-350px)] aunque estén vacíos — sin saltos entre vistas
  (Proveedores, Evaluaciones, Selección, Cuadros con thead sticky).
- `.page-head` sticky -top-6 (ya no hay navbar de 56px).
- UsuariosAdmin: quitado overflow-hidden que DECAPITABA el dropdown de rol
  (regla: nunca overflow-hidden en cards que contengan Select).
- **HALLAZGO de la imagen "ROL/RESPONSABILIDAD" de Fran (pendiente de construir
  con la matriz de permisos)**: cadena de validación de EVALUACIONES:
  Comprador (evaluación inicial + evidencias) → Área usuaria (encuesta) →
  Analista de compras (valida metodología/documentación) → Coordinador de
  compras (aprueba evaluación definitiva y clasificación). Hoy la evaluación se
  guarda directa; falta estado borrador→validada→aprobada. Diseñar con permisos.

## ⚡ FASE 2 — ejecutada el 14-jul (todo compilado; SQL db/fase2.sql YA CORRIDO en Supabase)
- **Flujo nuevo completo**: nav = Dashboard · Registro · Selección · Comparativos ·
  Proveedores · Evaluaciones. Estados de proveedores ampliados (registrado →
  seleccionado → aprobado; históricos evaluados migrados a 'aprobado').
- **/panel/seleccion** (nuevo): chips Por seleccionar/Seleccionados/Aprobados;
  modal one-view por proveedor (categoría→define bien/servicio, suministro,
  Regular/Crítico) → estado 'seleccionado'. `components/SeleccionTabla.tsx`.
- **Validar registro** ahora crea el proveedor (estado 'registrado') con datos del
  form → aparece en Selección. `ValidarRegistro` recibe prop `datos`.
- **Nueva evaluación**: solo proveedores estado='aprobado' (evaluación periódica).
- **Elegibles en comparativos**: confiables por evaluación O seleccionados/aprobados
  sin evaluar (medianamente/no confiable fuera). En cuadros/nuevo/page.tsx.
- **Catálogo SIG**: tabla `items` + /panel/configuracion/items (`ItemsAdmin`: alta,
  búsqueda, activar/desactivar, CARGA MASIVA CSV con upsert por codigo). En
  NuevoCuadro: `CatalogoPicker` (busca por código/descr., chip del código, texto
  libre si el catálogo está vacío) → guarda item_id/codigo_sig/precio_historico.
- **Alerta de precio histórico**: si un ítem del ganador supera ultimo_costo →
  aviso rojo en Resumen + cuadros.alerta_precio + aprobación sugerida escala al
  máximo aprobador.
- **Aprobadores**: tabla `aprobadores` + /panel/configuracion/aprobadores
  (área de lib/areas.ts AREAS, cargo, monto_max; null=máximo aprobador). Selector
  en Resumen del comparativo con sugerencia automática por monto/alerta →
  cuadros.aprobador_id. (El CORREO real espera Resend.)
- **Aprobar comparativo** → ganador pasa a proveedores.estado='aprobado'
  (AprobarCuadro prop ganadorId).
- **Expediente de la compra**: tabla `cuadro_documentos` + bucket privado
  `compras-docs` + `ExpedienteCompra` en el detalle del cuadro: adjuntar Ticket /
  Cotizaciones / OC / Otros (subida directa del cliente con policies auth),
  abrir con URL firmada 1h, badge "Ciclo cerrado con OC".
- **Usuarios y roles**: /panel/configuracion/usuarios (`UsuariosAdmin`) — rol por
  Select (ROLES en lib/areas.ts: admin/director/coordinador/analista/comprador/
  auditor; constraint SQL ampliado). Permisos granulares por módulo = esperan
  matriz de Fran.
- **Exports membretados**: /api/export ahora genera **XLSX real (exceljs, nueva
  dependencia)** con logo public/logo-alfaco.png, cabecera Alfa Co, periodo
  (params desde/hasta filtran evaluaciones.fecha), zebra, autofiltro.
  `ExportarPeriodo.tsx` = botón con popover de fechas en ambas listas.
- **Dashboard v2 (parcial)**: banda "Cuadros comparativos" (elaborados/pendientes/
  aprobados/rechazados → /panel/cuadros) + chips de filtro por categoría (?cat=)
  que filtran clasificación y promedios. (Estética "menos pálida" general: aún
  mejorable.)
- **Instructivo presentación**: instructivo-alfasource.html en carpeta de marca
  (flujo, 8 bondades, seguridad de datos) — imprimible para la directora.
- PENDIENTE SOLO DE INSUMOS: pesos matriz + matriz críticos (lunes Fran, carga por
  panel), subcategorías (Fran), CSV códigos SIG real (Fran), matriz de permisos
  por módulo (Fran), Resend (Hernany) → correos aprobador/digest/encuestas,
  membrete PDF actas con estructura final del acta (Fran/Auditoría).

# (histórico anterior ↓)

> **Regla de mantenimiento:** este archivo se actualiza al cierre de cada tanda
> significativa de cambios, ANTES de cerrar la sesión o cambiar de ventana.

> **Para Claude en una sesión nueva:** lee este archivo completo antes de tocar nada.
> Es la fuente de verdad del estado del proyecto. El dueño es Hernany (hernanyacosta@gmail.com);
> la stakeholder del cliente es Francys "Fran" Nava, jefa de logística de Alfa Co S.A.C. (Perú).

---

## 1. Qué es esto

**AlfaSource**: SaaS de evaluación y selección de proveedores con trazabilidad auditable
(ISO 9001/37001). Alfaco es el cliente #1; la plataforma es de Hernany + Francys y se piensa
comercializar a otras empresas (multi-tenant desde el día 1, datos exportables).
Entregable comprometido: 15 de julio. Demo ya realizada; estamos en ciclo de feedback.

Flujo del negocio: registro de proveedor (form público de debida diligencia, 88 preguntas)
→ evaluación con matriz de puntuación (Confiable ≥71 / Medianamente 31–70 / No confiable ≤30;
re-evaluación 6/3/1 meses) → cuadros comparativos (mín. 3 cotizaciones si rutinario, exento
emergencia, solo proveedores confiables) → aprobación → auditoría total.

## 2. Stack e infraestructura

- **Next.js 14.2.21** App Router + TypeScript + Tailwind (tokens custom) — repo:
  `https://github.com/scorecardproveedores-erp/procurement-scorecard-providers-erp.git` (branch main)
- **Vercel** (Hobby, cuenta scorecardproveedores@gmail.com). Prod:
  `https://procurement-scorecard-providers-erp.vercel.app`
  ⚠️ Hobby bloquea commits de autores externos → el `git config user.email` local DEBE ser
  `scorecardproveedores@gmail.com` (ya configurado).
- **Supabase** proyecto `udrlswivsjywttktevci` (São Paulo): Postgres + RLS + Auth + Storage.
- **Anti-firewall corporativo**: rewrite `/sbproxy/:path*` → supabase.co en `next.config.mjs`;
  el cliente browser usa `${window.location.origin}/sbproxy`. Cookie compartida
  `sb-alfasource-auth` en client/server/middleware (NO cambiar el nombre: rompe sesiones).
- **Multi-tenant**: todas las tablas tienen `empresa_id`; función SQL `mi_empresa()` + policies RLS.
  Empresa Alfaco id: `a6f1d8c3-6194-5804-ac16-a98cc205559d` (uuid5, namespace c0ffee00-…).
- **service_role key**: SOLO en variables de entorno de Vercel (`SUPABASE_SERVICE_ROLE_KEY`).
  Usada server-side en: `/api/registro`, `/api/satisfaccion`, página `/panel/registros`,
  página pública `/satisfaccion/[token]`.

### 🔒 Reglas de seguridad acordadas (NO romper)
- Jamás pedir ni pegar en el chat: contraseña de la BD, service_role key, PATs de GitHub.
- Los `git push` los ejecuta Hernany en su Terminal de Mac (con su PAT). Claude solo entrega
  el bloque de comandos. La carpeta del repo montada ES el repo real de su Mac.
- La anon key es pública, sin problema.

### Cómo trabaja Claude en este proyecto
- Código en la carpeta montada `outputs/scorecard-proveedores` (sandbox:
  `/sessions/<session>/mnt/outputs/scorecard-proveedores`).
- Verificación: `npx tsc --noEmit` con patrón nohup+sleep (el `next build` muere en sandbox;
  Vercel hace el build real).
- SQL en Supabase: vía extensión Claude-in-Chrome, SQL Editor, monaco
  `window.monaco.editor.getEditors()[0].setValue(sql)` + Cmd+Enter. Si hay varios browsers,
  preguntar cuál con AskUserQuestion.
- Estilo del usuario: "dale y ejecuta". Triaje del feedback de Fran → ejecutar lo ejecutable
  ya, listar qué espera insumos. Responder en español, directo.

## 3. Brand (AlfaSource)

Kit en carpeta montada "Brand Alfaco Procurement" (tokens.json, contract.md, assets svg).
- Fuentes: Space Grotesk (display) / Manrope (sans) / IBM Plex Mono — via next/font.
- Colores: brand.900 #2743C0, brand.700 #1F37A6, brand.100 #E9EDFA, alfa.red #E23A5E,
  ink.950 #0B0D13, page #F5F6F9, line #E4E7EE, ok #1F9D63, warn #E0921F, danger #DC3546.
- Isotipo: chevrones dobles (componente `Logo.tsx`: AlfaMark / AlfaLockup con endoso
  "MÓDULO DE ALFACO").
- Patrones UI ya validados con el usuario: modales one-view (header/footer fijos bg-ink-950
  con botones invertidos blancos, scroll solo en `.modal-body`), Select custom (nada de
  <select> nativo), scrollbars finos brand, tablas compactas 12px con thead sticky y
  paginador fijo (no debe saltar el layout), wizard con `Stepper.tsx`.

## 4. Base de datos (24 tablas, todo ejecutado)

Núcleo: empresas, usuarios, proveedores (+clasificacion regular|critico), categorias,
proveedor_categorias (relación evaluable: calificacion_actual, nota_actual,
proxima_evaluacion), matrices (version, estado borrador|vigente|archivada, clasificacion,
umbrales y meses de re-eval) → criterios → criterio_opciones; matriz_documentos
(eliminatorios); evaluaciones (+respuestas +documentos, codigo `DD.MM.YY-S|E-RUC`);
proveedor_registros (+documentos, bucket `registro-docs`); requerimientos, cuadros
(+items +cotizaciones +precios), niveles_aprobacion, aprobaciones;
satisfaccion_respuestas (token_acceso, puntaje, respondido_en);
notificacion_destinatarios (tipos text[]); audit_log.

Archivos: `db/schema.sql`, `db/seed.sql`, `db/import.sql` (339 registros históricos de Fran,
14 duplicados sufijados, categorías normalizadas), `db/policies.sql`, `db/settings.sql`.
**Todo ya está ejecutado en Supabase** incluida la policy `w_satisfaccion` y la migración
de settings (clasificacion, notificacion_destinatarios, policies de escritura de matrices).

Matrices seed vigentes: seleccion `72c161f8-…`, evaluacion `61ff7e7e-…` (históricas 808210af,
5779e150). Comparativos: PESOS {precio:30, lugar:15, tiempo:15, pago:20, garantia:10,
feedback:10}; feedback automático por calificación (10/5/0); precio/tiempo proporcional al mínimo.

## 5. Qué está hecho y en producción (todo verificado)

1. Form público de registro de proveedores (88 preguntas, 11 secciones, subida de DJ + sustentos).
2. Panel: dashboard (KPIs clickeables, radial % vigentes, barras 6 meses, promedio por categoría,
   leyenda con tooltips), Proveedores (chips-filtro, buscador, detalle modal con historial),
   Evaluaciones (buscador de trazabilidad), ficha/acta imprimible con firma digital del sistema
   (sello `ID8·ISO timestamp`), Comparativos (wizard 4 pasos, ganador, aprobar/rechazar).
3. Login split con carrusel de marca (imágenes alfaco.com.pe), proxy anti-firewall (Fran ya
   entra desde la red corporativa), logout, timeout con mensajes de error específicos.
4. Feedback Fran batch 1: campos obligatorios; campana de nuevos registros; vista Registros
   con documentos firmados por URL (1h) y botón Validar; export CSV (BOM+`;`) en Proveedores
   y Evaluaciones; encuesta pública del área usuaria (`/satisfaccion/[token]`, PUNTAJES
   excelente 10 / bueno 7 / regular 4 / malo 0) generada desde la ficha, feedback visible
   dentro del acta.
5. Feedback Fran batch 2 (consolidación): **Panel de Administración** en `/panel/configuracion`
   (engranaje en header): matrices administrables con **versionado** (editar → crea vN+1
   vigente, archiva la anterior, audit_log; aviso si pesos ≠ 100), vista/PDF de la matriz
   vigente para auditorías, CRUD de destinatarios de notificaciones por tipo, placeholder de
   documentos corporativos. **Clasificación Regular/Crítico** en nueva evaluación (se persiste
   en el proveedor; auto-selección de matriz por clasificación con fallback a regular + aviso).

### Gobernanza del repo (2026-07-11 tarde)
- README.md corporativo (arquitectura, setup, convención de migraciones, env vars).
- CONTRIBUTING.md con convenciones (commits, SQL inmutable, seguridad, patrones UI).
- Favicon: `app/icon.svg` (chevrones AlfaSource sobre ink, gradiente de marca).
- Código auditado: sin TODOs, console.logs ni notas informales.

### Estados de carga y error (2026-07-11 tarde)
- `components/CargandoAlfa.tsx`: loader de marca — chevrones con animación de avance +
  text-loop de tips del proceso (rotan cada 2.8s, estilo motion-primitives/text-loop).
- `app/loading.tsx` (público, pantalla completa) y `app/panel/loading.tsx` (dentro del panel).
- `app/panel/error.tsx`: error boundary con card de marca (conexión BD), botón Reintentar
  (reset) + digest de referencia. `app/global-error.tsx`: fallback total con estilos inline.
- `app/not-found.tsx`: 404 de marca.
- CSS: keyframes `chevAvance` y `tipLoop` al final de globals.css.

### Rediseño del form de registro — v2 "lobby" (2026-07-11 noche, DEFINITIVO)
- REGLA CORE DEL PROYECTO (dictada por el usuario tras romperse el split con scroll):
  **nunca scroll de página; siempre modal centrado one-view con scroll interno**.
- `app/registro/[token]/page.tsx`: "Lobby" = `components/FondoObra.tsx` (fotos reales de
  obra full-screen con crossfade 7s + Ken Burns + anim-gradient 60% + velo ink/45) y
  encima modal glass centrado: bg-white/75 + backdrop-blur-2xl + borde white/30
  (el 25% pedido se subió a 75% por legibilidad de 88 preguntas). Header bg-ink-950/90
  con chevrones ANIMADOS (chev-anim-1/2, gradiente claro) + título; estados
  inválido/enviado dentro del mismo modal.
- RegistroForm ahora es fragmento one-view: progress fijo (px-6 pt-4), `.modal-body`
  flex-1 con scroll interno (scrollTo al cambiar de sección), footer bg-ink-950/90 con
  botones invertidos + microcopy "Tu avance se conserva al retroceder". Grupos internos
  sobre glass: bg-white/55 y bg-white/70. CSS: keyframes `kenburns`.
- La v1 (split tipo login con scroll de página) quedó descartada.
- Ajustes v3 (feedback en vivo): modal BLANCO SÓLIDO (sin glass/blur — se veía sucio sobre
  fotos), título de sección FIJO fuera del scroll (solo scrollean los inputs), watermark
  gigante "alfasource" text-[16vw] white/15 detrás del modal (referencia spaciaz), campos
  con `ancho: "medio"` en registro-config (razón social + RUC en un row; distrito +
  provincia en otro; grid sm:grid-cols-2 en el renderer, grupos col-span-2), helper text
  a text-ink-600.
- NOTA: la propuesta v2 (motion/vex) NO gustó. La v3 (estilo "spaciaz": hero foto full +
  titular Baloo 2 + botón circular + watermark gigante + footer tarjeta blanca, logo α
  monocolor pequeño, solo home, registro conectado en navbar/sección/footer) SÍ gustó y
  está desplegada como estático en `public/web-alfaco/` del repo del producto → URL:
  https://procurement-scorecard-providers-erp.vercel.app/web-alfaco (rewrite en
  next.config.mjs). Es temporal: migrar a proyecto Vercel propio cuando se venda.
- Watermark del registro: mitad visible (bottom-0 translate-y-[46%], main overflow-hidden)
  con shimmer suave `.wm-shine` (gradient clip-text animado 8s, keyframes wmShine).
- Registro v7 (homologación exacta con el modal de comparativos): contenedor idéntico —
  max-w-3xl, `border border-line` (la línea outline), header px-5 py-3, body p-5, footer
  px-5 py-2.5, step-enter. `components/Watermark.tsx` nuevo: "alfasource" de punta a punta
  (scaleX medido con JS al ancho de ventana, resize-aware). FondoObra sin salto: el zoom
  ya no usa keyframes sino transition (opacity 2.2s / transform 9s; saliente scale 1.18,
  activa 1.06) — la deriva continúa durante el fade. Sección "condiciones": contenido
  anclado abajo (grid h-full content-end).
- Registro v6 (cierre de sesión): modal con ALTURA FIJA `h-full max-h-[780px]` (como el
  modal de Nuevo cuadro comparativo — sin saltos de tamaño entre secciones); clase
  `.modal-lobby` en el box con CSS scoped que refuerza outlines de inputs/selects
  (#c9cfdf, focus brand); fotos de fondo con blur-[7px] + scale-110 (kenburns ajustado
  1.16→1.06) — el watermark queda nítido por ser capa aparte.
- LA WEB: al usuario NO le gustó ninguna versión ("la sigues haciendo fea"). OLVIDAR todo
  el contexto/enfoque de la web; se retoma desde cero el 14 con otra dirección. No pasar
  el link de /web-alfaco.
- Registro v4: selects nativos del form reemplazados por components/Select (custom);
  ~36 campos emparejados con `ancho: "medio"` (cuenta+CCI soles y dólares, tipo+número de
  doc, contactos nombre+celular, referencias contacto+correo, rep. legal, conflictos,
  vinculadas, etc.); los items de grupos repetibles también renderizan en grid 2 cols.
- RegistroForm chrome: progress bar bg-alfa-gradient + chip "Sección X de 11", título de
  sección en font-display, radios → pills de marca, file input → dropzone punteada con
  UploadCloud + chips verdes por archivo, botonera con flechas y scroll-to-top al navegar.
- CSS: accent-color #2743c0 para radios/checkboxes nativos (grids del form).
- La lógica de validación/envío NO se tocó.

### Propuesta web v2 (2026-07-11 noche)
- `propuesta-web-alfaco.html` (carpeta de marca) rehecha estilo "motion": hero full-screen
  con Ken Burns crossfade de 3 fotos reales de obra, navbar liquid-glass, título animado
  letra por letra, fades escalonados (800/1200/1400ms), tag glass "Energía. Infraestructura.
  Minería.", marquee de líneas, banda Portal de Proveedores con 4 pasos y CTA → form demo
  (registro/demo-proveedor-001), footer legal. Es solo la HOME como pieza de venta;
  la web completa (7 subpáginas + legal + EN) queda para el 14. En producción el hero
  llevaría video de obra real.
- Sitemap real relevado de alfaco.com.pe: Inicio · Líneas de Negocio (7 subpáginas) ·
  Experiencia · Nuestro Trabajo · Conócenos · Contacto; top bar Trabaja con Nosotros /
  Intranet (Google Sites) / Mesa de Partes (helpdesk avanapps) / Línea Ética; footer con
  privacidad, términos, libro de reclamaciones, certificaciones; versión EN en
  en.alfaco.com.pe. Empresa: 20+ años, Colombia/Perú/Panamá/Costa Rica.
- Visión de paquete acordada: web moderna + portal de proveedores (autoservicio → módulo
  de evaluación) + mesa de partes digital + línea ética; intranet y helpdesk como links.
  Autoservicio = ruta pública sin token con Turnstile (plan B si no compran la web:
  se queda como link / subdominio proveedores.alfaco.com.pe con un CNAME).

### Feedback de Fran 11-jul (audio) — estado
- Matriz ajustada + matriz de Críticos: la directora aprueba el LUNES 13 → Fran manda
  Excel/ponderaciones → cargarlas ese día (por editor del panel o por mí).
- Subcategorías: Fran las trabaja, llegan lunes 13.
- Logo Alfaco: ✅ recibido y copiado a `public/logo-alfaco.png` (PNG 1200x630 RGBA).
  Ya viaja en git/Vercel — NO depende de la carpeta local del usuario. Usarlo el 14
  para membrete de PDFs (actas, matrices, reportes). Es horizontal con isotipo α
  azul/rojo + wordmark gris; para membretes pedir/derivar versión de mayor
  resolución o vectorial si se necesita imprimir grande.
- REGLA nueva (pedida por el usuario): NINGÚN asset del producto debe consumirse
  desde su carpeta local. Todo asset vivo va en `public/` del repo (o en Supabase
  Storage cuando sea por-tenant, p. ej. logos de clientes white-label — diseñar
  eso el 14). Las fotos del fondo del registro hoy se hotlinkean de alfaco.com.pe:
  migrarlas también a public/ el 14.
- Directora pidió ver "estructura del comparativo" para el 15 → YA ESTÁ FUNCIONAL
  completo (solo confiables, mín 3 cotizaciones, scoring, aprobación); solo falta
  adjuntar PDF de cotización (14).
- Directora vio la propuesta de web con buenos ojos → dispuesta a que la empresa
  la pague. Negocio confirmado; web desde cero el 14.
- Fran hace pruebas la tarde del 11 → llegará lista de observaciones.

### Pulido UI Configuración (hecho 11-jul noche, pendiente push)
- Back-links "← Configuración" ya no son botones raros: links de texto estándar
  (patrón de la ficha de evaluación). MatrizEditor: "← Volver a la matriz (sin
  guardar)" para que no compita con el botón Cancelar del pie.
- Tabla de matrices: columna "Ver" duplicada eliminada (el nombre ya es link).
- PENDIENTE 14 (observación del usuario): revisar iconografía de botones en
  Configuración (flechas/estilos que no se entienden) y homologar la tabla de
  matrices y la de destinatarios al 100% con el patrón de tablas del resto
  (sticky thead, paginador si crece, row-click).

### HALLAZGO CLAVE: Excel "EvaluacióndeProveedoresConfiable Enero.xls" (11-jul)
Fran lo mandó diciendo "ahí está el acta membretada". Está en uploads de la sesión
original Y el análisis completo aquí (el archivo NO viaja en el repo — pedirlo de
nuevo si hace falta). Hojas: LOG-F-P03-01, Control de Cambios, BD_EVALUACION,
T.D EVALUADOS, TD, EVAL. BIENES, EVAL. SERVICIOS, S. MAQUINARIAS, S. GENERALES,
BIENES, S. TRANSPORTES, S. SALUD, DATOS, Requisitos Vehículos.

1) **Acta membretada oficial (LOG-F-P03-01)** — estructura exacta a replicar el 14:
   logo Alfaco arriba-izq · título "EVALUACIÓN DE PROVEEDORES DE {TIPO}" · caja
   derecha CODIGO/VERSION/FECHA APROBACION (21/03/2024 v1) · fila Codigo
   (DD.MM.AA-E|S-RUC, coincide con nuestro formato) · grid TIPO DE SERVICIO/RAZÓN
   SOCIAL/DIRECCIÓN/SUMINISTRO vs FECHA/RUC/DISTRITO/PROYECTO · tabla RESULTADO DE
   SELECCIÓN con semáforo (Confiables/Medianamente/No confiable + leyenda 71-100 /
   31-70 / 0-30) y Puntaje grande con check verde · OBSERVACIONES · criterios con
   niveles marcados (radio) + PTS. POSIBLES + PUNTAJE por criterio · pie:
   ANALISTA (nombre) / Cargo: Evaluador / Firma. Además botones de macro
   "Exportar PDF" y "Registrar Evaluacion" (nuestro sistema los reemplaza).

2) **CONFIRMADO: matrices por TIPO DE SERVICIO** (esto es lo que Fran llama
   "subcategorías"/ajustes): cada hoja tiene criterios DISTINTOS:
   - EVAL. BIENES (evaluación): Precios · Calidad de bienes adquiridos ·
     Cumplimiento cantidad y entrega · Forma de pago · Entrega de documentación ·
     Posventa/Garantías (6 criterios).
   - EVAL. SERVICIOS (evaluación): Precios · Cumplimiento en calidad y entrega
     (4 niveles E/B/R/M) · Forma de pago · Entrega de documentación ·
     Posventa/Garantías · "OTRAS ESPECIFICACIONES" con 3 sub-checks C/NC
     (logística, personal técnico, servicio según lo pactado).
   - S. MAQUINARIAS (selección): Precios · Calidad certificada ISO · Forma de
     pago (4 niveles: 30d/15d/7d/<7d) · Garantías + docs legalidad (4 ítems C/NC
     con Observación) + DOCS ADICIONALES agrupados (Personal: DNI/SCTR/brevete,
     examen médico, cursos operador/manejo defensivo/vigía; Maquinaria: cert.
     operatividad, opacidad-minería, ficha técnica, plan de mantenimiento,
     evidencia último mant.) con C/NC/**NA**/Observación.
   - S. GENERALES (selección): Precios · Calidad certificada · Forma de pago ·
     Garantías + docs legalidad + adicionales por Vehículos (tarjeta/SOAT/rev.
     técnica, póliza RC) y Personal.
   - Hay hojas extra: S. TRANSPORTES, S. SALUD, Requisitos Vehículos.
   IMPLICACIONES para el 14: (a) el esquema YA soporta matriz por categoría
   (matrices.categoria_id nullable) — activar ese vínculo; (b) matriz_documentos
   necesita extensión: opción **NA** además de C/NC, campo observación por ítem,
   y agrupación (Personal/Vehículos/Maquinaria); (c) EVAL. SERVICIOS trae
   sub-checks C/NC dentro de un criterio (modelar como criterio con opciones o
   como documentos no eliminatorios); (d) los pesos que mande Fran el lunes
   vendrán probablemente separados por tipo de servicio.

### MEGA-FEEDBACK Fran 11/14-jul (voices + WhatsApp) — DEFINE LA FASE 2
Hecho ya (11-jul): back-links con lucide ArrowLeft en Configuración; encuesta exige
nombre+área; verificado que el comparativo YA impide repetir proveedor (filtro
`disponibles`).

**A. REDISEÑO DEL FLUJO (voice del 14 — el cambio más importante):**
La evaluación con matriz NO ocurre antes de comprar (no hay con qué evaluar).
Flujo correcto: 1) REGISTRO (panel que muestra todo lo que llega del form, sin
evaluación) → 2) SELECCIÓN (panel donde el comprador CATEGORIZA: bien/servicio +
categoría(s) + regular/crítico — sin puntaje) → 3) COMPARATIVO (jala proveedores
por categoría; correo al aprobador; al aprobarse → estado "proveedor aprobado")
→ 4) EVALUACIÓN PERIÓDICA solo de aprobados, con matriz, según meses del
procedimiento. "Medianamente confiable" y esos criterios SALEN del flujo de
selección (quedan solo en evaluación periódica). Nav esperada: Registro ·
Selección · Comparativos · Evaluaciones. La clasificación regular/crítico se
asigna en Selección (ya existe el campo).

**B. Catálogo de ítems (CÓDIGOS SIG) — ella ya prepara la data limpia del ERP:**
- Tabla items/catálogo: codigo_sig (llave única) + descripción + tipo
  (producto/servicio) + unidad + ultimo_costo (viene del ERP).
- Carga masiva inicial (CSV del ERP) + pantalla "Administrador de códigos SIG"
  en Configuración (ref. visual: screenshot "Administrar Productos y Servicios").
- En el comparativo, el ítem se SELECCIONA por código/descripción (no texto libre).
- **Alerta de precio histórico**: si el precio cotizado > ultimo_costo → alerta
  roja en el resumen y la aprobación escala al máximo aprobador (política:
  prohibido comprar sobre el histórico sin esa aprobación).

**C. Comparativo/aprobación:**
- Correo al aprobador con RESUMEN primero + link a la carpeta/detalle.
- "Administrador de aprobadores" en Configuración: aprobador varía por ÁREA y
  MONTO (área + cargo + correo). Al enviar el comparativo el sistema ya sabe a
  quién. (Lista de áreas de Fran recibida: Gestión de Calidad, Operaciones,
  Logística, Administración, Ingeniería, Relaciones Comunitarias, Redes
  Internas, Redes Externas, Nuevos Negocios, HSE, Gestión Humana, Finanzas,
  Contabilidad, Facturación, Auditoría y Control de Calidad — para selección
  simple en formularios.)
- **Carpeta repositorio por comparativo (ciclo completo de la compra)**: docs de
  registro/debida diligencia + ficha de registro en PDF + ticket de
  requerimiento (adjunto pdf/excel) + comparativo + cotizaciones PDF + Orden de
  Compra en PDF para CERRAR el ciclo. Ticket y OC vienen de fuera (ERP): el
  comprador los adjunta a la carpeta.

**D. Permisos y roles (punto 9/10):**
- Panel de permisos en Configuración. Roles: Director de área · Coordinador
  General · Analista de compras · Comprador · Auditor (solo lectura+descarga).
  Ej.: editar matrices SOLO directora+Fran. Fran organizará permisos por módulo
  después de revisar todo (ref. visual: screenshot "Administrar Usuarios").
- Requiere RLS por rol (hoy solo hay aislamiento por empresa) — diseñar con calma.

**E. Encuesta→evaluación:** Fran pregunta cómo se enlaza el puntaje de la
encuesta con la evaluación y cómo lo ve el comprador → conectar cuando mande la
matriz (criterio que reemplaza) y mostrarlo en la UI de evaluación, no solo acta.

**F. Exports:** Excel membretados (logo) + selector de PERIODO al exportar.

**G. Dashboard v2 (además de "pálido"):** filtro por categoría; evaluaciones por
categoría; KPIs de comparativos: creados, enviados, pendientes de aprobar,
aprobados.

**H. Para la presentación del 15 (Fran pide):** instructivo con las bondades de
la web + apartado de SEGURIDAD DE DATOS (con qué base se trabaja, dónde se
almacena, cifrado, respaldos). Respuesta técnica: Supabase/PostgreSQL cifrado en
reposo y tránsito (TLS), aislamiento por empresa vía RLS a nivel de base de
datos, storage privado con URLs firmadas temporales, auditoría completa en
audit_log, backups automáticos diarios, infra en AWS São Paulo.
- "Documento aleatorio" que Fran no entiende = probablemente la FIRMA DIGITAL
  del sistema en el acta (código único + timestamp): explicado en mensaje.

**I. Manuales de usuario (fase siguiente):** sección "Soporte" en Configuración
con manuales por módulo + FAQ (Fran mandó screenshots de cómo lo hizo en su
sistema anterior AlfaFleet — cards por módulo, tabs por tema, paso a paso).
Nota: Fran ya tiene experiencia armando esto; ella aporta contenido.

### Agenda 14 de julio (cuando se renueven los límites de Fable 5)
- Diseñar/iterar la nueva web de Alfaco a partir de `propuesta-web-alfaco.html`.
- Dashboard v2: hoy se ve "pálido/seco/poco interactivo" (palabras del usuario) —
  darle vida e interactividad; es la puerta de entrada aunque no el core.

### Propuesta web Alfaco (nuevo frente)
- Existe `propuesta-web-alfaco.html` en la carpeta de marca (fuera del repo): mockup
  one-page de la nueva alfaco.com.pe con Portal de Proveedores integrado (registro
  AlfaSource como CTA principal). Es material de venta del "paquete completo".
- Decisión pendiente del usuario: proveedores con cuenta propia vs. comunicación por
  correo + links por token. Recomendación registrada: v1 sin cuentas (correo + tokens,
  consistente con lo pedido por Fran); portal con login de proveedor como fase 2
  comercial (`proveedores.alfaco.com.pe`).
- La web actual (alfaco.com.pe, WordPress 2023, RedByte) tiene: 7 líneas de negocio,
  certificaciones ISO (calidad, ambiental, SST), sedes Ate e Ica, RUC 20601832390,
  top-bar con Intranet / Mesa de Partes / Línea Ética / Trabaja con Nosotros.

## 6. Pendientes — EN STAND BY (usuario quiere ir cerrando; no arrancar sin que lo pida)

**Esperan insumos de Fran:**
- Ajustes finales de matriz (puede cargarlos ella desde Configuración, o los pasa).
- Criterios de la matriz para proveedores Críticos.
- Estructura de categorías y subcategorías (impacta modelo de datos: definir niveles,
  matrices por subcategoría, multipertenencia — NO implementar antes de tener el listado).
- Ajustes al acta + requisitos de Auditoría.
- Logo / hoja membretada oficial de Alfaco (identidad de todos los PDFs; ella pidió NO inventar formato).

**Esperan acción de Hernany:**
- Cuenta gratis en resend.com (correo del proyecto). La API key va a Vercel env vars, nunca al chat.

**Solo priorización nuestra:**
- Motor de correos (al tener Resend): aviso de nuevo registro, digest diario vencidas/por
  vencer vía Vercel cron, envío de encuestas; usa notificacion_destinatarios.
- Encuesta integrada al puntaje final + cierre de evaluación (espera definición de matriz:
  qué criterio reemplaza y con qué peso).
- Importación masiva por Excel (hacerla DESPUÉS de subcategorías para no rehacer plantillas).
- Descarga directa de PDF de actas (hoy: Imprimir/Guardar PDF del navegador).
- Adjuntar PDF de cotización en comparativos (archivo_url hoy 'pendiente-adjuntar').
- Dominio propio (después de la presentación). Agregar cuenta personal de Hernany (achernany)
  como colaborador del repo para que registre actividad.

## 7. Gotchas conocidos

- Si el login se cae en redes corporativas → verificar `/sbproxy/auth/v1/health`.
- Renombrar el proyecto en Vercel NO migra el dominio .vercel.app: agregar a mano en Domains.
- El dashboard de Supabase a veces carga lento/en blanco: esperar y reintentar monaco.
- `git init`/unlink fallan dentro de la carpeta montada desde el sandbox: operaciones git
  reales siempre en la Mac del usuario.
- tsconfig target es2017 (FormData iteration); tipos explícitos en callbacks de cookies @supabase/ssr.
- No proponer rankings "top proveedores" en dashboard (sesgo; decisión tomada: promedio por
  categoría + radial de cumplimiento).
