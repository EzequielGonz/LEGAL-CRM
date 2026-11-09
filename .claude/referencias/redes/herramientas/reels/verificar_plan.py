# Verifica el plan completo (lo programado manda): reglas de reciclado y variedad por día.
import json, re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
hechos = {}
for l in open(LEDGER):
    if l.strip():
        j = json.loads(l)
        if j.get('ok'): hechos[(j['marca'], j['fecha'], j['tipo'])] = j['pieza']
import os
# las liberadas se verifican como van a quedar después de actualizarlas en Metricool
for k in ({tuple(x) for x in json.load(open('liberar.json'))} if os.path.exists('liberar.json') else set()): hechos.pop(k, None)
P = json.load(open('plan.json'))['plan']
def tema(pz):
    v = re.sub(r'-(voz|tendencia|post\d+|carrusel|his0|hisC)$', '', pz)
    return v[:-2] if v.endswith(('-b', '-c', '-d')) else v
final = [(p['marca'], p['fecha'], p['tipo'], hechos.get((p['marca'], p['fecha'], p['tipo']), p['pieza'])) for p in P]
print('entradas:', len(final), 'programadas:', sum((m, f, t) in hechos for m, f, t, _ in final), Counter(t for _, _, t, _ in final))
uso = defaultdict(list)
for m, f, t, pz in final: uso[(m, pz)].append(datetime.fromisoformat(f))
mal = []
for (m, pz), fs in uso.items():
    fs.sort()
    es_reel = pz.endswith(('-voz', '-tendencia'))
    if es_reel and len(fs) > 2: mal.append(('reel más de 2 veces', m, pz, len(fs)))
    for a, b in zip(fs, fs[1:]):
        if b - a < timedelta(days=7): mal.append(('menos de 7 días', m, pz, str(a), str(b)))
print('violaciones de 7 días / usos:', len(mal))
for x in mal: print('  ', x)
# por día
dia = defaultdict(list)
for m, f, t, pz in final: dia[(m, f[:10])].append((t, pz))
rep_fijas = 0; con_reel = 0; total_fijas = 0
for (m, d), xs in sorted(dia.items()):
    fijas = [(t, pz) for t, pz in xs if t != 'reel']
    temas_f = [tema(pz) for t, pz in fijas if not pz.endswith('-hisC')]  # el par de historias comparte tema a propósito
    if len(temas_f) != len(set(temas_f)): rep_fijas += 1; print('  tema repetido entre fijas', m, d, temas_f)
    tr = {tema(pz) for t, pz in xs if t == 'reel'}
    total_fijas += len(temas_f); con_reel += sum(t in tr for t in temas_f)
    temas_r = [tema(pz) for t, pz in xs if t == 'reel']
    if len(temas_r) != len(set(temas_r)): print('  tema repetido entre reels', m, d, temas_r)
print('días con tema repetido entre fijas:', rep_fijas, '| fijas que comparten tema con un reel del día:', con_reel, 'de', total_fijas)
# piezas por marca: usos
for m in ('vita', 'cob', 'mkt', 'autos'):
    c = Counter(pz for mm, f, t, pz in final if mm == m and t != 'reel')
    print(m, 'fijas distintas:', len(c), 'máx usos:', max(c.values()), Counter(c.values()))
