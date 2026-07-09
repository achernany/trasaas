-- ============================================================
-- SCORECARD DE PROVEEDORES — Esquema Postgres (Supabase)
-- Multi-tenant desde el día 1: toda tabla lleva empresa_id.
-- Basado en: LOG-P-03 (selección/evaluación), LOG-GN-P-02 (compras),
-- LOG-F-P03-01/02 (fichas y matriz de seguimiento), LOG-GN-F-P02-07 (comparativo)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- TENANTS Y USUARIOS ----------

create table empresas (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  ruc         text,
  logo_url    text,
  creado_en   timestamptz not null default now()
);

-- Perfil de usuario (el auth lo maneja Supabase Auth; aquí va rol y tenant)
create table usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid not null references empresas(id),
  nombre      text not null,
  email       text not null,
  rol         text not null check (rol in ('admin','coordinador','comprador','aprobador','area_usuaria')),
  cargo       text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

-- ---------- CATÁLOGOS ----------

create table proyectos (            -- CALIDDA, CONTUGAS, ELECTRODUNAS, TENGDA, GENERAL...
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  nombre      text not null,
  activo      boolean not null default true,
  unique (empresa_id, nombre)
);

create table categorias (           -- Bienes, S. Generales, Transportes, Maquinaria, Salud...
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  nombre      text not null,
  tipo        text not null check (tipo in ('bien','servicio')),
  activo      boolean not null default true,
  unique (empresa_id, nombre)
);

-- ---------- PROVEEDORES ----------

create table proveedores (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references empresas(id),
  ruc           text not null,
  razon_social  text not null,
  direccion     text,
  distrito      text,
  estado        text not null default 'registrado'
                check (estado in ('invitado','registrado','homologado_externo','inactivo')),
  creado_en     timestamptz not null default now(),
  unique (empresa_id, ruc)
);

-- Registro / debida diligencia (respuestas del form público del proveedor).
-- form_data JSONB hasta tener los campos exactos del Google Form de Francys.
create table proveedor_registros (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references empresas(id),
  proveedor_id  uuid references proveedores(id),
  token_acceso  text unique not null,          -- link único que se envía al proveedor
  form_data     jsonb,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','enviado','validado','observado')),
  enviado_en    timestamptz,
  validado_por  uuid references usuarios(id),
  creado_en     timestamptz not null default now()
);

create table proveedor_documentos (            -- adjuntos legales del registro
  id            uuid primary key default uuid_generate_v4(),
  registro_id   uuid not null references proveedor_registros(id) on delete cascade,
  tipo          text not null,                 -- ficha RUC, deuda coactiva, DNI rep. legal, etc.
  archivo_url   text not null,                 -- Supabase Storage
  vence_en      date,
  subido_en     timestamptz not null default now()
);

-- Un proveedor se califica POR CATEGORÍA (99 de 105 RUCs reales tienen varias)
create table proveedor_categorias (
  id                  uuid primary key default uuid_generate_v4(),
  empresa_id          uuid not null references empresas(id),
  proveedor_id        uuid not null references proveedores(id),
  categoria_id        uuid not null references categorias(id),
  suministro          text,                    -- descripción libre del bien/servicio
  calificacion_actual text check (calificacion_actual in
                      ('confiable','medianamente_confiable','no_confiable')),
  nota_actual         numeric(5,2),
  proxima_evaluacion  date,                    -- 6/3/1 meses según calificación
  unique (proveedor_id, categoria_id)
);

-- ---------- MATRICES (configurables y versionadas) ----------

create table matrices (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references empresas(id),
  nombre        text not null,
  tipo          text not null check (tipo in ('seleccion','evaluacion')),
  categoria_id  uuid references categorias(id),  -- null = matriz genérica
  version       int  not null default 1,
  estado        text not null check (estado in ('borrador','vigente','archivada')),
  umbral_confiable      int not null default 71,  -- ≥71 confiable
  umbral_medianamente   int not null default 31,  -- 31-70 medianamente
  meses_reeval_confiable      int not null default 6,
  meses_reeval_medianamente   int not null default 3,
  meses_reeval_no_confiable   int not null default 1,
  creado_en     timestamptz not null default now()
);

