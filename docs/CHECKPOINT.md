# CHECKPOINT — AlfaSource (actualizado 2026-07-19: FASE 2.6 CUADRO OFICIAL + APROBACIÓN PARCIAL)

## 🧾 FASE 2.6 — CUADRO OFICIAL LOGFP0202 + APROBADOR INTERNO (19-jul)

**SQL: db/fase2d.sql — YA EJECUTADO en Supabase ("Success. No rows returned").**
cotizaciones.puntajes jsonb · cuadro_items.estado_aprobacion /
observacion_aprobador / resuelto_en / origen_item_id · checks ampliados
(cuadros.estado + 'aprobado_parcial'; aprobaciones.accion + 'aprobado_parcial').

**1. /panel/cuadros/[id] reescrito con el formato oficial LOGFP0202:**
columnas N° · Cód. SIG · Bien/Servicio · Cant · Und · Fecha últ. compra ·
Precio histórico · Total histórico · y por proveedor P.U. / TOTAL /
ESPECIFICACIÓN-MARCA; filas SUBTOTAL / IGV 18% / TOTAL; celdas en ROJO cuando
el P.U. supera el precio histórico (con tooltip); banner de alerta de precio.
Sección **CONDICIONES COMERCIALES Y EVALUACIÓN** con lugar/tiempo/pago/garantía/
clasificación + puntaje POR CRITERIO (desde cotizaciones.puntajes) y PUNTAJE
TOTAL con trofeo al ganador. **Dashboard de decisión** (proveedores comparados,
total seleccionado c/IGV, referencia histórica, ahorro o sobrecosto % en verde/
rojo). Bloque PROVEEDOR SELECCIONADO + JUSTIFICACIÓN + nota al pie citando
LOG-GN-P-02 y la matriz aprobada.
Los cuadros anteriores al 19-jul no tienen desglose: se avisa en nota al pie.

**2. Vista interna del aprobador (components/AprobarCuadro.tsx):**
sin correo. Tres salidas: **Aprobar todo** · **Aprobar parcialmente por ítem**
(toggle que abre tabla con check por ítem + observación individual; botón
"Aprobar N de M"; exige observación general) · **Rechazar** (exige comentario).
Cada ítem guarda estado_aprobacion aprobado/no_aprobado + observación + fecha.
Confirmar obligatorio en las tres. audit_log guarda el detalle de no aprobados.

**3. Bandeja "Ítems pendientes de compra" (/panel/pendientes):**
lista los cuadro_items en estado no_aprobado con su comparativo de origen
(link), observación del aprobador y precio histórico. Selección múltiple →
**Descartar** (confirmación, pasa a 'descartado', audit) o **Llevar a nuevo
comparativo** → /panel/cuadros/nuevo?pendientes=ids: NuevoCuadro precarga esos
ítems (descripción, cantidad, unidad, código SIG, precio y fecha histórica) y
al guardar marca los originales como 'recomprado' + guarda origen_item_id
(trazabilidad de qué ítem viene de qué cuadro). Nav item en sidebar con badge
de conteo.

**5. Filtros en /panel/cuadros (pedido de Fran 20-jul):** buscador por N° de
ticket / código del cuadro / proveedor + chips por estado (Todos · Pend.
aprobación [incluye reenviado] · Aprobados · Aprobados parciales · Rechazados)
con conteos; empty state diferenciado "Sin resultados" vs "Aún no hay cuadros".
Fran va a probar con casos reales; la carga masiva de códigos con precios está
en Configuración → Códigos SIG → "Carga masiva (Excel del ERP)" (formato DATA
SIG, código repetido = se toma la última fila).

**4. Trazabilidad del puntaje:** NuevoCuadro ahora congela el desglose por
criterio en cotizaciones.puntajes al crear el cuadro (aunque la matriz cambie
después, el cuadro demuestra con qué puntajes se decidió). También guarda
fecha_ultima_compra del catálogo en el ítem del cuadro.


## 🚨 FASE 2.5 — SOLO CRÍTICO / NO CRÍTICO / APROBADO (19-jul) — REGLA ABSOLUTA

**Regla del usuario (textual): "No puede haber por ningún lado en el app ningún
otro estado o referencia de clasificación que no sea: Crítico, No Crítico o
aprobado."** La calificación Confiable/Medianamente/No confiable existe SOLO en
el dominio de evaluación periódica (matrices, evaluaciones, dashboard de
calificaciones) y siempre enmarcada como "evaluación periódica" — jamás como
estado/clasificación del proveedor en el flujo de compras.

