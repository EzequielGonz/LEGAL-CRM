# Copia a cada landing (apps/web/public/redes/) los archivos del calendario hasta una fecha
# y los publica: commit, push a main y después a la rama de trabajo.
# Uso: python3 alojar.py 2026-11-13 [--sin-push]
import json, os, shutil, subprocess, sys
HASTA = sys.argv[1]
REPO = {'vita': '/home/user/estudio-juridico-vita-final', 'cob': '/home/user/coberturas-sociales-landing',
        'autos': '/home/user/0km-kocos-agencia', 'mkt': '/home/user/agencia-kocos-mkt'}
RAMA = 'claude/gracious-volta-rv2f3x'
P = json.load(open('plan.json'))['plan']
base = os.path.dirname(os.path.abspath(__file__))
def origen(f): return os.path.join(base, 'out' if f.endswith('.mp4') else 'piezas', f)
def git(r, *a, ok=False):
    x = subprocess.run(['git', '-C', r, *a], capture_output=True, text=True)
    if x.returncode and not ok: raise SystemExit(f'git {a} en {r}: {x.stderr.strip()[:400]}')
    return x.stdout.strip()
resumen = {}
for m, r in REPO.items():
    dest = os.path.join(r, 'apps/web/public/redes'); os.makedirs(dest, exist_ok=True)
    fs = sorted({f for p in P if p['marca'] == m and p['fecha'] < HASTA for f in p['archivos']})
    nuevos = []; faltan = []
    for f in fs:
        o = origen(f)
        if not os.path.exists(o): faltan.append(f); continue
        d = os.path.join(dest, f)
        if not os.path.exists(d) or os.path.getsize(d) != os.path.getsize(o):
            shutil.copy2(o, d); nuevos.append(f)
    resumen[m] = {'nuevos': len(nuevos), 'faltan': faltan}
    if not nuevos or '--sin-push' in sys.argv: continue
    git(r, 'add', 'apps/web/public/redes')
    git(r, 'commit', '-q', '-m', f'Redes: archivos para las publicaciones programadas hasta el {HASTA}\n\n'
        'Videos e imágenes que Metricool toma por URL pública para Instagram y Facebook.\n\n'
        'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n'
        'Claude-Session: https://claude.ai/code/session_01FuLgnjHoiZTXHqrkcEnPGW')
    # primero main (así Vercel arma producción) y después la rama de trabajo
    for intento in range(4):
        x = subprocess.run(['git', '-C', r, 'push', '-q', 'origin', 'HEAD:main'], capture_output=True, text=True)
        if not x.returncode: break
        import time; time.sleep(2 ** (intento + 1))
    else: raise SystemExit(f'push a main falló en {r}: {x.stderr[:300]}')
    git(r, 'push', '-q', '-u', 'origin', RAMA)
    resumen[m]['commit'] = git(r, 'rev-parse', '--short', 'HEAD')
print(json.dumps(resumen, ensure_ascii=False, indent=1))
