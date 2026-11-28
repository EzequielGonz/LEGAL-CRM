# Producción en serie de reels Atlas (después de tener la voz). Por cada id:
#   palabras.json desde el plan → alinear (faster-whisper) → render 30 fps → mezcla −14 LUFS → mp4 → tapa → 3 cuadros de control.
# Uso: python3 lote.py <id> [<id> ...]   (necesita audio/<id>-voz.wav; salta los que ya tienen out/<id>.mp4)
# Registro: lote.log (una línea por paso). Errores: sigue con el próximo id.
import json, os, subprocess, sys, time
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
LOG = open('lote.log', 'a', buffering=1)
def tapa(id_):
    # Tapa: cuadro de 1,2 s (gancho a la vista). Solo en marcas de escena clara (Coberturas y Marketing):
    # si ese cuadro sale mucho más oscuro que la escena ya iluminada (apertura con foco o fundido),
    # se busca más adelante, hasta 3,0 s. VITA y Autos son oscuras a propósito y quedan en 1,2 s.
    from PIL import Image, ImageStat
    def luz(t, destino):
        run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.1f}', '-i', f'out/{id_}.mp4', '-frames:v', '1', '-q:v', '2', destino])
        return ImageStat.Stat(Image.open(destino).convert('L')).mean[0]
    primera = luz(1.2, f'out/{id_}.jpg')
    if id_.split('-')[0] not in ('coberturas', 'marketing'): return
    ref = luz(3.0, f'out/{id_}-ref.jpg'); os.remove(f'out/{id_}-ref.jpg')
    if primera >= 0.6 * ref: return
    for t in (1.6, 2.0, 2.4, 2.8, 3.0):
        if luz(t, f'out/{id_}.jpg') >= 0.8 * ref: break

def log(*a): LOG.write(time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in a) + '\n')
def run(cmd, env=None):
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if r.returncode: raise RuntimeError(' '.join(cmd[:3]) + ' → ' + (r.stderr or r.stdout)[-600:])
    return r.stdout
def dur(f): return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

def uno(id_):
    if os.path.exists(f'out/{id_}.mp4'): log(id_, 'ya estaba'); return
    voz = f'audio/{id_}-voz.wav'
    if not os.path.exists(voz): log(id_, 'SIN VOZ, salteado'); return
    pl = json.load(open(f'planes/{id_}.json')); T = dur(voz)
    json.dump(dict(id=id_, voz_fin=round(T, 3), total=round(T + 1.2, 2), palabras=[], textos=[b['texto'] for b in pl['beats']],
                   palabra=pl.get('palabra', ''), gancho=pl['gancho']), open(f'audio/{id_}-palabras.json', 'w'), ensure_ascii=False, indent=1)
    log(id_, 'alinear', run(['python3', 'alinear.py', id_, pl['voz'], voz, '0']).strip())
    env = dict(os.environ, RAPIDO='1', ESCALA=os.environ.get('ESCALA', '0.67')); t0 = time.time()
    run(['node', 'render.js', id_, '30', '3'], env=env); log(id_, 'render', round(time.time() - t0), 's')
    run(['python3', 'mezcla.py', id_])
    os.makedirs('out', exist_ok=True)
    run(['ffmpeg', '-y', '-v', 'error', '-framerate', '30', '-i', f'fr/{id_}/%05d.jpg', '-i', f'audio/{id_}-mezcla.wav', '-c:v', 'libx264', '-crf', '22',
         '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', f'out/{id_}.mp4'])
    D = dur(f'out/{id_}.mp4')
    tapa(id_)
    os.makedirs('prueba/chk', exist_ok=True)
    for k, t in enumerate([1.0, D / 2, D - 0.6]):
        run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.2f}', '-i', f'out/{id_}.mp4', '-frames:v', '1', '-vf', 'scale=360:-1', '-q:v', '4', f'prueba/chk/{id_}-{k}.jpg'])
    log(id_, 'LISTO', round(D, 1), 's', round(os.path.getsize(f'out/{id_}.mp4') / 1e6, 1), 'MB')

if __name__ == '__main__':
    for id_ in sys.argv[1:]:
        try: uno(id_)
        except Exception as e: log(id_, 'ERROR', e)
    log('fin del lote', ' '.join(sys.argv[1:]))