- DB: el valor `clasificacion = 'regular'` PERSISTE como storage (no migrar);
  la UI SIEMPRE muestra "No crítico". Estados del flujo: registrado →
  seleccionado → aprobado.
- **Clasificación desde Registro, uno por uno** → `components/ClasificarProveedor.tsx`:
  modal en /panel/registros para registros validados. Pills CRÍTICO / NO CRÍTICO
  + tabla colapsable con los 9 criterios de la matriz LOG-GN-A-P02-02 (guía
  CUALITATIVA — Fran esperaba criterios numéricos, el archivo oficial define
  comparación cualitativa). Al guardar: upsert proveedor por RUC → estado
  'seleccionado' + clasificacion + audit_log accion 'clasificar'.
- **Selección = SOLO 3 filtros**: Críticos / No críticos / Aprobados
  (default: criticos). Query solo estados seleccionado/aprobado.
- **Cadena documental visible de Registro a Selección**: seleccion/page.tsx
  construye `docsPorRuc` con admin client (service role) + signed URLs del
  bucket 'registro-docs'; SeleccionTabla muestra columna "Docs" (0 en warn =
  alerta de auditoría) y sección "Cadena documental del registro" en el modal
  con links que abren cada documento (DJ de Veracidad, sustento…).
- **Comparativo**: elegibilidad = estado seleccionado/aprobado (gate de
  calificación ELIMINADO); dropdown muestra " · CRÍTICO"/" · No crítico".
- **SIN CORREO por ahora** (decisión de la llamada: "no es trackeable").
  Cierre del comparativo: el comprador adjunta el PDF de aprobación en el
  Expediente → modal de cierre → selecciona proveedor ganador (la "llave") +
  observación opcional → cuadro aprobado + proveedor→aprobado + trazabilidad
  (aprobaciones + audit 'aprobado_por_correo'). Coordinación audita que el PDF
  coincida con el proveedor elegido. NO configurar Resend todavía.
- Renombrado global UI Regular→"No crítico" (SeleccionTabla, EvaluacionForm,
  MatricesLista, MatrizEditor, matrices/[id], export, chips de proveedores;
  filtro URL ?filtro=no_criticos con retrocompat 'regulares').
- Barrido de copy: login ("Solo proveedores aprobados…"), CargandoAlfa tips,
  tooltips del dashboard reescritos como "en su evaluación periódica";
  dashboard sección "Calificación de evaluaciones (periódicas)".

**Esta tanda quedó ENTREGADA en la Fase 2.6 (ver arriba).** Sigue pendiente:
leer a fondo LOG-GN-P-02 VD.docx y el catálogo de tiempos de re-evaluación por
clasificación (espera confirmación de Fran).

## 📦 ARCHIVOS DE FRAN RECIBIDOS Y DECODIFICADOS (18-jul) — YA EN EJECUCIÓN
Los 4 archivos (en uploads de la sesión; análisis completo aquí):

**1. "encabezado para subir materiales" (DATA SIG)** — formato REAL del import:
COD Material · Descripción · Tipo(INDIV) · Grupo Material · U.M. · Valor (Sin
IGV) · Precio (Con IGV). Cabecera en fila 6; códigos REPETIDOS por compra
histórica → se toma la ÚLTIMA fila (precio más reciente).
✅ CONSTRUIDO: /api/items/import (exceljs, detecta cabecera "COD Material",
mapea, dedupe por código quedándose con la última, upsert) + ItemsAdmin acepta
.xlsx/.csv. SQL fase2c (CORRIDO): items.grupo, items.precio_con_igv,
items.fecha_ultima_compra; cotizacion_precios.especificacion;
cuadros.tiempo_requerido_dias.

**2. Matriz de aprobaciones (LOG-GN-A-P02-01-v1, aprobada 04-feb-2026)** —
¡NOMBRES Y MONTOS REALES! (sin IGV): Directores Redes Hogar/Externas ≤50,000;
Dir. Administrativo y Dir. Logística y TI ≤8,000... OJO: interpretación fina de
columnas requiere leer notas completas. Aprobadores nombrados: Camilo Gómez
(GG, >100k), Mauricio González (Country Manager ≤100k), Santiago Jaimes (G.
Financiero ≤40k), Carlos Vela (G. Admin ≤40k), Blanca Jaramillo (Dir. Logística
y TI ≤8k), José Novoa (Redes Ext ≤50k), Jairo Rangel (Hogar/Comercios ≤50k),
Piero Cedano (Dir. Admin ≤8k), Mónica Gómez (Jefa Valorizaciones >100k).
→ Fran los carga en el panel Aprobadores (correos los tiene ella). Flujograma:
compra > S/50,000 la aprueba Dirección de Logística; ella (coordinadora)
aprueba hasta cierto monto. "No restringir solo nosotras en el panel".

