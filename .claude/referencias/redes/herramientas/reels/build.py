# Arma voz, línea de tiempo, efectos, música y mezclas de cada reel.
# Uso: python3 build.py <id> [<id> ...]   (o "todos")
import sys, os, json, asyncio, subprocess, glob, re, wave
import numpy as np
import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts

SR = 48000
VOCES = {'vita': ('es-AR-TomasNeural', '+8%', '-2Hz'), 'cob': ('es-AR-ElenaNeural', '+8%', '+0Hz'),
         'autos': ('es-AR-TomasNeural', '+12%', '+0Hz'), 'mkt': ('es-AR-ElenaNeural', '+12%', '+0Hz')}
os.makedirs('aud', exist_ok=True)

async def tts(texto, voz, rate, pitch, out):
    if os.path.exists(out + '.json') and os.path.exists(out + '.mp3'):
        return
    c = edge_tts.Communicate(texto, voz, rate=rate, pitch=pitch, boundary='WordBoundary')
    words = []
    with open(out + '.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append({'t': ch['offset'] / 1e7, 'd': ch['duration'] / 1e7, 'w': ch['text']})
    json.dump(words, open(out + '.json', 'w'), ensure_ascii=False)

def norm(s): return re.sub(r'[^a-záéíóúñü0-9]', '', s.lower())

def linea_de_tiempo(g):
    voz, rate, pitch = VOCES[g['marca']]
    tareas = []
    for i, e in enumerate(g['escenas']):
        for j, s in enumerate(e['segs']):
            out = f"aud/{g['id']}-{i}-{j}-{abs(hash((s, voz, rate))) % 10**8}"
            e.setdefault('_aud', []).append(out)
            tareas.append(tts(s, voz, rate, pitch, out))
    async def todas():
        for k in range(0, len(tareas), 6): await asyncio.gather(*tareas[k:k + 6])
    asyncio.run(todas())
    t = 0.0; ev = []; voces = []
    for i, e in enumerate(g['escenas']):
        e['t0'] = t
        lead = 0.12 if i == 0 else 0.24
        if e['tipo'] in ('objeto',) and i == 0: lead = 0.5
        if e['tipo'] == 'sello': lead = 0.15 if i == 0 else 0.26
        cur = t + lead; e['seg'] = []
        for j, out in enumerate(e['_aud']):
            w = json.load(open(out + '.json'))
            L = (w[-1]['t'] + w[-1]['d']) if w else 1.0
            st = cur - 0.09  # el audio trae ~0,1 s de silencio inicial
            e['seg'].append({'t': round(cur, 3), 'fin': round(cur + L - 0.1, 3), 'w': [{'t': round(st + x['t'], 3), 'w': x['w']} for x in w]})
            voces.append((out + '.mp3', st))
            gap = 0.28 if e['tipo'] == 'lista' else 0.4
            if e['tipo'] == 'sello' and j == 0: gap = 0.35
            cur = cur + L - 0.1 + gap
        fin = e['seg'][-1]['fin']
        if e['tipo'] == 'voto':
            e['cuenta'] = [round(fin + 0.25 + k * 0.7, 3) for k in range(3)]
            e['revela'] = round(e['cuenta'][-1] + 0.7, 3)
            fin = e['revela'] + 0.55
        elif e['tipo'] == 'cierre':
            fin += 1.7
        elif e['tipo'] == 'titulo' and e.get('sub'):
            fin += 0.9
        elif e['tipo'] == 'dato':
            fin += 0.9
        elif e['tipo'] in ('objeto', 'compara', 'chat'):
            fin += 0.7
        else:
            fin += 0.6
        if e['tipo'] == 'objeto' and e['objeto'] == 'etiqueta':
            ws = e['seg'][1]['w'] if len(e['seg']) > 1 else e['seg'][0]['w']
            tt = []
            for it in e['items']:
                k = norm(it.split()[0]); m = [x['t'] for x in ws if norm(x['w']) == k and (not tt or x['t'] > tt[-1])]
                tt.append(round(m[0], 3) if m else round((tt[-1] + 0.6) if tt else ws[0]['t'], 3))
            e['itemsT'] = tt
        e['t1'] = round(fin, 3); t = fin
        del e['_aud']
    g['total'] = round(t + 0.05, 3)
    # eventos de sonido
    for i, e in enumerate(g['escenas']):
        a = e['t0']; s0 = e['seg'][0]['t']
        if i > 0: ev.append((a - 0.05, 'whoosh', 0.8))
        tp = e['tipo']
        if tp == 'notif': ev += [(a + 0.05, 'ding', 1), (e['seg'][-1]['t'], 'thud', .5)]
        if tp == 'titulo': ev.append((s0, 'thud', .45))
        if tp == 'sello': ev.append((e['seg'][1]['t'] if len(e['seg']) > 1 else s0 + .8, 'boom', 1))
        if tp == 'voto':
            ev.append((s0, 'thud', .5)); ev += [(x, 'tick', 1) for x in e['cuenta']]; ev.append((e['cuenta'][0] - .1, 'riser', .7)); ev.append((e['revela'], 'boom', .8))
        if tp == 'lista': ev += [(sg['t'], 'chime' if k else 'thud', .8 if k else .45) for k, sg in enumerate(e['seg'])]
        if tp == 'dato': ev += [(s0 + k * 0.07, 'tick', .25) for k in range(10)] + [(s0 + 0.75, 'boom', .6)]
        if tp == 'chat':
            n = 0
            for b in e['burbujas']:
                if b['lado'] == 'dia': continue
                ev.append((burb_t(e, n), 'popout' if b['lado'] == 'out' else 'popin', 1)); n += 1
        if tp == 'compara': ev += [(s0, 'popin', 1), (s0 + .9, 'scratch', .8), (e['seg'][-1]['t'], 'popout', 1)]
        if tp == 'objeto':
            o = e['objeto']
            if o == 'carta': ev += [(a + .2, 'paper', .9), (e['seg'][0]['t'] + 1.0, 'boom', 1)]
            if o == 'recibo': ev += [(a + .25, 'printer', .9), (s0 + 1.4, 'thud', .6)]
            if o == 'etiqueta': ev += [(a + .25, 'paper', .6)] + [(x, 'click', 1) for x in e['itemsT']]
            if o == 'celular': ev += [(a + .3 + k * .12, 'popin', .5) for k in range(6)]
        if tp == 'cierre': ev += [(s0, 'popout', .9), (s0 + .25, 'chime', .7)]
    g['eventos'] = [(round(x, 3), n, v) for x, n, v in ev]
    g['_voces'] = voces
    return g

def burb_t(e, n):
    # burbujas: la 1.ª al empezar, el resto repartidas en las frases
    segs = e['seg']
    pts = [e['t0'] + 0.35] + [s['t'] for s in segs] + [segs[-1]['t'] + 1.0]
    return pts[min(n, len(pts) - 1)] if n == 0 else pts[min(n, len(pts) - 1)] + 0.05

# ---------------- síntesis ----------------
rng = np.random.default_rng(5)
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4); return np.fft.irfft(X, len(x))
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def sweep(f0, f1, d): n = int(d * SR); f = np.linspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def S_ding():
    t = np.arange(int(1.0 * SR)) / SR; x = np.sin(2*np.pi*1318*t)*np.exp(-t/.33) + .55*np.sin(2*np.pi*1975*t)*np.exp(-t/.22)
    t2 = np.clip(t - .11, 0, None); x += (t > .11) * (np.sin(2*np.pi*1760*t2)*np.exp(-t2/.38) + .45*np.sin(2*np.pi*2637*t2)*np.exp(-t2/.28)); return x * .45
