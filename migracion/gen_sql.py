#!/usr/bin/env python3
"""Genera db/seed.sql y db/import.sql a partir de los CSVs y las matrices del procedimiento."""
import csv, uuid, json
from collections import Counter, defaultdict

NS = uuid.UUID('c0ffee00-0000-4000-8000-000000000000')
def uid(*parts): return str(uuid.uuid5(NS, '|'.join(parts)))
def q(s):
    if s is None or s == '': return 'null'
    return "'" + str(s).replace("'", "''").strip() + "'"

EMPRESA = uid('empresa','alfaco')

CAT_MAP = {  # nombre crudo del Excel -> (nombre canónico, tipo)
 '1. BIENES GENERALES': ('Bienes Generales','bien'),
 '1. SERVICIOS GENERALES': ('Servicios Generales','servicio'),
 '3. TRANSPORTE DE MATERIALES (FURGONES, CAMIONES)': ('Transporte de Materiales','servicio'),
 '1. TRANSPORTE PRIVADO (AUTOS, CAMIONETAS, OTROS)': ('Transporte Privado','servicio'),
 '2. MOVILIDAD PARA OBRA': ('Movilidad para Obra','servicio'),
 '1. MAQUINARIA PESADA': ('Maquinaria Pesada','servicio'),
 'SERVICIO DE SEGURIDAD': ('Servicio de Seguridad','servicio'),
 '6. SUMISTRO DE CONCRETO PRE-MEZCLADO': ('Suministro de Concreto Pre-mezclado','bien'),
 '2. EQUIPOS PODER': ('Equipos Poder','servicio'),
 'ALQUILER Y ARRENDAMIENTO DE OTROS TIPOS DE MAQUINARIA, EQUIPO Y BIENES TANGIBLES': ('Alquiler de Maquinaria y Equipos','servicio'),
}
PROYECTOS = ['CALIDDA','CONTUGAS','ELECTRODUNAS','TENGDA','GENERAL']

# ---------- SEED ----------
S = ["-- SEED: datos iniciales. Ejecutar DESPUÉS de schema.sql. Idempotente NO — ejecutar una sola vez.", ""]
S.append(f"insert into empresas (id, nombre, ruc) values ({q(EMPRESA)}, 'Alfa Co S.A.C.', null);")
S.append("")
for p in PROYECTOS:
    S.append(f"insert into proyectos (id, empresa_id, nombre) values ({q(uid('proy',p))}, {q(EMPRESA)}, {q(p)});")
S.append("")
for nombre, tipo in sorted(set(CAT_MAP.values())):
    S.append(f"insert into categorias (id, empresa_id, nombre, tipo) values ({q(uid('cat',nombre))}, {q(EMPRESA)}, {q(nombre)}, {q(tipo)});")
S.append("")
S.append("-- Niveles de aprobación (default LOG-GN-P-02; Francys validará)")
S.append(f"insert into niveles_aprobacion (id, empresa_id, orden, nombre, monto_desde, monto_hasta) values ({q(uid('nivel','1'))}, {q(EMPRESA)}, 1, 'Coordinación de Compras', 0, 50000);")
S.append(f"insert into niveles_aprobacion (id, empresa_id, orden, nombre, monto_desde, monto_hasta) values ({q(uid('nivel','2'))}, {q(EMPRESA)}, 2, 'Dirección de Logística y T.I.', 50000, null);")
S.append("")

def matriz(mid, nombre, tipo, estado, criterios, docs=None):
    S.append(f"insert into matrices (id, empresa_id, nombre, tipo, estado) values ({q(mid)}, {q(EMPRESA)}, {q(nombre)}, {q(tipo)}, {q(estado)});")
    for i,(cnom, peso, ops) in enumerate(criterios, 1):
        cid = uid(mid,'crit',str(i))
        S.append(f"insert into criterios (id, matriz_id, orden, nombre, peso_max) values ({q(cid)}, {q(mid)}, {i}, {q(cnom)}, {peso});")
        for j,(et, desc, pts) in enumerate(ops, 1):
            S.append(f"insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ({q(uid(cid,'op',str(j)))}, {q(cid)}, {j}, {q(et)}, {q(desc)}, {pts});")
    for d in (docs or []):
        S.append(f"insert into matriz_documentos (id, matriz_id, descripcion, eliminatorio) values ({q(uid(mid,'doc',d))}, {q(mid)}, {q(d)}, true);")
    S.append("")

