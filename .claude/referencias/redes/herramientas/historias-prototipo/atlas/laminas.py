# Láminas fijas (post, carrusel e historias) con la escena 3D de cada marca, sin voz.
# Arma un plan y unos tiempos de palabras sintéticos, saca un cuadro por lámina con render.js y recorta:
# carrusel y post a 1080×1350, historias a 1080×1920. Salida: piezas/<id>-<n>.jpg
# Uso: python3 laminas.py specs.json [id ...]
#   specs.json: lista de {id, marca, gancho, laminas: [[cartel, linea, objeto], ...], formato: car|post|his}
#   cartel ≤ 5 palabras (va escrito en la escena); linea ≤ 4 palabras (subtítulo de abajo); el cierre lo agrega solo.
import json, os, re, subprocess, sys, unicodedata
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
CIERRE = 'Escribinos por WhatsApp'
PASO, VENT, MIRA = 3.0, 1.6, 2.3      # segundos por lámina, ventana de las palabras, momento del cuadro
EFECTOS = ['rebote', 'lupa', 'flash', 'barrido', 'despiece', 'giro', 'cuenta']

def nrm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9ñ]', '', s)

def armar(sp):
    lam = [list(x) for x in sp['laminas']]
    if sp['formato'] == 'car' and nrm(lam[-1][0]) != nrm(CIERRE): lam.append([CIERRE, CIERRE + '.', 'check' if sp['marca'] != 'vita' else 'sello'])
    palabras, beats, tiempos, vistos = [], [], [], {}
    for i, (cartel, linea, obj) in enumerate(lam):
        if len(cartel.split()) > 5: raise SystemExit(f"{sp['id']}: cartel de más de 5 palabras: {cartel}")
        if len(linea.split()) > 4 or re.search(r'[,;:]', linea.rstrip('.?!')): raise SystemExit(f"{sp['id']}: línea de más de 4 palabras o con coma: {linea}")
        if not re.search(r'[.?!…]$', linea): linea += '.'
        lam[i][1] = linea
        ini = .6 + i * PASO; ws = linea.split(); d = VENT / max(1, len(ws))
        for j, w in enumerate(ws): palabras.append({'t': round(ini + j * d, 3), 'd': round(d * .9, 3), 'w': w})
        k = nrm(ws[0]); n = vistos.get(k, 0)
        for w in ws: vistos[nrm(w)] = vistos.get(nrm(w), 0) + 1
        tipo = 'gancho' if i == 0 else 'cierre' if nrm(cartel) == nrm(CIERRE) else 'paso'
        beats.append({'palabra': ws[0], 'n': n, 'tipo': tipo, 'objeto': obj, 'texto': cartel,
                      'efecto': 'sello' if tipo == 'cierre' else EFECTOS[(i + len(sp['id'])) % len(EFECTOS)]})
        tiempos.append(round(ini + MIRA, 2))
    total = round(.6 + len(lam) * PASO + .8, 2)
    plan = {'id': sp['id'], 'marca': sp['marca'], 'gancho': sp['gancho'], 'voz': ' '.join(x[1] for x in lam), 'palabra': '',
            'contador': 0, 'beats': beats, 'cierre': CIERRE}
    json.dump(plan, open(f"planes/{sp['id']}.json", 'w'), ensure_ascii=False, indent=1)
    json.dump({'id': sp['id'], 'voz_fin': total - 1.2, 'total': total, 'palabras': palabras, 'textos': [x[0] for x in lam],
               'palabra': '', 'gancho': sp['gancho']}, open(f"audio/{sp['id']}-palabras.json", 'w'), ensure_ascii=False, indent=1)
    return tiempos

def sacar(sp):
    t = armar(sp); os.makedirs('piezas', exist_ok=True)
    r = subprocess.run(['node', 'render.js', sp['id'], 'prueba', *map(str, t)], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stdout[-800:] + r.stderr[-800:])
    salidas = []
    for k, x in enumerate(t):
        im = Image.open(f"prueba/{sp['id']}-{x:.2f}.jpg").convert('RGB')
        if sp['formato'] in ('car', 'post'): im = im.crop((0, sp.get('recorte', 190), 1080, sp.get('recorte', 190) + 1350))
        f = f"piezas/{sp['id']}-{k + 1}.jpg"; im.save(f, quality=90); salidas.append(f)
    return salidas

if __name__ == '__main__':
    specs = json.load(open(sys.argv[1])); pedidos = set(sys.argv[2:])
    for sp in specs:
        if pedidos and sp['id'] not in pedidos: continue
        print(sp['id'], sacar(sp), flush=True)