def S_popin(): n = int(.12*SR); return sweep(1100, 520, .12) * env(n, .002, .03) * .6
def S_popout(): n = int(.18*SR); return sweep(600, 1300, .18)*env(n, .003, .04)*.5 + bp(rng.standard_normal(n), 1500, 7000)*np.hanning(n)*.1
def S_click(): n = int(.03*SR); return bp(rng.standard_normal(n), 1800, 9000)*env(n, .0005, .005)*.6 + sweep(220, 160, .03)*env(n, .0005, .008)*.25
def S_whoosh(d=.38, lo=300, hi=7000):
    n = int(d*SR); x = rng.standard_normal(n); out = np.zeros(n); k = 8
    for i in range(k):
        a, b = i*n//k, (i+1)*n//k; c = lo*(hi/lo)**(i/k); out[a:b] = bp(x, c*.6, c*1.8)[a:b]
    return out * np.sin(np.pi*np.linspace(0, 1, n))**2 * .32
def S_boom():
    n = int(1.3*SR); t = np.arange(n)/SR; f = 52 + 90*np.exp(-t/.05)
    x = np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/.42) + bp(rng.standard_normal(n), 80, 3000)*np.exp(-t/.05)*.45; return np.tanh(x*1.5)*.7
def S_thud():
    n = int(.45*SR); t = np.arange(n)/SR; f = 68 + 110*np.exp(-t/.03); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/.15)*.65
def S_tick(): n = int(.14*SR); t = np.arange(n)/SR; return (np.sin(2*np.pi*1046*t) + .5*np.sin(2*np.pi*2093*t))*np.exp(-t/.03)*.45
def S_chime(): t = np.arange(int(.6*SR))/SR; return (np.sin(2*np.pi*1568*t) + .4*np.sin(2*np.pi*3136*t))*np.exp(-t/.17)*.3
def S_riser(d=2.0):
    n = int(d*SR); t = np.arange(n)/SR; return S_whoosh(d, 200, 9000)*2.0*(t/d)**2 + sweep(180, 720, d)*(t/d)**2*.1