DOCS_LEGALIDAD = [
 '1. Fotocopia del documento del representante legal y/o persona natural',
 '2. Ficha RUC actualizado, fecha de generación menor a 30 días',
 '3. Formato de Deuda Coactiva (SUNAT), no mayor a 30 días',
 '4. Cotización y/o propuesta económica',
]
# Matriz de SELECCIÓN vigente (LOG-P-03 Tabla 3: 5 criterios x 20)
M_SEL = uid('matriz','seleccion-v1')
matriz(M_SEL, 'Selección de Proveedores (LOG-P-03 v1)', 'seleccion', 'vigente', [
 ('Precios', 20, [('EXCELENTE','Menor que el promedio del mercado',20),('BUENO','Igual al promedio del mercado',15),('NO CUMPLE','Mayor que el promedio del mercado',0)]),
 ('Atención del proveedor / Soporte técnico', 20, [('EXCELENTE','Atención excelente',20),('BUENO','Atención buena',15),('NO CUMPLE','Atención mala',0)]),
 ('Calidad certificada (ISO o similar)', 20, [('EXCELENTE','Posee certificado',20),('BUENO','En proceso o posee controles internos',15),('NO CUMPLE','No posee',0)]),
 ('Forma de pago', 20, [('EXCELENTE','Crédito superior a 30 días o más',20),('BUENO','Crédito a 30 días',15),('NO CUMPLE','Inferior a 30 días o sin plazos',0)]),
 ('Servicio Posventa / Garantías', 20, [('EXCELENTE','Otorga garantía total',20),('BUENO','Otorga garantía parcial',15),('NO CUMPLE','No otorga garantía',0)]),
], DOCS_LEGALIDAD)

# Matriz de EVALUACIÓN vigente (LOG-P-03 6.3.1: 6 criterios x15 + otras 10)
def ops3(desc_exc, desc_bue, desc_no, peso):
    return [('EXCELENTE',desc_exc,peso),('BUENO',desc_bue,round(peso*2/3)),('NO CUMPLE',desc_no,0)]
M_EVA = uid('matriz','evaluacion-v1')
matriz(M_EVA, 'Evaluación de Proveedores (LOG-P-03 v1)', 'evaluacion', 'vigente', [
 ('Precio', 15, ops3('El precio es inferior a la oferta del mercado','El precio es competitivo','El precio no es competitivo',15)),
 ('Cumplimiento de cantidad y entrega', 15, ops3('Entrega cantidades pactadas antes de la fecha estipulada','Entrega cantidades pactadas en la fecha estipulada','No cumple cantidades o fecha',15)),
 ('Entrega de documentación', 15, ops3('Entrega oportuna y documentación actualizada','Entrega/actualiza parcialmente en fecha posterior','No entrega ni actualiza documentación',15)),
 ('Forma de pago', 15, [('EXCELENTE','Crédito superior a 30 días o más',15),('BUENO','Crédito a 30 días',10),('REGULAR','Crédito a 15 días',5),('NO CUMPLE','Inferior a 15 días o sin plazos',0)]),
 ('Servicio postventa / Garantía', 15, ops3('Garantía total y control postventa','Garantía parcial, se preocupa por calidad','No otorga garantía, atiende tardíamente',15)),
 ('Calidad y cumplimiento de especificaciones técnicas', 15, ops3('Supera expectativas y mejora especificaciones','Cumple requisitos y especificaciones','Inconformidades en calidad/especificaciones',15)),
 ('Otras especificaciones', 10, ops3('Logística, personal calificado y servicio según lo pactado','Cumplimiento parcial','No cumplió',10)),
])

