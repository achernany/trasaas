-- ============================================================
-- FASE 3 — SaaS white-label v1: aislamiento real + branding por tenant
-- Correr en el SQL Editor de Supabase. Idempotente (se puede re-correr).
-- ANTES de correr, verificar el estado de RLS:
--   select relname, relrowsecurity from pg_class c
--   join pg_namespace n on n.oid=c.relnamespace
--   where n.nspname='public' and c.relkind='r' order by relrowsecurity, relname;
-- ============================================================

-- ---------- 1. RLS en las tablas core ----------
-- Las policies ya existen (db/policies.sql, settings.sql). Esto ACTIVA RLS.
-- Enable es idempotente: si ya estaba activo, no hace nada.
alter table empresas                enable row level security;
alter table usuarios                enable row level security;
alter table proyectos               enable row level security;
alter table categorias              enable row level security;
alter table proveedores             enable row level security;
alter table proveedor_registros     enable row level security;
alter table proveedor_documentos    enable row level security;
alter table proveedor_categorias    enable row level security;
alter table matrices                enable row level security;
alter table criterios               enable row level security;
alter table criterio_opciones       enable row level security;
alter table matriz_documentos       enable row level security;
alter table evaluaciones            enable row level security;
alter table evaluacion_respuestas   enable row level security;
alter table evaluacion_documentos   enable row level security;
alter table satisfaccion_respuestas enable row level security;
alter table requerimientos          enable row level security;
alter table cuadros                 enable row level security;
alter table cuadro_items            enable row level security;
alter table cotizaciones            enable row level security;
alter table cotizacion_precios      enable row level security;
alter table niveles_aprobacion      enable row level security;
alter table aprobaciones            enable row level security;
alter table audit_log               enable row level security;

-- ---------- 2. Policy de lectura de usuarios por tenant ----------
-- Hoy usuarios solo tiene usuarios_self (id = auth.uid()). Con RLS activo, el
-- panel de Usuarios no podría listar al equipo. Se agrega lectura por tenant.
drop policy if exists t_usuarios on usuarios;
create policy t_usuarios on usuarios for select using (empresa_id = mi_empresa());

-- ---------- 3. Columnas de branding/config por tenant en empresas ----------
alter table empresas add column if not exists slug             text;
alter table empresas add column if not exists nombre_comercial text;
alter table empresas add column if not exists color_primario   text;              -- hex, ej. '#2743C0'
alter table empresas add column if not exists tasa_impuesto    numeric(5,4) not null default 0.18;
alter table empresas add column if not exists moneda           text not null default 'PEN';
alter table empresas add column if not exists modulos          jsonb not null default '[]'::jsonb;  -- entitlements
alter table empresas add column if not exists areas            jsonb not null default '[]'::jsonb;  -- áreas por tenant
-- logo_url ya existe.

-- slug único (parcial: permite null mientras no se asigna)
create unique index if not exists empresas_slug_uidx on empresas (slug) where slug is not null;

-- ---------- 4. Bucket de branding (logos por tenant, lectura pública) ----------
insert into storage.buckets (id, name, public) values ('branding','branding', true)
on conflict (id) do nothing;

drop policy if exists s_branding_r on storage.objects;
create policy s_branding_r on storage.objects for select
  using (bucket_id = 'branding');                       -- lectura pública (login pre-auth)

drop policy if exists s_branding_w on storage.objects;
create policy s_branding_w on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = mi_empresa()::text);
