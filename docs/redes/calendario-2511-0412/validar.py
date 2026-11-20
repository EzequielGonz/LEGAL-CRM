# Valida calendario.csv. Uso: python3 validar.py  (sale con código 1 si hay errores)
import csv, os, sys, collections
from datetime import date

AQUI = os.path.dirname(os.path.abspath(__file__))
filas = list(csv.DictReader(open(os.path.join(AQUI, 'calendario.csv'), encoding='utf-8')))
errores, avisos = [], []
D = lambda s: date.fromisoformat(s)
DIAS = sorted({f['fecha'] for f in filas})
MARCAS = sorted({f['marca'] for f in filas})
CARRUSEL = {'2026-11-25', '2026-11-27', '2026-11-29', '2026-12-01', '2026-12-03'}
TOPE_TEMA = 3

por = collections.defaultdict(list)
for f in filas:
    tipo = 'reel' if f['formato'] == 'reel' else 'historia' if f['formato'].startswith('historia') else 'carrusel'
    por[(f['marca'], f['fecha'], tipo)].append(f['hora'])
    for campo in ('palabra', 'revision', 'gancho', 'cierre'):
        if not f[campo].strip():
            errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: falta «{campo}»')
    if 'botón está en el perfil' in ' '.join(f.values()).lower() or 'boton esta en el perfil' in ' '.join(f.values()).lower():
        errores.append(f'{f["fecha"]} {f["hora"]} {f["marca"]}: menciona el botón del perfil, que no existe')

for m in MARCAS:
    for d in DIAS:
        esperado = ['08:30', '13:30', '20:30'] if d <= '2026-11-30' else ['08:30', '13:30', '17:00', '20:30']
        if sorted(por[(m, d, 'reel')]) != esperado:
            errores.append(f'{m} {d}: reels en {sorted(por[(m, d, "reel")])}, se esperaba {esperado}')
        if sorted(por[(m, d, 'historia')]) != ['09:30', '12:00', '18:30', '21:30']:
            errores.append(f'{m} {d}: historias en {sorted(por[(m, d, "historia")])}')
        car = por[(m, d, 'carrusel')]
        if (d in CARRUSEL and car != ['11:00']) or (d not in CARRUSEL and car):
            errores.append(f'{m} {d}: carrusel mal ubicado ({car})')

# Repeticiones de reels
reels = [f for f in filas if f['formato'] == 'reel']
vistos = collections.defaultdict(list)
for f in reels:
    vistos[(f['marca'], f['idea_id'])].append(f)
for (m, iid), lst in vistos.items():
    vers = [x['version'] for x in lst]
    if len(lst) > 2 or len(set(vers)) != len(vers):
        errores.append(f'{m} {iid}: se repite {len(lst)} veces ({vers})')
    a = [x for x in lst if x['version'] == 'A']
    for b in [x for x in lst if x['version'] == 'B']:
        if not a:
            errores.append(f'{m} {iid}: versión B sin A')
            continue
        dias = (D(b['fecha']) - D(a[0]['fecha'])).days
        if dias < 5:
            errores.append(f'{m} {iid}: B a {dias} días de A (mínimo 5)')
        if b['gancho'] == a[0]['gancho']:
            errores.append(f'{m} {iid}: la B tiene el mismo gancho que la A')

temas = collections.Counter((f['marca'], f['tema']) for f in reels)
for (m, t), n in temas.items():
    if n > TOPE_TEMA:
        errores.append(f'{m}: el tema «{t}» aparece {n} veces en reels (tope {TOPE_TEMA})')

# Historias idénticas a menos de 5 días
hist = collections.defaultdict(list)
for f in filas:
    if f['formato'].startswith('historia'):
        hist[(f['marca'], f['gancho'])].append(D(f['fecha']))
for (m, g), fechas in hist.items():
    fechas.sort()
    for x, y in zip(fechas, fechas[1:]):
        if (y - x).days < 5:
            avisos.append(f'{m}: historia repetida a {(y - x).days} días: «{g[:60]}»')

# Resumen
print('Validación de calendario.csv')
print(f'- Filas: {len(filas)} · reels: {len(reels)} · historias: {sum(1 for f in filas if f["formato"].startswith("historia"))}'
      f' · carruseles: {sum(1 for f in filas if f["formato"] == "carrusel guía")}')
for m in MARCAS:
    r = [f for f in reels if f['marca'] == m]
    ideas = {f['idea_id'] for f in r}
    print(f'- {m}: {len(r)} reels, {len(ideas)} ideas distintas, {sum(1 for f in r if f["version"] == "B")} versiones B, '
          f'tema más repetido: {max(n for (mm, t), n in temas.items() if mm == m)} veces')
rev = collections.Counter(f['revision'] for f in filas)
print('- Revisión: ' + ' · '.join(f'{k}: {v}' for k, v in sorted(rev.items())))
print(f'- Condicionados o de actualidad: {sum(1 for f in filas if f["condicion"])}')
for a in avisos:
    print('AVISO', a)
for e in errores:
    print('ERROR', e)
print('Resultado:', 'OK, sin errores' if not errores else f'{len(errores)} errores')
sys.exit(1 if errores else 0)
