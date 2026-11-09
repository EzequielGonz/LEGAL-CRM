# Métricas de variedad de las piezas fijas que se reasignan (pendientes y liberadas)
import json, re, os
from datetime import datetime, timedelta
from collections import defaultdict, Counter
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
hechos = {}
for l in open(LEDGER):
    if l.strip():
        j = json.loads(l)
        if j.get('ok'): hechos[(j['marca'], j['fecha'], j['tipo'])] = j['pieza']
LIB = {tuple(x) for x in json.load(open('liberar.json'))}
for k in LIB: hechos.pop(k, None)
P = json.load(open('plan.json'))['plan']
fin = [(p['marca'], p['fecha'], p['tipo'], hechos.get((p['marca'], p['fecha'], p['tipo']), p['pieza']), (p['marca'], p['fecha'], p['tipo']) not in hechos) for p in P]
def tema(pz):
    v = re.sub(r'-(voz|tendencia|post\d+|carrusel|his0|hisC)$', '', pz); return v[:-2] if v.endswith(('-b', '-c', '-d')) else v
def var(pz):
    if pz.endswith(('-his0', '-hisC')): return None
    return re.sub(r'-(voz|tendencia|post\d+|carrusel)$', '', pz)
reels_dia = defaultdict(set)
for m, f, t, pz, nuevo in fin:
    if t == 'reel': reels_dia[(m, f[:10])].add(tema(pz))
textos = defaultdict(list)
for m, f, t, pz, nuevo in fin:
    if var(pz): textos[m].append((datetime.fromisoformat(f), var(pz), t, pz))
n = 0; tr = 0; tc = 0; ej = []
for m, f, t, pz, nuevo in fin:
    if not nuevo or t == 'reel': continue
    n += 1
    if tema(pz) in reels_dia[(m, f[:10])] and not pz.endswith('-hisC'): tr += 1
    v = var(pz)
    if v:
        c = datetime.fromisoformat(f)
        cerca = [x for x in textos[m] if x[1] == v and x[3] != pz or (x[1] == v and x[3] == pz and x[0] != c)]
        cerca = [x for x in cerca if timedelta(0) < abs(x[0] - c) < timedelta(days=3)]
        if cerca: tc += 1; ej.append((m, f, pz, [(str(x[0])[5:16], x[3]) for x in cerca]))
print(f'fijas reasignadas: {n} | con tema de un reel del día: {tr} | con el mismo texto a menos de 3 días: {tc}')
for e in ej[:12]: print('  ', e)
for m in ('vita', 'cob', 'mkt', 'autos'):
    c = Counter(pz for mm, f, t, pz, _ in fin if mm == m and t != 'reel')
    print(' ', m, 'máx usos', max(c.values()), Counter(c.values()))
