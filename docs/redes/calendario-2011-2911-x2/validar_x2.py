# Valida calendario.csv del cronograma x2 (20/11 al 29/11/2026). Uso: python3 validar_x2.py
# Sale con código 1 si hay errores. Lee el calendario base (../calendario-2511-0412/calendario.csv) solo para comparar.
import csv, os, re, sys, collections
from datetime import date, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE_CSV = os.path.join(os.path.dirname(AQUI), 'calendario-2511-0412', 'calendario.csv')
REND = os.path.join(os.path.dirname(AQUI), 'analisis-2026-11-20', 'rendimiento-reels-10-19nov.csv')
filas = list(csv.DictReader(open(os.path.join(AQUI, 'calendario.csv'), encoding='utf-8')))
base = list(csv.DictReader(open(BASE_CSV, encoding='utf-8')))
errores, avisos = [], []
D = date.fromisoformat

COLS = ['fecha', 'hora', 'marca', 'redes', 'formato', 'serie', 'tema', 'idea_id', 'idea', 'gancho', 'palabra', 'cierre',
        'referencia', 'revision', 'version', 'condicion', 'variante_de', 'cambios', 'personaje', 'lugar_ba',
        'conflicto_seg1', 'giro_irreal']
OBLIGATORIAS = [c for c in COLS if c not in ('condicion', 'variante_de')]
DIAS = [(date(2026, 11, 20) + timedelta(days=i)).isoformat() for i in range(10)]
MARCAS = ['Autos', 'Coberturas', 'Kocos Marketing', 'VITA']
CONTROL = {'08:30', '11:00', '13:30', '17:00', '20:30', '10:00', '19:00', '12:30', '09:30', '18:30'}
TOPE_TEMA = 6
NOTA = '«Situación ilustrativa» va solo en el texto de la publicación'
PJ, PE = 'pendiente: revisión profesional', 'pendiente: revisión del equipo'

def mas20(h):
    t = int(h[:2]) * 60 + int(h[3:]) + 20
    return f'{t // 60:02d}:{t % 60:02d}'

def esperado(n, tipo):
    if tipo == 'reel':
        hs = ['08:30', '10:30', '13:30', '16:30', '19:00', '20:30'] if n < 6 else \
             ['07:30', '09:00', '10:30', '12:00', '13:30', '17:00', '19:00', '20:30']
    elif tipo == 'historia':
        hs = ['08:00', '09:30', '11:30', '13:00', '15:30', '18:30', '20:00', '21:30']
    else:
        hs = ['11:00']
    if n < 5:
        hs = [mas20(h) if h in CONTROL else h for h in hs]
    return sorted(hs)

def tipo(f):
    return 'reel' if f['formato'] == 'reel' else 'historia' if f['formato'].startswith('historia') else 'carrusel'

def origen(f):
    c = f['cambios']
    return 'base' if c.startswith('calendario base') else 'remake' if c.startswith('remake') else 'variante'

# 1. Columnas completas
if list(filas[0].keys()) != COLS:
    errores.append(f'columnas distintas de las esperadas: {list(filas[0].keys())}')
for f in filas:
    for c in OBLIGATORIAS:
        if not (f.get(c) or '').strip():
            errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]} {f["formato"]}: falta «{c}»')
    if f['version'] in ('B', 'R') and not f['variante_de'].strip():
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: versión {f["version"]} sin «variante_de»')

# 2. Totales exactos por formato, marca y día
cuenta = collections.Counter(tipo(f) for f in filas)
for t, n in (('reel', 272), ('historia', 320), ('carrusel', 40)):
    if cuenta[t] != n:
        errores.append(f'total de {t}: {cuenta[t]}, se esperaban {n}')
if len(filas) != 632:
    errores.append(f'total de filas: {len(filas)}, se esperaban 632')
por = collections.defaultdict(list)
for f in filas:
    por[(f['marca'], f['fecha'], tipo(f))].append(f['hora'])
for m in MARCAS:
    for t, n in (('reel', 68), ('historia', 80), ('carrusel', 10)):
        tot = sum(len(por[(m, d, t)]) for d in DIAS)
        if tot != n:
            errores.append(f'{m}: {tot} {t}s, se esperaban {n}')
    for n, d in enumerate(DIAS):
        for t in ('reel', 'historia', 'carrusel'):
            # 3. Horarios exactos (con el corrimiento del grupo de control del 20 al 24/11)
            if sorted(por[(m, d, t)]) != esperado(n, t):
                errores.append(f'{m} {d} {t}: horarios {sorted(por[(m, d, t)])}, se esperaban {esperado(n, t)}')
