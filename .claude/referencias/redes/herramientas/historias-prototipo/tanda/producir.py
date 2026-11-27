#!/usr/bin/env python3
# Producción en serie de reels (tanda 27/11–06/12). Un guion → voz → subtítulos con tiempos → sonido → render 1080×1920 30 fps → revisión → mp4 + portada.
#
#   python3 producir.py voz-pedidos [--marca vita] [--ids a,b]     lista lo que hay que generar con la herramienta de ElevenLabs (no gasta nada)
#   python3 producir.py voz-importar <id> <url|archivo.mp3>        descarga el audio ya generado a salida/<marca>/<id>.mp3
#   python3 producir.py preparar <id>                              tiempos por palabra + beats + receta de estilo → trabajo/<id>/plan.json
#   python3 producir.py sonido <id>                                ambiente, efectos, música y mezcla a −14 LUFS
#   python3 producir.py render <id> [--fps 30] [--workers 4]       cuadros con Chromium
#   python3 producir.py revisar <id>                               cuadros cada 0,5 s, hoja de contactos, desbordes/zonas seguras
#   python3 producir.py entrega <id>                               mp4 (loop empalmado) + portada + volumen
#   python3 producir.py todo <id>                                  preparar → sonido → render → revisar → entrega
#   python3 producir.py lote [--marca m] [--desde id] [--max n]    todo para cada guion que ya tenga voz
#
# Guion: {"id","fecha","hora","marca","formula","gancho_pantalla","voz","textos_pantalla":[...],"personaje","lugar_ba","escena_visual","cierre","palabra","copy"}
# Opcional en el guion: "estilo": {fondo, layout, cam, trans, card, sub, cartas, contador, escala, pal, ft} para forzar el estilo.
import argparse, glob, hashlib, json, os, re, shutil, subprocess, sys, time, types, unicodedata, urllib.request, ssl
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__)); PROTO = os.path.dirname(AQUI)
REPO = '/home/user/LEGAL-CRM'; TANDA = f'{REPO}/docs/redes/tanda-2811-0712'; GUIONES = f'{TANDA}/guiones'; SALIDA = f'{TANDA}/salida'
TRAB = f'{AQUI}/trabajo'; PUERTO = int(os.environ.get('PUERTO_TANDA', 8801)); SR = 48000
MODELO_VOZ = 'eleven_flash_v2_5'   # el económico. NO eleven_v4.
MARCAS = {
 'vita': dict(nombre='VITA Abogados', logo='vita.png', voz='hVXoK5zuQfMOQB7NrIFY', voz_nombre='Claudiio Antoci', mus='vita', fts=['Playfair Display', 'Manrope', 'Inter'], fs='Manrope'),
 'coberturas': dict(nombre='Compara Tu Obra Social', logo='coberturas.png', voz='ijxn8I4NzJccD2Sa7lcj', voz_nombre='Sol', mus='cob', fts=['Manrope', 'Inter'], fs='Manrope'),
 'autos': dict(nombre='Automotores Kocos', logo='autos.png', voz='jbWMqMKDKL7X0v1DXTHH', voz_nombre='Franco', mus='autos', fts=['Manrope', 'Inter'], fs='Manrope'),
 'marketing': dict(nombre='Kocos Marketing', logo='marketing.png', voz='CNBiCLtxaJJKQwl4Hq2q', voz_nombre='Santo', mus='mkt', fts=['Manrope', 'Inter'], fs='Manrope'),
}
def marca_de(m):
    s = sin_acento(m)
    for k, pat in (('vita', 'vita|jurid'), ('coberturas', 'cobertura|cob\\b|obra social|medic'), ('autos', 'auto|0 ?km'), ('marketing', 'market|mkt|kocos')):
        if re.search(pat, s): return k
    raise SystemExit(f'marca desconocida: {m}')
def sin_acento(s): return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()

# ---------------- guiones ----------------
def cargar_guiones(marca=None):
    G = []
    for f in sorted(glob.glob(f'{GUIONES}/*.json')):
        d = json.load(open(f)); d = d if isinstance(d, list) else d.get('guiones', d.get('reels', [d]))
        for g in d:
            g['_marca'] = marca_de(g['marca']); G.append(g)
    G.sort(key=lambda g: (g.get('fecha', ''), g.get('hora', ''), g['_marca']))
    por = {}
    for g in G: g['_orden'] = por.setdefault(g['_marca'], 0); por[g['_marca']] += 1
    return [g for g in G if not marca or g['_marca'] == marca]
