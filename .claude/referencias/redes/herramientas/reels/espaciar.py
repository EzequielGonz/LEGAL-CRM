# Segunda pasada sobre plan.json: va después de plan.py y antes de siguiente.py.
# 1) Piezas fijas (posts, carruseles e historias) que todavía no se programaron: se reparten de nuevo
#    para que ningún archivo vuelva a salir a menos de 7 días (contando lo ya programado en Metricool),
#    para que en un mismo día las piezas fijas no repitan tema y, si se puede, tampoco el tema de los reels
#    del día ni un tema usado en piezas fijas los 2 días anteriores. Solo usa archivos ya alojados.
#    A las 10:00 va de preferencia la portada de un guion (post0) y a las 19:00 una escena de contenido.
#    La historia de la mañana (his0) y la de la tarde (hisC) son del mismo tema, como en plan.py.
# 2) Reels: si un archivo sale dos veces a menos de 7 × 24 horas, se intercambia el horario dentro del
#    mismo día con otro reel de la marca, siempre que el otro siga cumpliendo la regla.
# Uso: python3 espaciar.py   (guarda la versión anterior en plan-antes-de-espaciar.json)
# liberar.json (opcional): [[marca, fecha, tipo], ...] ya programadas que se pueden reasignar.
import json, re, os, glob, shutil
from datetime import datetime, timedelta
from collections import defaultdict

LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
PUB = {'vita': '/home/user/estudio-juridico-vita-final/apps/web/public/redes',
       'cob': '/home/user/coberturas-sociales-landing/apps/web/public/redes',
       'mkt': '/home/user/agencia-kocos-mkt/apps/web/public/redes',
       'autos': '/home/user/0km-kocos-agencia/apps/web/public/redes'}
DOM = {'vita': 'https://www.estudiojuridicovita.com', 'cob': 'https://www.comparatuobrasocial.com',
       'autos': 'https://www.autoskocos.com', 'mkt': 'https://www.kocosmkt.com'}
SEMANA = timedelta(days=7)
textos = json.load(open('textos.json'))
tl = {os.path.basename(f)[:-8]: json.load(open(f)) for f in glob.glob('reels/*.tl.json')}


def tema(v):
    return v[:-2] if v.endswith(('-b', '-c', '-d')) else v


def texto(v):
    k = tema(v)
    t = textos[k]['texto']
    if v.endswith('-b') and textos[k].get('ganchoB'):
        t = t.replace(textos[k]['gancho'], textos[k]['ganchoB'], 1)
    if v.endswith('-d') and textos[k].get('ganchoD'):
        t = t.replace(textos[k]['gancho'], textos[k]['ganchoD'], 1)
    return t


def tema_pieza(pz):
    v = re.sub(r'-(voz|tendencia|post\d+|carrusel|his0|hisC)$', '', pz)
    return tema(v)


def dt(s):
    return datetime.fromisoformat(s[:19])


D = json.load(open('plan.json'))
if D.get('espaciado'):
    raise SystemExit('plan.json ya pasó por espaciar.py: restaurá plan-antes-de-espaciar.json o corré plan.py antes.')
shutil.copy('plan.json', 'plan-antes-de-espaciar.json')
P = D['plan']
hechos = {}
for l in open(LEDGER):
    if l.strip():
        j = json.loads(l)
        if j.get('ok'):
            hechos[(j['marca'], j['fecha'], j['tipo'])] = j['pieza']
# Entradas ya programadas que se pueden volver a elegir (repetían imagen a menos de 7 días);
# después hay que actualizarlas en Metricool y anotarlas en el registro.
LIBERAR = {tuple(x) for x in json.load(open('liberar.json'))} if os.path.exists('liberar.json') else set()
for k in LIBERAR: hechos.pop(k, None)

