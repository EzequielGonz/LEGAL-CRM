# Genera calendario.csv del cronograma x2: 20/11 al 29/11/2026, el doble de publicaciones que el calendario base.
# Uso: python3 generar_x2.py && python3 validar_x2.py
# Reutiliza ../calendario-2511-0412/generar.py (solo lo lee: no escribe nada en esa carpeta).
import csv, os, re, sys, copy, random, itertools, collections
from datetime import date, timedelta

sys.dont_write_bytecode = True  # no dejar caché en la carpeta original
AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(os.path.dirname(AQUI), 'calendario-2511-0412')
REND = os.path.join(os.path.dirname(AQUI), 'analisis-2026-11-20', 'rendimiento-reels-10-19nov.csv')
sys.path.insert(0, BASE)
sys.path.insert(0, AQUI)
import generar as G          # calendario base (ideas, orden por día, historias y carruseles)
import historias as H        # una línea de mini historia por idea
from datos_x2 import VAR, REM, PL, GIROS, APERTURAS, PRIMER_PLANO, ORDENES, CAMARAS, MUSICAS, PALETAS, OBJETO, CARR_VAR

# ---------------- Fechas y grillas ----------------
INICIO = date(2026, 11, 20)
DIAS = [(INICIO + timedelta(days=i)).isoformat() for i in range(10)]          # 20/11 al 29/11
DIAS_BASE = list(G.DIAS)                                                       # 25/11 al 04/12
REEL_1 = ['08:30', '10:30', '13:30', '16:30', '19:00', '20:30']                 # días 0 a 5
REEL_2 = ['07:30', '09:00', '10:30', '12:00', '13:30', '17:00', '19:00', '20:30']  # días 6 a 9
NUEVAS_1 = ['10:30', '16:30', '19:00']
NUEVAS_2 = ['07:30', '10:30', '12:00', '19:00']
HIST = ['08:00', '09:30', '11:30', '13:00', '15:30', '18:30', '20:00', '21:30']
CARRUSEL = '11:00'
CONTROL = {'08:30', '11:00', '13:30', '17:00', '20:30', '10:00', '19:00', '12:30', '09:30', '18:30'}  # grupo de control 20-24/11
DIAS_CONTROL = set(DIAS[:5])

def correr_control(fecha, hora):
    """Del 20 al 24/11 ningún horario nuevo coincide con el grupo de control: se corre 20 minutos."""
    if fecha in DIAS_CONTROL and hora in CONTROL:
        h, m = map(int, hora.split(':'))
        t = h * 60 + m + 20
        return f'{t // 60:02d}:{t % 60:02d}'
    return hora

def horas_reel(n):
    return REEL_1 if n < 6 else REEL_2

AP, PJ, PE = G.AP, G.PJ, G.PE
NOTA = 'sin cartel en pantalla: «Situación ilustrativa» va solo en el texto de la publicación'
REV_NUEVA = {'vita': PJ, 'cob': PJ, 'autos': PE, 'mkt': PE}
COLS = G.COLS + ['variante_de', 'cambios', 'personaje', 'lugar_ba', 'conflicto_seg1', 'giro_irreal']

# ---------------- Ajustes de agenda por el corrimiento de 5 días ----------------
ORDEN = copy.deepcopy(G.ORDEN)
# Autos: Black Friday (27/11) pasa al día 7 y «Cómo se adjudica un plan» toma su lugar el día 2.
ORDEN['autos'][2][0], ORDEN['autos'][7][0] = 'adjudicacion/A', 'blackfriday/A'
# Autos: el ranking de noviembre de ACARA sale en diciembre (fuera del período): va el respaldo aprobado.
ORDEN['autos'][8][0] = 'contado-plan/A'
G.ORDEN = ORDEN
G.DIAS = DIAS
G.COND_EXTRA = {
 ('cob', 'fallo-corte', 'A'): 'Sale solo con revisión profesional del alcance del fallo antes del 20/11 a las 13:50 (24 h antes de salir); si no, va «Tu obra social la podés elegir» (recibo-elegir A) y el 26/11 a las 20:30 pasa a lugar de actualidad.',
 ('autos', 'blackfriday', 'A'): 'Black Friday (27/11): sale con el visto bueno del equipo antes del 25/11; si no, el lugar queda en borrador con motivo (nada lo reemplaza solo).',
}
COND_CARR = {('autos', 'blackfriday'): G.COND_EXTRA[('autos', 'blackfriday', 'A')]}
CAMBIO_BASE = {('autos', 'reel', 'adjudicacion'): 'pasa del 02/12 (día 7) al 22/11 (día 2) para que Black Friday caiga el 27/11',
               ('autos', 'reel', 'blackfriday'): 'pasa al 27/11, día de Black Friday',
               ('autos', 'reel', 'contado-plan'): 'va el respaldo aprobado: el ranking de ACARA de noviembre sale después del 29/11',
               ('autos', 'carrusel guía', 'blackfriday'): 'pasa al 27/11, día de Black Friday'}