fuera = [f for f in filas if f['fecha'] not in DIAS]
if fuera:
    errores.append(f'{len(fuera)} filas fuera del período 20/11 al 29/11')
for f in filas:
    if f['fecha'] in DIAS[:5] and f['hora'] in CONTROL:
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: coincide con un horario del grupo de control')

# 4. Separación de 5 días o más entre piezas de la misma idea (por formato)
def familia(f):
    return f['variante_de'] if f['version'] == 'R' else f['idea_id']
grupos = collections.defaultdict(list)
for f in filas:
    clave = f['formato'] if tipo(f) == 'historia' else tipo(f)
    grupos[(f['marca'], clave, familia(f))].append(f)
for (m, fmt, fam), lst in grupos.items():
    fechas = sorted(D(x['fecha']) for x in lst)
    for a, b in zip(fechas, fechas[1:]):
        if (b - a).days < 5:
            errores.append(f'{m} {fmt} «{fam}»: dos piezas a {(b - a).days} días (mínimo 5)')
    rep = collections.Counter(x['gancho'] for x in lst)
    for x in lst:
        if rep[x['gancho']] > 1:
            if origen(x) != 'base':
                errores.append(f'{m} {fmt} «{fam}»: una variante nueva repite el texto de su madre')
            elif x is lst[0] or True:
                avisos.append(f'{m} {fmt} «{fam}»: el calendario base repite el mismo texto a 5 días (versiones A y B del reel del día)')
                break
    if fmt == 'reel':
        giros = [x['giro_irreal'] for x in lst]
        if len(set(giros)) != len(giros):
            errores.append(f'{m} reel «{fam}»: la variante repite el giro irreal')
# Remakes: la pieza vieja salió hace más de 5 días
ultima = collections.defaultdict(str)
for x in csv.DictReader(open(REND, encoding='utf-8')):
    b = re.sub(r'-(voz|tendencia)$', '', x['pieza'])
    ultima[b] = max(ultima[b], x['fecha_ba'][:10])
for f in filas:
    if f['version'] == 'R':
        u = ultima.get(f['variante_de'])
        if not u:
            errores.append(f'{f["fecha"]} {f["marca"]}: remake de una pieza vieja desconocida ({f["variante_de"]})')
        elif (D(f['fecha']) - D(u)).days <= 5:
            errores.append(f'{f["fecha"]} {f["marca"]}: remake de «{f["variante_de"]}» a {(D(f["fecha"]) - D(u)).days} días de la pieza vieja')
# Variantes B nuevas: misma palabra que la madre
palabra_idea = {(f['marca'], f['idea_id']): f['palabra'] for f in filas if origen(f) == 'base'}
for f in filas:
    if origen(f) == 'variante' and f['version'] == 'B':
        p = palabra_idea.get((f['marca'], f['variante_de']))
        if p and p != f['palabra']:
            errores.append(f'{f["fecha"]} {f["marca"]} {f["idea_id"]}: la variante cambia la palabra ({p} → {f["palabra"]})')

# 5. Tope por tema y marca en reels
reels = [f for f in filas if f['formato'] == 'reel']
temas = collections.Counter((f['marca'], f['tema']) for f in reels)
for (m, t), n in temas.items():
    if n > TOPE_TEMA:
        errores.append(f'{m}: el tema «{t}» tiene {n} reels (tope {TOPE_TEMA})')
ganchos = collections.Counter((f['marca'], f['gancho']) for f in reels)
for (m, g), n in ganchos.items():
    if n > 1:
        errores.append(f'{m}: el gancho «{g}» se repite en {n} reels')

# 6. Textos prohibidos y cierres
PROHIBIDO = [r'bot[oó]n est[aá] en el perfil', r'bot[oó]n en el perfil', r'\$\s?\d', r'\bUSD\b', r'\d+\s?pesos',
             r'te garantizamos', r'garantizad[oa]s?\b', r'te aseguramos', r'resultado asegurado', r'vas a cobrar',
             r'vas a ganar', r'duplic[aá]', r'triplic[aá]', r'cartel de «?situación ilustrativa»? en pantalla']
