# Cola única de reels: produce siempre el que sale antes (fecha y hora de publicación), entre todos los planes
# <marca>-<ddmm>-<a..e> que ya tienen voz en audio/voces-listas.txt y todavía no tienen out/<id>.mp4.
# Reemplaza a cola.sh y cola2.sh. Se puede relanzar: nunca corre dos lote.py a la vez.
import glob, json, os, re, subprocess, time
os.chdir(os.path.dirname(os.path.abspath(__file__)))
def log(*a): open('lote.log', 'a').write(time.strftime('%H:%M:%S ') + ' '.join(map(str, a)) + '\n')
def listas():
    ok, falla = set(), set()
    if os.path.exists('audio/voces-listas.txt'):
        for l in open('audio/voces-listas.txt'):
            p = l.split()
            if len(p) >= 2: (falla if p[1] == 'FALLA' else ok).add(p[0])
    return ok, falla
while True:
    if subprocess.run(['pgrep', '-f', 'lote.py'], capture_output=True).returncode == 0: time.sleep(20); continue
    ok, falla = listas(); cand = []
    for f in glob.glob('planes/*-[0-9][0-9][0-9][0-9]-[a-e].json'):
        id_ = os.path.basename(f)[:-5]
        if id_ in falla or id_ not in ok or os.path.exists(f'out/{id_}.mp4'): continue
        p = json.load(open(f)); cand.append((p['fecha_pub'], p['hora'], id_))
    if not cand: time.sleep(60); continue
    _, _, id_ = min(cand); subprocess.run(['python3', 'lote.py', id_])
