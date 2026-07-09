# Rediseño UX/UI — Spec para Figma
Scorecard de Proveedores · v1 · 09/07/26
Persona: analista/coordinadora de compras que vive en Excel y Google Forms. Objetivo: familiar
pero superior — denso sin apretado, one-view donde se pueda, feedback inmediato siempre.

---

## 1 · DESIGN TOKENS

### Tipografía
| Token | Fuente | Peso | Tamaño / línea | Uso |
|---|---|---|---|---|
| display | Poppins | 600 | 30 / 38 | H1 de página, número protagonista |
| h2 | Poppins | 600 | 20 / 28 | Títulos de card/sección |
| h3 | Mulish | 700 | 16 / 24 | Subtítulos, labels de grupo |
| body | Mulish | 400 | 15 / 24 | Texto general, formularios |
| body-strong | Mulish | 700 | 15 / 24 | Énfasis inline |
| table | Mulish | 400/600 | 13.5 / 20 | Celdas (activar `tabular-nums`) |
| caption | Mulish | 400 | 12 / 16 | Ayudas, metadatos, umbrales |
| kpi | Poppins | 600 | 34 / 40 | Números de KPI (`tabular-nums`) |
Reglas: Poppins NUNCA bajo 18px ni para datos. Números siempre tabulares. Máx 2 pesos por familia.

### Color
| Token | Hex | Uso |
|---|---|---|
| brand-900 | #0B3B4D | Header, botón primario, links (azul petróleo — separa marca de semántica) |
| brand-700 | #14586F | Hover primario |
| brand-100 | #DDEEF4 | Fondos selección, chips activos |
| ink-900 / 600 / 400 | #101828 / #475467 / #98A2B3 | Texto: título / secundario / placeholder |
| bg / surface / line | #F5F7FA / #FFFFFF / #E4E7EC | Fondo página / cards / bordes |
| ok-600 / ok-100 | #067647 / #DCFAE6 | Confiable (+ ícono ✓) |
| warn-700 / warn-100 | #B54708 / #FEF0C7 | Medianamente confiable (+ ícono !) |
| danger-600 / danger-100 | #D92D20 / #FEE4E2 | No confiable, vencidas (+ ícono ✕/reloj) |
Regla de oro: el color semántico SIEMPRE acompañado de ícono o texto (daltonismo).
Contraste mínimo AA: 4.5:1 texto normal, 3:1 texto ≥18px y componentes UI.

### Espaciado, radios, sombras
- Grid 8pt: 4 / 8 / 12 / 16 / 24 / 32 / 40 / 64
- Card: padding 24, gap interno 16, radius 16. Gap entre cards 24. Secciones 40.
- Contenedor: max 1120px desktop; mobile margin 16.
- Sombra única: `0 1px 2px rgba(16,24,40,.06)` — la jerarquía la hace el espacio, no la sombra.
- Touch targets: mínimo 44×44 (nav, botones de grilla, filas tap en mobile).

---

## 2 · COMPONENTES (crear como Figma components)

1. **Badge de calificación**: ícono + label + fondo 100/texto 600-800. Variantes: ok / warn /
   danger / neutral. Tamaños S (12) y M (13.5).
2. **KPI card**: caption arriba, número kpi abajo, delta opcional. Variante **action-card**:
   fondo danger-100 suave, ícono, CTA "Ver →" (para las 146 vencidas).
3. **Mini-bar de nota**: barra 64×6 + número tabular al lado. Color por umbral (≥71 ok,
   31–70 warn, <31 danger).
4. **Chips de filtro**: pill 32px alto, contador dentro `Vencidas (146)`. Activo = brand-100
   + texto brand-900. Reemplazan filtros escondidos.
5. **Combobox de proveedor**: input con lupa → dropdown con coincidencias resaltadas,
   navegable con teclado, muestra razón social + RUC en dos líneas.
6. **Grilla de calificación (el componente estrella)**: filas = criterios (nombre + pts máx),
   columnas = niveles (EXCELENTE / BUENO / REGULAR / NO CUMPLE) como botones segmentados
   44px alto. Estado seleccionado: fondo brand-100 + borde brand-900 + puntos ganados visibles.
   Tooltip/línea secundaria con la descripción del nivel. Es la ficha Excel de siempre, viva.
7. **Barra de resultado sticky** (bottom): nota acumulada grande (tabular), chip de clasificación
   que cambia en vivo, contador "5/7 criterios", botón Guardar. Siempre visible durante la
   evaluación — feedback inmediato (clave TDAH).
8. **Fila de tabla enriquecida**: razón social (body-strong) + RUC (caption) / badge / mini-bar
   + nota / pill de fecha (con ícono reloj si vencida) / acción.
