# python3 entregar_autos1.py <id> <fecha> <hora> <idea_id> <version> [t_portada]
# Copia el reel y la portada a docs/redes/produccion-2011/entregas/autos-1/, mide el volumen y actualiza el manifiesto autos-1.csv.
import csv, os, re, shutil, subprocess, sys
from historia_guion import R
rid, fecha, hora, idea, ver = sys.argv[1:6]; tp = sys.argv[6] if len(sys.argv) > 6 else '0.6'
REPO = '/home/user/LEGAL-CRM'; ENT = f'{REPO}/docs/redes/produccion-2011/entregas/autos-1'; MAN = f'{REPO}/docs/redes/produccion-2011/manifiestos/autos-1.csv'
os.makedirs(ENT, exist_ok=True)
shutil.copy(f'out/{rid}-h.mp4', f'{ENT}/{rid}.mp4')
subprocess.run(['node', 'revision/portada.js', rid, tp, f'{ENT}/{rid}.jpg'], check=True)
cal = next(x for x in csv.DictReader(open(f'{REPO}/docs/redes/calendario-2011-2911-x2/calendario.csv')) if x['fecha'] == fecha and x['hora'] == hora and x['marca'] == 'Autos' and x['formato'] == 'reel')
g = R[rid]; pal = g['palabra']; limpio = lambda s: re.sub(r'\*', '', s).strip()
its = sorted([f for f in g['frases'] if f.get('item')], key=lambda f: f['item'])
txt = (f"{cal['gancho']}\n\n" + '\n'.join(f"{f['item']}. {limpio(f['show'])}" for f in its) + f"\n\nComentá «{pal}» y te respondemos.\n\nSituación ilustrativa. Voz generada con IA.\n\n#0km #autonuevo #concesionaria #buenosaires #autos")
cols = 'fecha,hora,marca,idea_id,version,id,video_url,portada_url,palabra,texto,estado,metricool_id'.split(',')
rows = list(csv.DictReader(open(MAN))) if os.path.exists(MAN) else []
rows = [r for r in rows if r['id'] != rid] + [dict(fecha=fecha, hora=hora, marca='Autos', idea_id=idea, version=ver, id=rid, video_url=f'https://www.autoskocos.com/redes/2011/{rid}.mp4',
  portada_url=f'https://www.autoskocos.com/redes/2011/{rid}.jpg', palabra=pal, texto=txt, estado='renderizado', metricool_id='')]
rows.sort(key=lambda r: (r['fecha'], r['hora']))
w = csv.DictWriter(open(MAN, 'w', newline=''), fieldnames=cols); w.writeheader(); w.writerows(rows)
lu = subprocess.run(['ffmpeg', '-nostats', '-i', f'{ENT}/{rid}.mp4', '-vn', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
print(rid, os.path.getsize(f'{ENT}/{rid}.mp4') // 1e6, 'MB', re.findall(r'I:\s+(-?[\d.]+) LUFS', lu)[-1:], '\n' + txt)
