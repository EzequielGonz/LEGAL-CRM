# Arma los JSON de guiones y GUIONES.md desde los datos de cada marca (fuente/<marca>.py).
# Uso: python3 armar.py   (valida largos, ganchos únicos, fórmulas seguidas, temas, variantes y palabras)
import json, os, re, importlib.util, collections, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(AQUI, '..', 'guiones')
DIAS = ['2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01',
        '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06']
HORAS = {'vita': ['08:40', '11:10', '13:40', '21:10'], 'coberturas': ['12:40', '18:10', '21:40', '22:40'],
         'autos': ['09:10', '13:10', '17:10', '21:30'], 'marketing': ['08:10', '12:20', '18:40', '21:20']}
HORAS_GRATIS = {'vita': ['16:10', '19:40'], 'coberturas': ['15:10', '20:10'],
                'autos': ['11:10', '19:10'], 'marketing': ['10:10', '15:40']}
# VITA en Instagram sube de a poco (orden del dueño); Facebook lleva todo desde el principio.
VITA_IG = {'2026-11-27': 2, '2026-11-28': 2, '2026-11-29': 3, '2026-11-30': 3, '2026-12-01': 4,
           '2026-12-02': 4, '2026-12-03': 5, '2026-12-04': 5, '2026-12-05': 6, '2026-12-06': 6}
VITA_IG_PREF = ['08:40', '21:10', '13:40', '11:10', '16:10', '19:40']
VITA_TRANSITO = {'NUNCA', 'PLAZO', 'CHOQUE', 'TRAYECTO', 'FIESTAS', 'SEGURO', 'HERIDOS', 'DANOS',
                 'FIRMA', 'ARREGLO', 'RUTA', 'HORAS', 'BICI'}
PRIMERA_SEMANA_HASTA = '2026-12-03'
BOCETO_VOZ = ('Domingo, 19:10. Recién chocaste y te sale decir: «Perdón, fue mi culpa». Nunca digas esto. Antes de hablar, tres pasos. '
              'Uno: fotos de los autos, la patente y la esquina. Dos: datos del otro conductor y de los testigos. '
              'Tres: avisá a tu seguro dentro de los tres días. Mandáselo a quien maneje todos los días. Porque recién chocaste… y te sale decir:')
MARCA = {'vita': 'VITA', 'coberturas': 'Compara Tu Obra Social', 'autos': 'Automotores Kocos', 'marketing': 'Kocos Marketing'}
TAGS = {'vita': '#VITAAbogados #DerechoCivil #DerechoPenal #DerechoLaboral #BuenosAires',
        'coberturas': '#ComparaTuObraSocial #ObraSocial #Prepaga #Monotributo #BuenosAires',
        'autos': '#AutomotoresKocos #0km #AutoNuevo #PlanDeAhorro #BuenosAires',
        'marketing': '#KocosMarketing #WhatsAppBusiness #Pymes #Emprendedores #BuenosAires'}
# Recurso que el bot entrega a quien comenta la palabra (05-estrategia §4). Los que no figuran usan la guía del tema.
RECURSOS = {
    'vita': {'FIRMA': '«3 cosas para no firmar»', 'TRAYECTO': '«Pasos después del accidente»',
             'TELEGRAMA': '«Errores del telegrama»', 'ALTA': '«Qué hacer si te dieron el alta y te duele»',
             'HERENCIA': '«Los primeros pasos de una sucesión»', 'NUNCA': '«Qué decir y qué no después de un choque»'},
    'coberturas': {'APORTES': '«Cómo leer tu recibo»', 'COMPARAR': '«Lista para antes de cambiarte»'},
    'autos': {'0KM': '«Los ítems del precio final»', 'LLAVE': '«La revisión del retiro»'},
    'marketing': {'CHECKLIST': '«Los 10 mensajes que todo negocio necesita»', 'CRM': '«La prueba del chat»'},
}
FORMULAS = {'ADV': 'advertencia', 'ESC': 'escena con hora o número', 'CONT': 'contador que avanza',
            'CARTAS': 'tres cartas cerradas', 'VOS': 'segunda persona «vos»', 'MITO': 'mito roto',
            'CUAL': '¿cuál sos? (identidad)', 'NUM': 'pregunta con respuesta numérica',
            'SERIE1': 'serie (parte 1)', 'SERIE2': 'serie (parte 2)', 'LOOP': 'loop',
            'BOCETO': 'advertencia + escena con hora + contador + loop'}
