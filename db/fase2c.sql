-- ============================================================
-- FASE 2c (2026-07-18) — Archivos oficiales de Fran
-- Formato DATA SIG del ERP, especificación/marca por cotización,
-- tiempo requerido del comparativo.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

-- Catálogo: formato real del ERP (DATA SIG)
alter table items add column if not exists grupo text;                -- "Grupo Material"
alter table items add column if not exists precio_con_igv numeric(14,2);
alter table items add column if not exists fecha_ultima_compra date;  -- para el cuadro

-- Comparativo oficial LOGFP0202
alter table cotizacion_precios add column if not exists especificacion text; -- "ESPECIFICACIÓN / MARCA"
alter table cuadros add column if not exists tiempo_requerido_dias int;      -- criterio TIEMPO (binario)