# ---------------- Piezas viejas del 10 al 19/11 (madres de los remakes) ----------------
VIEJAS = collections.defaultdict(lambda: {'repro': 0.0, 'ultima': '0000-00-00'})
for x in csv.DictReader(open(REND, encoding='utf-8')):
    b = re.sub(r'-(voz|tendencia)$', '', x['pieza'])
    VIEJAS[b]['repro'] += float(x['repro'] or 0)
    VIEJAS[b]['ultima'] = max(VIEJAS[b]['ultima'], x['fecha_ba'][:10])

def viejas_de(prefijo):
    return sorted([b for b in VIEJAS if re.fullmatch(re.escape(prefijo) + r'(-[a-z])?', b)],
                  key=lambda b: -VIEJAS[b]['repro'])

def dmy(iso):
    return f'{iso[8:10]}/{iso[5:7]}'

# ---------------- Planificación de los reels nuevos ----------------
CAP = [3] * 6 + [4] * 4

def planificar(m, base_reels):
    idx = {f: i for i, f in enumerate(DIAS)}
    dia_madre = collections.defaultdict(list)
    tema_dia0 = collections.Counter()
    for r in base_reels:
        dia_madre[r['idea_id']].append(idx[r['fecha']])
        tema_dia0[(r['tema'], idx[r['fecha']])] += 1
    items_b = []
    for iid in VAR[m]:
        assert len(dia_madre[iid]) == 1, (m, iid, dia_madre[iid])
        dm = dia_madre[iid][0]
        ok = [d for d in range(10) if abs(d - dm) >= 5]
        items_b.append(dict(tipo='B', iid=iid, tema=G.I[(m, iid)]['tema'], dias=ok, madre=dm,
                            tarde=G.I[(m, iid)]['rev'] == PJ and dm >= 5))
    items_r = []
    for tema, pref, rep, _lista, entradas in REM[m]:
        for k, e in enumerate(entradas):
            items_r.append(dict(tipo='R', tema=tema, pref=pref, rep=rep, entrada=e, k=k, pin=e[5],
                                cands=viejas_de(pref)))
    # Cada remake recibe su pieza vieja antes de buscar días: si un prefijo tiene menos piezas viejas que remakes,
    # se repiten las que pueden salir antes (la segunda vez, a 5 días o más de la primera).
    def primer_dia(b):
        return next(d for d in range(10) if (date.fromisoformat(DIAS[d]) - date.fromisoformat(VIEJAS[b]['ultima'])).days > 5)
    por_pref = collections.defaultdict(list)
    for it in items_r:
        por_pref[it['pref']].append(it)
    for pref, its in por_pref.items():
        olds = sorted(viejas_de(pref), key=lambda b: (primer_dia(b), -VIEJAS[b]['repro']))
        dobles = [b for b in olds if primer_dia(b) <= 4][:max(0, len(its) - len(olds))]
        asignadas = olds[:len(its)] + dobles
        assert len(asignadas) >= len(its), (m, pref)
        for it, b in zip(sorted(its, key=lambda it: it['pin'] is None), asignadas):
            it['vieja'] = b
            it['dias'] = [it['pin']] if it['pin'] is not None else list(range(primer_dia(b), 10))
    todos = items_b + items_r

    mejor = None
    exitos = 0
    for semilla in range(200):
        rng = random.Random(semilla)
        cap = CAP[:]
        tema_dia = collections.Counter(tema_dia0)
        usos = collections.defaultdict(list)
        pasos = [0]

        def dominio(it):
            b = it.get('vieja')
            return [d for d in it['dias'] if cap[d] > 0 and not (b and any(abs(d - x) < 5 for x in usos[b]))]

        def resolver(pend):
            if not pend:
                return []
            pasos[0] += 1
            if pasos[0] > 5000:
                return None
            doms = [dominio(it) for it in pend]
            for d in range(10):
                if cap[d] > sum(1 for dm in doms if d in dm):
                    return None
            i = min(range(len(pend)), key=lambda i: (len(doms[i]), rng.random()))
            it = pend[i]
            resto = pend[:i] + pend[i + 1:]
            ops = sorted(doms[i], key=lambda d: (tema_dia[(it['tema'], d)],
                                                 (max(it['dias']) - d) if it['tipo'] == 'B' and it['tarde'] else 0, rng.random()))
            b = it.get('vieja')
            for d in ops:
                cap[d] -= 1; tema_dia[(it['tema'], d)] += 1
                if b:
                    usos[b].append(d)
                sol = resolver(resto)
                if sol is not None:
                    return [(d, it, b)] + sol
                cap[d] += 1; tema_dia[(it['tema'], d)] -= 1
                if b:
                    usos[b].pop()
            return None

        sol = resolver(list(todos))
        if sol is None:
            continue
        pen = sum(10 * max(0, c - 1) for c in tema_dia.values())
        pen += sum((max(it['dias']) - d) for d, it, _ in sol if it['tipo'] == 'B' and it['tarde'])
        exitos += 1
        if mejor is None or pen < mejor[0]:
            mejor = (pen, sol)
        if exitos >= 40:
            break
    assert mejor, f'{m}: no hay planificación posible'
    return mejor[1]