# Inventario alojado por marca
inv = {}
for m, d in PUB.items():
    fs = set(os.listdir(d))
    posts = sorted(f[:-4] for f in fs if re.fullmatch(rf'{m}-.+-post\d+\.jpg', f) and tema(re.sub(r'-post\d+\.jpg$', '', f)) in textos)
    cars = defaultdict(set)
    for f in fs:
        mm = re.fullmatch(rf'({m}-.+)-car(\d+)\.jpg', f)
        if mm: cars[mm[1]].add(int(mm[2]))
    carr = {}
    for v, ix in cars.items():
        n = len(tl[v]['escenas']) if v in tl else -1
        if ix == set(range(n)) and tema(v) in textos:
            carr[v] = [f'{v}-car{i}.jpg' for i in range(n)]
    his0 = sorted(f[:-4] for f in fs if f.startswith(m + '-') and f.endswith('-his0.jpg'))
    hisC = sorted(f[:-4] for f in fs if f.startswith(m + '-') and f.endswith('-hisC.jpg'))
    inv[m] = {'post': posts, 'carrusel': carr, 'his0': his0, 'hisC': hisC}

# Historial: lo ya programado (registro) más lo que se va asignando
ult = defaultdict(lambda: datetime(2000, 1, 1))      # (marca, pieza) -> última salida
usos = defaultdict(int)
ult_tema_fijo = defaultdict(lambda: datetime(2000, 1, 1))  # (marca, tema) -> última pieza fija
ult_texto_fijo = defaultdict(lambda: datetime(2000, 1, 1))  # (marca, variante) -> última pieza fija con ese texto


def anotar(m, pz, cuando, fija):
    if cuando > ult[(m, pz)]: ult[(m, pz)] = cuando
    usos[(m, pz)] += 1
    if fija and cuando > ult_tema_fijo[(m, tema_pieza(pz))]: ult_tema_fijo[(m, tema_pieza(pz))] = cuando
    v = re.sub(r'-(post\d+|carrusel)$', '', pz) if fija and not pz.endswith(('-his0', '-hisC')) else None
    if v and cuando > ult_texto_fijo[(m, v)]: ult_texto_fijo[(m, v)] = cuando


def es_fija(t):
    return t in ('post', 'carrusel', 'historia')


pendientes = []
for p in P:
    k = (p['marca'], p['fecha'], p['tipo'])
    if k in hechos:
        anotar(p['marca'], hechos[k], dt(p['fecha']), es_fija(p['tipo']))
    elif es_fija(p['tipo']):
        pendientes.append(p)
    else:
        anotar(p['marca'], p['pieza'], dt(p['fecha']), False)  # reels pendientes: cuentan para temas del día


def reels_del_dia(m, dia):
    rs = [p['pieza'] for p in P if p['marca'] == m and p['tipo'] == 'reel' and p['fecha'].startswith(dia)]
    return {tema_pieza(x) for x in rs}, {texto_de_reel(x) for x in rs}


def texto_de_reel(pz):
    # versión del texto de un reel: la versión C usa el texto original
    v = re.sub(r'-(voz|tendencia)$', '', pz)
    return v[:-2] if v.endswith('-c') else v


def variante(pz):
    # versión del texto que lleva la pieza (las historias no llevan texto)
    if pz.endswith(('-his0', '-hisC')): return None
    return re.sub(r'-(post\d+|carrusel)$', '', pz)


# Textos de los reels (fijos en el plan) por marca, para no repetir el mismo texto en pocos días
textos_reels = defaultdict(list)
for p in P:
    if p['tipo'] == 'reel':
        k = (p['marca'], p['fecha'], 'reel')
        textos_reels[p['marca']].append((dt(p['fecha']), texto_de_reel(hechos.get(k, p['pieza']))))
VENTANA_TEXTO = timedelta(days=3)


def texto_cercano(m, v, cuando):
    if v is None: return False
    if cuando - ult_texto_fijo[(m, v)] < VENTANA_TEXTO: return True
    return any(abs(cuando - c) < VENTANA_TEXTO for c, vv in textos_reels[m] if vv == v)