for f in filas:
    texto = ' '.join(f[c] for c in COLS if c != 'cierre') + ' ' + f['cierre'].replace(NOTA, '')
    for pat in PROHIBIDO:
        if re.search(pat, texto, re.I):
            errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: texto prohibido ({pat})')
    kw = f['palabra']
    if tipo(f) == 'reel' and not f['cierre'].startswith(f'Comentá «{kw}»'):
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: el reel no cierra con «Comentá {kw}»')
    if tipo(f) == 'historia' and not f['cierre'].startswith(f'Respondé esta historia con «{kw}»'):
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: la historia no cierra con «Respondé esta historia con {kw}»')
    if tipo(f) == 'carrusel' and f'comentá «{kw}»'.lower() not in f['cierre'].lower():
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: el carrusel no cierra con «comentá {kw}»')
    if NOTA not in f['cierre']:
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: falta aclarar que «Situación ilustrativa» va solo en el texto')

# 7. Revisión de lo nuevo
for f in filas:
    if origen(f) != 'base':
        esperada = PJ if f['marca'] in ('VITA', 'Coberturas') else PE
        if f['revision'] != esperada:
            errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: pieza nueva con revisión «{f["revision"]}» (va «{esperada}»)')

# 8. Las 316 piezas del calendario base siguen, con su contenido y en su día (corrido 5 días)
idx_base = {d: i for i, d in enumerate(sorted({b['fecha'] for b in base}))}
idx_nuevo = {d: i for i, d in enumerate(DIAS)}
# Black Friday de Autos pasa al 27/11 (día 7) y «Cómo se adjudica un plan» toma su lugar el 22/11 (día 2), con sus historias.
EXC = {('Autos', 'reel', 'blackfriday'): 7, ('Autos', 'reel', 'adjudicacion'): 2, ('Autos', 'carrusel', 'blackfriday'): 7,
       ('Autos', 'historia', 'blackfriday'): 7, ('Autos', 'historia', 'adjudicacion'): 2}
nuevas_base = collections.defaultdict(list)
for f in filas:
    if origen(f) == 'base':
        nuevas_base[(f['marca'], f['formato'], f['idea_id'], f['gancho'], f['version'])].append(f)
faltan = 0
for b in base:
    clave = (b['marca'], b['formato'], b['idea_id'], b['gancho'], b['version'])
    if b['idea_id'] == 'patentamientos':
        continue  # va el respaldo «contado-plan»: el ranking de ACARA de noviembre sale después del 29/11
    lst = nuevas_base.get(clave)
    if not lst:
        faltan += 1
        errores.append(f'falta la pieza base {clave}')
        continue
    f = lst.pop(0)
    n_esp = EXC.get((b['marca'], tipo(b), b['idea_id']), idx_base[b['fecha']])
    if idx_nuevo[f['fecha']] != n_esp:
        errores.append(f'pieza base {clave} en el día {idx_nuevo[f["fecha"]]}, se esperaba {n_esp}')
    for c in ('palabra', 'revision', 'serie', 'tema', 'idea'):
        if f[c] != b[c]:
            errores.append(f'pieza base {clave}: cambió «{c}»')
n_base = sum(1 for f in filas if origen(f) == 'base')
if n_base != 316:
    errores.append(f'piezas del calendario base: {n_base}, se esperaban 316')

# Resumen
print('Validación de calendario.csv (x2, 20/11 al 29/11/2026)')
print(f'- Filas: {len(filas)} · reels: {cuenta["reel"]} · historias: {cuenta["historia"]} · carruseles: {cuenta["carrusel"]}'
      f' · en IG y FB por separado: {2 * len(filas)}')
print(f'- Del calendario base: {n_base} · variantes nuevas: {sum(1 for f in filas if origen(f) == "variante")}'
      f' · remakes: {sum(1 for f in filas if origen(f) == "remake")}')
for m in MARCAS:
    r = [f for f in reels if f['marca'] == m]
    v = collections.Counter(f['version'] for f in r)
    tmax = max(n for (mm, t), n in temas.items() if mm == m)
    print(f'- {m}: {len(r)} reels (A {v["A"]} · B {v["B"]} · R {v["R"]}), {len({familia(f) for f in r})} ideas distintas, '
          f'tema más repetido: {tmax} reels')
rev = collections.Counter(f['revision'] for f in filas)
print('- Revisión: ' + ' · '.join(f'{k}: {v}' for k, v in sorted(rev.items())))
print(f'- Condicionadas: {sum(1 for f in filas if f["condicion"])}')
print(f'- Horarios corridos +20 min por el grupo de control (20 al 24/11): {sum(1 for f in filas if "grupo de control" in f["cambios"])}')
for a in avisos:
    print('AVISO', a)
for e in errores:
    print('ERROR', e)
print('Resultado:', 'OK, 0 errores' if not errores else f'{len(errores)} errores')
sys.exit(1 if errores else 0)