def guion(id_, archivo=None):
    if archivo:
        g = json.load(open(archivo)); g = g[0] if isinstance(g, list) else g; g['_marca'] = marca_de(g['marca']); g.setdefault('_orden', 0); return g
    for g in cargar_guiones():
        if g['id'] == id_: return g
    p = f'{TRAB}/{id_}/guion.json'
    if os.path.exists(p): return json.load(open(p))
    raise SystemExit(f'no encuentro el guion {id_} (¿{GUIONES}/*.json o --guion archivo?)')
def mp3_de(g): return f"{SALIDA}/{g['_marca']}/{g['id']}.mp3"
def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
def sh(*a, **k): return subprocess.run(list(map(str, a)), check=True, **k)

# ---------------- voz ----------------
def voz_pedidos(args):
    G = cargar_guiones(args.marca); ids = set(args.ids.split(',')) if args.ids else None; out = []; tot = 0
    for g in G:
        if ids and g['id'] not in ids: continue
        if os.path.exists(mp3_de(g)): continue
        M = MARCAS[g['_marca']]; n = len(g['voz']); tot += n
        out.append(dict(id=g['id'], marca=g['_marca'], voice_id=M['voz'], voz=M['voz_nombre'], model_id=MODELO_VOZ, generations_count=1, caracteres=n, prompt=g['voz'], destino=mp3_de(g)))
    os.makedirs(TRAB, exist_ok=True); json.dump(out, open(f'{TRAB}/voz_pedidos.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{len(out)} voces pendientes, {tot} caracteres (≈{tot} créditos) → {TRAB}/voz_pedidos.json')
    print('Para cada una: mcp__ElevenLabs__creative_generate_speech(prompt, model_id=eleven_flash_v2_5, voice_id, generations_count=1, flow_id=<uno solo>);')
    print('luego creative_get_flow_run_status hasta all_completed y `voz-importar <id> <media[0].url>`. NUNCA repetir la generación para reintentar.')
def voz_importar(args):
    g = guion(args.id, args.guion); dest = mp3_de(g); os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and not args.forzar: raise SystemExit(f'{dest} ya existe (--forzar para pisar)')
    if re.match(r'https?://', args.fuente):
        ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt') if os.path.exists('/root/.ccr/ca-bundle.crt') else None
        open(dest, 'wb').write(urllib.request.urlopen(urllib.request.Request(args.fuente, headers={'User-Agent': 'tanda'}), context=ctx, timeout=60).read())
    else: shutil.copy(args.fuente, dest)
    d = dur(dest); print(f'{dest}  {d:.2f} s')
    if d < 3: os.remove(dest); raise SystemExit('audio demasiado corto: descartado')

# ---------------- alineación de palabras (sin gastar créditos) ----------------
def silencios(f):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=n=-34dB:d=0.09', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; e = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
    return s, e
def silabas(w): return max(1, len(re.findall(r'[aeiouáéíóúü]+', w.lower()))) + .35
def alinear(texto, f):
    D = dur(f); s, e = silencios(f)
    sil = []   # silencios internos (start,end) no iniciales ni finales
    for i, a in enumerate(s):
        b = e[i] if i < len(e) else D
        if a < .05 or b >= D - .02: continue
        sil.append((a, b))
    ini = e[0] if s and s[0] < .05 and e else 0.0; fin = s[-1] if s and (len(e) < len(s) or e[-1] >= D - .02) else D
    # tiempo activo = habla sin los silencios internos
    segs = []; c = ini
    for a, b in sil:
        if a > c: segs.append((c, a))
        c = max(c, b)
    segs.append((c, fin)); A = sum(b - a for a, b in segs)
    def a2r(x, ini_pal=False):
        for a, b in segs:
            if x < b - a - 1e-9 or (not ini_pal and x <= b - a + 1e-9): return a + x
            x -= b - a
        return segs[-1][1]
    pos = []; acc = 0
    for a, b in segs: pos.append(acc); acc += b - a
    sact = [sum(b - a for a, b in segs[:k]) for k in range(1, len(segs))]   # posición activa de cada silencio interno
    toks = texto.split(); wt = [silabas(t) for t in toks]; tot = sum(wt); cum = np.cumsum([0] + wt)
    # anclas: cada puntuación fuerte se pega al silencio más cercano
    anc = [(0.0, 0.0)]; last = -1
    for i, t in enumerate(toks[:-1]):
        if re.search(r'[.?!:;,]$', t):
            fr = cum[i + 1] / tot * A; tol = 1.0 if re.search(r'[.?!:;]$', t) else .45
            c = [(abs(sact[k] - fr), k) for k in range(len(sact)) if k > last]
            if c:
                d, k = min(c)
                if d < tol and sact[k] > anc[-1][1] + .08: anc.append((cum[i + 1] / tot * A, sact[k])); last = k
    anc.append((A, A)); xs = [a for a, _ in anc]; ys = [b for _, b in anc]
    W = []
    for i, t in enumerate(toks):
        x0 = np.interp(cum[i] / tot * A, xs, ys); x1 = np.interp(cum[i + 1] / tot * A, xs, ys)
        W.append(dict(w=re.sub(r'[.:;,]+$', '', t), p=t, t=round(a2r(x0, True), 3), e=round(a2r(max(x0, x1 - .04)), 3)))
    return W, D

# ---------------- receta de estilo ----------------
def pal(bg1, bg2, ink, acc, acc2, onacc, card, cardInk, k, d, line, luz, subFill, subStroke, pill, pillInk, grade):
    return dict(bg1=bg1, bg2=bg2, ink=ink, acc=acc, acc2=acc2, onacc=onacc, card=card, cardInk=cardInk, k=k, d=d, line=line, luz=luz, subFill=subFill, subStroke=subStroke, pill=pill, pillInk=pillInk, grade=grade)
FRIO = 'linear-gradient(180deg,rgba(0,70,110,.16),rgba(0,0,0,0) 45%,rgba(255,150,70,.10))'; CALIDO = 'linear-gradient(180deg,rgba(255,120,40,.14),rgba(0,0,0,0) 50%,rgba(120,40,160,.10))'
NOCHE = 'linear-gradient(180deg,rgba(40,20,120,.2),rgba(0,0,0,0) 50%,rgba(0,120,160,.12))'; NEUTRO = 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,0) 50%,rgba(0,0,0,.08))'
DK = 'rgba(8,12,28,.92)'; LT = 'rgba(255,255,255,.95)'
PALETAS = {
 'vita': [pal('#112250', '#0E1218', '#fff', '#D4AF37', '#C1AE7A', '#0E1218', '#F5F4F0', '#112250', '#F5F4F0', '#0E1218', '#D4AF37', '#ffe9b0', '#fff', DK, 'rgba(10,16,34,.6)', '#fff', FRIO),
          pal('#F5F4F0', '#E7E2CE', '#112250', '#112250', '#D4AF37', '#F5F4F0', '#fff', '#112250', '#fff', '#112250', '#112250', '#fff3c8', '#112250', LT, 'rgba(17,34,80,.92)', '#F5F4F0', NEUTRO),
          pal('#0B1637', '#1d2f66', '#fff', '#E7E2CE', '#D4AF37', '#112250', '#E7E2CE', '#112250', '#E7E2CE', '#0B1637', '#E7E2CE', '#cfe0ff', '#fff', DK, 'rgba(10,16,34,.6)', '#fff', NOCHE),
          pal('#0E1218', '#2a2210', '#fff', '#C1AE7A', '#D4AF37', '#0E1218', '#F5F4F0', '#0E1218', '#F5F4F0', '#0E1218', '#C1AE7A', '#ffd98a', '#fff', DK, 'rgba(14,18,24,.65)', '#fff', CALIDO)],
 'coberturas': [pal('#003D3B', '#0B2B26', '#fff', '#DAF1DE', '#8EB69B', '#0B2B26', '#DAF1DE', '#0B2B26', '#DAF1DE', '#0B2B26', '#8EB69B', '#d6ffe8', '#fff', DK, 'rgba(0,61,59,.7)', '#fff', FRIO),
                pal('#DAF1DE', '#D5E6DA', '#0B2B26', '#235347', '#8EB69B', '#fff', '#fff', '#0B2B26', '#fff', '#0B2B26', '#235347', '#ffffff', '#0B2B26', LT, 'rgba(35,83,71,.92)', '#fff', NEUTRO),
                pal('#235347', '#0B2B26', '#fff', '#8EB69B', '#DAF1DE', '#0B2B26', '#fff', '#0B2B26', '#fff', '#0B2B26', '#8EB69B', '#e6fff0', '#fff', DK, 'rgba(11,43,38,.65)', '#fff', NOCHE),
                pal('#0B2B26', '#003D3B', '#DAF1DE', '#7fe0a8', '#8EB69B', '#0B2B26', '#DAF1DE', '#0B2B26', '#DAF1DE', '#0B2B26', '#7fe0a8', '#d6ffe8', '#fff', DK, 'rgba(0,61,59,.7)', '#fff', FRIO)],
 'autos': [pal('#000521', '#011F65', '#fff', '#207CCF', '#4E9BE4', '#fff', '#fff', '#000521', '#fff', '#000521', '#4E9BE4', '#bfe0ff', '#fff', DK, 'rgba(0,5,33,.65)', '#fff', FRIO),
           pal('#011F65', '#000521', '#fff', '#8CC8FF', '#207CCF', '#000521', '#fff', '#011F65', '#fff', '#000521', '#8CC8FF', '#e0f0ff', '#fff', DK, 'rgba(1,31,101,.7)', '#fff', NOCHE),
           pal('#FFFFFF', '#dfe7f1', '#000521', '#207CCF', '#011F65', '#fff', '#fff', '#000521', '#fff', '#011F65', '#207CCF', '#ffffff', '#000521', LT, 'rgba(0,5,33,.92)', '#fff', NEUTRO),
           pal('#020C47', '#0E4EB2', '#fff', '#4E9BE4', '#8CC8FF', '#000521', '#fff', '#020C47', '#fff', '#000521', '#8CC8FF', '#cfe8ff', '#fff', DK, 'rgba(2,12,71,.7)', '#fff', FRIO)],
 'marketing': [pal('#1B1B1B', '#323232', '#fff', '#FC6E20', '#C9AC93', '#1B1B1B', '#FFE7D0', '#1B1B1B', '#FFE7D0', '#1B1B1B', '#FC6E20', '#ffd2b0', '#fff', DK, 'rgba(27,27,27,.7)', '#fff', CALIDO),
               pal('#FFE7D0', '#C9AC93', '#1B1B1B', '#FC6E20', '#5D493D', '#1B1B1B', '#fff', '#1B1B1B', '#fff', '#1B1B1B', '#5D493D', '#fff3e6', '#1B1B1B', LT, 'rgba(27,27,27,.92)', '#FFE7D0', NEUTRO),
               pal('#FC6E20', '#c84a0c', '#1B1B1B', '#1B1B1B', '#FFE7D0', '#FFE7D0', '#FFE7D0', '#1B1B1B', '#FFE7D0', '#1B1B1B', '#FFE7D0', '#fff0dd', '#fff', DK, 'rgba(27,27,27,.85)', '#FFE7D0', CALIDO),
               pal('#323232', '#1B1B1B', '#FFE7D0', '#FFE7D0', '#FC6E20', '#1B1B1B', '#FC6E20', '#1B1B1B', '#FFE7D0', '#1B1B1B', '#FC6E20', '#ffd2b0', '#fff', DK, 'rgba(27,27,27,.7)', '#fff', NOCHE)],
}
FONDOS = ['ciudad', 'grid', 'bokeh_', 'rayas', 'blueprint', 'puntos', 'olas', 'mosaico']; FONDOS[2] = 'mosaico'
CAMS = ['empuje', 'mix', 'lateral', 'orbita', 'mano']; TRANS = ['deslizar', 'zoom', 'giro', 'caer', 'cortina']
CARDS = ['pastilla', 'sello', 'ticket', 'marco', 'subrayado', 'cinta']; SUBS = ['color', 'caja', 'subrayado', 'color']
def h(id_, k=''): return int(hashlib.md5((id_ + k).encode()).hexdigest()[:8], 16)
def receta(g, nbeats):
    id_ = g['id']; o = g.get('_orden', h(id_) % 97); M = MARCAS[g['_marca']]
    # las posiciones usan el orden dentro de la marca con pasos coprimos: dos reels seguidos nunca comparten fondo, cámara ni transición
    R = dict(seed=h(id_) % 1000, fondo=FONDOS[(o * 3 + h(id_, 'f')) % 8], layout='AB'[(o + h(id_, 'l')) % 2], cam=CAMS[(o * 2 + h(id_, 'c')) % 5], trans=TRANS[(o * 3 + h(id_, 't')) % 5],
             card=CARDS[(o * 5 + h(id_, 'k')) % 6], sub=SUBS[(o + h(id_, 's')) % 4], ft=M['fts'][(o + h(id_, 'z')) % len(M['fts'])], fs=M['fs'], pal=PALETAS[g['_marca']][(o + h(id_, 'p')) % 4], vin=.4, tilt=True)
    k = (o + h(id_, 'r')) % 4
    R['cartas'] = (k == 0 and nbeats >= 4); R['contador'] = k in (1, 2) and nbeats >= 4; R['escala'] = (o + h(id_, 'e')) % 3 == 0
    st = g.get('estilo') or {}
    if 'pal' in st and isinstance(st['pal'], int): st['pal'] = PALETAS[g['_marca']][st['pal'] % 4]
    R.update(st); return R

