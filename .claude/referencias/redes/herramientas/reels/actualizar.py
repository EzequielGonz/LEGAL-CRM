# Arma los pedidos de actualización para las entradas liberadas (liberar.json) con la pieza nueva del plan.
import json, subprocess
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
BLOG = {'mkt': '7242607', 'vita': '7549864', 'cob': '7549939', 'autos': '7552104'}
TZ = 'America/Argentina/Buenos_Aires'
L = [tuple(x) for x in json.load(open('liberar.json'))]
reg = {}
for l in open(LEDGER):
    if l.strip():
        j = json.loads(l)
        if j.get('ok'): reg[(j['marca'], j['fecha'], j['tipo'])] = j
P = {(p['marca'], p['fecha'], p['tipo']): p for p in json.load(open('plan.json'))['plan']}
out = []
for k in L:
    p = P[k]; r = reg[k]
    vivos = all(subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-I', '--max-time', '15', u], capture_output=True, text=True).stdout == '200' for u in p['urls'])
    t = {'post': 'POST', 'carrusel': 'POST', 'historia': 'STORY'}[p['tipo']]
    info = {'autoPublish': True, 'draft': False, 'text': p['texto'], 'media': p['urls'],
            'providers': [{'network': 'instagram'}, {'network': 'facebook'}],
            'publicationDate': {'dateTime': p['fecha'], 'timezone': TZ},
            'instagramData': {'type': t, 'isAiGenerated': False}, 'facebookData': {'type': t}}
    out.append({'marca': k[0], 'fecha': k[1], 'tipo': k[2], 'antes': r['pieza'], 'id': r['detalle'].split()[-1], 'nuevo': p['pieza'], 'blogId': BLOG[k[0]], 'vivos': vivos, 'info': json.dumps(info, ensure_ascii=False)})
json.dump(out, open('actualizaciones.json', 'w'), ensure_ascii=False, indent=1)
for i, o in enumerate(out, 1):
    print(f"### {i} {o['marca']} {o['fecha']} {o['tipo']} id {o['id']} | {o['antes']} -> {o['nuevo']} | medios vivos: {o['vivos']}")
    print(o['info'])