def S_paper():
    n = int(.5*SR); return bp(rng.standard_normal(n), 1200, 8000)*np.hanning(n)**.5*np.abs(np.sin(np.linspace(0, 18, n)))*.18
def S_printer():
    n = int(1.2*SR); t = np.arange(n)/SR; g = (np.sin(2*np.pi*14*t) > 0).astype(float)
    return bp(rng.standard_normal(n), 900, 5000)*g*np.minimum(1, (1.2-t)/.2)*.16 + np.sin(2*np.pi*90*t)*.05*g
def S_scratch():
    n = int(.42*SR); return bp(rng.standard_normal(n), 2500, 9000)*np.abs(np.sin(np.linspace(0, 9, n)))*np.hanning(n)*.35
SFX = {'ding': S_ding, 'popin': S_popin, 'popout': S_popout, 'click': S_click, 'whoosh': S_whoosh, 'boom': S_boom, 'thud': S_thud,
       'tick': S_tick, 'chime': S_chime, 'riser': S_riser, 'paper': S_paper, 'printer': S_printer, 'scratch': S_scratch}

def add(buf, t, x, g=1.0):
    i = int(max(0, t)*SR); j = min(len(buf), i + len(x))
    if i < len(buf): buf[i:j] += x[:j-i]*g

n2f = lambda m: 440*2**((m-69)/12)
def kick(): n = int(.42*SR); t = np.arange(n)/SR; f = 48+110*np.exp(-t/.035); return np.tanh(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/.2)*2)*.75
def clap():
    n = int(.3*SR); t = np.arange(n)/SR; e = np.exp(-t/.07)
    for o in (0, .011, .022): e = e + (t > o)*np.exp(-np.clip(t-o, 0, None)/.008)*.6
    return bp(rng.standard_normal(n), 900, 5000)*e*.25
def hat(d=.05): n = int(d*SR); t = np.arange(n)/SR; return bp(rng.standard_normal(n), 7000, 16000)*np.exp(-t/(d/4))*.2
def keys(fs, d, bright=1.0):
    n = int(d*SR); t = np.arange(n)/SR
    x = sum(np.sin(2*np.pi*f*t) + .35*bright*np.sin(2*np.pi*f*2*t)*np.exp(-t/.4) + .12*bright*np.sin(2*np.pi*f*3*t)*np.exp(-t/.2) for f in fs)/len(fs)
    return x*np.exp(-t/(d*.7))*np.minimum(1, t/.008)*.22
def pad(fs, d):
    n = int(d*SR); t = np.arange(n)/SR; x = sum(np.sin(2*np.pi*f*t + .6*np.sin(2*np.pi*.25*t)) + .25*np.sin(2*np.pi*f*2.004*t) for f in fs)/len(fs)
    return x*np.minimum(1, t/.4)*np.minimum(1, np.maximum(0, d-t)/.4)*.12
def bass(f, d): n = int(d*SR); t = np.arange(n)/SR; return (np.sin(2*np.pi*f*t) + .3*np.tanh(3*np.sin(2*np.pi*f*t)))*np.minimum(1, t/.01)*np.exp(-t/(d*1.3))*.38
def marimba(f, d=.35): n = int(d*SR); t = np.arange(n)/SR; return (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*f*4*t)*np.exp(-t/.03))*np.exp(-t/.11)*.2
def pluck(f, d=.3): n = int(d*SR); t = np.arange(n)/SR; x = np.sign(np.sin(2*np.pi*f*t))*.25 + np.sin(2*np.pi*f*t); return bp(x, 150, 2600)*np.exp(-t/.09)*.12