# ---------------- plan ----------------
def frases(W):
    F = []; cur = []
    for i, w in enumerate(W):
        cur.append(i)
        if re.search(r'[.?!:;]$', w['p']): F.append(cur); cur = []
    if cur: F.append(cur)
    return F
def toks(s): return {t[:5] for t in re.findall(r'[a-z0-9]{4,}', sin_acento(s))}
def asignar(textos, W, F):
    S = len(F); Nn = len(textos); st = [0]; txt = [toks(' '.join(W[i]['p'] for i in f)) for f in F]
    for j in range(1, Nn):
        lo = st[-1] + 1; hi = S - (Nn - j); best = None
        for i in range(lo, max(lo, hi) + 1):
            if i >= S: break
            sc = len(toks(textos[j]) & txt[i]) * 3 - abs(i - j * S / Nn) * .05 + (.5 if i == S - 1 and j == Nn - 1 else 0)
            if best is None or sc > best[0]: best = (sc, i)
        i = best[1] if best else min(S - 1, lo)
        if i - 1 > st[-1] and re.search(r':$', W[F[i - 1][-1]]['p']): i -= 1   # «Antes de firmar:» abre el beat siguiente
        st.append(i)
    return st
LEAD = .30; COLA = 1.6
def preparar(args):
    g = guion(args.id, args.guion); f = mp3_de(g)
    if not os.path.exists(f): raise SystemExit(f'falta la voz: {f} (usar voz-pedidos / voz-importar)')
    W, D = alinear(g['voz'], f); F = frases(W); textos = g['textos_pantalla']; st = asignar(textos, W, F)
    for w in W: w['t'] = round(w['t'] + LEAD, 3); w['e'] = round(w['e'] + LEAD, 3)
    T = round(LEAD + D + COLA, 2); beats = []
    for j, tx in enumerate(textos):
        i0 = st[j]; i1 = st[j + 1] if j + 1 < len(st) else len(F)
        t0 = 0.0 if j == 0 else max(0.0, W[F[i0][0]]['t'] - .06); voz = ' '.join(W[i]['p'] for fr in F[i0:i1] for i in fr)
        fr = [dict(t0=max(0.0, W[fi[0]]['t'] - .05), t1=W[fi[-1]]['e'] + .25, txt=' '.join(W[i]['p'] for i in fi)) for fi in F[i0:i1]]
        beats.append(dict(texto=tx, t0=t0, voz=voz, frases=fr))
    for j, b in enumerate(beats): b['t1'] = beats[j + 1]['t0'] if j + 1 < len(beats) else T
    R = receta(g, len(beats))
    k = 0
    for j, b in enumerate(beats):
        m = re.search(r'(?<![\d.])(\d{1,3}(?:\.\d{3})*|\d+)(?![\d])', b['texto'])
        if m and int(m.group(1).replace('.', '')) >= 2 and j > 0: b['num'] = int(m.group(1).replace('.', ''))
        elif R.get('contador') and 0 < j < len(beats) - 1: k += 1; b['paso'] = k
    M = MARCAS[g['_marca']]
    plan = dict(id=g['id'], marca=g['_marca'], T=T, lead=LEAD, voz_dur=round(D, 3), nombre=M['nombre'], logo=M['logo'], palabra=g['palabra'], cierre=g.get('cierre', ''), lugar=g.get('lugar_ba', ''), personaje=g.get('personaje', ''), escena=g.get('escena_visual', ''), beats=beats, words=W, receta=R)
    d = f'{TRAB}/{g["id"]}'; os.makedirs(d, exist_ok=True); json.dump(plan, open(f'{d}/plan.json', 'w'), ensure_ascii=False, indent=1); json.dump(g, open(f'{d}/guion.json', 'w'), ensure_ascii=False, indent=1)
    dur_ok = 15 <= T <= 25
    print(f'{g["id"]}: voz {D:.1f}s → reel {T:.1f}s {"" if dur_ok else "  ¡FUERA DE 15–25 s!"} | {len(beats)} beats | fondo={R["fondo"]} layout={R["layout"]} cam={R["cam"]} trans={R["trans"]} card={R["card"]} sub={R["sub"]} cartas={R["cartas"]} contador={R["contador"]}')
    return plan

