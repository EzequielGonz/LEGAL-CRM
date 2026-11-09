# Imprime los próximos K pedidos para Metricool que no están en el registro, en orden cronológico,
# solo si sus archivos ya responden en la URL pública. Uso: python3 siguiente.py K [hasta]
import json, sys, subprocess, os
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
BLOG = {'mkt': '7242607', 'vita': '7549864', 'cob': '7549939', 'autos': '7552104'}
TZ = 'America/Argentina/Buenos_Aires'
K = int(sys.argv[1]); HASTA = sys.argv[2] if len(sys.argv) > 2 else '9999'
hechos = set()
if os.path.exists(LEDGER):
    for l in open(LEDGER):
        if l.strip():
            j = json.loads(l)
            if j.get('ok'): hechos.add((j['marca'], j['fecha'], j['tipo']))
P = json.load(open('plan.json'))['plan']
vivos = {}
def vivo(u):
    if u not in vivos:
        x = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-I', '--max-time', '15', u], capture_output=True, text=True)
        vivos[u] = x.stdout.strip() == '200'
    return vivos[u]
out = []
for p in P:
    if len(out) >= K: break
    if p['fecha'] >= HASTA or (p['marca'], p['fecha'], p['tipo']) in hechos: continue
    if not all(vivo(u) for u in p['urls']): continue
    t = {'reel': 'REEL', 'post': 'POST', 'carrusel': 'POST', 'historia': 'STORY'}[p['tipo']]
    info = {'autoPublish': True, 'draft': False, 'text': p['texto'], 'media': p['urls'],
            'providers': [{'network': 'instagram'}, {'network': 'facebook'}],
            'publicationDate': {'dateTime': p['fecha'], 'timezone': TZ},
            'instagramData': {'type': t, 'isAiGenerated': bool(p.get('ai'))}, 'facebookData': {'type': t}}
    if t == 'REEL': info['videoCoverMilliseconds'] = p['portada_ms']; info['instagramData']['showReelOnFeed'] = True
    out.append({'marca': p['marca'], 'tipo': p['tipo'], 'pieza': p['pieza'], 'blogId': BLOG[p['marca']],
                'date': p['fecha'] + '-03:00', 'info': json.dumps(info, ensure_ascii=False)})
for o in out: print(json.dumps(o, ensure_ascii=False))