# ---------------- Filas ----------------
def base_fila(r, m):
    """Pieza del calendario base: mismo contenido, fecha corrida 5 días y cierre unificado."""
    f = dict(r)
    n = DIAS.index(f['fecha'])
    kw = f['palabra']
    notas = [f'fecha corrida 5 días (en el calendario base: {dmy(DIAS_BASE[n])})']
    if f['formato'] == 'reel':
        if n >= 6 and f['hora'] == '08:30':
            f['hora'] = '09:00'; notas.append('hora 08:30 → 09:00 por la grilla nueva')
        f['cierre'] = f'Comentá «{kw}» y te respondemos · {NOTA}'
    elif f['formato'].startswith('historia'):
        if f['hora'] == '12:00':
            f['hora'] = '11:30'; notas.append('hora 12:00 → 11:30 por la grilla nueva')
        extra = '' if r['cierre'].startswith('Respondé') else f' · {r["cierre"]}'
        f['cierre'] = f'Respondé esta historia con «{kw}»{extra} · {NOTA}'
    else:
        f['cierre'] = f'Última lámina: «Guardalo y comentá «{kw}»» · {NOTA}'
    clave = (m, f['formato'] if f['formato'] in ('reel', 'carrusel guía') else 'x', f['idea_id'])
    if clave in CAMBIO_BASE:
        notas.append(CAMBIO_BASE[clave])
    if f['version'] == 'B':
        f['variante_de'] = f['idea_id']
        f['cambios'] = 'calendario base: versión B (gancho, portada, orden de escenas y apertura distintos de la A) · ' + ' · '.join(notas)
    else:
        f['variante_de'] = ''
        f['cambios'] = 'calendario base: sin cambios de contenido · ' + ' · '.join(notas)
    return f

def nueva_fila(m, fecha, hora, formato, iid, version, gancho, cierre, idea, serie, tema, kw, ref, variante_de, cambios, extra):
    return dict(fecha=fecha, hora=hora, marca=G.MARCAS[m], redes=G.REDES_REEL if formato == 'reel' else G.REDES_HIST,
                formato=formato, serie=serie, tema=tema, idea_id=iid, idea=idea, gancho=gancho, palabra=kw,
                cierre=cierre, referencia=ref, revision=REV_NUEVA[m], version=version, condicion='',
                variante_de=variante_de, cambios=cambios, **extra)

class Rueda:
    def __init__(self, lista, inicio=0):
        self.l, self.i = lista, inicio
    def __call__(self):
        v = self.l[self.i % len(self.l)]; self.i += 1
        return v

NOMBRES = ['Nico', 'Sole', 'Lucía', 'Gabriel', 'Vero', 'Elsa', 'Juli', 'Mati', 'Leo', 'Romina', 'Tomi']

def giro_para(m, fam, usados, rueda, personaje):
    # el giro solo nombra personajes que están en la escena
    for _ in range(len(GIROS[m])):
        g = rueda()
        if any(n in g and n not in personaje for n in NOMBRES):
            continue
        if g not in usados[fam]:
            usados[fam].add(g)
            return g
    raise AssertionError('sin giro libre')

def mini_historia_base(m, iid):
    pers, lugar = PL[m][iid]
    return pers, lugar, H.H[(m, iid)]