# ---------------- sonido ----------------
def modulo_build():
    os.makedirs('/tmp/aud_dummy', exist_ok=True); cwd = os.getcwd(); os.chdir('/tmp/aud_dummy')
    c = types.ModuleType('certifi'); c.where = lambda: ''; sys.modules.setdefault('certifi', c); sys.modules.setdefault('edge_tts', types.ModuleType('edge_tts'))
    sys.path.insert(0, f'{REPO}/.claude/referencias/redes/herramientas/reels'); import build as B; os.chdir(cwd); return B
def sonido(args):
    B = modulo_build(); g = guion(args.id, args.guion); P = json.load(open(f'{TRAB}/{args.id}/plan.json')); T = P['T']; R = P['receta']; bp, add = B.bp, B.add
    rng = np.random.default_rng(h(args.id) % 2**31); N = int(T * SR); S = np.zeros(N)
    ev = lambda t, fn, gn: add(S, max(0, t), fn(), gn)
    ev(0.0, B.S_boom, .45); ev(.05, B.S_thud, .5)
    for j, b in enumerate(P['beats'][1:], 1):
        ev(b['t0'] - .05, lambda: B.S_whoosh(.3, 400, 7000), .4)
        if b.get('paso') or b.get('num') or R.get('cartas'): ev(b['t0'] + .25, B.S_chime, .5); ev(b['t0'] + .02, B.S_click, .7)
        if b.get('num'): [ev(b['t0'] + .1 + k * .075, B.S_tick, .22) for k in range(14)]
    # cortes de cámara: pequeño golpe
    servidor(); cz = json.loads(nodo('cortes_t.js', args.id, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]); json.dump(cz, open(f'{TRAB}/{args.id}/cortes.json', 'w'))
    for t in cz[1:]: ev(t - .04, lambda: B.S_whoosh(.22, 600, 6000), .18)
    ev(T - (R.get('ctaDur') or 2.3), B.S_ding, .5); ev(T - (R.get('ctaDur') or 2.3) + .1, B.S_chime, .55)
    # música con variaciones por pieza: tempo ±10 BPM y progresión rotada
    key = f'{args.id}'; E = dict(B.ESTILO[MARCAS[g['_marca']]['mus']]); E['bpm'] = E['bpm'] + int(rng.integers(-10, 11)); r = int(rng.integers(0, 4)); E['prog'] = E['prog'][r:] + E['prog'][:r]
    B.ESTILO[key] = E; mus = B.musica(key, T, [(0.0, .0)])
    amb = bp(rng.standard_normal(N), 80, 700) * .03
    d = f'{TRAB}/{args.id}'; B.guardar(S * .9, f'{d}/sfx.wav'); B.guardar(mus * .6, f'{d}/mus.wav'); B.guardar(amb, f'{d}/amb.wav')
    mp3 = mp3_de(g); lead_ms = int(LEAD * 1000)
    fl = ('[0:a]aresample=48000,highpass=f=80,equalizer=f=230:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.4:g=2,equalizer=f=9000:t=h:w=1:g=1.5,deesser=i=0.35,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,'
          f'loudnorm=I=-17:TP=-2:LRA=7,adelay={lead_ms}|{lead_ms},apad=whole_dur={T},atrim=0:{T},pan=stereo|c0=c0|c1=c0,asplit=3[v][vk][vk2];'
          '[2:a]volume=0.5[m];[m][vk]sidechaincompress=threshold=0.025:ratio=10:attack=15:release=350[md];[3:a]volume=0.9[a];[a][vk2]sidechaincompress=threshold=0.03:ratio=3:attack=20:release=400[ad];'
          '[v]volume=1.5[vv];[1:a]volume=0.8[s];[vv][s][md][ad]amix=inputs=4:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,afade=t=out:st=%.2f:d=0.25[o]' % (T - .25))
    sh('ffmpeg', '-y', '-v', 'error', '-i', mp3, '-i', f'{d}/sfx.wav', '-i', f'{d}/mus.wav', '-i', f'{d}/amb.wav', '-filter_complex', fl, '-map', '[o]', '-ar', SR, f'{d}/mezcla.wav')
    print(f'{args.id}: audio listo ({T:.1f} s)')

