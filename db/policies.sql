-- ============================================================
-- POLICIES: acceso por tenant para usuarios autenticados
-- Ejecutar DESPUÉS de schema.sql (las tablas ya tienen RLS activado).
-- El form público de proveedores NO usa estas políticas: pasa por
-- API routes con service_role (valida token de acceso).
-- ============================================================

-- Función auxiliar: empresa del usuario logueado
create or replace function mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from usuarios where id = auth.uid()
$$;

-- El usuario puede leer su propio perfil (necesario para el layout)
create policy usuarios_self on usuarios
  for select using (id = auth.uid());

-- Lectura por tenant en las tablas del panel
create policy t_empresas on empresas for select using (id = mi_empresa());
create policy t_proyectos on proyectos for select using (empresa_id = mi_empresa());
create policy t_categorias on categorias for select using (empresa_id = mi_empresa());
create policy t_proveedores on proveedores for select using (empresa_id = mi_empresa());
create policy t_pc on proveedor_categorias for select using (empresa_id = mi_empresa());
create policy t_matrices on matrices for select using (empresa_id = mi_empresa());
create policy t_criterios on criterios for select
  using (exists (select 1 from matrices m where m.id = matriz_id and m.empresa_id = mi_empresa()));
create policy t_opciones on criterio_opciones for select
  using (exists (select 1 from criterios c join matrices m on m.id = c.matriz_id
                 where c.id = criterio_id and m.empresa_id = mi_empresa()));
create policy t_mdocs on matriz_documentos for select
  using (exists (select 1 from matrices m where m.id = matriz_id and m.empresa_id = mi_empresa()));
create policy t_evaluaciones on evaluaciones for select using (empresa_id = mi_empresa());
create policy t_ev_resp on evaluacion_respuestas for select
  using (exists (select 1 from evaluaciones e where e.id = evaluacion_id and e.empresa_id = mi_empresa()));
create policy t_ev_docs on evaluacion_documentos for select
  using (exists (select 1 from evaluaciones e where e.id = evaluacion_id and e.empresa_id = mi_empresa()));
create policy t_registros on proveedor_registros for select using (empresa_id = mi_empresa());
create policy t_prov_docs on proveedor_documentos for select
  using (exists (select 1 from proveedor_registros r where r.id = registro_id and r.empresa_id = mi_empresa()));
create policy t_requerimientos on requerimientos for select using (empresa_id = mi_empresa());
create policy t_cuadros on cuadros for select using (empresa_id = mi_empresa());
create policy t_items on cuadro_items for select
  using (exists (select 1 from cuadros c where c.id = cuadro_id and c.empresa_id = mi_empresa()));
create policy t_cotizaciones on cotizaciones for select
  using (exists (select 1 from cuadros c where c.id = cuadro_id and c.empresa_id = mi_empresa()));
create policy t_cot_precios on cotizacion_precios for select
  using (exists (select 1 from cotizaciones z join cuadros c on c.id = z.cuadro_id
                 where z.id = cotizacion_id and c.empresa_id = mi_empresa()));
create policy t_niveles on niveles_aprobacion for select using (empresa_id = mi_empresa());
create policy t_aprobaciones on aprobaciones for select using (empresa_id = mi_empresa());
create policy t_satisfaccion on satisfaccion_respuestas for select using (empresa_id = mi_empresa());
create policy t_audit on audit_log for select using (empresa_id = mi_empresa());

-- Escritura (fase demo: roles internos crean/editan; se afinará por rol)
create policy w_registros on proveedor_registros for insert
  with check (empresa_id = mi_empresa());
create policy w_registros_upd on proveedor_registros for update
  using (empresa_id = mi_empresa());
create policy w_evaluaciones on evaluaciones for insert with check (empresa_id = mi_empresa());
create policy w_evaluaciones_upd on evaluaciones for update using (empresa_id = mi_empresa());
create policy w_ev_resp on evaluacion_respuestas for insert
  with check (exists (select 1 from evaluaciones e where e.id = evaluacion_id and e.empresa_id = mi_empresa()));
create policy w_ev_docs on evaluacion_documentos for insert
  with check (exists (select 1 from evaluaciones e where e.id = evaluacion_id and e.empresa_id = mi_empresa()));
create policy w_pc on proveedor_categorias for insert with check (empresa_id = mi_empresa());
create policy w_pc_upd on proveedor_categorias for update using (empresa_id = mi_empresa());
create policy w_proveedores on proveedores for insert with check (empresa_id = mi_empresa());
create policy w_proveedores_upd on proveedores for update using (empresa_id = mi_empresa());
create policy w_requerimientos on requerimientos for insert with check (empresa_id = mi_empresa());
create policy w_cuadros on cuadros for insert with check (empresa_id = mi_empresa());
create policy w_cuadros_upd on cuadros for update using (empresa_id = mi_empresa());
create policy w_items on cuadro_items for insert
  with check (exists (select 1 from cuadros c where c.id = cuadro_id and c.empresa_id = mi_empresa()));
create policy w_cotizaciones on cotizaciones for insert
  with check (exists (select 1 from cuadros c where c.id = cuadro_id and c.empresa_id = mi_empresa()));
create policy w_cot_precios on cotizacion_precios for insert
  with check (exists (select 1 from cotizaciones z join cuadros c on c.id = z.cuadro_id
                      where z.id = cotizacion_id and c.empresa_id = mi_empresa()));
create policy w_audit on audit_log for insert with check (empresa_id = mi_empresa());

-- Bucket privado para los documentos del registro de proveedores
insert into storage.buckets (id, name, public) values ('registro-docs','registro-docs', false)
on conflict (id) do nothing;
create policy storage_registro_read on storage.objects for select
  using (bucket_id = 'registro-docs' and auth.role() = 'authenticated');

-- ============================================================
-- ALTA DE USUARIOS INTERNOS (ejecutar por cada usuario):
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password)
-- 2. Copiar el UUID del usuario creado y ejecutar:
-- insert into usuarios (id, empresa_id, nombre, email, rol) values
--   ('<UUID-del-auth-user>',
--    (select id from empresas limit 1),
--    'Nombre Apellido', 'correo@dominio.com', 'admin');
-- Roles válidos: admin | coordinador | comprador | aprobador | area_usuaria
-- ============================================================
