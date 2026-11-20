# Guiones de la sesión cob-1: Coberturas (Compara Tu Obra Social), reels del 20/11 16:30 al 24/11 20:50.
# Estructura fija (la usan historias/cobkit.js y sonido.py): 0 personaje · 1 documento · 2 preparación · 3 golpe · 4 entrada a los puntos ·
# items 1-3 · alivio (personaje) · cta. Sin números ni porcentajes de cuotas o aumentos. Afirmaciones generales y prudentes.
VOCES = {
 'vero': ('piper', 'es_AR-daniela-high', .98, 0),
 'lucia': ('piper', 'es_AR-daniela-high', 1.02, 0),
 'gabriel': ('edge', 'es-AR-TomasNeural', 6, -1),
 'elsa': ('edge', 'es-AR-ElenaNeural', -4, -3),
}
def g(palabra, serie, pj, f0, f1, f2, f3, f4, i1, i2, i3, ali, nar='nar_f'):
    "f* = (say, show[, extra]); el cierre se arma con la palabra."
    def fr(q, x, **k): d = dict(q=q, say=x[0], show=x[1], p=k.pop('p', .3)); d.update(k); d.update(x[2] if len(x) > 2 else {}); return d
    return dict(palabra=palabra, serie=serie, nar=nar, frases=[
        fr(pj, f0, p=.35, marca='notif'), fr('nar', f1, p=.35), fr('nar', f2, p=.08), fr('nar', f3, p=.5, r=-6, marca='golpe'), fr('nar', f4, p=.25),
        fr('nar', i1, item=1), fr('nar', i2, item=2), fr('nar', i3, p=.4, item=3), fr(pj, ali, marca='alivio'),
        dict(q='nar', say=f'Comentá «{palabra.lower()}», y te respondemos.', show=f'Comentá *{palabra}*', p=.2, cta=1, r=-3)])
R = {}
# 20/11 16:30 · reintegros B · Vero, cocina de los Ferreyra en Villa Urquiza
R['cob-reintegros-b'] = g('COMPARAR', 'Reintegros', 'vero',
    ('¿Y este ticket qué hace acá?', '¿Y este ticket qué hace acá?'),
    ('Pagaste una consulta de tu bolsillo, y el ticket quedó en la heladera.', 'Pagaste una consulta y el ticket *quedó en la heladera.*'),
    ('Antes de tirarlo,', 'Antes de tirarlo,'),
    ('pedí el reintegro.', '*pedí el reintegro.*'),
    ('Según tu plan, puede corresponder. Mirá tres cosas.', 'Según tu plan, puede corresponder. *Mirá tres cosas:*'),
    ('Uno: factura a tu nombre, con fecha y detalle.', 'Factura *a tu nombre.*'),
    ('Dos: el plazo para presentarla.', 'Ojo con *el plazo.*'),
    ('Tres: si tu plan no reintegra, compará.', 'Si no reintegra, *compará.*'),
    ('Lo pido hoy mismo.', 'Lo pido hoy mismo.'))
