-- ============================================================
-- FASE 2d (2026-07-19) — Cuadro oficial LOGFP0202 + aprobación
-- interna con APROBACIÓN PARCIAL POR ÍTEM y bandeja de ítems
-- pendientes de compra.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

-- 1) Trazabilidad del puntaje: se congela el desglose por criterio
--    al momento de elaborar el cuadro (auditoría: se puede demostrar
--    con qué puntajes se decidió, aunque la matriz cambie después).
alter table cotizaciones add column if not exists puntajes jsonb;

-- 2) Aprobación parcial: cada ítem del cuadro tiene su propia resolución
alter table cuadro_items
  add column if not exists estado_aprobacion text not null default 'pendiente';
alter table cuadro_items
  add column if not exists observacion_aprobador text;
alter table cuadro_items
  add column if not exists resuelto_en timestamptz;

do $$
begin
  alter table cuadro_items drop constraint if exists cuadro_items_estado_aprobacion_check;
  alter table cuadro_items add constraint cuadro_items_estado_aprobacion_check
    check (estado_aprobacion in
      ('pendiente','aprobado','no_aprobado','descartado','recomprado'));
end $$;

-- 3) El cuadro puede quedar aprobado parcialmente
do $$
begin
  alter table cuadros drop constraint if exists cuadros_estado_check;
  alter table cuadros add constraint cuadros_estado_check
    check (estado in
      ('borrador','enviado','aprobado','aprobado_parcial','rechazado','reenviado'));
end $$;

-- 4) La resolución del aprobador también puede ser parcial
do $$
begin
  alter table aprobaciones drop constraint if exists aprobaciones_accion_check;
  alter table aprobaciones add constraint aprobaciones_accion_check
    check (accion in ('aprobado','aprobado_parcial','rechazado'));
end $$;

-- 5) Bandeja: de qué cuadro viene el ítem cuando se vuelve a comprar
alter table cuadro_items
  add column if not exists origen_item_id uuid references cuadro_items(id);

create index if not exists idx_cuadro_items_estado
  on cuadro_items (estado_aprobacion);