def generar_marca(m):
    ruedas = {k: Rueda(v, hash_inicio) for k, v, hash_inicio in [
        ('pp', PRIMER_PLANO[m], 0), ('orden', ORDENES, 1), ('cam', CAMARAS, 2), ('mus', MUSICAS, 3), ('pal', PALETAS, 0),
        ('ap', APERTURAS[m], 0), ('giro', GIROS[m], 0)]}
    giros_usados = collections.defaultdict(set)
    base_r = G.reels(m)
    base_h = G.historias(m, base_r)
    filas = []
    # Reels base
    for r in base_r:
        f = base_fila(r, m)
        pers, lugar, conf = mini_historia_base(m, f['idea_id'])
        if f['version'] == 'B':
            conf = ruedas['ap']() + conf
        f.update(personaje=pers, lugar_ba=lugar, conflicto_seg1=conf, giro_irreal=giro_para(m, f['idea_id'], giros_usados, ruedas['giro'], pers))
        filas.append(f)
    # Reels nuevos
    nuevos_por_dia = collections.defaultdict(list)
    for d, it, vieja in planificar(m, base_r):
        nuevos_por_dia[d].append((it, vieja))
    reels_nuevos = []
    for d in range(10):
        lst = sorted(nuevos_por_dia[d], key=lambda x: (x[0]['tipo'], x[0].get('iid', ''), x[0].get('tema'), x[0].get('k', 0)))
        horas = NUEVAS_1 if d < 6 else NUEVAS_2
        assert len(lst) == len(horas), (m, d, len(lst))
        ocupadas = {f['hora']: f['tema'] for f in filas if f['formato'] == 'reel' and f['fecha'] == DIAS[d]}
        mejor = None
        for perm in itertools.permutations(lst):
            dia = dict(ocupadas)
            dia.update({h: it['tema'] for h, (it, _) in zip(horas, perm)})
            seq = [dia[h] for h in sorted(dia)]
            pen = sum(a == b for a, b in zip(seq, seq[1:]))
            if mejor is None or pen < mejor[0]:
                mejor = (pen, perm)
        for h, (it, vieja) in zip(horas, mejor[1]):
            fecha = DIAS[d]
            if it['tipo'] == 'B':
                iid = it['iid']; I = G.I[(m, iid)]
                gancho, preg = VAR[m][iid]
                pers, lugar, conf = mini_historia_base(m, iid)
                conf = ruedas['ap']() + conf
                extra_cambio = [f'cámara: {ruedas["cam"]()}', f'música: {ruedas["mus"]()}', f'paleta: {ruedas["pal"]()}'][d % 3]
                cambios = (f'variante: gancho nuevo en los primeros 3 s · portada distinta · orden de escenas: {ruedas["orden"]()} · '
                           f'apertura y giro irreal distintos · primer plano: {ruedas["pp"]()} · {extra_cambio}')
                ref = f'{G.ref(m, iid)} · variante de «{iid}» (la madre sale el {dmy(DIAS[it["madre"]])})'
                fila = nueva_fila(m, fecha, h, 'reel', iid, 'B', gancho, f'Comentá «{I["kw"]}» y te respondemos · {NOTA}',
                                  I['idea'], G.SERIES[I['serie']], I['tema'], I['kw'], ref, iid, cambios,
                                  dict(personaje=pers, lugar_ba=lugar, conflicto_seg1=conf,
                                       giro_irreal=giro_para(m, iid, giros_usados, ruedas['giro'], pers)))
                datos = dict(fam=iid, gancho=gancho, preg=preg, dato=I['dato'], kw=I['kw'], idea=I['idea'], serie=fila['serie'],
                             tema=I['tema'], iid=iid, version='B', ref=ref, pers=pers, lugar=lugar)
            else:
                gancho, preg, pers, lugar, conf, _pin = it['entrada']
                I = G.I[(m, it['rep'])]
                n_r = sum(1 for x in reels_nuevos if x[1]['fam'] == vieja) + 1
                iid = f'R-{vieja}-{n_r}'
                v = VIEJAS[vieja]
                ref = (f'Remake de la pieza vieja «{vieja}» (salió por última vez el {dmy(v["ultima"])}; '
                       f'{int(v["repro"])} reproducciones en IG + FB del 10 al 19/11) · {G.REF.get((m, it["tema"]), "tema del 10 al 19/11")}')
                cambios = (f'remake: estilo nuevo con mini historia y personaje · gancho nuevo · portada nueva · '
                           f'orden de escenas: {ruedas["orden"]()} · cámara: {ruedas["cam"]()} · música: {ruedas["mus"]()}')
                serie = G.SERIES[I['serie']]
                idea = f'{I["idea"]} (remake de «{vieja}»)'
                fila = nueva_fila(m, fecha, h, 'reel', iid, 'R', gancho, f'Comentá «{I["kw"]}» y te respondemos · {NOTA}',
                                  idea, serie, it['tema'], I['kw'], ref, vieja, cambios,
                                  dict(personaje=pers, lugar_ba=lugar, conflicto_seg1=conf,
                                       giro_irreal=giro_para(m, vieja, giros_usados, ruedas['giro'], pers)))
                datos = dict(fam=vieja, gancho=gancho, preg=preg, dato=I['dato'], kw=I['kw'], idea=idea, serie=serie,
                             tema=it['tema'], iid=iid, version='R', ref=ref, pers=pers, lugar=lugar)
            filas.append(fila)
            reels_nuevos.append((fila, datos))
    # Historias base
    obj = OBJETO[m]
    for r in base_h:
        f = base_fila(r, m)
        pers, lugar, _ = mini_historia_base(m, f['idea_id'])
        f.update(personaje=pers, lugar_ba=lugar, **idea_historia(f['formato'], pers, lugar, obj, f['palabra'], f['gancho']))
        filas.append(f)
    # Historias nuevas: acompañan los reels nuevos del día
    for d in range(10):
        nuevos = sorted([x for x in reels_nuevos if x[0]['fecha'] == DIAS[d]], key=lambda x: x[0]['hora'])
        tipo1530 = 'checklist' if d % 2 else 'detrás de escena animado'
        plan = [('08:00', 'historia: dato o mito', nuevos[0]), ('13:00', 'historia: encuesta', nuevos[1]),
                ('15:30', f'historia: {tipo1530}', nuevos[2]),
                ('20:00', 'historia: respondé con PALABRA', nuevos[3] if len(nuevos) > 3 else nuevos[0])]
        for h, formato, (rf, x) in plan:
            kw = x['kw']
            if formato == 'historia: dato o mito':
                texto, idea, st = f'Lo que pocos saben: {x["dato"]}', 'Dato: ' + x['dato'], 'Sticker de pregunta: «¿Te pasó?»'
            elif formato == 'historia: encuesta':
                texto, idea, st = x['preg'], 'Encuesta: ' + x['preg'], 'Sticker de encuesta; al día siguiente, historia con el resultado'
            elif formato == 'historia: checklist':
                texto, idea, st = f'Checklist rápido: {x["dato"]}', f'Checklist rápido: {x["dato"]}', 'Sticker de enlace a la landing con UTM'
            elif formato == 'historia: detrás de escena animado':
                texto = f'Detrás de escena: cómo se armó el giro del reel «{x["gancho"]}»'
                idea, st = texto, 'Sticker de enlace a la landing con UTM'
            else:
                texto = f'{x["gancho"]}. ¿Te pasó? Respondé esta historia con «{kw}»'
                idea, st = f'Respondé con «{kw}» (tema: {x["gancho"]})', ''
            cierre = f'Respondé esta historia con «{kw}»' + (f' · {st}' if st else '') + f' · {NOTA}'
            cambios = (f'variante: acompaña el reel de las {rf["hora"]} · texto reescrito · fondo y portada distintos · '
                       f'orden: {"pregunta primero" if d % 2 else "dato primero"}')
            filas.append(nueva_fila(m, DIAS[d], h, formato, x['iid'], x['version'], texto, cierre, idea, x['serie'], x['tema'], kw,
                                    x['ref'], x['fam'], cambios,
                                    dict(personaje=x['pers'], lugar_ba=x['lugar'],
                                         **idea_historia(formato, x['pers'], x['lugar'], obj, kw, x['gancho']))))
    # Carruseles
    base_dias = [0, 2, 4, 6, 8]
    for n, (iid, titulo) in zip(base_dias, G.CARRUSELES[m]):
        if (m, iid) == ('autos', 'blackfriday'):
            n = 7
        r = G.fila(DIAS[n], '11:00', m, G.REDES_HIST, 'carrusel guía', iid, 'única', titulo,
                   f'Última lámina: «Guardalo y comentá «{G.I[(m, iid)]["kw"]}»»', idea_txt='Carrusel: ' + titulo)
        r['condicion'] = COND_CARR.get((m, iid), '')
        f = base_fila(r, m)
        pers, lugar, _ = mini_historia_base(m, iid)
        f.update(personaje=pers, lugar_ba=lugar, **idea_carrusel(pers, lugar, obj, f['palabra']))
        filas.append(f)
    for n, (iid, titulo, desde) in sorted(CARR_VAR[m].items()):
        I = G.I[(m, iid)]
        pers, lugar, _ = mini_historia_base(m, iid)
        if desde == 'reel':
            cambios = (f'variante del reel al carrusel: la misma idea pasada a láminas · portada nueva · orden de láminas: '
                       f'{ruedas["orden"]()} · paleta: {ruedas["pal"]()}')
        else:
            cambios = (f'variante: portada nueva · títulos reescritos · orden de láminas: {ruedas["orden"]()} · '
                       f'paleta: {ruedas["pal"]()}')
        filas.append(nueva_fila(m, DIAS[n], '11:00', 'carrusel guía', iid, 'B', titulo,
                                f'Última lámina: «Guardalo y comentá «{I["kw"]}»» · {NOTA}', 'Carrusel: ' + titulo,
                                G.SERIES[I['serie']], I['tema'], I['kw'], G.ref(m, iid) + ' · variante de carrusel', iid, cambios,
                                dict(personaje=pers, lugar_ba=lugar, **idea_carrusel(pers, lugar, obj, I['kw']))))
    # Grupo de control: correr 20 minutos lo que coincida
    for f in filas:
        nueva = correr_control(f['fecha'], f['hora'])
        if nueva != f['hora']:
            f['cambios'] += f' · {f["hora"]} → {nueva} para no coincidir con el grupo de control'
            f['hora'] = nueva
    return filas

