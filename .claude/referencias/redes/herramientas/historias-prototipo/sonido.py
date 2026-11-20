# Diseño de sonido de las mini historias: ambiente por escena (ciudad, oficina, living, avenida), efectos de cada evento,
# música de marca que baja durante la voz (sidechain) y mezcla final a −14 LUFS. Versión con voz y versión sin voz.
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, '/home/user/LEGAL-CRM/.claude/referencias/redes/herramientas/reels'); os.makedirs('/tmp/aud_dummy', exist_ok=True); _cwd = os.getcwd(); os.chdir('/tmp/aud_dummy')
import build as B
os.chdir(_cwd)
SR = B.SR; rng = np.random.default_rng(11); bp = B.bp; add = B.add

def ruido_marron(d, lo=40, hi=900): n = int(d * SR); x = np.cumsum(rng.standard_normal(n)); x -= np.convolve(x, np.ones(4800) / 4800, 'same'); return bp(x / (np.abs(x).max() + 1e-9), lo, hi)
def amb_ciudad(d, noche=True):
    x = ruido_marron(d, 40, 700) * .5 + bp(rng.standard_normal(int(d * SR)), 300, 3000) * .03
    for k in range(int(d / 3) + 1):  # autos que pasan
        t0 = k * 3 + rng.uniform(0, 2); n = int(2.4 * SR); env = np.hanning(n) ** 2
        add(x, t0, bp(rng.standard_normal(n), 120, 1800) * env * .25)
    if noche: add(x, d * .6, B.sweep(420, 410, .5) * B.env(int(.5 * SR), .02, .3) * .04)  # bocina lejana
    return x
def amb_interior(d, hum=True):
    x = bp(rng.standard_normal(int(d * SR)), 80, 600) * .05
    if hum: t = np.arange(len(x)) / SR; x += np.sin(2 * np.pi * 100 * t) * .004
    return x
def amb_reloj(d): x = amb_interior(d, False); [add(x, k * 1.0, B.S_tick() * .25) for k in range(int(d))]; return x
def colectivo_pasa(d=3.0):
    n = int(d * SR); t = np.arange(n) / SR; env = np.exp(-((t - d / 2) / (d / 4)) ** 2)
    eng = np.sin(2 * np.pi * np.cumsum(70 + 18 * np.tanh((d / 2 - t) * 2)) / SR) * .35 + bp(rng.standard_normal(n), 100, 2500) * .6
    return eng * env * .55
def pasos(d, paso=.42): x = np.zeros(int(d * SR)); [add(x, k * paso, bp(rng.standard_normal(int(.08 * SR)), 300, 3000) * B.env(int(.08 * SR), .001, .02) * .35) for k in range(int(d / paso))]; return x
def vibra(d=.5): n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 160 * t) * (np.sin(2 * np.pi * 6 * t) > 0) * .18
def sello_golpe(): x = B.S_boom() * .9; add(x, 0, B.S_thud() * .9); add(x, .01, B.S_paper() * .8); return x
def choque(): x = B.S_boom() * 1.0; add(x, 0, B.S_thud()); add(x, .03, bp(rng.standard_normal(int(.5 * SR)), 2500, 11000) * np.exp(-np.arange(int(.5 * SR)) / SR / .12) * .35); return x
def lapicera(): n = int(.6 * SR); return bp(rng.standard_normal(n), 2000, 9000) * np.abs(np.sin(np.linspace(0, 14, n))) * np.hanning(n) * .08

