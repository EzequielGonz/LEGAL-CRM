# Aloja las piezas fijas (post, carrusel, historias) en la landing de cada marca y comprueba el 200.
# Uso: python3 alojar_piezas.py <marca> [ddmm ...]     (sin días: todos los de specs-<marca>.json)
# Copia piezas/<id>-<n>.jpg a apps/web/public/redes/<ddmm>/ con los nombres de 04-posts-carruseles-historias.md:
#   <marca>-<ddmm>-post.jpg · <marca>-<ddmm>-carrusel-<n>.jpg · <marca>-<ddmm>-historia-1.jpg y -2.jpg
# Escribe piezas/alojadas-<marca>.json: {id: [urls]} con las URLs públicas que ya responden 200.
import glob, json, os, shutil, subprocess, sys, time
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
REPO = {'vita': 'estudio-juridico-vita-final', 'coberturas': 'coberturas-sociales-landing', 'autos': '0km-kocos-agencia', 'marketing': 'agencia-kocos-mkt'}
DOM = {'vita': 'www.estudiojuridicovita.com', 'coberturas': 'www.comparatuobrasocial.com', 'autos': 'www.autoskocos.com', 'marketing': 'www.kocosmkt.com'}
RAMA = 'claude/brave-hawking-nzsr60'

def nombre(id_, n):
    m, dd, tipo = id_.split('-')
    if tipo == 'car': return f'{m}-{dd}-carrusel-{n}.jpg'
    if tipo == 'post': return f'{m}-{dd}-post.jpg'
    return f'{m}-{dd}-historia-{tipo[-1]}.jpg'

def git(r, *a): return subprocess.run(['git', '-C', r, *a], capture_output=True, text=True)

m = sys.argv[1]; dias = set(sys.argv[2:])
specs = [s for s in json.load(open(f'piezas/specs-{m}.json')) if not dias or s['id'].split('-')[1] in dias]
r = f'/home/user/{REPO[m]}'; urls = {}
for s in specs:
    dd = s['id'].split('-')[1]; dest = f'{r}/apps/web/public/redes/{dd}'; os.makedirs(dest, exist_ok=True)
    fs = sorted(glob.glob(f"piezas/{s['id']}-[0-9].jpg"), key=lambda f: int(f.rsplit('-', 1)[1][:-4]))
    if not fs: print(s['id'], 'SIN IMÁGENES'); continue
    urls[s['id']] = []
    for k, f in enumerate(fs, 1):
        n = nombre(s['id'], k); shutil.copy(f, f'{dest}/{n}'); urls[s['id']].append(f'https://{DOM[m]}/redes/{dd}/{n}')
git(r, 'fetch', '-q', 'origin', 'main'); git(r, 'merge', '-q', '--ff-only', 'origin/main')
git(r, 'add', 'apps/web/public/redes'); c = git(r, 'commit', '-qm', f'Redes: posts, carruseles e historias de {m}')
for intento in range(4):
    p1 = git(r, 'push', '-q', 'origin', 'HEAD:main')
    if p1.returncode == 0: git(r, 'push', '-q', 'origin', f'HEAD:{RAMA}'); break
    git(r, 'fetch', '-q', 'origin', 'main'); git(r, 'rebase', '-q', 'origin/main'); time.sleep(10 * (intento + 1))
else: raise SystemExit(f'{m}: no se pudo subir: {p1.stderr[-300:]}')
time.sleep(90); ok = {}
for id_, us in urls.items():
    bien = True
    for u in us:
        for _ in range(6):
            code = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-I', u], capture_output=True, text=True).stdout
            if code == '200': break
            time.sleep(30)
        if code != '200': bien = False; print('SIN 200', u, code)
    if bien: ok[id_] = us
prev = json.load(open(f'piezas/alojadas-{m}.json')) if os.path.exists(f'piezas/alojadas-{m}.json') else {}
prev.update(ok); json.dump(prev, open(f'piezas/alojadas-{m}.json', 'w'), indent=1)
print(m, len(ok), 'de', len(urls), 'piezas con 200')
