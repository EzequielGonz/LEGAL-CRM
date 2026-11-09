# Para las piezas fijas ya programadas que repiten imagen a menos de 7 días: elige un reemplazo
# para la segunda aparición, sin romper la regla con ninguna otra salida del plan completo.
import json, re, os, glob
from datetime import datetime, timedelta
from collections import defaultdict
exec(open('espaciar.py').read().split('# Historial:')[0])  # reusa inventario, texto() y tema_pieza()
SEM = timedelta(days=7)
P = json.load(open('plan.json'))['plan']
final = []
for p in P:
    k = (p['marca'], p['fecha'], p['tipo'])
    final.append({'marca': p['marca'], 'fecha': p['fecha'], 'tipo': p['tipo'], 'pieza': hechos.get(k, p['pieza']), 'prog': k in hechos})
def salidas(m, pz, salvo=None):
    return [datetime.fromisoformat(e['fecha']) for e in final if e['marca'] == m and e['pieza'] == pz and e is not salvo]
viol = []
for e in final:
    if e['tipo'] == 'reel': continue
    antes = [s for s in salidas(e['marca'], e['pieza'], e) if s < datetime.fromisoformat(e['fecha'])]
    if antes and datetime.fromisoformat(e['fecha']) - max(antes) < SEM: viol.append(e)
out = []
for e in sorted(viol, key=lambda e: e['fecha']):
    m, f = e['marca'], e['fecha']; cuando = datetime.fromisoformat(f)
    mismas = [x for x in final if x['marca'] == m and x['fecha'][:10] == f[:10] and x is not e]
    temas_fijas = {tema_pieza(x['pieza']) for x in mismas if x['tipo'] != 'reel'}
    temas_reels = {tema_pieza(x['pieza']) for x in mismas if x['tipo'] == 'reel'}
    if e['tipo'] == 'carrusel':
        ops = [v + '-carrusel' for v in inv[m]['carrusel']]; pref = lambda x: True
    else:
        ops = inv[m]['post']; pref = (lambda x: x.endswith('-post0')) if f.endswith('10:00:00') else (lambda x: not x.endswith('-post0'))
    def clave(x):
        ss = salidas(m, x)
        dist = min((abs(cuando - s) for s in ss), default=timedelta(days=99))
        return (dist < SEM, tema_pieza(x) in temas_fijas, len(ss), tema_pieza(x) in temas_reels, not pref(x), -dist.total_seconds(), x)
    nuevo = min(ops, key=clave)
    k = clave(nuevo)
    if e['tipo'] == 'carrusel':
        v = nuevo[:-len('-carrusel')]; arch = inv[m]['carrusel'][v]
    else:
        v = re.sub(r'-post\d+$', '', nuevo); arch = [nuevo + '.jpg']
    out.append({'marca': m, 'fecha': f, 'tipo': e['tipo'], 'antes': e['pieza'], 'nuevo': nuevo, 'archivos': arch,
                'urls': [f"{DOM[m]}/redes/{a}" for a in arch], 'texto': texto(v), 'ok7': not k[0], 'tema_reel': k[3]})
    e['pieza'] = nuevo
json.dump(out, open('reemplazos.json', 'w'), ensure_ascii=False, indent=1)
for o in out: print(o['marca'], o['fecha'], o['tipo'], o['antes'], '->', o['nuevo'], '| 7 días ok:', o['ok7'], '| comparte tema con reel:', o['tema_reel'])
