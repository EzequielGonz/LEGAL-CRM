# Anota un reel programado en docs/redes/programadas.jsonl. Uso: python3 registrar.py <id> <id_metricool> [nota]
import json, sys, datetime, os
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.abspath(os.path.join(AQUI, *['..'] * 6))
DOM = {'vita': 'www.estudiojuridicovita.com', 'coberturas': 'www.comparatuobrasocial.com', 'autos': 'www.autoskocos.com', 'marketing': 'www.kocosmkt.com'}
id_, mid = sys.argv[1], sys.argv[2]; nota = ' '.join(sys.argv[3:])
p = json.load(open(os.path.join(AQUI, 'planes', id_ + '.json'))); m = p['marca']; dd = id_.split('-')[1]
r = {'marca': m, 'fecha': f"{p['fecha_pub']}T{p['hora']}:00", 'tipo': 'reel', 'pieza': id_, 'ok': True,
     'detalle': f"id {mid} (REEL IG + FB, isAiGenerated, tapa propia; video https://{DOM[m]}/redes/{dd}/{id_}.mp4){' · ' + nota if nota else ''}",
     'registrado': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
open(os.path.join(RAIZ, 'docs/redes/programadas.jsonl'), 'a').write(json.dumps(r, ensure_ascii=False) + '\n'); print('anotado', id_, mid)
