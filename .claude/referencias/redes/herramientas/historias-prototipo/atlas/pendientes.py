# Reels alojados (mp4 y jpg con 200) que todavía no están en docs/redes/programadas.jsonl.
# Uso: python3 pendientes.py
# Imprime la lista y, para cada uno, la línea de reel_metricool.py (blogId, fecha, redes) y su JSON «info».
# Arma una hoja única prueba/chk/pendientes-hoja.jpg (una fila por reel: 3 cuadros + tapa) para revisar de una vez.
import json, os, re, subprocess, sys
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
RAIZ = os.path.abspath(os.path.join(AQUI, *['..'] * 6))
al = {}
for l in open('alojados.log'):
    m = re.match(r'\S+ (\S+-\d{4}-[a-e]) (mp4|jpg) 200', l)
    if m: al.setdefault(m.group(1), set()).add(m.group(2))
prog = set()
for l in open(os.path.join(RAIZ, 'docs/redes/programadas.jsonl')):
    try: d = json.loads(l)
    except ValueError: continue
    if d.get('ok') and d.get('tipo') == 'reel': prog.add(d.get('pieza'))
pend = sorted((i for i, s in al.items() if s >= {'mp4', 'jpg'} and i not in prog),
              key=lambda i: (json.load(open(f'planes/{i}.json'))['fecha_pub'], json.load(open(f'planes/{i}.json'))['hora']))
print('pendientes:', ' '.join(pend) or 'ninguno')
if not pend: sys.exit()
print(subprocess.run(['python3', 'reel_metricool.py', *pend], capture_output=True, text=True).stdout)
filas = []
for i in pend:
    fs = [f'prueba/chk/{i}-{k}.jpg' for k in range(3)] + [f'out/{i}.jpg']
    ims = [Image.open(f).convert('RGB').resize((180, 320)) for f in fs if os.path.exists(f)]
    fila = Image.new('RGB', (190 * len(ims), 330), 'white')
    for k, im in enumerate(ims): fila.paste(im, (k * 190, 5))
    filas.append(fila)
hoja = Image.new('RGB', (max(f.width for f in filas), 330 * len(filas)), 'white')
for k, f in enumerate(filas): hoja.paste(f, (0, k * 330))
hoja.save('prueba/chk/pendientes-hoja.jpg', quality=80)
print('hoja: prueba/chk/pendientes-hoja.jpg (filas en el orden de la lista)')
