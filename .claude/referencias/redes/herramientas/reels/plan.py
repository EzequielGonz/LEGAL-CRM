# Arma el calendario de 15 días (10/11 al 24/11) por marca, con reciclado:
# 5 reels, 2 posts, 1 carrusel y 2 historias por día. Salida: plan.json
import json, glob, os, datetime
MARCAS = ['vita', 'cob', 'autos', 'mkt']
DOM = {'vita': 'https://www.estudiojuridicovita.com', 'cob': 'https://www.comparatuobrasocial.com',
       'autos': 'https://www.autoskocos.com', 'mkt': 'https://www.kocosmkt.com'}
H_REEL = ['08:30', '11:00', '13:30', '17:00', '20:30']
H_POST = ['10:00', '19:00']; H_CAR = '12:30'; H_HIS = ['09:30', '18:30']
INICIO = datetime.date(2026, 11, 10); DIAS = 15
textos = json.load(open('textos.json'))
tl = {os.path.basename(f)[:-8]: json.load(open(f)) for f in glob.glob('reels/*.tl.json')}
# Contenido nuevo del análisis de competencia (09/11): solo para reels y desde el día 7 (17/11),
# así los días ya programados se calculan igual que antes.
NUEVOS = {'vita-nunca': 'vita', 'mkt-api': 'mkt'}
GANCHOS_D = {'vita-firmas': 'vita', 'cob-familia': 'cob', 'autos-lista': 'autos'}
DESDE = 7
base = {m: sorted(i for i in tl if i.startswith(m + '-') and not i.endswith(('-b', '-c', '-d')) and i not in NUEVOS) for m in MARCAS}

def texto(v):
    k = v[:-2] if v.endswith(('-b', '-c', '-d')) else v
    t = textos[k]['texto']
    if v.endswith('-b') and textos[k].get('ganchoB'):
        t = t.replace(textos[k]['gancho'], textos[k]['ganchoB'], 1)
    if v.endswith('-d') and textos[k].get('ganchoD'):
        t = t.replace(textos[k]['gancho'], textos[k]['ganchoD'], 1)
    return t

def portada_ms(v):
    e = tl[v]['escenas'][0]
    return int(min(e['t1'] - .25, e['seg'][0]['t'] + 1.7) * 1000)

plan = []; reels_usados = set(); estaticas = []
import re
YA = {}
if os.path.exists('/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'):
    YA = {(j['marca'], j['fecha'], j['tipo']): j['pieza'] for j in map(json.loads, filter(str.strip, open('/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'))) if j.get('ok')}
