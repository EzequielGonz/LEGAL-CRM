# Voces de los reels Atlas: VITA usa la voz ElevenLabs ya generada (tiempos por frase medidos con silencedetect);
# las demás usan la voz gratis (edge-tts es-AR) con el tiempo de cada palabra. Salida: audio/<id>-voz.wav y audio/<id>-palabras.json
import asyncio, json, os, re, ssl, subprocess, sys
import edge_tts, edge_tts.communicate as _c
_c._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
G = '/home/user/LEGAL-CRM/docs/redes/tanda-2811-0712/guiones/'
VOCES = {'coberturas': ('es-AR-ElenaNeural', '+6%', '+0Hz'), 'autos': ('es-AR-TomasNeural', '+8%', '-2Hz'), 'marketing': ('es-AR-ElenaNeural', '+8%', '+0Hz')}
LEAD = 0.5  # silencio al principio para que el primer cuadro ya esté en movimiento

def guion(id_):
    marca = id_.split('-')[0]
    return {x['id']: x for x in json.load(open(G + marca + '.json'))}[id_]

async def edge(id_):
    g = guion(id_); marca = id_.split('-')[0]; voz, rate, pitch = VOCES[marca]
    c = edge_tts.Communicate(g['voz'], voz, rate=rate, pitch=pitch, boundary='WordBoundary'); words = []
    with open(f'audio/{id_}-raw.mp3', 'wb') as f:
        async for m in c.stream():
            if m['type'] == 'audio': f.write(m['data'])
            elif m['type'] == 'WordBoundary': words.append(dict(t=round(m['offset'] / 1e7 + LEAD, 3), d=round(m['duration'] / 1e7, 3), w=m['text']))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'audio/{id_}-raw.mp3', '-af', f'adelay={int(LEAD*1000)}|{int(LEAD*1000)},highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2', '-ar', '48000', '-ac', '1', f'audio/{id_}-voz.wav'], check=True)
    return words

def vita(id_):
    # Frases medidas con silencedetect sobre la voz ElevenLabs (32,91 s); las palabras se reparten por largo dentro de cada frase.
    seg = [(0, .68, 'Domingo,'), (1.0, 2.39, '19:10.'), (3.24, 5.51, 'Recién chocaste y te sale decir:'), (6.47, 8.12, '«Perdón, fue mi culpa».'),
           (8.9, 9.89, 'Nunca digas esto.'), (10.78, 11.53, 'Antes de hablar,'), (12.04, 12.82, 'tres pasos.'), (13.48, 13.84, 'Uno:'),
           (14.69, 17.53, 'fotos de los autos, la patente y la esquina.'), (18.25, 18.65, 'Dos:'), (19.28, 21.88, 'datos del otro conductor y de los testigos.'),
           (22.47, 22.83, 'Tres:'), (23.4, 25.99, 'avisá a tu seguro dentro de los tres días.'), (26.6, 28.95, 'Mandáselo a quien maneje todos los días.'),
           (29.64, 30.95, 'Porque recién chocaste…'), (31.54, 32.44, 'y te sale decir:')]
    words = []
    for a, b, txt in seg:
        ws = txt.split(); L = sum(len(w) + 1 for w in ws); t = a
        for w in ws:
            d = (b - a) * (len(w) + 1) / L; words.append(dict(t=round(t + LEAD, 3), d=round(d, 3), w=w)); t += d
    src = '/home/user/LEGAL-CRM/docs/redes/tanda-2811-0712/salida/vita/vita-2711-1.mp3'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-af', f'adelay={int(LEAD*1000)}|{int(LEAD*1000)}', '-ar', '48000', '-ac', '1', f'audio/{id_}-voz.wav'], check=True)
    return words

def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)

if __name__ == '__main__':
    os.makedirs('audio', exist_ok=True)
    for id_ in sys.argv[1:]:
        words = vita(id_) if id_.startswith('vita') else asyncio.run(edge(id_))
        T = dur(f'audio/{id_}-voz.wav')
        g = guion(id_)
        json.dump(dict(id=id_, voz_fin=round(T, 3), total=round(T + 1.2, 2), palabras=words, textos=g['textos_pantalla'], palabra=g['palabra'], gancho=g['gancho_pantalla']),
                  open(f'audio/{id_}-palabras.json', 'w'), ensure_ascii=False, indent=1)
        print(id_, 'voz', round(T, 2), 's,', len(words), 'palabras')