# ---------------- render ----------------
def servidor():
    import socket
    s = socket.socket()
    try: s.connect(('127.0.0.1', PUERTO)); s.close(); return
    except OSError: pass
    subprocess.Popen(['python3', '-m', 'http.server', str(PUERTO), '--bind', '127.0.0.1'], cwd=PROTO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True); time.sleep(1.2)
def nodo(script, *a, **k): return subprocess.run(['node', f'{AQUI}/{script}', *map(str, a)], env=dict(os.environ, PUERTO=str(PUERTO), NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()), **k)
def render(args):
    servidor(); d = f'{TRAB}/{args.id}'; fr = f'{d}/fr'; shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr); t0 = time.time(); W = args.workers
    ps = [subprocess.Popen(['node', f'{AQUI}/render_t.js', args.id, fr, str(args.fps), str(W), str(k)], env=dict(os.environ, PUERTO=str(PUERTO), NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())) for k in range(W)]
    [p.wait() for p in ps]; n = len(os.listdir(fr)); s = time.time() - t0
    json.dump(dict(cuadros=n, segundos=round(s, 1)), open(f'{d}/tiempo_render.json', 'w')); print(f'{args.id}: {n} cuadros en {s:.0f} s ({s / max(1, n) * 1000:.0f} ms/cuadro con {W} sesiones)')

