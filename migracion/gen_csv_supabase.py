#!/usr/bin/env python3
"""CSVs con UUIDs resueltos para el importador de Supabase (mismos IDs que seed.sql)."""
import csv, uuid
from collections import Counter

NS = uuid.UUID('c0ffee00-0000-4000-8000-000000000000')
def uid(*parts): return str(uuid.uuid5(NS, '|'.join(parts)))
EMPRESA = uid('empresa','alfaco')
CAT_MAP = {
 '1. BIENES GENERALES': 'Bienes Generales',
 '1. SERVICIOS GENERALES': 'Servicios Generales',
 '3. TRANSPORTE DE MATERIALES (FURGONES, CAMIONES)': 'Transporte de Materiales',
 '1. TRANSPORTE PRIVADO (AUTOS, CAMIONETAS, OTROS)': 'Transporte Privado',
 '2. MOVILIDAD PARA OBRA': 'Movilidad para Obra',
 '1. MAQUINARIA PESADA': 'Maquinaria Pesada',
 'SERVICIO DE SEGURIDAD': 'Servicio de Seguridad',
 '6. SUMISTRO DE CONCRETO PRE-MEZCLADO': 'Suministro de Concreto Pre-mezclado',
 '2. EQUIPOS PODER': 'Equipos Poder',
 'ALQUILER Y ARRENDAMIENTO DE OTROS TIPOS DE MAQUINARIA, EQUIPO Y BIENES TANGIBLES': 'Alquiler de Maquinaria y Equipos',
}
PROY = {p: uid('proy',p) for p in ['CALIDDA','CONTUGAS','ELECTRODUNAS','TENGDA','GENERAL']}
CAL = {'Confiable':'confiable','Medianamente Confiable':'medianamente_confiable','No Confiable':'no_confiable'}
PROC = {'Evaluación':'evaluacion','Selección':'seleccion'}
M_HSEL, M_HEVA = uid('matriz','hist-sel'), uid('matriz','hist-eva')

rows = list(csv.DictReader(open('evaluaciones.csv')))
provs = list(csv.DictReader(open('proveedores.csv')))
import os
os.makedirs('supabase', exist_ok=True)

with open('supabase/1_proveedores.csv','w',newline='') as f:
    w = csv.writer(f); w.writerow(['id','empresa_id','ruc','razon_social','direccion','distrito','estado'])
    for p in provs:
        w.writerow([uid('prov',p['ruc']), EMPRESA, p['ruc'], p['razon_social'], p['direccion'], p['distrito'], 'registrado'])

pc_latest = {}
for r in rows:
    k = (r['ruc'], CAT_MAP[r['categoria']])
    if k not in pc_latest or r['fecha_evaluacion'] > pc_latest[k]['fecha_evaluacion']: pc_latest[k] = r
with open('supabase/2_proveedor_categorias.csv','w',newline='') as f:
    w = csv.writer(f); w.writerow(['id','empresa_id','proveedor_id','categoria_id','suministro','calificacion_actual','nota_actual','proxima_evaluacion'])
    for (ruc,cat), r in sorted(pc_latest.items()):
        w.writerow([uid('pc',ruc,cat), EMPRESA, uid('prov',ruc), uid('cat',cat), r['suministro'], CAL[r['calificacion']], r['nota'], r['fecha_proxima_eval']])

seen = Counter()
with open('supabase/3_evaluaciones.csv','w',newline='') as f:
    w = csv.writer(f); w.writerow(['id','empresa_id','proveedor_categoria_id','matriz_id','proyecto_id','codigo','proceso','fecha','nota','calificacion','observacion','estado'])
    for r in rows:
        cat = CAT_MAP[r['categoria']]
        cod = r['codigo'] or f"MIG-{r['ruc']}-{r['fecha_evaluacion']}"
        seen[cod] += 1
        if seen[cod] > 1: cod = f"{cod}-{seen[cod]}"
        mid = M_HEVA if PROC[r['proceso']]=='evaluacion' else M_HSEL
        w.writerow([uid('ev',cod,r['ruc'],r['fecha_evaluacion']), EMPRESA, uid('pc',r['ruc'],cat), mid,
                    PROY.get(r['proyecto'],''), cod, PROC[r['proceso']], r['fecha_evaluacion'], r['nota'],
                    CAL[r['calificacion']], r['observacion'], 'completada'])
print('OK', *[f"{n}:{sum(1 for _ in open('supabase/'+n))-1}" for n in os.listdir('supabase')])