**3. Matriz críticos/no críticos (LOG-GN-A-P02-02, aprobada 17-jul-2026)** —
9 criterios comparativos (impacto operación, alternativas de mercado, switching
cost, requisitos contractuales, impacto económico, info sensible, complejidad
de compra, nivel de seguimiento, tipo de relación) + definiciones + ejemplos +
estrategia de gestión. PENDIENTE: guía visible en el modal de Selección.

**4. Cuadro comparativo LOGFP0202 v2** — LA MATRIZ DE PUNTAJES APROBADA:
PRECIO 30% por RANKING (1° 30 / 2° 20 / 3° 10 / resto 0) · LUGAR 15%
(destino 15/agencia 10/recojo 0) · TIEMPO 15% BINARIO (dentro del plazo
requerido 15, fuera 0) · PAGO 20% en 5 NIVELES (61-90+:20 / 31-60:15 / 30:10 /
15:5 / contado:0) · GARANTÍA 10% (total+postventa+cert:10/básica:5/sin:0) ·
FEEDBACK/EXPERIENCIA/PRECIO HISTÓRICO 10% (positivo+exp+≤histórico:10 /
neutro o >histórico:5 / negativo:0).
✅ CONSTRUIDO en NuevoCuadro: scoring completo según matriz aprobada (ranking
de precio, tiempo binario con input "tiempo requerido" en Requerimiento, 5
niveles de pago, feedback base 5 sin evaluación y tope 5 si supera histórico),
input ESPECIFICACIÓN/MARCA por ítem por proveedor (se guarda en
cotizacion_precios.especificacion), precio histórico visible por ítem y CELDA
EN ROJO cuando el P.U. lo supera.
ESTRUCTURA DEL CUADRO (columnas oficiales): N°, BIEN/SERVICIO, CANT, UND,
FECHA ULT. COMPRA, PRECIO HISTÓRICO, TOTAL HISTÓRICO, y por proveedor P.U./
TOTAL/ESPECIFICACIÓN-MARCA + SUBTOTAL/IGV18%/TOTAL + sección CONDICIONES
COMERCIALES Y EVALUACIÓN con puntajes por criterio + PROVEEDOR SELECCIONADO +
JUSTIFICACIÓN + nota "lo registrado será considerado para la evaluación del
proveedor". Hoja DASHBOARD TOMA DE DECISIONES: recomendado + cuadro de
puntajes + semáforo de criterios + recomendación para jefatura.
⏳ PENDIENTE SIGUIENTE TANDA: (a) detalle/impresión del cuadro en /panel/
cuadros/[id] con el formato oficial completo (histórico+fecha+espec por
columna, rojos, sección evaluación, dashboard-resumen); (b) guía críticos en
Selección; (c) vista interna del aprobador (aprobar/parcial/rechazar por ítem
+ bandeja ítems pendientes); (d) leer a fondo el DOCX del procedimiento VD
(rutinario 5-15 días hábiles ingreso antes 14:00, emergencia 1-5 días con
aprobación de jefatura, estados de OC: Pendiente Aprob/Aprobado/Pendiente/
Cerrada/Anulada, homologación críticos/alto riesgo HSE, contratos recurrentes,
anticipos — del flujograma); (e) tiempos re-eval por clasificación (Fran
confirma).

## 📞 LLAMADA HERNANY↔FRAN (14-jul) — ESPECIFICACIÓN DE LA PRÓXIMA TANDA
**A. Precio histórico (refinamiento del ya construido):**
- Política: PROHIBIDO comprar sobre el precio histórico; si el mercado subió,
  pasa por aprobación especial de GERENCIA (nuestro "máximo aprobador" ✔).
- El comprador NUNCA escribe precios históricos: vienen del catálogo de ítems.
  Solo si el ítem existe pero NUNCA se compró (sin precio en catálogo), el
  comparativo deja el histórico vacío sin alerta.
- Los precios/el catálogo los administra el ADMIN en Configuración (ya ✔);
  cuando gerencia aprueba un precio mayor, el admin actualiza el catálogo y la
  alerta desaparece en futuros comparativos (flujo ya soportado por upsert ✔).
