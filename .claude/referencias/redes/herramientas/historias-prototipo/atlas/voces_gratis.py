# Voces gratis (edge-tts es-AR) para los planes con "motor_voz": "gratis" que todavía no tienen voz.
# Uso: python3 voces_gratis.py [id ...]   (con ids, también fuerza esos aunque digan elevenlabs)
import asyncio, glob, json, os, ssl, subprocess, sys
import edge_tts, edge_tts.communicate as _c
_c._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')   # el proxy del entorno
os.chdir(os.path.dirname(os.path.abspath(__file__)))
VOZ = {'vita': 'es-AR-TomasNeural', 'coberturas': 'es-AR-ElenaNeural', 'autos': 'es-AR-TomasNeural', 'marketing': 'es-AR-TomasNeural'}
hechos = {l.split()[0] for l in open('audio/voces-listas.txt') if l.strip()}
forzar = set(sys.argv[1:])
for f in sorted(glob.glob('planes/*-[0-9][0-9][0-9][0-9]-[a-e].json'), key=lambda f: (json.load(open(f))['fecha_pub'], json.load(open(f))['hora'])):
    p = json.load(open(f)); i = p['id']
    if i in hechos or (p.get('motor_voz') != 'gratis' and i not in forzar): continue
    raw, wav = f'audio/{i}-raw.mp3', f'audio/{i}-voz.wav'
    try:
        asyncio.run(edge_tts.Communicate(p['voz'], VOZ[p['marca']], rate='+10%').save(raw))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af', 'adelay=500|500,highpass=f=80', '-ar', '48000', '-ac', '1', wav], check=True, timeout=120)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
        open('audio/voces-listas.txt', 'a').write(f'{i} {d:.1f} s\n'); print(i, round(d, 1))
    except Exception as e:
        print(i, 'FALLA', e)
