#!/usr/bin/env python3
"""Migra BD_EVALUACION del Excel → proveedores.csv + evaluaciones.csv listos para Supabase"""
import xlrd, csv, sys
from datetime import datetime, timedelta

XLS = sys.argv[1]
wb = xlrd.open_workbook(XLS)
s = wb.sheet_by_name('BD_EVALUACION')

def fecha(v):
    if v in ('', None): return ''
    try: return (datetime(1899,12,30) + timedelta(days=float(v))).strftime('%Y-%m-%d')
    except (ValueError, TypeError): return str(v).strip()

def ruc(v):
    if isinstance(v, float): return str(int(v))
    return str(v).strip()

rows = []
for r in range(8, s.nrows):
    vals = [s.cell_value(r, c) for c in range(1, 15)]
    if not str(vals[1]).strip():  # sin RUC -> fila vacía
        continue
    rows.append({
        'codigo': str(vals[0]).strip(),
        'ruc': ruc(vals[1]),
        'razon_social': str(vals[2]).strip(),
        'distrito': str(vals[3]).strip(),
        'direccion': str(vals[4]).strip(),
        'fecha_evaluacion': fecha(vals[5]),
        'proyecto': str(vals[6]).strip(),
        'categoria': str(vals[7]).strip(),
        'suministro': str(vals[8]).strip(),
        'proceso': str(vals[9]).strip(),
        'nota': vals[10] if vals[10] != '' else '',
        'calificacion': str(vals[11]).strip(),
        'observacion': str(vals[12]).strip(),
        'fecha_proxima_eval': fecha(vals[13]),
    })

# proveedores únicos por RUC (datos del registro más reciente)
provs = {}
for x in sorted(rows, key=lambda x: x['fecha_evaluacion']):
    provs[x['ruc']] = {'ruc': x['ruc'], 'razon_social': x['razon_social'],
                       'distrito': x['distrito'], 'direccion': x['direccion']}

with open('proveedores.csv','w',newline='',encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['ruc','razon_social','distrito','direccion'])
    w.writeheader(); w.writerows(provs.values())

with open('evaluaciones.csv','w',newline='',encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

# validaciones
from collections import Counter
print(f'evaluaciones: {len(rows)} | proveedores únicos: {len(provs)}')
print('por proceso:', dict(Counter(x["proceso"] for x in rows)))
print('por calificación:', dict(Counter(x["calificacion"] for x in rows)))
print('categorías:', len(set(x["categoria"] for x in rows)))
sin_nota = [x for x in rows if x['nota']=='']
print('sin nota:', len(sin_nota), '| sin próxima eval:', len([x for x in rows if not x["fecha_proxima_eval"]]))
multi = [r for r,c in Counter(x['ruc'] for x in rows).items() if c>1]
print('RUCs con múltiples evaluaciones/categorías:', len(multi))