- PENDIENTE UI: en el cuadro (vista + impresión): columna PRECIO HISTÓRICO +
  FECHA DE ÚLTIMA COMPRA por ítem; precios unitarios que superen el histórico
  EN ROJO por celda + columna/nota de observación "por encima del precio
  histórico". Alerta visual por ítem, no solo global.

**B. Estructura completa del cuadro comparativo (falta, espera su Excel de
referencia LOGFP0202 que reenviará):**
- ESPECIFICACIONES TÉCNICAS por ítem (obligatorio — comparabilidad: "camisa de
  algodón vs drill no son comparables, lo observan").
- Precio histórico + fecha última compra como columnas.
- La matriz de ponderación visible/reflejada en el cuadro (el comprador ve el
  puntaje formarse en vivo — nuestro wizard ya lo hace, revisar contra su Excel).

**C. SLA de comparativos:**
- Registrar fecha/hora de ENVÍO y fecha de APROBACIÓN; mostrar aging de
  "pendientes por aprobar" (cuántos días llevan) en lista y dashboard.
- (Futuro módulo tickets: SLA llegada→atención→cierre.)

**D. Cierre del flujo de aprobación (DECISIONES DE LA LLAMADA):**
- Se creará VISTA INTERNA DE APROBACIÓN con rol aprobador básico: ve el cuadro,
  puede APROBAR / APROBAR PARCIALMENTE (por ítem) / RECHAZAR + observación.
- Aprobación PARCIAL: ítems no aprobados quedan como "ÍTEMS PENDIENTES DE
  COMPRA" en una bandeja: el comprador decide borrar o jalarlos a otro
  comparativo. Estados: aprobar / parcial / rechazado.
- Flujo alternativo POR CORREO (mientras tanto / complemento): el COMPRADOR
  adjunta el PDF de aprobación del correo + SELECCIONA el proveedor aprobado →
  el cuadro pasa a "aprobado" (esa es la llave). Coordinación audita que el
  PDF coincida. Puede llevar observación.
- Roles que arman/envían comparativos: coordinación, analistas y compradores.

**E. Selección/Proveedores — filtros:**
- En Selección: filtros por CRÍTICOS / REGULARES (además de estados). La
  calificación confiable/medianamente/no confiable NO va en selección — es
  exclusiva de la evaluación periódica.
- En Proveedores: QUITAR chips confiable/medianamente/no confiable; dejar
  vencidas/por vencer; añadir críticos/regulares.

**F. Tiempos de re-evaluación por CLASIFICACIÓN (catálogo configurable):**
- "Críticos cada X meses, regulares cada Y" administrable sin tocar matrices;
  alimenta los vencidos del dashboard. Fran CONFIRMARÁ los tiempos.

**G. Encuesta ligada a la matriz:** la encuesta del área usuaria ES el último
criterio de la matriz de evaluación (10/5/0) y debe jalarse automático al
puntaje. Espera la matriz aprobada.

**H. Fran ENVIARÁ (un solo envío):** (1) matriz/criterios de categorización
críticos-no críticos; (2) ENCABEZADO EXACTO del export de ítems+precios de su
ERP (para configurar la carga masiva — NO construir el parser final hasta
tenerlo); (3) cuadro comparativo de referencia (reenvío); (4) procedimiento
actualizado (terminado 13-jul); (5) tiempos de re-evaluación; (6) matriz de
aprobaciones. La vista nueva del comparativo DEPENDE de la matriz de ítems.

**I. NEGOCIO (importante):**
- MÓDULO DE TICKETS/REQUERIMIENTOS: reemplazo de AvanDesk (hoy solo recibe
  Excels y calcula SLA). Áreas usuarias crearían requerimientos en el sistema
  con SLA llegada→atención→cierre. HAY UN INTERESADO EN OTRA EMPRESA (jefe de
  área) — Fran ya le dijo que eso lo cobra Hernany; reunión al cerrar esta
  semana. Es VENTA NUEVA + módulo futuro del ecosistema.
- Directora de TI preguntó por despliegue EN SERVIDOR DE LA EMPRESA
  (on-premise): respondido que sí es posible (white-label, instancia propia)
  sin perder el derecho de vender el producto a otros. Fran también vende
  AlfaFleet a otras 2 empresas — modelo validado.
- Repositorio de documentos: confirmado en llamada que vive EN el sistema
  (no Drive) — ver/descargar desde la tabla ✔ (ya construido).



## ⚡ FASE 2.4 — NORMA: dirty-check + confirmación en procesos sensibles (14-jul)
- **NORMA UX nueva (aplicar SIEMPRE)**: (a) si no hay cambios, el botón Guardar
  se deshabilita y dice "Sin cambios" (comparación por snapshot JSON del estado
  inicial); (b) toda acción sensible/irreversible pasa por el modal estándar
  `components/Confirmar.tsx` (título + consecuencias + Cancelar/Confirmar,
  tono "brand" o "peligro", footer oscuro) antes de ejecutarse.
- Aplicado en: MatrizEditor (dirty-check + confirmación de activar vN+1),
  AprobarCuadro (aprobar/rechazar), ValidarRegistro (validar expediente),
  UsuariosAdmin (cambio de rol), eliminaciones en DestinatariosAdmin,
  AprobadoresAdmin y ExpedienteCompra (tono peligro), SeleccionTabla
  (dirty-check en edición; "Seleccionar" de un registrado siempre habilitado
  porque la transición de estado ES la acción).
- Los mensajes de confirmación explican la CONSECUENCIA (qué se archiva, qué
  queda en auditoría) — pedagogía consistente con los Hints.

## ⚡ FASE 2.3 — Editor de matriz como modal wizard + fixes (14-jul noche)
- **REGLA CORE reafirmada y AMPLIADA**: NINGUNA vista de edición/creación hace
  scroll de página. TODO formulario largo = modal centrado one-view con Stepper
  y scroll SOLO en .modal-body. Única excepción: documentos imprimibles
  (actas, matriz imprimible) que son formato papel para Imprimir/Guardar PDF.
- **MatrizEditor reescrito como wizard** (Datos · Criterios · Documentos) dentro
  de modal overlay en /matrices/[id]/editar (header oscuro con X, footer oscuro
  Cancelar/Anterior/Siguiente/Guardar). Al guardar o cancelar → vuelve a la
  LISTA de matrices (nunca al documento imprimible).
- **Las 3 superficies de matriz, aclaradas**: (1) modal de CONSULTA desde la
  lista (Stepper 3 pasos, solo lectura); (2) modal wizard de EDICIÓN;
  (3) /matrices/[id] = SOLO "Versión imprimible" (documento formato papel,
  se llega únicamente desde el botón del modal de consulta).
- **UserMenu**: el dropdown ahora abre HACIA ARRIBA (bottom-full mb-2) porque
  vive al fondo del sidebar — antes el "Cerrar sesión" se salía de pantalla.

## ⚡ FASE 2.2 — Estandarización UX (14-jul, segundo feedback con screenshots)
- **`components/ConfigHeader.tsx`**: cabecera ÚNICA de todas las páginas de
  Configuración — breadcrumb (Configuración › Página) + botón cuadrado con
  ArrowLeft junto al título + Hint opcional. Aplicado a correos, items,
  aprobadores, usuarios y matrices. REGLA: nunca más back-links sueltos ni
  posiciones distintas.
- **Ancho/alto uniformes en Configuración**: todas las páginas usan
  `mx-auto w-full max-w-5xl` + minHeight calc(100vh-96px) — sin saltos de ancho
  ni de alto entre vistas (regla "todo lisito" extendida a config).
- **`components/Hint.tsx`**: iconito Info (lucide) con tooltip pedagógico (contenido
  del instructivo). Props `roles`/`rolActual` para mostrarlo solo a los roles que
  ejecutan ese proceso — el gating real se conecta cuando exista la matriz de
  permisos (hoy: visible; patrón aplicado en Selección y en todos los
  ConfigHeader). PENDIENTE: sembrar más Hints en Comparativos/Evaluaciones/
  Registro con textos del instructivo.
- **Matrices = modal wizard de CONSULTA** (`components/MatricesLista.tsx`):
  fila → modal one-view con Stepper (Resumen · Criterios · Documentos), solo
  lectura, footer oscuro con "Versión imprimible" (→ /matrices/[id], que sigue
  siendo el doc printable) y "Editar (nueva versión)" si vigente. La lista
  tiene alto fijo estándar.
- **Cuadros**: eliminado el "+ Nuevo cuadro" duplicado del empty state (queda
  solo el del head — posición consistente).
- REGLA UX registrada: revisar redundancia de CTAs (un solo botón por acción
  por vista) y homologar spacings en el resto del app cuando se toque cada vista.

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