9. **Card de proveedor (mobile)**: la tabla colapsa a cards <768px: nombre, badge, nota con
   mini-bar, próxima eval, botón Evaluar full-width.
10. **Bottom tab bar (mobile)**: 4 tabs ícono+label 11px: Inicio / Proveedores / Evaluaciones /
    Comparativos. Activo en brand-900.
11. **Toast de confirmación** y **skeleton rows** (3 estados: cargando, vacío con ilustración
    ligera + CTA, error con reintento).

---

## 3 · PANTALLAS (wireframe anotado)

### Login
Claro, alineado a la app. Card 400px centrada, logo, campos 48px de alto, botón brand-900.
Fondo bg con patrón sutil opcional. Caption de confianza abajo ("ISO 9001 · datos en la nube").

### Dashboard — "un vistazo y sé qué hacer"
- Fila 1: 3 KPI + 1 **action-card** de vencidas (protagonista, no par).
- Fila 2: card clasificación con barra apilada CON etiquetas y porcentajes en cada segmento.
- Fila 3 (nueva): "Próximas re-evaluaciones" — lista de 5 con botón Evaluar directo. El
  dashboard deja de ser informativo y se vuelve accionable. Todo cabe en un viewport ✓.

### Proveedores
- Header: título + búsqueda inline + chips de filtro (Todas/Confiables/Medianam./Vencidas).
- Tabla enriquecida (comp. 8), header sticky, hover, 48px de alto por fila.
- Mobile: cards (comp. 9). Sin scroll horizontal jamás.

### Nueva evaluación — one-view, cero wizard (desktop)
- Zona 1 (compacta, 2 columnas): proceso (segmented), proveedor (combobox), categoría,
  proyecto, suministro. Colapsa a resumen de 1 línea al completarse ("Evaluando a X en Y ·
  editar").
- Zona 2: **grilla de calificación** (comp. 6) — 7 criterios en un solo viewport.
- Zona 3: documentos de legalidad como fila de toggles Cumple/No cumple; si algo marca
  No cumple, banner danger inmediato explicando el efecto eliminatorio.
- Sticky bottom (comp. 7) con score vivo y Guardar.
- Mobile: la grilla colapsa a stepper por criterio (1 de 7, opciones como cards grandes),
  mismo sticky de score.

### Ficha (resultado)
Mantener estructura documento. Mejoras: bloque de resultado con fondo semántico suave,
nota gigante (Poppins 48 tabular), QR opcional con link de verificación (vende auditoría),
sello digital como "chip" monoespaciado.

### Comparativos (propuesta)
Grid de bondades 2×3 con íconos por bondad + banner "fase 2" — ya está bien, solo aplicar
tokens nuevos.

---

## 4 · ACCESIBILIDAD E INCLUSIÓN (checklist de diseño)
- [ ] Color nunca solo: ícono/texto en todo estado semántico
- [ ] Contraste AA verificado por token (tabla arriba cumple)
- [ ] Targets ≥44px; nav mobile por tabs, no hamburguesa
- [ ] `focus-visible` en TODO interactivo (anillo brand 2px offset 2)
- [ ] Una acción primaria por pantalla; secundarias en outline
- [ ] Feedback inmediato: score vivo, toasts, estados de guardado
- [ ] Chunking: secciones numeradas, máx 7±2 ítems visibles por grupo
- [ ] Microcopy en español simple, sin jerga técnica; errores dicen cómo corregir
- [ ] `prefers-reduced-motion`: sin animaciones esenciales
- [ ] Zoom 200% sin pérdida (layout fluido, sin alturas fijas en texto)

## 5 · PRIORIDAD DE IMPLEMENTACIÓN
1. 🔴 Bottom tab bar mobile (hoy no hay navegación en celular)
2. 🔴 Combobox de proveedor + sticky score en Nueva evaluación
3. 🟡 Grilla de calificación one-view (desktop)
4. 🟡 Tokens tipográficos Poppins/Mulish + espaciado 8pt global
5. 🟡 Chips de filtro + tabla enriquecida + cards mobile
6. 🟢 Action-card de vencidas + lista accionable en dashboard
7. 🟢 Login claro, estados vacíos, toasts

## 6 · PARA MONTAR EN FIGMA
- Frames: Desktop 1440 / Mobile 390. Grid 8pt, columnas 12/4.
- Estilos de texto y color = tokens de las secciones 1 (nombrarlos igual: `brand/900`,
  `text/kpi`...). Fuentes: Poppins y Mulish están en Google Fonts (nativas en Figma).
- Componentes de la sección 2 con variantes (badge: 4 estados × 2 tamaños, etc.).
- Iterar en este orden: tokens → componentes → Dashboard → Nueva evaluación → Proveedores.
