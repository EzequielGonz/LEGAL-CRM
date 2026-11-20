# agrega o reemplaza una fila del manifiesto mkt-1
import csv, os, sys
P = 'docs/redes/produccion-2011/manifiestos/mkt-1.csv'
COLS = 'fecha,hora,marca,idea_id,version,id,video_url,portada_url,palabra,texto,estado,metricool_id'.split(',')
fecha, hora, idea, ver, rid, palabra, gancho, p1, p2, p3 = sys.argv[1:11]
texto = f"{gancho}\n\n1. {p1}\n2. {p2}\n3. {p3}\n\nComentá «{palabra}» y te respondemos.\n\nSituación ilustrativa. Voz generada con IA.\n\n#pymes #emprendedores #ventas #marketingdigital #buenosaires"
fila = dict(fecha=fecha, hora=hora, marca='Kocos Marketing', idea_id=idea, version=ver, id=rid, video_url=f'https://www.kocosmkt.com/redes/2011/{rid}.mp4',
            portada_url=f'https://www.kocosmkt.com/redes/2011/{rid}.jpg', palabra=palabra, texto=texto, estado='renderizado', metricool_id='')
rows = list(csv.DictReader(open(P))) if os.path.exists(P) else []
rows = [r for r in rows if r['id'] != rid] + [fila]; rows.sort(key=lambda r: (r['fecha'], r['hora']))
w = csv.DictWriter(open(P, 'w', newline=''), COLS); w.writeheader(); w.writerows(rows)
