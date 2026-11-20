# Voces de las mini historias: narración con edge-tts es-AR y personajes con edge-tts o Piper es_AR (local).
# Arma una pista por hablante, la línea de tiempo con palabras y la envolvente de la boca (60 Hz) para el lip-sync.
import asyncio, json, os, re, ssl, subprocess, sys
import numpy as np, edge_tts, edge_tts.communicate as _c
_c._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
from historia_guion import R, VOCES
from voz import align, trim, breath, SR
os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('voz/h', exist_ok=True)

async def edge(text, voz, rate, pitch, out):
    if os.path.exists(out + '.wav') and os.path.exists(out + '.json'): return
    c = edge_tts.Communicate(text, voz, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz', boundary='WordBoundary'); words = []
    with open(out + '.mp3', 'wb') as f:
        async for m in c.stream():
            if m['type'] == 'audio': f.write(m['data'])
            elif m['type'] == 'WordBoundary': words.append(dict(t=m['offset'] / 1e7, d=m['duration'] / 1e7, w=m['text']))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', out + '.mp3', '-ar', str(SR), '-ac', '1', out + '.wav'], check=True)
    json.dump(words, open(out + '.json', 'w'), ensure_ascii=False)

def piper(text, model, ls, out):
    if os.path.exists(out + '.wav'): return
    subprocess.run(['python3', '-m', 'piper', '-m', f'piper/{model}.onnx', '--length-scale', str(ls), '--noise-scale', '.6', '--noise-w-scale', '.75', '-f', out + '-22k.wav'],
                   input=text.encode(), check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', out + '-22k.wav', '-ar', str(SR), '-ac', '1', out + '.wav'], check=True)
    json.dump([], open(out + '.json', 'w'))

def load(w):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', w, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def proc(y, rng, room=.06):
    fl = 'highpass=f=85,equalizer=f=230:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.4:g=2,equalizer=f=9000:t=h:w=1:g=1.5,deesser=i=0.35,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2'
    y.astype(np.float32).tofile(f'voz/h/tmp-{os.getpid()}.f32')
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', f'voz/h/tmp-{os.getpid()}.f32', '-af', fl, '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    n = int(.3 * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / .06); ir /= np.sqrt((ir ** 2).sum())
    N = 1 << int(np.ceil(np.log2(len(y) + n))); y = y + np.fft.irfft(np.fft.rfft(y, N) * np.fft.rfft(ir, N), N)[:len(y)] * room
    return y

async def main(ids):
    rng = np.random.default_rng(7)
    for rid in ids:
        g = R[rid]; segs = []
        for i, f in enumerate(g['frases']):
            who = g['nar'] if f['q'] == 'nar' else f['q']; eng, voz, a, b = VOCES[who]
            out = f'voz/h/{rid}-{i}-{who}-{abs(hash((f["say"], f.get("r", 0), a, b))) % 10**7}'
            if eng == 'edge': await edge(f['say'], voz, a + f.get('r', 0), b + f.get('ph', 0), out)
            else: piper(f['say'], voz, a, out)
            segs.append((f, who, out))
        lead = .35; t = lead; pistas = {}; frases = []; L = []
        for f, who, out in segs:
            x = load(out + '.wav'); x, off = trim(x, .008); ws = [dict(w, t=w['t'] - off) for w in json.load(open(out + '.json'))]
            if not ws:  # Piper no da tiempos: se reparten por largo de palabra sobre la duración
                tok = f['say'].split(); tot = sum(len(w) + 1 for w in tok); c = 0; dur = len(x) / SR
                for w in tok: ws.append(dict(t=c / tot * dur, d=len(w) / tot * dur, w=w)); c += len(w) + 1
            if f.get('cta') or f.get('item') == 1: b = breath(rng); L.append((who, t, b)); t += len(b) / SR
            wa = align(f['show'], ws, t)
            # envolvente para la boca (solo personajes)
            env = []
            if f['q'] != 'nar':
                hop = SR // 60; e = np.array([np.sqrt((x[k:k + hop] ** 2).mean()) for k in range(0, len(x), hop)]); e = np.clip(e / (e.max() + 1e-9) * 1.4, 0, 1); env = [round(float(v), 2) for v in e]
            frases.append(dict(t=round(t, 3), fin=round(t + len(x) / SR, 3), q=f['q'], quien=who, show=f['show'], item=f.get('item'), cta=f.get('cta', 0), marca=f.get('marca'), words=wa, boca=env))
            L.append((who, t, x)); t += len(x) / SR + f['p'] + float(rng.uniform(-.03, .03))
        total = t + 1.8
        mix = {}
        for who, t0, x in L:
            if who not in mix: mix[who] = np.zeros(int((total + 1) * SR))
            i = int(t0 * SR); mix[who][i:i + len(x)] += x[:len(mix[who]) - i]
        voz = np.zeros(int((total + 1) * SR))
        for who, y in mix.items():
            y = proc(y, rng, .05 if who.startswith('nar') else .09)
            act = y[np.abs(y) > 1e-3]; lvl = -17 if who.startswith('nar') else -18.5
            y *= 10 ** (lvl / 20) / (np.sqrt((act ** 2).mean()) + 1e-9); voz += y
        pk = np.abs(voz).max(); voz = voz / pk * min(pk, .85)
        voz.astype(np.float32).tofile(f'voz/h/tmp-{os.getpid()}.f32')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', f'voz/h/tmp-{os.getpid()}.f32', f'voz/{rid}-h-voz.wav'], check=True)
        json.dump(dict(id=rid, total=round(total, 3), palabra=g['palabra'], serie=g['serie'], cfg=g.get('cfg', {}), frases=frases), open(f'voz/{rid}-h.json', 'w'), ensure_ascii=False)
        print(rid, round(total, 2), 's', [(f['q'], f['t']) for f in frases])

asyncio.run(main(sys.argv[1:] or list(R)))
