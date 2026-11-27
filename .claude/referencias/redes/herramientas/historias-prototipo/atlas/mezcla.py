# Sonido de los reels Atlas: voz + música de marca (baja sola cuando habla la voz) + efectos de cada evento de la escena,
# mezcla final a −14 LUFS. Los eventos los declara la escena (window.EVENTOS) y render.js los guarda en audio/<id>-eventos.json.
# python3 mezcla.py <id>  → audio/<id>-mezcla.wav
import json, os, subprocess, sys
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); HP = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(os.path.dirname(HP), 'reels')); os.makedirs('/tmp/aud_dummy', exist_ok=True); os.chdir('/tmp/aud_dummy')
import build as B
sys.path.insert(0, HP); import sonido as S
os.chdir(AQUI)
SR = B.SR; rng = np.random.default_rng(5); bp, add, env = B.bp, B.add, B.env

def cargar(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def flap(n=8, gap=.045):  # cartel de aeropuerto: ráfaga de paletas que caen
    x = np.zeros(int((n * gap + .2) * SR))
    for k in range(n):
        m = int(.025 * SR); c = bp(rng.standard_normal(m), 1500, 9000) * env(m, .0004, .004) * (.5 + .3 * rng.random()) + B.sweep(320, 180, .025) * env(m, .0004, .006) * .25
        add(x, k * gap * (1 + .15 * rng.standard_normal()), c)
    return x * .8
def arcilla():  # plastilina que se aplasta
    n = int(.22 * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 120, 900) * np.exp(-t / .05) * .55 + np.sin(2 * np.pi * np.cumsum(140 - 300 * t) / SR) * np.exp(-t / .06) * .3
def vidrio():
    t = np.arange(int(1.2 * SR)) / SR; return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) * a for f, d, a in [(2637, .5, .25), (3951, .3, .12), (5274, .2, .06)])
def grieta():
    n = int(.35 * SR); x = np.zeros(n)
    for k in range(14): m = int(.012 * SR); add(x, rng.uniform(0, .25), bp(rng.standard_normal(m), 2500, 12000) * env(m, .0002, .003) * rng.uniform(.3, .9))
    return x + bp(rng.standard_normal(n), 60, 300) * np.exp(-np.arange(n) / SR / .08) * .4
def foco():  # golpe de reflector de teatro
    n = int(.5 * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 40, 220) * np.exp(-t / .09) * .9 + bp(rng.standard_normal(n), 1800, 6000) * np.exp(-t / .015) * .25
def telon(d=1.4):
    n = int(d * SR); return bp(rng.standard_normal(n), 200, 2500) * np.hanning(n) ** .7 * .35
def foto():
    return cargar(os.path.join(HP, 'tanda/trabajo/vita-2711-1/sfx_foto.mp3')) * .9

SFX = {'whoosh': lambda: B.S_whoosh(), 'whoosh_largo': lambda: B.S_whoosh(.8, 200, 5000), 'boom': B.S_boom, 'thud': B.S_thud, 'tick': B.S_tick, 'chime': B.S_chime,
       'ding': B.S_ding, 'pop': B.S_popin, 'popout': B.S_popout, 'click': B.S_click, 'riser': lambda: B.S_riser(1.6), 'papel': B.S_paper, 'rasgu': B.S_scratch,
       'sello': S.sello_golpe, 'choque': S.choque, 'vibra': S.vibra, 'flap': flap, 'flap_largo': lambda: flap(22, .038), 'arcilla': arcilla, 'vidrio': vidrio,
       'grieta': grieta, 'foco': foco, 'telon': telon, 'foto': foto, 'pasos': lambda: S.pasos(1.6, .4), 'ciudad': lambda: S.amb_ciudad(34)}
MUSICA = {'vita': None, 'coberturas': 'cob', 'autos': 'autos', 'marketing': 'mkt'}

def guardar(x, fn):
    import wave
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1); w = wave.open(fn, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes()); w.close()

if __name__ == '__main__':
    id_ = sys.argv[1]; marca = id_.split('-')[0]
    ev = json.load(open(f'audio/{id_}-eventos.json')); T = ev['total']; N = int(T * SR)
    fx = np.zeros(N)
    for t, n, v in ev['eventos']: add(fx, t, SFX[n](), v)
    if MUSICA[marca]: mus = B.musica(MUSICA[marca], T, [])
    else:
        mus = cargar(os.path.join(HP, 'tanda/trabajo/vita-2711-1/musica.mp3'))[:N]; mus = np.pad(mus, (0, max(0, N - len(mus))))
        fo = int(max(0, T - 1.5) * SR); mus[fo:] *= np.linspace(1, 0, N - fo)
    a = f'audio/{id_}'; guardar(fx * .8, a + '-fx.wav'); guardar(mus[:N] * .7, a + '-mus.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', a + '-voz.wav', '-i', a + '-fx.wav', '-i', a + '-mus.wav', '-filter_complex',
        f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad,atrim=0:{T},asplit[v][vk];[2:a]volume=0.55[m];[m][vk]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=320[md];'
        f'[v]volume=1.6[vv];[1:a]volume=0.8[s];[vv][s][md]amix=inputs=3:normalize=0,atrim=0:{T},loudnorm=I=-14:TP=-1.5:LRA=9[o]', '-map', '[o]', '-ar', '48000', a + '-mezcla.wav'], check=True)
    print(id_, 'mezcla', T, 's,', len(ev['eventos']), 'efectos')
