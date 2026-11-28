# Anota una pieza fija (post, carrusel, historia) programada en docs/redes/programadas.jsonl.
# Uso: python3 registrar_pieza.py <id> <id_metricool>     (id como en piezas/specs-<marca>.json)
import datetime, json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.abspath(os.path.join(AQUI, *['..'] * 6))
id_, mid = sys.argv[1], sys.argv[2]; m = id_.split('-')[0]
s = [x for x in json.load(open(os.path.join(AQUI, f'piezas/specs-{m}.json'))) if x['id'] == id_][0]
al = json.load(open(os.path.join(AQUI, f'piezas/alojadas-{m}.json'))).get(id_, [])
tipo = {'car': 'carrusel', 'post': 'post'}.get(id_.split('-')[2], 'historia')
r = {'marca': m, 'fecha': f"{s['fecha']}T{s['hora']}:00", 'tipo': tipo, 'pieza': id_, 'ok': True,
     'detalle': f"id {mid} ({len(al)} imagen(es); {al[0] if al else ''})",
     'registrado': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
open(os.path.join(RAIZ, 'docs/redes/programadas.jsonl'), 'a').write(json.dumps(r, ensure_ascii=False) + '\n'); print('anotado', id_, mid)