def puntaje(m, pz, cuando, feed_hoy, hist_hoy, rh, preferida):
    gap = cuando - ult[(m, pz)]
    t = tema_pieza(pz)
    reels_hoy, ganchos_hoy = rh
    return (gap < SEMANA,                                  # la regla de 7 días manda
            usos[(m, pz)] >= 2,                            # cada pieza fija sale 2 veces como mucho, si se puede
            t in feed_hoy,                                 # no repetir tema entre posts y carrusel del día
            variante(pz) in ganchos_hoy,                   # no repetir el mismo texto que un reel del día
            t in hist_hoy,                                 # mejor que no repita el tema de las historias del día
            t in reels_hoy,                                # tema distinto de los reels del día
            usos[(m, pz)],                                 # lo menos usado primero
            texto_cercano(m, variante(pz), cuando),        # si se puede, el mismo texto no vuelve antes de 3 días
            cuando - ult_tema_fijo[(m, t)] < timedelta(days=2),  # tema reciente en fijas
            not preferida(pz),                             # portada a la mañana, contenido a la tarde
            -gap.total_seconds(), pz)


# Excepciones elegidas a mano cuando todas las opciones tienen algún problema. Cobertura del 21/11 a las 19:00:
# ese día los 8 temas ya salen en reels, historias, el post de la mañana y el carrusel. Las piezas que cumplen
# los 7 días repiten el texto de un reel del día o el tema del carrusel. Se elige «65» con gancho B, que sale
# 6 días y 9 horas después de su uso anterior y acompaña el tema de las historias de ese día.
EXCEPCIONES = {('cob', '2026-11-21T19:00:00', 'post'): 'cob-65-b-post0'}

cambios = []
por_dia = defaultdict(list)
for p in pendientes:
    por_dia[(p['marca'], p['fecha'][:10])].append(p)
for (m, dia), ps in sorted(por_dia.items(), key=lambda x: (x[0][1], x[0][0])):
    ps.sort(key=lambda p: p['fecha'])
    ya = [(q['tipo'], tema_pieza(hechos[(m, q['fecha'], q['tipo'])])) for q in P
          if q['marca'] == m and q['fecha'].startswith(dia) and es_fija(q['tipo']) and (m, q['fecha'], q['tipo']) in hechos]
    feed = {t for tp, t in ya if tp != 'historia'}
    hist = {t for tp, t in ya if tp == 'historia'}
    rh = reels_del_dia(m, dia)
    # historias: primero se elige el tema del par (mañana y tarde), después el resto
    hs = [p for p in ps if p['tipo'] == 'historia']
    if hs:
        mañana = next((p for p in hs if p['fecha'].endswith('09:30:00')), None)
        tarde = next((p for p in hs if p['fecha'].endswith('18:30:00')), None)
        # si la de la mañana ya está programada, la de la tarde sigue su tema
        fijo = hechos.get((m, f'{dia}T09:30:00', 'historia')) if not mañana else None
        mejores = []
        for c in inv[m]['hisC']:
            k = tema_pieza(c)
            if fijo and k != tema_pieza(fijo): continue
            ops0 = [h for h in inv[m]['his0'] if tema_pieza(h) == k]
            if not ops0: continue
            c_t = dt(tarde['fecha']) if tarde else dt(mañana['fecha'])
            t0 = dt(mañana['fecha']) if mañana else c_t
            h0 = min(ops0, key=lambda h: puntaje(m, h, t0, feed | hist, set(), rh, lambda x: True))
            s0 = puntaje(m, h0, t0, feed | hist, set(), rh, lambda x: True)
            sc = puntaje(m, c, c_t, feed | hist, set(), rh, lambda x: True)
            # orden: 7 días, usos, tema ya usado hoy, tema de los reels, usos totales, tema reciente, distancia
            mejores.append(((s0[0] or sc[0], s0[1] or sc[1], s0[2], s0[5], sc[6] + s0[6], s0[8], s0[10] + sc[10]), h0, c))
        mejores.sort(key=lambda x: x[0])
        _, h0, c = mejores[0]
        for p, pz in ((mañana, h0), (tarde, c)):
            if not p: continue
            if pz != p['pieza']: cambios.append((m, p['fecha'], p['tipo'], p['pieza'], pz))
            p['pieza'] = pz; p['archivos'] = [pz + '.jpg']; p['texto'] = ''
            anotar(m, pz, dt(p['fecha']), True)
        hist.add(tema_pieza(c))
    for p in ps:
        if p['tipo'] == 'historia': continue
        cuando = dt(p['fecha'])
        if p['tipo'] == 'carrusel':
            ops = [v + '-carrusel' for v in inv[m]['carrusel']]
            pref = lambda x: True
        else:
            ops = inv[m]['post']
            mañana_ = p['fecha'].endswith('10:00:00')
            pref = (lambda x: x.endswith('-post0')) if mañana_ else (lambda x: not x.endswith('-post0'))
        pz = EXCEPCIONES.get((m, p['fecha'], p['tipo'])) or min(ops, key=lambda x: puntaje(m, x, cuando, feed, hist, rh, pref))
        if pz != p['pieza']: cambios.append((m, p['fecha'], p['tipo'], p['pieza'], pz))
        if p['tipo'] == 'carrusel':
            v = pz[:-len('-carrusel')]; p['archivos'] = inv[m]['carrusel'][v]; p['texto'] = texto(v)
        else:
            v = re.sub(r'-post\d+$', '', pz); p['archivos'] = [pz + '.jpg']; p['texto'] = texto(v)
        p['pieza'] = pz
        anotar(m, pz, cuando, True)
        feed.add(tema_pieza(pz))

