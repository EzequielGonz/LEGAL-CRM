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
base = {m: sorted(i for i in tl if i.startswith(m + '-') and not i.endswith(('-b', '-c'))) for m in MARCAS}

def texto(v):
    k = v[:-2] if v.endswith(('-b', '-c')) else v
    t = textos[k]['texto']
    if v.endswith('-b') and textos[k].get('ganchoB'):
        t = t.replace(textos[k]['gancho'], textos[k]['ganchoB'], 1)
    return t

def portada_ms(v):
    e = tl[v]['escenas'][0]
    return int(min(e['t1'] - .25, e['seg'][0]['t'] + 1.7) * 1000)

plan = []; reels_usados = set(); estaticas = []
for m in MARCAS:
    B = base[m]
    # reels: prioridad voz original, voz gancho B, voz corta, después las versiones con música
    cand = []
    for aud, pr in (('voz', 0), ('tendencia', 3)):
        for k in B:
            cand.append({'v': k, 'a': aud, 'pr': pr, 'k': k})
            cand.append({'v': k + '-b', 'a': aud, 'pr': pr + 1, 'k': k})
            if k + '-c' in tl: cand.append({'v': k + '-c', 'a': aud, 'pr': pr + 2, 'k': k})
    for c in cand: c['usos'] = 0; c['ult'] = -99
    # rotación de guiones por día para piezas fijas
    for d in range(DIAS):
        fecha = INICIO + datetime.timedelta(days=d)
        hoy = set(); elegidos = []
        for _ in range(5):
            ok = [c for c in cand if c['k'] not in hoy and c['usos'] < 2 and (c['usos'] == 0 or d - c['ult'] >= 7)]
            if not ok: ok = [c for c in cand if c['k'] not in hoy and c['usos'] < 2]
            if not ok: ok = [c for c in cand if c['usos'] < 2]
            if not ok: ok = [c for c in cand if c['k'] not in hoy]
            ok.sort(key=lambda c: (c['usos'], c['pr'], (B.index(c['k']) - d) % len(B)))
            c = ok[0]; c['usos'] += 1; c['ult'] = d; hoy.add(c['k']); elegidos.append(c)
        for h, c in zip(H_REEL, elegidos):
            f = f"{c['v']}-{c['a']}.mp4"; reels_usados.add(c['v'])
            plan.append({'marca': m, 'fecha': f'{fecha}T{h}:00', 'tipo': 'reel', 'archivos': [f], 'texto': texto(c['v']),
                         'ai': c['a'] == 'voz', 'portada_ms': portada_ms(c['v']), 'pieza': f"{c['v']}-{c['a']}"})
        # carrusel: 8 originales y 7 con gancho B
        orden_car = B + [k + '-b' for k in B]
        v = orden_car[d % len(orden_car)]
        n = len(tl[v]['escenas']); fs = [f'{v}-car{i}.jpg' for i in range(n)]
        estaticas += [(v, 'carrusel', i, '', f) for i, f in enumerate(fs)]
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_CAR}:00', 'tipo': 'carrusel', 'archivos': fs, 'texto': texto(v), 'pieza': f'{v}-carrusel'})
        # posts: 10 h gancho (original o B), 19 h escena de contenido de otro guion
        vh = (B[d % len(B)] if d < 8 else B[d % len(B)] + '-b') if True else None
        fh = f'{vh}-post0.jpg'; estaticas.append((vh, 'post', 0, 'wa', fh))
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_POST[0]}:00', 'tipo': 'post', 'archivos': [fh], 'texto': texto(vh), 'pieza': f'{vh}-post0'})
        kc = B[(d + 3) % len(B)]; esc = tl[kc]['escenas']
        idxs = [i for i, e in enumerate(esc) if e['tipo'] in ('lista', 'dato', 'sello', 'objeto', 'compara') or (e['tipo'] == 'titulo' and e.get('sub'))]
        ic = idxs[(d // len(B)) % len(idxs)] if idxs else 0
        fc = f'{kc}-post{ic}.jpg'; estaticas.append((kc, 'post', ic, 'wa', fc))
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_POST[1]}:00', 'tipo': 'post', 'archivos': [fc], 'texto': texto(kc), 'pieza': f'{kc}-post{ic}'})
        # historias: 9:30 gancho, 18:30 cierre «Respondé esta historia con PALABRA» del mismo guion
        vs = B[(d + 5) % len(B)] if d < 8 else B[(d + 5) % len(B)] + '-b'
        ks = vs[:-2] if vs.endswith('-b') else vs
        f0 = f'{vs}-his0.jpg'; fC = f'{ks}-hisC.jpg'
        estaticas.append((vs, 'historia', 0, 'historia', f0)); estaticas.append((ks, 'historia', len(tl[ks]['escenas']) - 1, '', fC))
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_HIS[0]}:00', 'tipo': 'historia', 'archivos': [f0], 'texto': '', 'pieza': f'{vs}-his0'})
        plan.append({'marca': m, 'fecha': f'{fecha}T{H_HIS[1]}:00', 'tipo': 'historia', 'archivos': [fC], 'texto': '', 'pieza': f'{ks}-hisC'})
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
