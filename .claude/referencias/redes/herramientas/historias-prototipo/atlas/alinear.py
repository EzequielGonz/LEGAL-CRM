# Tiempos reales de cada palabra (para el karaoke): reconoce la voz con faster-whisper (local, gratis) y cruza lo reconocido
# con el texto del guion; las palabras del guion que no se reconocen toman el tiempo interpolado entre vecinas.
# Uso: python3 alinear.py <id> "<texto de la voz>" <audio> [lead]  → audio/<id>-palabras.json (solo el campo palabras)
import difflib, json, re, subprocess, sys, unicodedata
import numpy as np
from faster_whisper import WhisperModel
_M = None
def modelo():
    global _M
    if _M is None: _M = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)
    return _M
def nrm(s): s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn'); return re.sub(r'[^a-z0-9ñ]', '', s)
NUM = {'19:10': ['diecinueve', 'y', 'diez']}
def alinear(texto, audio, lead=0.0):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout, np.float32)
    segs, _ = modelo().transcribe(pcm, language='es', word_timestamps=True, vad_filter=False, beam_size=5)
    rec = [dict(w=w.word.strip(), t=w.start, f=w.end) for s in segs for w in s.words]
    guion = texto.split()
    a = [nrm(w) for w in guion]; b = [nrm(x['w']) for x in rec]
    out = [None] * len(guion)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): r = rec[blk.b + k]; out[blk.a + k] = (r['t'], r['f'])
    # palabras sin pareja (números, signos): interpolar entre vecinas conocidas
    idx = [i for i, v in enumerate(out) if v]
    if not idx: raise SystemExit('sin alineación')
    for i in range(len(out)):
        if out[i]: continue
        prev = max([j for j in idx if j < i], default=None); nxt = min([j for j in idx if j > i], default=None)
        if prev is None: out[i] = (max(0, out[nxt][0] - .3), out[nxt][0])
        elif nxt is None: out[i] = (out[prev][1], out[prev][1] + .35)
        else:
            gap = (out[nxt][0] - out[prev][1]); n = nxt - prev; k = i - prev
            out[i] = (out[prev][1] + gap * (k - 1) / n, out[prev][1] + gap * k / n)
    return [dict(t=round(s + lead, 3), d=round(max(.08, f - s), 3), w=w) for w, (s, f) in zip(guion, out)], sum(1 for v in idx) / len(guion)

if __name__ == '__main__':
    id_, texto, audio = sys.argv[1:4]; lead = float(sys.argv[4]) if len(sys.argv) > 4 else 0
    pal, cobertura = alinear(texto, audio, lead)
    f = f'audio/{id_}-palabras.json'; d = json.load(open(f)); d['palabras'] = pal; json.dump(d, open(f, 'w'), ensure_ascii=False, indent=1)
    print(id_, len(pal), 'palabras, reconocidas', round(cobertura * 100), '%')