# ---------------- revisión ----------------
def revisar(args):
    servidor(); d = f'{TRAB}/{args.id}'; shutil.rmtree(f'{d}/rev', ignore_errors=True); os.makedirs(f'{d}/rev')
    nodo('revision_t.js', args.id, f'{d}/rev', check=True)
    from PIL import Image, ImageDraw
    P = json.load(open(f'{d}/plan.json')); fs = sorted(glob.glob(f'{d}/rev/t_*.jpg')); tw, th = 216, 384; cols = 8; rows = (len(fs) + cols - 1) // cols
    hoja = Image.new('RGB', (cols * tw, rows * (th + 22)), '#111'); dr = ImageDraw.Draw(hoja)
    for i, f in enumerate(fs):
        im = Image.open(f).convert('RGB').resize((tw, th)); x, y = (i % cols) * tw, (i // cols) * (th + 22); hoja.paste(im, (x, y + 22)); dr.text((x + 6, y + 5), f'{float(os.path.basename(f)[2:-4]):.1f}s', fill='#9f9')
    hoja.save(f'{d}/hoja_contactos.jpg', quality=88); rep = json.load(open(f'{d}/rev/rev.json'))
    print(f'{args.id}: hoja de contactos {d}/hoja_contactos.jpg · {len(fs)} cuadros · {len(rep["problemas"])} problemas de zona/desborde')
    for p in rep['problemas'][:12]: print('  ', p)
    return rep

# ---------------- entrega ----------------
def lufs(f):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', o); p = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o); return (float(m[-1]) if m else None, float(p[-1]) if p else None)
def entrega(args):
    g = guion(args.id, args.guion); d = f'{TRAB}/{args.id}'; P = json.load(open(f'{d}/plan.json')); T = P['T']; fps = args.fps; out = f'{SALIDA}/{g["_marca"]}'; os.makedirs(out, exist_ok=True)
    fr = f'{d}/fr'; n = len(os.listdir(fr)); mp4 = f'{out}/{g["id"]}.mp4'; t0 = time.time(); X = .45
    # loop: en los últimos 0,45 s el video se funde con el primer cuadro; el último cuadro queda igual al primero
    fc = f'[2:v]format=yuva420p,fade=t=in:st={T - X:.2f}:d={X}:alpha=1[ov];[0:v][ov]overlay=shortest=1,format=yuv420p[v]'
    sh('ffmpeg', '-y', '-v', 'error', '-framerate', fps, '-i', f'{fr}/%05d.jpg', '-i', f'{d}/mezcla.wav', '-loop', '1', '-framerate', fps, '-i', f'{fr}/00000.jpg', '-filter_complex', fc, '-map', '[v]', '-map', '1:a',
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-r', fps, '-c:a', 'aac', '-b:a', '192k', '-t', f'{T:.2f}', '-movflags', '+faststart', mp4)
    t_h = min(P['beats'][0]['t1'] - .1, 1.2); sh('ffmpeg', '-y', '-v', 'error', '-ss', f'{t_h:.2f}', '-i', mp4, '-frames:v', 1, '-q:v', 2, f'{out}/{g["id"]}.jpg')
    L, pk = lufs(mp4); info = dict(id=g['id'], mp4=mp4, duracion=round(dur(mp4), 2), lufs=L, pico_dbfs=pk, bytes=os.path.getsize(mp4), segundos_encode=round(time.time() - t0, 1))
    json.dump(info, open(f'{d}/entrega.json', 'w'), indent=1); print(json.dumps(info, indent=1)); return info
def todo(args):
    t0 = time.time(); preparar(args); sonido(args); render(args); rep = revisar(args); info = entrega(args)
    tr = json.load(open(f'{TRAB}/{args.id}/tiempo_render.json')); print(f'TOTAL {args.id}: {time.time() - t0:.0f} s (render {tr["segundos"]} s)')
def lote(args):
    G = [g for g in cargar_guiones(args.marca) if os.path.exists(mp3_de(g))]
    if args.desde: G = G[[g['id'] for g in G].index(args.desde):]
    for g in G[:args.max]:
        if os.path.exists(f'{SALIDA}/{g["_marca"]}/{g["id"]}.mp4') and not args.rehacer: continue
        a = argparse.Namespace(id=g['id'], guion=None, fps=args.fps, workers=args.workers)
        try: todo(a)
        except Exception as e: print('FALLÓ', g['id'], e)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='c', required=True)
    def add(n, f, *opts):
        p = sp.add_parser(n); p.set_defaults(f=f); p.add_argument('--guion'); p.add_argument('--fps', type=int, default=30); p.add_argument('--workers', type=int, default=4)
        for o in opts: p.add_argument(*o[0], **o[1])
        return p
    add('voz-pedidos', voz_pedidos, (['--marca'], {}), (['--ids'], {})); p = add('voz-importar', voz_importar, (['id'], {}), (['fuente'], {}), (['--forzar'], dict(action='store_true')))
    for n, f in (('preparar', preparar), ('sonido', sonido), ('render', render), ('revisar', revisar), ('entrega', entrega), ('todo', todo)): add(n, f, (['id'], {}))
    add('lote', lote, (['--marca'], {}), (['--desde'], {}), (['--max'], dict(type=int, default=999)), (['--rehacer'], dict(action='store_true')))
    a = ap.parse_args(); a.f(a)
