-- ============================================================
-- SETTINGS / PANEL DE ADMINISTRACIÓN
-- Clasificación de proveedores, matrices administrables,
-- destinatarios de notificaciones.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

-- 1. Clasificación de proveedores (Regular / Crítico)
alter table proveedores
  add column if not exists clasificacion text not null default 'regular'
  check (clasificacion in ('regular','critico'));

-- 2. Las matrices aplican a una clasificación
alter table matrices
  add column if not exists clasificacion text not null default 'regular'
  check (clasificacion in ('regular','critico'));

-- 3. Destinatarios de notificaciones (administrable desde Settings)
create table if not exists notificacion_destinatarios (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id),
  nombre      text,
  email       text not null,
  tipos       text[] not null default '{}',  -- nuevos_proveedores | por_vencer | vencidas | encuestas | comparativos
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
alter table notificacion_destinatarios enable row level security;
create policy t_destinatarios on notificacion_destinatarios for select using (empresa_id = mi_empresa());
create policy w_destinatarios_i on notificacion_destinatarios for insert with check (empresa_id = mi_empresa());
create policy w_destinatarios_u on notificacion_destinatarios for update using (empresa_id = mi_empresa());
create policy w_destinatarios_d on notificacion_destinatarios for delete using (empresa_id = mi_empresa());

-- 4. Escritura de matrices desde el panel (nuevas versiones)
create policy w_matrices_i on matrices for insert with check (empresa_id = mi_empresa());
create policy w_matrices_u on matrices for update using (empresa_id = mi_empresa());
create policy w_criterios_i on criterios for insert
  with check (exists (select 1 from matrices m where m.id = matriz_id and m.empresa_id = mi_empresa()));
create policy w_opciones_i on criterio_opciones for insert
  with check (exists (select 1 from criterios c join matrices m on m.id = c.matriz_id
                      where c.id = criterio_id and m.empresa_id = mi_empresa()));
create policy w_mdocs_i on matriz_documentos for insert
  with check (exists (select 1 from matrices m where m.id = matriz_id and m.empresa_id = mi_empresa()));
