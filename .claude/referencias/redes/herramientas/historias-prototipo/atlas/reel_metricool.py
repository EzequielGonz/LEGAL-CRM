# Prepara la carga de un reel en Metricool a partir de su plan (no publica nada).
# Uso: python3 reel_metricool.py <id> [<id> ...]
# Imprime, por reel: blogId, fecha con zona y el JSON «info» listo para createScheduledPost.
# También arma la hoja de control (3 cuadros + tapa) en prueba/chk/<id>-hoja.jpg para revisarla antes de programar.
# Reglas: redes según el plan; REEL en IG y FB; isAiGenerated en IG; tapa propia; borrador si el plan tiene «revision».
import json, os, sys
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); os.chdir(AQUI)
DOM = {'vita': 'www.estudiojuridicovita.com', 'coberturas': 'www.comparatuobrasocial.com', 'autos': 'www.autoskocos.com', 'marketing': 'www.kocosmkt.com'}
BLOG = {'vita': '7549864', 'coberturas': '7549939', 'autos': '7552104', 'marketing': '7242607'}
ZONA = 'America/Argentina/Buenos_Aires'

def hoja(id_):
    fs = [f'prueba/chk/{id_}-{k}.jpg' for k in range(3)] + [f'out/{id_}.jpg']
    ims = [Image.open(f).convert('RGB') for f in fs if os.path.exists(f)]
    h = 560; ims = [i.resize((int(i.width * h / i.height), h)) for i in ims]
    c = Image.new('RGB', (sum(i.width for i in ims) + 10 * len(ims), h), 'white'); x = 0
    for i in ims: c.paste(i, (x, 0)); x += i.width + 10
    c.save(f'prueba/chk/{id_}-hoja.jpg', quality=80); return f'prueba/chk/{id_}-hoja.jpg'

for id_ in sys.argv[1:]:
    p = json.load(open(f'planes/{id_}.json')); m = p['marca']; dd = id_.split('-')[1]
    base = f"https://{DOM[m]}/redes/{dd}/{id_}"
    redes = p.get('redes') or ['instagram', 'facebook']
    info = {'autoPublish': True, 'draft': bool(p.get('revision')), 'descendants': [], 'firstCommentText': '',
            'hasNotReadNotes': False, 'shortener': False, 'smartLinkData': {'ids': []},
            'media': [base + '.mp4'], 'videoThumbnailUrl': base + '.jpg', 'mediaAltText': [],
            'providers': [{'network': r} for r in redes],
            'publicationDate': {'dateTime': f"{p['fecha_pub']}T{p['hora']}:00", 'timezone': ZONA},
            'text': p['copy']}
    if 'facebook' in redes: info['facebookData'] = {'type': 'REEL'}
    if 'instagram' in redes: info['instagramData'] = {'type': 'REEL', 'showReelOnFeed': True, 'isAiGenerated': True}
    print(f"== {id_} · blogId {BLOG[m]} · fecha {p['fecha_pub']}T{p['hora']}:00-03:00 · redes {'+'.join(redes)}"
          f"{' · BORRADOR (' + p['revision'] + ')' if p.get('revision') else ''} · hoja {hoja(id_)}")
    print(json.dumps(info, ensure_ascii=False))