COMUNES = {'Cocina', 'Vereda', 'Mostrador', 'Mesa', 'Depósito', 'Supermercado', 'Showroom', 'Departamento', 'Living',
           'Guardia', 'Taller', 'Oficina', 'Caja', 'Sobremesa', 'Puerta', 'Bar', 'Sillón', 'Colectivo', 'Esquina', 'Vidriera',
           'Dormitorio', 'Salida', 'Consultorio', 'Farmacia', 'Sala', 'Avenida', 'Calle', 'Casa', 'Pasillo'}

def lc(lugar):
    w = lugar.split(' ', 1)[0]
    return lugar[0].lower() + lugar[1:] if w in COMUNES else lugar

def idea_historia(formato, pers, lugar, obj, kw, gancho):
    p, l = pers.split(';')[0], lc(lugar)
    if formato.endswith('encuesta'):
        return dict(conflicto_seg1=f'Idea: {p}, en {l}, frente a dos puertas que son las opciones de la encuesta',
                    giro_irreal=f'{obj[0].upper() + obj[1:]}, en tamaño gigante, marca la opción más votada al día siguiente')
    if formato.endswith('dato o mito'):
        return dict(conflicto_seg1=f'Idea: en {l}, el dato aparece escrito sobre {obj} delante de {p}',
                    giro_irreal=f'El texto se arma letra por letra sobre {obj} en escala gigante')
    if formato.endswith('checklist'):
        return dict(conflicto_seg1=f'Idea: en {l}, la lista se tilda punto por punto delante de {p}',
                    giro_irreal='Cada tilde cae desde arriba como un objeto pesado y hace temblar la escena')
    if formato.endswith('detrás de escena animado'):
        return dict(conflicto_seg1=f'Idea: la escena 3D de «{gancho}» se desarma en tres capas',
                    giro_irreal='La cámara se aleja y muestra la maqueta del set con los personajes en miniatura')
    return dict(conflicto_seg1=f'Idea: en {l}, «{kw}» aparece escrito sobre {obj}, con {p} mirando a cámara',
                giro_irreal=f'La palabra «{kw}» crece hasta llenar la pantalla y deja lugar a la caja de respuesta')

def idea_carrusel(pers, lugar, obj, kw):
    p, l = pers.split(';')[0], lc(lugar)
    return dict(conflicto_seg1=f'Idea: portada con {p} en {l}; una lámina por paso y la última con «{kw}»',
                giro_irreal=f'Portada con escala imposible: {obj} gigante y {p} en miniatura')

def main():
    filas = []
    for m in G.MARCAS:
        filas += generar_marca(m)
    filas.sort(key=lambda f: (f['fecha'], f['hora'], f['marca'], f['formato']))
    with open(os.path.join(AQUI, 'calendario.csv'), 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=COLS)
        w.writeheader()
        w.writerows(filas)
    print(f'{len(filas)} filas escritas en calendario.csv')

if __name__ == '__main__':
    main()