# Matrices históricas para la migración (archivadas)
M_HSEL, M_HEVA = uid('matriz','hist-sel'), uid('matriz','hist-eva')
S.append(f"insert into matrices (id, empresa_id, nombre, tipo, estado) values ({q(M_HSEL)}, {q(EMPRESA)}, 'Histórica — Selección (migración Excel)', 'seleccion', 'archivada');")
S.append(f"insert into matrices (id, empresa_id, nombre, tipo, estado) values ({q(M_HEVA)}, {q(EMPRESA)}, 'Histórica — Evaluación (migración Excel)', 'evaluacion', 'archivada');")

open('../db/seed.sql','w').write('\n'.join(S))

# ---------- IMPORT ----------
rows = list(csv.DictReader(open('evaluaciones.csv')))
provs = list(csv.DictReader(open('proveedores.csv')))
I = ["-- IMPORT: base real migrada del Excel. Ejecutar DESPUÉS de seed.sql.", ""]
for p in provs:
    pid = uid('prov', p['ruc'])
    I.append(f"insert into proveedores (id, empresa_id, ruc, razon_social, direccion, distrito, estado) values ({q(pid)}, {q(EMPRESA)}, {q(p['ruc'])}, {q(p['razon_social'])}, {q(p['direccion'])}, {q(p['distrito'])}, 'registrado');")
I.append("")

CAL = {'Confiable':'confiable','Medianamente Confiable':'medianamente_confiable','No Confiable':'no_confiable'}
PROC = {'Evaluación':'evaluacion','Selección':'seleccion'}
# proveedor_categorias: última evaluación por (ruc, categoría canónica)
pc_latest = {}
for r in rows:
    cat = CAT_MAP[r['categoria']][0]
    k = (r['ruc'], cat)
    if k not in pc_latest or r['fecha_evaluacion'] > pc_latest[k]['fecha_evaluacion']:
        pc_latest[k] = r
for (ruc,cat), r in sorted(pc_latest.items()):
    pcid = uid('pc', ruc, cat)
    I.append(f"insert into proveedor_categorias (id, empresa_id, proveedor_id, categoria_id, suministro, calificacion_actual, nota_actual, proxima_evaluacion) values ({q(pcid)}, {q(EMPRESA)}, {q(uid('prov',ruc))}, {q(uid('cat',cat))}, {q(r['suministro'])}, {q(CAL[r['calificacion']])}, {r['nota']}, {q(r['fecha_proxima_eval'])});")
I.append("")
seen = Counter()
for r in rows:
    cat = CAT_MAP[r['categoria']][0]
    cod = r['codigo'] or f"MIG-{r['ruc']}-{r['fecha_evaluacion']}"
    seen[cod] += 1
    if seen[cod] > 1: cod = f"{cod}-{seen[cod]}"
    mid = M_HEVA if PROC[r['proceso']]=='evaluacion' else M_HSEL
    proy = f"(select id from proyectos where empresa_id={q(EMPRESA)} and nombre={q(r['proyecto'])})" if r['proyecto'] in PROYECTOS else 'null'
    I.append(f"insert into evaluaciones (id, empresa_id, proveedor_categoria_id, matriz_id, proyecto_id, codigo, proceso, fecha, nota, calificacion, observacion, estado) values ({q(uid('ev',cod,r['ruc'],r['fecha_evaluacion']))}, {q(EMPRESA)}, {q(uid('pc',r['ruc'],cat))}, {q(mid)}, {proy}, {q(cod)}, {q(PROC[r['proceso']])}, {q(r['fecha_evaluacion'])}, {r['nota']}, {q(CAL[r['calificacion']])}, {q(r['observacion'])}, 'completada');")
open('../db/import.sql','w').write('\n'.join(I))
print(f"seed.sql: {len(S)} líneas | import.sql: {len(I)} líneas | proveedores={len(provs)} pc={len(pc_latest)} evals={len(rows)}")
