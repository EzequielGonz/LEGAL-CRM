# Voz: edge-tts es-AR frase por frase, con pausas y micro-variaciones de ritmo y tono, más una cadena de mezcla
# (EQ, de-esser, compresión y una sala muy leve) para que no suene "seca de laboratorio".
import asyncio, json, os, re, ssl, subprocess, sys
import numpy as np, edge_tts, edge_tts.communicate as _c
_c._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
from guion import R
SR = 48000; os.chdir(os.path.dirname(os.path.abspath(__file__)))

async def tts(text, voz, rate, pitch, out):
    if os.path.exists(out + '.mp3') and os.path.exists(out + '.json'): return
    c = edge_tts.Communicate(text, voz, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz', boundary='WordBoundary')
    words = []
    with open(out + '.mp3', 'wb') as f:
        async for m in c.stream():
            if m['type'] == 'audio': f.write(m['data'])
            elif m['type'] == 'WordBoundary': words.append(dict(t=m['offset'] / 1e7, d=m['duration'] / 1e7, w=m['text']))
    json.dump(words, open(out + '.json', 'w'), ensure_ascii=False)

def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def trim(x, thr=0.01):
    a = np.abs(x); idx = np.where(a > thr)[0]
    if not len(idx): return x, 0
    i0 = max(0, idx[0] - int(0.015 * SR)); i1 = min(len(x), idx[-1] + int(0.06 * SR))
    return x[i0:i1], i0 / SR

def breath(rng, d=0.22, g=0.012):
    n = int(d * SR); x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); X *= np.exp(-((f - 1800) / 1400) ** 2); x = np.fft.irfft(X, n)
    return x / (np.abs(x).max() + 1e-9) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g

def plain(s): return re.sub(r'[*]', '', s)

def align(show, words, t0):
    # Reparte los tiempos de las palabras dichas sobre las palabras mostradas por posición relativa de caracteres.
    sw = plain(show).split(); hot = []
    raw = show.split(); on = False
    for w in raw:
        st = w.startswith('*'); en = w.rstrip('.,:…?!').endswith('*') or w.endswith('*')
        if st: on = True
        hot.append(on)
        if en: on = False
    if not words: return [dict(w=w, t=t0, h=h) for w, h in zip(sw, hot)]
    said = ' '.join(x['w'] for x in words); L = max(1, len(said)); pos = []; c = 0
    for x in words: pos.append((c / L, x['t'])); c += len(x['w']) + 1
    pos.append((1.0, words[-1]['t'] + words[-1]['d']))
    Ls = max(1, len(' '.join(sw))); out = []; c = 0
    for w, h in zip(sw, hot):
        fr = c / Ls; k = max(i for i, (p, _) in enumerate(pos) if p <= fr + 1e-9)
        if k >= len(pos) - 1: tt = pos[-1][1]
        else:
            (p0, a), (p1, b) = pos[k], pos[k + 1]; tt = a + (b - a) * (fr - p0) / max(1e-6, p1 - p0)
        out.append(dict(w=w, t=round(t0 + tt, 3), h=h)); c += len(w) + 1
    return out

async def main(ids):
    rng = np.random.default_rng(7)
    for rid in ids:
        g = R[rid]; tareas = []
        for i, f in enumerate(g['frases']):
            f['_o'] = f'voz/seg/{rid}-{i}-{g["voz"][6:9]}-{g["rate"] + f.get("r", 0)}-{g["pitch"] + f.get("ph", 0)}-{abs(hash(f["say"])) % 10**6}'
            tareas.append(tts(f['say'], g['voz'], g['rate'] + f.get('r', 0), g['pitch'] + f.get('ph', 0), f['_o']))
        await asyncio.gather(*tareas)
        lead = 0.18; buf = [np.zeros(int(lead * SR), np.float32)]; t = lead; frases = []; words = []
        for i, f in enumerate(g['frases']):
            x = load(f['_o'] + '.mp3'); x, off = trim(x)
            ws = json.load(open(f['_o'] + '.json')); ws = [dict(w['w'] and w, t=w['t'] - off) for w in ws]
            if f.get('br') or f.get('cta') or f.get('item') == 1:  # respiración suave antes de algunas frases
                b = breath(rng); buf[-1] = buf[-1]; buf.append(b.astype(np.float32)); t += len(b) / SR
            wa = align(f['show'], ws, t)
            frases.append(dict(t=round(t, 3), fin=round(t + len(x) / SR, 3), show=f['show'], item=f.get('item'), cta=f.get('cta', 0), hook=f.get('hook', 0), sello=f.get('sello', 0), words=wa))
            words += wa; buf.append(x); t += len(x) / SR
            p = f['p'] + float(rng.uniform(-0.03, 0.03)); buf.append(np.zeros(int(max(0.04, p) * SR), np.float32)); t += max(0.04, p)
        v = np.concatenate(buf)
        tail = g.get('tail', 1.6); v = np.concatenate([v, np.zeros(int(tail * SR), np.float32)]); total = len(v) / SR
        raw = f'voz/{rid}-raw.wav'; v.astype(np.float32).tofile(raw + '.f32')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw + '.f32', raw], check=True)
        fl = ('highpass=f=85,equalizer=f=230:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.4:g=2,equalizer=f=9000:t=h:w=1:g=1.5,'
              'deesser=i=0.35,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2')
        y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', raw, '-af', fl, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
        # sala corta muy leve (respuesta sintética de 0,3 s), para que la voz no suene seca de laboratorio
        n = int(0.3 * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.06); ir /= np.sqrt((ir ** 2).sum())
        N = 1 << int(np.ceil(np.log2(len(y) + n))); wet = np.fft.irfft(np.fft.rfft(y, N) * np.fft.rfft(ir, N), N)[:len(y)]
        y = y + wet * 0.06
        y *= 10 ** (-17 / 20) / (np.sqrt((y[np.abs(y) > 1e-3] ** 2).mean()) + 1e-9)
        pk = np.abs(y).max(); y = y / pk * min(pk, 0.84)
        y.astype(np.float32).tofile('voz/tmp.f32')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'voz/tmp.f32', f'voz/{rid}-voz.wav'], check=True); os.remove('voz/tmp.f32')
        os.remove(raw + '.f32')
        json.dump(dict(id=rid, total=round(total, 3), palabra=g['palabra'], frases=frases), open(f'voz/{rid}.json', 'w'), ensure_ascii=False, indent=1)
        print(rid, 'total', round(total, 2), 's', len(words), 'palabras')

asyncio.run(main(sys.argv[1:] or list(R)))