create table criterios (
  id          uuid primary key default uuid_generate_v4(),
  matriz_id   uuid not null references matrices(id) on delete cascade,
  orden       int  not null,
  nombre      text not null,               -- Precios, Forma de pago, Garantías...
  peso_max    numeric(5,2) not null        -- puntos máximos del criterio
);

create table criterio_opciones (           -- niveles: EXCELENTE / BUENO / NO CUMPLE...
  id          uuid primary key default uuid_generate_v4(),
  criterio_id uuid not null references criterios(id) on delete cascade,
  orden       int  not null,
  etiqueta    text not null,
  descripcion text,
  puntos      numeric(5,2) not null
);

-- Checklist documental ELIMINATORIO por matriz (si no cumple → no aprobado)
create table matriz_documentos (
  id           uuid primary key default uuid_generate_v4(),
  matriz_id    uuid not null references matrices(id) on delete cascade,
  descripcion  text not null,
  eliminatorio boolean not null default true
);

-- ---------- EVALUACIONES (selección inicial y periódicas) ----------

create table evaluaciones (
  id                    uuid primary key default uuid_generate_v4(),
  empresa_id            uuid not null references empresas(id),
  proveedor_categoria_id uuid not null references proveedor_categorias(id),
  matriz_id             uuid not null references matrices(id),
  proyecto_id           uuid references proyectos(id),
  codigo                text not null,        -- ej. 26.01.26-E-20600585658 (autogenerado)
  proceso               text not null check (proceso in ('seleccion','evaluacion')),
  evaluador_id          uuid references usuarios(id),
  fecha                 date not null default current_date,
  nota                  numeric(5,2),
  calificacion          text check (calificacion in
                        ('confiable','medianamente_confiable','no_confiable')),
  observacion           text,
  estado                text not null default 'borrador'
                        check (estado in ('borrador','completada','anulada')),
  pdf_url               text,                 -- ficha PDF generada (evidencia auditoría)
  notificado_proveedor  timestamptz,          -- LOG-P-03 exige comunicar resultado
  creado_en             timestamptz not null default now(),
  unique (empresa_id, codigo)
);

create table evaluacion_respuestas (
  id             uuid primary key default uuid_generate_v4(),
  evaluacion_id  uuid not null references evaluaciones(id) on delete cascade,
  criterio_id    uuid not null references criterios(id),
  opcion_id      uuid not null references criterio_opciones(id),
  puntos         numeric(5,2) not null,
  unique (evaluacion_id, criterio_id)
);

create table evaluacion_documentos (          -- checklist C/NC de la ficha
  id             uuid primary key default uuid_generate_v4(),
  evaluacion_id  uuid not null references evaluaciones(id) on delete cascade,
  matriz_documento_id uuid not null references matriz_documentos(id),
  cumple         boolean,
  observacion    text
);

-- Encuesta de satisfacción del ÁREA USUARIA (alimenta el criterio postventa)
create table satisfaccion_respuestas (
  id                     uuid primary key default uuid_generate_v4(),
  empresa_id             uuid not null references empresas(id),
  proveedor_categoria_id uuid not null references proveedor_categorias(id),
  evaluacion_id          uuid references evaluaciones(id),
  token_acceso           text unique not null, -- link corto que se envía al área usuaria
  respondente            text,
  area                   text,
  puntaje                int check (puntaje between 0 and 10),
  comentario             text,
  respondido_en          timestamptz
);

-- ---------- REQUERIMIENTOS Y CUADROS COMPARATIVOS ----------

create table requerimientos (
  id             uuid primary key default uuid_generate_v4(),
  empresa_id     uuid not null references empresas(id),
  ticket_avandesk text not null,              -- código único de AvanDesk (sin integración)
  tipo           text not null check (tipo in ('rutinario','emergencia')),
  area_solicitante text,
  proyecto_id    uuid references proyectos(id),
  archivo_url    text,                        -- PDF del requerimiento adjunto
  creado_por     uuid references usuarios(id),
  creado_en      timestamptz not null default now(),
  unique (empresa_id, ticket_avandesk)
);