PROHIBIDAS = ['¿Sabías que', 'Te contamos todo', 'No te lo pierdas', 'botón está en el perfil',
              'Agencia Kocos', 'ORVIAN', 'plata rápido', 'garantizado', 'te aseguramos', 'Black Friday', 'la mitad resuelta', 'casi nunca pasa', 'SINGOCE', '«AUTO»']

def cargar(m):
    spec = importlib.util.spec_from_file_location(m, os.path.join(AQUI, m + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.REELS, getattr(mod, 'RESERVA', []), getattr(mod, 'VARIANTES', [])

def recurso(m, palabra, tema):
    return RECURSOS[m].get(palabra, f"la guía «{tema[0].upper() + tema[1:]}»")

def armar(m, r, fecha, hora, rid, motor, variante_de=''):
    voz = r['voz'].replace('{C}', r['cierre']) if '{C}' in r['voz'] else r['voz'] + ' ' + r['cierre']
    voz = ' '.join(voz.split())
    cierre = f"{r['cierre']} O comentá «{r['palabra']}» y te mando {recurso(m, r['palabra'], r['tema'])}."
    pantalla = [r['gancho']] + r['puntos'] + [r['cierre'], f"Comentá «{r['palabra']}»"]
    avisos = 'Situación ilustrativa. Voz generada con IA.'
    if m == 'vita':
        avisos += '\nInformación general: no reemplaza una consulta.'
    if r.get('fuente'):
        avisos = f"Fuente: {r['fuente']}.\n" + avisos
    copy = (f"{r['gancho']}\n\n" + '\n'.join('✔ ' + p for p in r['puntos']) +
            f"\n\n{cierre}\n\n{avisos}\n\n{TAGS[m]}")
    x = {'id': rid, 'fecha': fecha, 'hora': hora, 'marca': MARCA[m], 'motor_voz': motor,
         'variante_de': variante_de, 'redes': ['instagram', 'facebook'],
         'formula': FORMULAS[r['f']], 'tema': r['tema'], 'basado_en': r['base'],
         'gancho_pantalla': r['gancho'], 'voz': voz, 'caracteres_voz': len(voz),
         'textos_pantalla': pantalla, 'personaje': r['pj'], 'lugar_ba': r['lugar'],
         'escena_visual': r['escena'], 'cierre': cierre, 'palabra': r['palabra'],
         'copy': copy, 'fuente': r.get('fuente', '')}
    return x

def main():
    errores, todos, ganchos = [], {}, collections.Counter()
    palabras = collections.defaultdict(list)
    for m in ['vita', 'coberturas', 'autos', 'marketing']:
        reels, reserva, variantes = cargar(m)
        lista, por_id, crudo = [], {}, {}
        for i, r in enumerate(reels):
            d, h = divmod(i, 4)
            rid = f"{m}-{DIAS[d][8:]}{DIAS[d][5:7]}-{h+1}"
            x = armar(m, r, DIAS[d], HORAS[m][h], rid, 'elevenlabs'); lista.append(x); por_id[rid] = x; crudo[rid] = r
        for j, v in enumerate(variantes):
            d, h = divmod(j, 2)
            o = crudo.get(v['orig'])
            if not o: errores.append(f"{m} variante {j}: original {v['orig']} no existe"); continue
            r = dict(o); r.update({k: v[k] for k in ('f', 'tema', 'palabra', 'gancho', 'voz', 'puntos', 'lugar', 'escena', 'cierre') if k in v})
            r['pj'] = v.get('pj') or o['pj']; r['fuente'] = v.get('fuente', o.get('fuente', ''))
            r['base'] = f"variante de {v['orig']} ({o['base']})"
            rid = f"{m}-{DIAS[d][8:]}{DIAS[d][5:7]}-g{h+1}"
            x = armar(m, r, DIAS[d], HORAS_GRATIS[m][h], rid, 'gratis', v['orig'])
            orig = por_id[v['orig']]
            if (orig['fecha'], orig['hora']) >= (x['fecha'], x['hora']): errores.append(f"{rid}: sale antes que su original")
            if orig['formula'] == x['formula']: errores.append(f"{rid}: misma fórmula que el original")
            if orig['lugar_ba'] == x['lugar_ba']: errores.append(f"{rid}: mismo lugar que el original")
            lista.append(x)
        for j, r in enumerate(reserva):
            lista.append(armar(m, r, 'reserva', '', f"{m}-reserva-{j+1}", 'elevenlabs'))
        lista.sort(key=lambda x: (x['fecha'] == 'reserva', x['fecha'], x['hora']))
        if m == 'vita':
            for dia in DIAS:
                del_dia = {x['hora']: x for x in lista if x['fecha'] == dia}
                cupo = VITA_IG[dia]
                for hora in VITA_IG_PREF:
                    x = del_dia.get(hora)
                    if not x: continue
                    transito = x['palabra'] in VITA_TRANSITO and x['formula'] != FORMULAS['BOCETO']
                    if cupo > 0 and not (transito and dia <= PRIMERA_SEMANA_HASTA):
                        cupo -= 1
                    else:
                        x['redes'] = ['facebook']
                if cupo: errores.append(f"vita {dia}: faltan {cupo} reels aptos para Instagram")
        # validaciones
        prev = None; temas = collections.defaultdict(list)
        for x in lista:
            if x['caracteres_voz'] > 380: errores.append(f"{x['id']}: voz {x['caracteres_voz']} > 380")
            if len(x['gancho_pantalla']) > 45: errores.append(f"{x['id']}: gancho {len(x['gancho_pantalla'])} > 45")
            ganchos[x['gancho_pantalla'].lower()] += 1
            palabras[x['palabra']].append(x)
            if x['fecha'] != 'reserva':
                if prev == x['formula']: errores.append(f"{x['id']}: misma fórmula que el anterior ({prev})")
                prev = x['formula']
            temas[x['tema']].append(x)
            if m == 'coberturas' and re.search(r'\d+(,\d+)? ?%|por ciento', x['voz'] + ' '.join(x['textos_pantalla'])):
                errores.append(f"{x['id']}: número de aporte o cuota en Coberturas")
            for p in PROHIBIDAS:
                if p.lower() in (x['voz'] + x['copy']).lower(): errores.append(f"{x['id']}: contiene «{p}»")
        for t, xs in temas.items():
            fechadas = sorted(x['fecha'] for x in xs if x['fecha'] != 'reserva')
            es_serie = all('serie' in x['formula'] for x in xs)
            from datetime import date
            for a, b in zip(fechadas, fechadas[1:]):
                if not es_serie and (date.fromisoformat(b) - date.fromisoformat(a)).days < 7:
                    errores.append(f"{m}: tema «{t}» se repite en menos de 7 días ({a} y {b})")
            con_voz = [x for x in xs if x['motor_voz'] == 'elevenlabs']
            if len(con_voz) > 2 or len(xs) > 3: errores.append(f"{m}: tema «{t}» sale {len(xs)} veces")
            if len(con_voz) == 2:
                a, b = con_voz
                if a['formula'] == b['formula'] and 'serie' not in a['formula']: errores.append(f"{m}: tema «{t}» repite fórmula")
                if a['lugar_ba'] == b['lugar_ba']: errores.append(f"{m}: tema «{t}» repite lugar")
        todos[m] = lista
        with open(os.path.join(SAL, m + '.json'), 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)
    for g, n in ganchos.items():
        if n > 1: errores.append(f"gancho repetido: {g}")
    for p, xs in palabras.items():
        series = {x['tema'] for x in xs if 'serie' in x['formula']}
        resto = [x for x in xs if 'serie' not in x['formula']]
        if len(series) > 1 or len(resto) > 1 or (series and resto):
            errores.append(f"palabra «{p}» repetida: {[x['id'] for x in xs]}")
    b = [x for x in todos['vita'] if x['id'] == 'vita-2711-1'][0]['voz']
    if b != BOCETO_VOZ: errores.append('vita-2711-1: la voz del boceto cambió (ya está generada)')
    escribir_md(todos)
    for e in errores: print('ERROR', e)
    for m, l in todos.items():
        e = [x for x in l if x['motor_voz'] == 'elevenlabs']; g = [x for x in l if x['motor_voz'] == 'gratis']
        print(m, len(e), 'con ElevenLabs', sum(x['caracteres_voz'] for x in e), 'caracteres ·', len(g), 'con voz gratis')
    print('total ElevenLabs', sum(x['caracteres_voz'] for l in todos.values() for x in l if x['motor_voz'] == 'elevenlabs'))
    return 1 if errores else 0

def escribir_md(todos):
    L = ['# Guiones de reels · tanda del 27/11 al 06/12/2026', '',
         'Por marca y por día: **6 reels**. 4 con voz ElevenLabs y 2 con voz gratis del motor (edge-tts o Piper es-AR), que son variantes recicladas con edición fuerte de un guion de la misma tanda (otra fórmula, otro gancho, otro orden, otra escena). Más 4 de reserva con ElevenLabs por marca. Horarios en hora argentina.',
         '', 'Se arma con `fuente/armar.py` (datos en `fuente/<marca>.py`); los JSON están en `guiones/`. En cada guion: `motor_voz` es `elevenlabs` o `gratis`, `variante_de` dice de qué guion sale la variante y `redes` dice dónde sale.',
         '', 'Estado: **especificado** (guiones escritos y validados por el script). No producido, no programado, no publicado.', '',
         '## Horarios', '', '| Marca | ElevenLabs | Voz gratis |', '|---|---|---|']
    for m in todos:
        L.append(f"| {MARCA[m]} | {' · '.join(HORAS[m])} | {' · '.join(HORAS_GRATIS[m])} |")
    L += ['', 'VITA en Instagram sube de a poco: 2 reels por día el 27 y 28/11, 3 el 29 y 30/11, 4 el 1 y 2/12, 5 el 3 y 4/12 y 6 el 5 y 6/12. Facebook lleva los 6 desde el primer día. Hasta el 03/12 ningún tema de tránsito va a Instagram, salvo el boceto del 27/11 08:40.', '',
          '## Caracteres de voz ElevenLabs', '', '| Marca | Reels ElevenLabs | Caracteres | Promedio | Reels voz gratis |', '|---|---|---|---|---|']
    tot = n = 0
    for m, l in todos.items():
        e = [x for x in l if x['motor_voz'] == 'elevenlabs']; c = sum(x['caracteres_voz'] for x in e); tot += c; n += len(e)
        g = len(l) - len(e)
        L.append(f"| {MARCA[m]} | {len(e)} | {c:,} | {c // len(e)} | {g} |".replace(',', '.'))
    L.append(f"| **Total** | **{n}** | **{tot:,}** | {tot // n} | {sum(len(l) for l in todos.values()) - n} |".replace(',', '.'))
    L += ['', f"Tope pedido: 38.000 caracteres (presupuesto ElevenLabs 40.000). {'Dentro del tope.' if tot <= 38000 else 'FUERA DEL TOPE.'} Las voces gratis no gastan ElevenLabs.", '']
    L += ['## Reparto de fórmulas por marca (todos los reels)', '']
    for m, l in todos.items():
        c = collections.Counter(x['formula'] for x in l)
        L.append(f"- **{MARCA[m]}:** " + ' · '.join(f"{k} {v}" for k, v in sorted(c.items(), key=lambda z: -z[1])))
    for m, l in todos.items():
        L += ['', f"## {MARCA[m]}", '', '| Día | Hora | Voz | Fórmula | Gancho | Palabra | Redes | Caracteres |', '|---|---|---|---|---|---|---|---|']
        for x in l:
            dia = x['fecha'] if x['fecha'] == 'reserva' else x['fecha'][8:] + '/' + x['fecha'][5:7]
            voz = 'ElevenLabs' if x['motor_voz'] == 'elevenlabs' else f"gratis (de {x['variante_de']})"
            redes = 'IG + FB' if 'instagram' in x['redes'] else 'FB'
            L.append(f"| {dia} | {x['hora']} | {voz} | {x['formula']} | {x['gancho_pantalla']} | {x['palabra']} | {redes} | {x['caracteres_voz']} |")
    with open(os.path.join(AQUI, '..', 'GUIONES.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')

if __name__ == '__main__':
    sys.exit(main())