def mezclar(rid, amb, fx, estilo, quiebres=()):
    V = json.load(open(f'voz/{rid}-h.json')); T = V['total']; N = int(T * SR)
    A = np.zeros(N); S = np.zeros(N)
    for t0, t1, kind in amb:
        seg = {'ciudad': lambda d: amb_ciudad(d), 'ciudad_dia': lambda d: amb_ciudad(d, False), 'oficina': amb_interior, 'living': amb_reloj, 'local': lambda d: amb_interior(d, False)}[kind](t1 - t0 + .3)
        n = len(seg); f = np.ones(n); k = int(.12 * SR); f[:k] = np.linspace(0, 1, k); f[-k:] = np.linspace(1, 0, k); add(A, t0, seg * f)
    for t, fn, g in fx: add(S, t, fn(), g)
    mus = B.musica(estilo, T, list(quiebres))
    d = f'audio/{rid}'; os.makedirs('audio', exist_ok=True)
    B.guardar(A * .9, d + '-amb.wav'); B.guardar(S * .85, d + '-sfx.wav'); B.guardar(mus * .6, d + '-mus.wav')
    run = lambda a: subprocess.run(['ffmpeg', '-y', '-v', 'error', *a], check=True)
    run(['-i', f'voz/{rid}-h-voz.wav', '-i', d + '-sfx.wav', '-i', d + '-mus.wav', '-i', d + '-amb.wav', '-filter_complex',
         '[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=3[v][vk][vk2];[2:a]volume=0.55[m];[m][vk]sidechaincompress=threshold=0.025:ratio=10:attack=15:release=350[md];[3:a]volume=0.9[a];[a][vk2]sidechaincompress=threshold=0.03:ratio=3:attack=20:release=400[ad];'
         '[v]volume=1.6[vv];[1:a]volume=0.8[s];[vv][s][md][ad]amix=inputs=4:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[o]', '-map', '[o]', '-ar', '48000', d + '-mix-voz.wav'])
    run(['-i', d + '-sfx.wav', '-i', d + '-mus.wav', '-i', d + '-amb.wav', '-filter_complex', '[0:a][1:a][2:a]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[o]', '-map', '[o]', '-ar', '48000', d + '-mix-sinvoz.wav'])
    print(rid, 'audio listo', T)

def vita():
    V = json.load(open('voz/vita-h.json')); F = lambda m: next(f for f in V['frases'] if f.get('marca') == m); FI = lambda i: next(f for f in V['frases'] if f.get('item') == i)
    fr = V['frases']; T = V['total']; T1 = fr[1]['t']; golpe = F('sello')['t'] + .12
    cortes = [T1 - .04, T1 + 1.95, F('lapicera')['t'] - .1, F('sello')['t'] - .45, fr[4]['t'] - .05, F('dolor')['t'] - .05, F('dolor')['t'] + 2.1, fr[6]['t'] - .05, FI(1)['t'] - .1, FI(2)['t'] - .1, FI(3)['t'] - .1, F('alivio')['t'] - .1, T - .4]
    amb = [(0, T1, 'ciudad'), (T1, T1 + 1.95, 'ciudad'), (T1 + 1.95, F('lapicera')['t'], 'oficina'), (F('lapicera')['t'], fr[4]['t'], 'oficina'), (fr[4]['t'], F('dolor')['t'], 'oficina'),
           (F('dolor')['t'], FI(1)['t'], 'living'), (FI(1)['t'], FI(3)['t'], 'living'), (FI(3)['t'], F('alivio')['t'], 'ciudad_dia'), (F('alivio')['t'], T, 'oficina')]
    fx = [(0.0, choque, .9), (.12, vibra, .9), (.75, vibra, .7), (.2, B.S_ding, .5), (golpe, sello_golpe, 1.0), (golpe - .5, lambda: B.S_whoosh(.5, 200, 6000), .9), (F('lapicera')['t'] + .1, lapicera, 1),
          (FI(2)['t'] + .5, B.S_paper, .9), (FI(3)['t'] - .1, colectivo_pasa, .9), (FI(3)['t'] - .1, lambda: pasos(2.9), .8), (V['frases'][-1]['t'] - .3, B.S_chime, .7)]
    fx += [(c - .06, lambda: B.S_whoosh(.32, 400, 7000), .35) for c in cortes] + [(FI(i)['t'], B.S_chime, .55) for i in (1, 2, 3)]
    caeL = F('sello')['t'] - .75; t4 = fr[4]['t'] - .05; ate = F('dolor')['t'] - .05
    def viento(d):
        n = int(d * SR); x = bp(rng.standard_normal(n), 300, 5000) * np.linspace(.2, 1, n) ** 1.5 * .5; x[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR)); return x
    fx += [(caeL - .55, lambda: B.S_whoosh(.55, 120, 3000), 1.0), (caeL, choque, 1.0), (t4 - .1, lambda: B.S_riser(.5) if hasattr(B, 'S_riser') else viento(.5), .6),
           (t4, lambda: viento(ate - t4), .9), (ate, sello_golpe, 1.0), (ate, B.S_boom, .7)]
    mezclar('vita', amb, fx, 'vita', quiebres=[(golpe - .1, golpe + .7)])

if __name__ == '__main__':
    {'vita': vita}[sys.argv[1]]()
