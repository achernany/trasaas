-- ============================================================
-- FASE 2b (2026-07-14, tras llamada con Fran)
-- Cierre de aprobación por PDF: nuevo tipo de documento
-- "aprobacion" en el expediente + fecha de envío para SLA.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

alter table cuadro_documentos drop constraint if exists cuadro_documentos_tipo_check;
alter table cuadro_documentos add constraint cuadro_documentos_tipo_check
  check (tipo in ('ticket','cotizacion','oc','aprobacion','otro'));

-- SLA: momento de envío y de resolución del comparativo
alter table cuadros add column if not exists enviado_en timestamptz;
alter table cuadros add column if not exists resuelto_en timestamptz;
update cuadros set enviado_en = creado_en where enviado_en is null;