for m in MARCAS:
    B = base[m]
    # reels: prioridad voz original, voz gancho B, voz corta, después las versiones con música
    cand = []
    for aud, pr in (('voz', 0), ('tendencia', 3)):
        for k in B:
            cand.append({'v': k, 'a': aud, 'pr': pr, 'k': k})
            cand.append({'v': k + '-b', 'a': aud, 'pr': pr + 1, 'k': k})
            if k + '-c' in tl: cand.append({'v': k + '-c', 'a': aud, 'pr': pr + 2, 'k': k})
    for nuevo, mm_ in NUEVOS.items():
        if mm_ != m: continue
        for aud, pr in (('voz', 0), ('tendencia', 3)):
            cand.append({'v': nuevo, 'a': aud, 'pr': pr, 'k': nuevo, 'desde': DESDE})
            cand.append({'v': nuevo + '-b', 'a': aud, 'pr': pr + 1, 'k': nuevo, 'desde': DESDE})
            if nuevo + '-c' in tl: cand.append({'v': nuevo + '-c', 'a': aud, 'pr': pr + 2, 'k': nuevo, 'desde': DESDE})
    for k_, mm_ in GANCHOS_D.items():
        if mm_ != m: continue
        for aud, pr in (('voz', 0), ('tendencia', 3)):
            cand.append({'v': k_ + '-d', 'a': aud, 'pr': pr, 'k': k_, 'desde': DESDE})
    for c in cand: c['usos'] = 0; c['ult'] = -99
    ultimo_tema = {}  # día en que salió por última vez cada tema nuevo: día por medio como mucho
    from collections import Counter
    cnt = {c: Counter() for c in ('post', 'car', 'cont', 'his')}
    # rotación de guiones por día para piezas fijas
    for d in range(DIAS):
        fecha = INICIO + datetime.timedelta(days=d)
        hoy = set(); elegidos = []
        for _ in range(5):
            disp = [c for c in cand if d >= c.get('desde', 0) and ('desde' not in c or d - ultimo_tema.get(c['k'], -99) >= 2)]
            ok = [c for c in disp if c['k'] not in hoy and c['usos'] < 2 and (c['usos'] == 0 or d - c['ult'] >= 7)]
            if not ok: ok = [c for c in disp if c['k'] not in hoy and c['usos'] < 2]
            if not ok: ok = [c for c in disp if c['usos'] < 2]
            if not ok: ok = [c for c in disp if c['k'] not in hoy]
            ok.sort(key=lambda c: (c['usos'], c['pr'], (B.index(c['k']) - d) % len(B) if c['k'] in B else -1))
            c = ok[0]; c['usos'] += 1; c['ult'] = d; hoy.add(c['k']); elegidos.append(c)
            if 'desde' in c: ultimo_tema[c['k']] = d
        for h, c in zip(H_REEL, elegidos):
            f = f"{c['v']}-{c['a']}.mp4"; reels_usados.add(c['v'])
            plan.append({'marca': m, 'fecha': f'{fecha}T{h}:00', 'tipo': 'reel', 'archivos': [f], 'texto': texto(c['v']),
                         'ai': c['a'] == 'voz', 'portada_ms': portada_ms(c['v']), 'pieza': f"{c['v']}-{c['a']}"})
        # piezas fijas: guiones distintos entre sí y, si se puede, distintos de los reels del día.
        # La primera vez que sale un guion va el original; la segunda, el gancho B.
        tomados = set(hoy) | {re.sub(r'(-b|-c)?(-voz|-tendencia|-post\d+|-carrusel|-his0|-hisC)$', '', pz)
                              for (m2, fe, t2), pz in YA.items() if m2 == m and fe.startswith(str(fecha))}
        def elegir(cat, off):
            cands = sorted(B, key=lambda k: (cnt[cat][k], (B.index(k) - d - off) % len(B)))
            k = next((x for x in cands if x not in tomados), cands[0])
            cnt[cat][k] += 1; tomados.add(k); return k
        kh = elegir('post', 0); vh = kh if cnt['post'][kh] == 1 else kh + '-b'
        fh = f'{vh}-post0.jpg'
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_POST[0]}:00', 'tipo': 'post', 'archivos': [fh], 'texto': texto(vh), 'pieza': f'{vh}-post0'})
        kcar = elegir('car', 2); v = kcar if cnt['car'][kcar] == 1 else kcar + '-b'
        n = len(tl[v]['escenas']); fs = [f'{v}-car{i}.jpg' for i in range(n)]
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_CAR}:00', 'tipo': 'carrusel', 'archivos': fs, 'texto': texto(v), 'pieza': f'{v}-carrusel'})
        kc = elegir('cont', 4); esc = tl[kc]['escenas']
        idxs = [i for i, e in enumerate(esc) if e['tipo'] in ('lista', 'dato', 'sello', 'objeto', 'compara') or (e['tipo'] == 'titulo' and e.get('sub'))]
        ic = idxs[(cnt['cont'][kc] - 1) % len(idxs)] if idxs else 0
        fc = f'{kc}-post{ic}.jpg'
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_POST[1]}:00', 'tipo': 'post', 'archivos': [fc], 'texto': texto(kc), 'pieza': f'{kc}-post{ic}'})
        ks = elegir('his', 6); vs = ks if cnt['his'][ks] == 1 else ks + '-b'
        f0 = f'{vs}-his0.jpg'; fC = f'{ks}-hisC.jpg'
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_HIS[0]}:00', 'tipo': 'historia', 'archivos': [f0], 'texto': '', 'pieza': f'{vs}-his0'})
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_HIS[1]}:00', 'tipo': 'historia', 'archivos': [fC], 'texto': '', 'pieza': f'{ks}-hisC'})
# lo que ya quedó programado en Metricool manda sobre el plan
import re
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
def desde_pieza(pz):
    if pz.endswith('-carrusel'):
        v = pz[:-9]; return [f'{v}-car{i}.jpg' for i in range(len(tl[v]['escenas']))], texto(v)
    if re.search(r'-post\d+$', pz): v = re.sub(r'-post\d+$', '', pz); return [pz + '.jpg'], texto(v)
    if pz.endswith(('-his0', '-hisC')): return [pz + '.jpg'], ''
    return [pz + '.mp4'], texto(pz.rsplit('-', 1)[0])
if os.path.exists(LEDGER):
    hechos = {(j['marca'], j['fecha'], j['tipo']): j['pieza'] for j in map(json.loads, filter(str.strip, open(LEDGER))) if j.get('ok')}
    for p in plan:
        pz = hechos.get((p['marca'], p['fecha'], p['tipo']))
        if pz and pz != p['pieza']:
            p['archivos'], p['texto'] = desde_pieza(pz); p['pieza'] = pz
# piezas fijas necesarias, derivadas del plan final
for p in plan:
    for f in p['archivos']:
        if f.endswith('.mp4'): continue
        mm = re.match(r'(.+)-(car|post)(\d+)\.jpg$', f)
        if mm: estaticas.append((mm[1], 'carrusel' if mm[2] == 'car' else 'post', int(mm[3]), '' if mm[2] == 'car' else 'wa', f)); continue
        v = f[:-9]
        estaticas.append((v, 'historia', 0, 'historia', f) if f.endswith('-his0.jpg') else (v, 'historia', len(tl[v]['escenas']) - 1, '', f))
for p in plan: p['urls'] = [f"{DOM[p['marca']]}/redes/{f}" for f in p['archivos']]
plan.sort(key=lambda p: (p['fecha'], p['marca']))
# orden de render de reels por primer uso
prim = {}
for p in plan:
    if p['tipo'] == 'reel':
        v = p['pieza'].rsplit('-', 1)[0]; prim.setdefault(v, p['fecha'])
json.dump({'plan': plan, 'reels': sorted(prim, key=lambda v: prim[v]),
           'estaticas': sorted(set(estaticas), key=lambda x: x[4])}, open('plan.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(plan), Counter(p['tipo'] for p in plan), 'reels a renderizar:', len(prim), 'estáticas:', len(set(estaticas)))
for m in MARCAS:
    us = Counter(p['pieza'] for p in plan if p['marca'] == m and p['tipo'] == 'reel')
    print(m, 'archivos de reel distintos:', len(us), 'máx usos:', max(us.values()))
