# CHECKPOINT — AlfaSource (actualizado 2026-07-11, tarde)

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
- NOTA: la propuesta de web NO gustó — descartar contexto/opiniones previas de la web;
  se retoma desde cero el 14.
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