# Reels a menos de 7 × 24 horas: intercambio de horario dentro del día
reels = [p for p in P if p['tipo'] == 'reel']
def salidas(m, pz):
    return sorted(dt(p['fecha']) for p in reels if p['marca'] == m and p['pieza'] == pz)
def cumple(m, pz):
    s = salidas(m, pz)
    return all(b - a >= SEMANA for a, b in zip(s, s[1:]))
for p in sorted(reels, key=lambda p: p['fecha']):
    m = p['marca']
    if (m, p['fecha'], 'reel') in hechos or cumple(m, p['pieza']): continue
    for q in sorted((q for q in reels if q['marca'] == m and q['fecha'][:10] == p['fecha'][:10] and q['fecha'] > p['fecha']
                     and (m, q['fecha'], 'reel') not in hechos), key=lambda q: q['fecha']):
        p['fecha'], q['fecha'] = q['fecha'], p['fecha']
        if cumple(m, p['pieza']) and cumple(m, q['pieza']):
            cambios.append((m, q['fecha'], 'reel', 'horario', f"{p['pieza']} pasa a {p['fecha'][11:16]}, {q['pieza']} a {q['fecha'][11:16]}"))
            break
        p['fecha'], q['fecha'] = q['fecha'], p['fecha']

def desde_pieza(pz):
    if pz.endswith('-carrusel'):
        v = pz[:-len('-carrusel')]; return [f'{v}-car{i}.jpg' for i in range(len(tl[v]['escenas']))], texto(v)
    if re.search(r'-post\d+$', pz): return [pz + '.jpg'], texto(re.sub(r'-post\d+$', '', pz))
    if pz.endswith(('-his0', '-hisC')): return [pz + '.jpg'], ''
    return [pz + '.mp4'], texto(re.sub(r'-(voz|tendencia)$', '', pz))


for p in P:
    k = (p['marca'], p['fecha'], p['tipo'])
    if k in hechos and hechos[k] != p['pieza']:
        # el plan refleja lo que de verdad quedó programado (incluidas las correcciones)
        p['pieza'] = hechos[k]; p['archivos'], p['texto'] = desde_pieza(hechos[k])
    if p['tipo'] == 'reel' and k not in hechos:
        p['texto'] = texto(re.sub(r'-(voz|tendencia)$', '', p['pieza']))
    p['urls'] = [f"{DOM[p['marca']]}/redes/{f}" for f in p['archivos']]
P.sort(key=lambda p: (p['fecha'], p['marca']))
D['espaciado'] = True
json.dump(D, open('plan.json', 'w'), ensure_ascii=False, indent=1)
print(len(cambios), 'cambios')
for c in cambios: print(' ', *c)
