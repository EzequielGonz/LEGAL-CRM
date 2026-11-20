# Arma cob-1.csv (manifiesto de la sesión cob-1) con el texto final de cada reel entregado. Uso: python3 cob-1.py
import csv, os
H = '#prepagas #obrasocial #monotributo #saludargentina #buenosaires'
BASE = 'docs/redes/produccion-2011/entregas/cob-1/'
P = [  # fecha, hora, idea_id, version, id, palabra, gancho, puntos
 ('2026-11-20', '16:30', 'reintegros', 'B', 'cob-reintegros-b', 'COMPARAR', 'Ese ticket de la consulta: ¿pediste el reintegro?',
  ['Factura a tu nombre, con fecha y detalle.', 'Ojo con el plazo para presentarla.', 'Si tu plan no reintegra, compará.']),
]
def texto(g, pts, pal):
    return f"{g}\n\n" + '\n'.join(f'{i}. {p}' for i, p in enumerate(pts, 1)) + f"\n\nComentá «{pal}» y te respondemos.\n\nSituación ilustrativa. Voz generada con IA.\n\n{H}"
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cob-1.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow('fecha,hora,marca,idea_id,version,id,video_url,portada_url,palabra,texto,estado,metricool_id'.split(','))
    for fe, ho, idea, v, rid, pal, g, pts in P:
        w.writerow([fe, ho, 'Coberturas', idea, v, rid, BASE + rid + '.mp4', BASE + rid + '.jpg', pal, texto(g, pts, pal), 'renderizado', ''])
