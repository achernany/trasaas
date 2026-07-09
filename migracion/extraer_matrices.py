#!/usr/bin/env python3
"""Extrae criterios y opciones de las hojas de matrices del Excel de Francys → matrices.json"""
import xlrd, json, sys, re

XLS = sys.argv[1] if len(sys.argv) > 1 else 'EvaluacióndeProveedoresConfiable Enero.xls'
wb = xlrd.open_workbook(XLS)

HOJAS = {
    'BIENES':          {'tipo':'seleccion','categoria':'Bienes'},
    'S. GENERALES':    {'tipo':'seleccion','categoria':'Servicios Generales'},
    'S. TRANSPORTES':  {'tipo':'seleccion','categoria':'Servicios de Transporte'},
    'S. MAQUINARIAS':  {'tipo':'seleccion','categoria':'Servicios de Maquinaria'},
    'S. SALUD.':       {'tipo':'seleccion','categoria':'Servicios de Salud'},
    'LOG-F-P03-01':    {'tipo':'seleccion','categoria':'Bienes Generales'},
    'EVAL. BIENES':    {'tipo':'evaluacion','categoria':'Bienes'},
    'EVAL. SERVICIOS': {'tipo':'evaluacion','categoria':'Servicios'},
}

def txt(s, r, c):
    if r >= s.nrows or c >= s.ncols: return ''
    v = s.cell_value(r, c)
    if isinstance(v, float) and v == int(v): v = int(v)
    return str(v).strip()

matrices = []
for hoja, meta in HOJAS.items():
    s = wb.sheet_by_name(hoja)
    criterios, docs = [], []
    actual = None
    en_docs = False
    for r in range(s.nrows):
        num, nombre, opcion = txt(s,r,1), txt(s,r,2), txt(s,r,4)
        peso = txt(s,r,11)
        # bloque de documentos (checklist eliminatorio)
        if 'DOCUMENTOS' in nombre.upper() or 'Documentos Adicional' in nombre:
            en_docs = True; actual = None; continue
        if en_docs:
            d = txt(s,r,2)
            if d and not d.startswith('Descripción') and 'Cargo' not in txt(s,r,1):
                if re.match(r'^\d+\.', d) or len(d) > 15:
                    docs.append(d)
            continue
        # criterio nuevo
        if num.replace('.','').isdigit() and nombre:
            actual = {'nombre': nombre, 'peso_max': float(peso) if peso else None, 'opciones': []}
            criterios.append(actual)
            if opcion: actual['opciones'].append(opcion)
        elif actual is not None and opcion and not num:
            actual['opciones'].append(opcion)
    matrices.append({'hoja': hoja, **meta, 'criterios': criterios, 'documentos_legalidad': docs})

with open('matrices.json','w',encoding='utf-8') as f:
    json.dump(matrices, f, ensure_ascii=False, indent=2)

for m in matrices:
    tot = sum(c['peso_max'] or 0 for c in m['criterios'])
    print(f"{m['hoja']:18} {m['tipo']:10} crit={len(m['criterios'])} docs={len(m['documentos_legalidad'])} suma_pesos={tot}")