ESTILO = {
  'vita': dict(bpm=78, prog=[(50, [62, 65, 69]), (46, [62, 65, 70]), (53, [60, 65, 69]), (48, [60, 64, 67])], kick='suave', hats=1, inst='keys', padv=1),
  'cob': dict(bpm=98, prog=[(48, [64, 67, 72]), (43, [62, 67, 71]), (45, [64, 69, 72]), (41, [65, 69, 72])], kick='suave', hats=2, inst='marimba', padv=.7),
  'autos': dict(bpm=122, prog=[(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])], kick='4x4', hats=4, inst='pluck', padv=.6, bajo8=True),
  'mkt': dict(bpm=104, prog=[(40, [64, 67, 71]), (36, [64, 67, 72]), (43, [62, 67, 71]), (38, [62, 66, 69])], kick='trap', hats=4, inst='pluck', padv=.7),
}
def musica(marca, T, quiebres):
    E = ESTILO[marca]; beat = 60/E['bpm']; bar = 4*beat; N = int((T+1)*SR); M = np.zeros(N); B = np.zeros(N)
    t = 0.0
    while t < T:
        root, ch = E['prog'][int(t/bar) % 4]
        silencio = any(a <= t < b for a, b in quiebres)
        if E['padv']: add(M, t, pad([n2f(m) for m in ch], min(bar, T-t+.5)), E['padv'])
        for k in range(4):
            tb = t + k*beat
            if tb >= T: break
            q = any(a <= tb < b for a, b in quiebres)
            if q: continue
            if E['kick'] == '4x4' or (E['kick'] == 'suave' and k in (0, 2)) or (E['kick'] == 'trap' and k in (0, 2)): add(B, tb, kick(), .9 if E['kick'] != 'suave' else .6)
            if E['kick'] == 'trap' and k == 3: add(B, tb + beat*.5, kick(), .6)
            if E['kick'] in ('4x4', 'trap') and k in (1, 3): add(M, tb, clap())
            for h in range(E['hats']): add(M, tb + h*beat/E['hats'], hat(), .55 if h % 2 else .8)
            if E.get('bajo8'):
                add(M, tb, bass(n2f(root), beat*.45)); add(M, tb + beat/2, bass(n2f(root), beat*.45), .8)
            elif k in (0, 2): add(M, tb, bass(n2f(root), beat*1.8))
            if E['inst'] == 'keys' and k in (0, 2): add(M, tb, keys([n2f(m) for m in ch], beat*2))
            if E['inst'] == 'marimba':
                for j, m in enumerate([ch[0], ch[2], ch[1]+12, ch[2]]): add(M, tb + j*beat/4 if False else tb + (j*beat/2 if j < 2 else 0), marimba(n2f(m+12)), .9) if j < 2 else None
            if E['inst'] == 'pluck':
                for j, m in enumerate([ch[0], ch[2], ch[1]+12, ch[2]]): add(M, tb + j*beat/4, pluck(n2f(m+12)), .8)
        t += bar
    mus = (M + B)[:int(T*SR)]
    fo = int(max(0, T-1.2)*SR); mus[fo:] *= np.linspace(1, 0, len(mus)-fo)
    return mus

def guardar(x, fn):
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1); w = wave.open(fn, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()

def audio(g):
    T = g['total']; N = int(T*SR); S = np.zeros(N)
    for t, n, v in g['eventos']: add(S, t, SFX[n](), v)
    quiebres = [(e['cuenta'][0] - .2, e['revela']) for e in g['escenas'] if e['tipo'] == 'voto']
    mus = musica(g['marca'], T, quiebres)
    d = f"aud/{g['id']}"
    guardar(S*.85, d + '-sfx.wav'); guardar(mus*.75, d + '-mus.wav')
    ins = []; fl = []
    for i, (f, st) in enumerate(g['_voces']):
        ins += ['-i', f]; ms = int(max(0, st)*1000); fl.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms},apad[v{i}]')
    n = len(g['_voces'])
    fl.append(''.join(f'[v{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0,atrim=0:{T},pan=stereo|c0=c0|c1=c0,acompressor=threshold=-18dB:ratio=3:attack=5:release=80[out]')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[out]', '-ar', '48000', d + '-voz.wav'], check=True)
    run = lambda a: subprocess.run(['ffmpeg', '-y', '-v', 'error', *a], check=True)
    run(['-i', d + '-voz.wav', '-i', d + '-sfx.wav', '-i', d + '-mus.wav', '-filter_complex',
         '[0:a]asplit[v][vk];[2:a]volume=0.6[m];[m][vk]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[md];[v]volume=1.7[vv];[1:a]volume=0.75[s];[vv][s][md]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[o]',
         '-map', '[o]', '-ar', '48000', d + '-mix-voz.wav'])
    run(['-i', d + '-sfx.wav', '-i', d + '-mus.wav', '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[o]', '-map', '[o]', '-ar', '48000', d + '-mix-sinvoz.wav'])
    run(['-i', d + '-sfx.wav', '-filter_complex', 'loudnorm=I=-18:TP=-1.5[o]', '-map', '[o]', '-ar', '48000', d + '-mix-efectos.wav'])

if __name__ == '__main__':
    ids = sys.argv[1:]
    if ids == ['todos']: ids = [os.path.basename(f)[:-5] for f in sorted(glob.glob('reels/*.json')) if not f.endswith('.tl.json')]
    for i in ids:
        g = json.load(open(f'reels/{i}.json'))
        g = linea_de_tiempo(g)
        json.dump({k: v for k, v in g.items() if k != '_voces'}, open(f'reels/{i}.tl.json', 'w'), ensure_ascii=False)
        if '--sin-audio' not in sys.argv: audio(g)
        print(i, 'total', g['total'], 's')
