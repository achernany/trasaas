-- ============================================================
-- FASE 2 (2026-07-14)
-- Flujo Registro→Selección→Comparativo→Aprobados→Evaluación,
-- catálogo de códigos SIG, aprobadores por área/monto,
-- roles ampliados y expediente documental por comparativo.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

-- 1. Estados del ciclo de vida del proveedor
alter table proveedores drop constraint if exists proveedores_estado_check;
alter table proveedores add constraint proveedores_estado_check
  check (estado in ('invitado','registrado','seleccionado','aprobado','homologado_externo','inactivo'));

-- Históricos ya evaluados → aprobados (ya operaban con Alfaco)
update proveedores set estado = 'aprobado'
 where id in (select distinct pc.proveedor_id from proveedor_categorias pc
              where pc.calificacion_actual is not null);

-- 2. Roles ampliados (Director / Coordinador / Analista / Comprador / Auditor)
alter table usuarios drop constraint if exists usuarios_rol_check;
alter table usuarios add constraint usuarios_rol_check
  check (rol in ('admin','director','coordinador','analista','comprador','aprobador','auditor','area_usuaria'));

-- 3. Catálogo de ítems (códigos SIG del ERP)
create table if not exists items (
  id           uuid primary key default uuid_generate_v4(),
  empresa_id   uuid not null references empresas(id),
  codigo       text not null,                    -- código SIG (llave de negocio)
  descripcion  text not null,
  tipo         text not null default 'producto' check (tipo in ('producto','servicio')),
  unidad       text not null default 'UND',
  ultimo_costo numeric(14,2),                    -- del ERP; dispara alerta si se supera
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  unique (empresa_id, codigo)
);
alter table items enable row level security;
create policy t_items on items for select using (empresa_id = mi_empresa());
create policy w_items_i on items for insert with check (empresa_id = mi_empresa());
create policy w_items_u on items for update using (empresa_id = mi_empresa());
create policy w_items_d on items for delete using (empresa_id = mi_empresa());

-- 4. Aprobadores de comparativos (por área y monto)
create table if not exists aprobadores (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  nombre      text not null,
  email       text not null,
  area        text,
  cargo       text,
  monto_max   numeric(14,2),                     -- null = máximo aprobador (sin tope)
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
alter table aprobadores enable row level security;
create policy t_aprobadores on aprobadores for select using (empresa_id = mi_empresa());
create policy w_aprobadores_i on aprobadores for insert with check (empresa_id = mi_empresa());
create policy w_aprobadores_u on aprobadores for update using (empresa_id = mi_empresa());
create policy w_aprobadores_d on aprobadores for delete using (empresa_id = mi_empresa());

-- 5. Comparativos: vínculo al catálogo, aprobador y alerta de precio histórico
alter table cuadro_items add column if not exists item_id uuid references items(id);
alter table cuadro_items add column if not exists codigo_sig text;
alter table cuadros add column if not exists aprobador_id uuid references aprobadores(id);
alter table cuadros add column if not exists alerta_precio boolean not null default false;

-- 6. Expediente documental por comparativo (ciclo completo de la compra)
create table if not exists cuadro_documentos (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  cuadro_id   uuid not null references cuadros(id) on delete cascade,
  tipo        text not null check (tipo in ('ticket','cotizacion','oc','otro')),
  nombre      text not null,
  archivo_url text not null,                     -- ruta en el bucket compras-docs
  subido_por  uuid references usuarios(id),
  creado_en   timestamptz not null default now()
);
alter table cuadro_documentos enable row level security;
create policy t_cdocs on cuadro_documentos for select using (empresa_id = mi_empresa());
create policy w_cdocs_i on cuadro_documentos for insert with check (empresa_id = mi_empresa());
create policy w_cdocs_d on cuadro_documentos for delete using (empresa_id = mi_empresa());

-- 7. Bucket privado del expediente + acceso autenticado
insert into storage.buckets (id, name, public)
values ('compras-docs','compras-docs', false)
on conflict (id) do nothing;
create policy s_compras_r on storage.objects for select to authenticated
  using (bucket_id = 'compras-docs');
create policy s_compras_w on storage.objects for insert to authenticated
  with check (bucket_id = 'compras-docs');