create table cuadros (
  id               uuid primary key default uuid_generate_v4(),
  empresa_id       uuid not null references empresas(id),
  requerimiento_id uuid not null references requerimientos(id),
  codigo           text not null,             -- correlativo LOG-GN-F-P02-07-XXXX
  matriz_pesos     jsonb not null,            -- pesos del comparativo (precio 30%, entrega 15%...)
  moneda           text not null default 'PEN' check (moneda in ('PEN','USD')),
  incluye_igv      boolean not null default true,
  estado           text not null default 'borrador' check (estado in
                   ('borrador','enviado','aprobado','rechazado','reenviado')),
  justificacion    text,
  proveedor_ganador_id uuid references proveedores(id),
  pdf_url          text,
  creado_por       uuid references usuarios(id),
  creado_en        timestamptz not null default now(),
  unique (empresa_id, codigo)
);

create table cuadro_items (
  id          uuid primary key default uuid_generate_v4(),
  cuadro_id   uuid not null references cuadros(id) on delete cascade,
  orden       int not null,
  descripcion text not null,
  cantidad    numeric(12,3) not null,
  unidad      text not null,
  precio_historico numeric(12,2),             -- última compra
  fecha_ultima_compra date
);

-- Regla de negocio: solo proveedores CONFIABLES en la categoría (se valida en app + trigger).
-- Excepción: requerimiento tipo 'emergencia' (LOG-GN-P-02 no exige 3 cotizaciones).
create table cotizaciones (
  id            uuid primary key default uuid_generate_v4(),
  cuadro_id     uuid not null references cuadros(id) on delete cascade,
  proveedor_id  uuid not null references proveedores(id),
  vigencia_dias int,
  lugar_entrega text,                         -- destino / agencia / recojo
  tiempo_entrega_dias int,
  condicion_pago text,                        -- crédito >30, 30, 15, contado
  garantia      text,
  observaciones text,
  archivo_url   text not null,                -- PDF de la cotización (obligatorio, auditoría)
  puntaje_total numeric(5,2),
  unique (cuadro_id, proveedor_id)
);

create table cotizacion_precios (
  id            uuid primary key default uuid_generate_v4(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  item_id       uuid not null references cuadro_items(id) on delete cascade,
  precio_unitario numeric(12,4) not null,
  unique (cotizacion_id, item_id)
);

-- ---------- APROBACIONES ----------

create table niveles_aprobacion (             -- matriz de aprobación configurable por monto
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  orden       int not null,
  nombre      text not null,                  -- ej. Coordinación de Compras, Dirección Logística
  monto_desde numeric(14,2) not null default 0,
  monto_hasta numeric(14,2)                   -- null = sin tope (>S/50,000 → Dirección)
);

create table aprobaciones (
  id           uuid primary key default uuid_generate_v4(),
  empresa_id   uuid not null references empresas(id),
  cuadro_id    uuid not null references cuadros(id),
  nivel_id     uuid references niveles_aprobacion(id),
  aprobador_id uuid references usuarios(id),
  token_email  text unique not null,          -- link firmado del correo (resumen + detalle)
  accion       text check (accion in ('aprobado','rechazado')),
  comentario   text,
  enviado_en   timestamptz not null default now(),
  resuelto_en  timestamptz
);

-- ---------- AUDITORÍA (el producto ES esto) ----------

create table audit_log (
  id          bigint generated always as identity primary key,
  empresa_id  uuid not null references empresas(id),
  usuario_id  uuid,
  entidad     text not null,                  -- 'evaluacion','cuadro','aprobacion'...
  entidad_id  uuid,
  accion      text not null,                  -- 'crear','enviar','aprobar','rechazar','editar'
  detalle     jsonb,
  creado_en   timestamptz not null default now()
);

-- ---------- ÍNDICES CLAVE ----------
create index on evaluaciones (empresa_id, fecha);
create index on proveedor_categorias (empresa_id, proxima_evaluacion);
create index on cuadros (empresa_id, estado);
create index on audit_log (empresa_id, entidad, entidad_id);

-- ---------- RLS (Row Level Security) ----------
-- Toda tabla se aísla por empresa_id contra el JWT del usuario.
-- Plantilla (repetir por tabla):
--   alter table <tabla> enable row level security;
--   create policy tenant_isolation on <tabla>
--     using (empresa_id = (select empresa_id from usuarios where id = auth.uid()));
-- Excepciones: proveedor_registros y satisfaccion_respuestas también se acceden
-- por token_acceso vía edge function (el proveedor/área usuaria no tiene login).
