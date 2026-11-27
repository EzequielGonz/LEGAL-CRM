# Arma los JSON de guiones y GUIONES.md desde los datos de cada marca.
# Uso: python3 armar.py   (valida largos, ganchos únicos, fórmulas seguidas y temas)
import json, os, importlib.util, collections, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(AQUI, '..', 'guiones')
DIAS = ['2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01',
        '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06']
HORAS = {'vita': ['08:40', '11:10', '13:40', '21:10'],
         'coberturas': ['12:40', '18:10', '21:40', '22:40'],
         'autos': ['09:10', '13:10', '17:10', '21:30'],
         'marketing': ['08:10', '12:20', '18:40', '21:20']}
MARCA = {'vita': 'VITA', 'coberturas': 'Compara Tu Obra Social', 'autos': 'Automotores Kocos', 'marketing': 'Kocos Marketing'}
TAGS = {'vita': '#VITAAbogados #DerechoCivil #DerechoPenal #DerechoLaboral #BuenosAires',
        'coberturas': '#ComparaTuObraSocial #ObraSocial #Prepaga #Monotributo #BuenosAires',
        'autos': '#AutomotoresKocos #0km #AutoNuevo #PlanDeAhorro #BuenosAires',
        'marketing': '#KocosMarketing #WhatsAppBusiness #Pymes #Emprendedores #BuenosAires'}
FORMULAS = {'ADV': 'advertencia', 'ESC': 'escena con hora o número', 'CONT': 'contador que avanza',
            'CARTAS': 'tres cartas cerradas', 'VOS': 'segunda persona «vos»', 'MITO': 'mito roto',
            'CUAL': '¿cuál sos? (identidad)', 'NUM': 'pregunta con respuesta numérica',
            'SERIE1': 'serie (parte 1)', 'SERIE2': 'serie (parte 2)', 'LOOP': 'loop',
            'BOCETO': 'advertencia + escena con hora + contador + loop'}
PROHIBIDAS = ['¿Sabías que', 'Te contamos todo', 'No te lo pierdas', 'botón está en el perfil',
              'Agencia Kocos', 'ORVIAN', 'plata rápido', 'garantizado', 'te aseguramos']

def cargar(m):
    spec = importlib.util.spec_from_file_location(m, os.path.join(AQUI, m + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.REELS, getattr(mod, 'RESERVA', [])

def armar(m, r, fecha, hora, rid):
    voz = r['voz'].replace('{C}', r['cierre']) if '{C}' in r['voz'] else r['voz'] + ' ' + r['cierre']
    voz = ' '.join(voz.split())
    cierre = f"{r['cierre']} O escribinos «{r['palabra']}» por WhatsApp."
    pantalla = [r['gancho']] + r['puntos'] + [r['cierre'], f"«{r['palabra']}» por WhatsApp"]
    avisos = 'Situación ilustrativa. Voz generada con IA.'
    if m == 'vita':
        avisos += '\nInformación general: no reemplaza una consulta.'
    if r.get('fuente'):
        avisos = f"Fuente: {r['fuente']}.\n" + avisos
    copy = (f"{r['gancho']}\n\n" + '\n'.join('✔ ' + p for p in r['puntos']) +
            f"\n\n{cierre}\n\n{avisos}\n\n{TAGS[m]}")
    return {'id': rid, 'fecha': fecha, 'hora': hora, 'marca': MARCA[m],
            'formula': FORMULAS[r['f']], 'tema': r['tema'], 'basado_en': r['base'],
            'gancho_pantalla': r['gancho'], 'voz': voz, 'caracteres_voz': len(voz),
            'textos_pantalla': pantalla, 'personaje': r['pj'], 'lugar_ba': r['lugar'],
            'escena_visual': r['escena'], 'cierre': cierre, 'palabra': r['palabra'],
            'copy': copy, 'fuente': r.get('fuente', '')}

def main():
    errores, todos, ganchos = [], {}, collections.Counter()
    for m in ['vita', 'coberturas', 'autos', 'marketing']:
        if not os.path.exists(os.path.join(AQUI, m + '.py')):
            continue
        reels, reserva = cargar(m)
        lista = []
        for i, r in enumerate(reels):
            d, h = divmod(i, 4)
            lista.append(armar(m, r, DIAS[d], HORAS[m][h], f"{m}-{DIAS[d][8:]}{DIAS[d][5:7]}-{h+1}"))
        for j, r in enumerate(reserva):
            lista.append(armar(m, r, 'reserva', '', f"{m}-reserva-{j+1}"))
        # validaciones
        prev = None; temas = collections.defaultdict(list)
        for k, x in enumerate(lista):
            if x['caracteres_voz'] > 380: errores.append(f"{x['id']}: voz {x['caracteres_voz']} > 380")
            if len(x['gancho_pantalla']) > 45: errores.append(f"{x['id']}: gancho {len(x['gancho_pantalla'])} > 45")
            ganchos[x['gancho_pantalla'].lower()] += 1
            if x['fecha'] != 'reserva' and prev and prev == x['formula']:
                errores.append(f"{x['id']}: misma fórmula que el anterior ({prev})")
            if x['fecha'] != 'reserva': prev = x['formula']
            temas[x['tema']].append(x)
            texto = x['voz'] + x['copy']
            for p in PROHIBIDAS:
                if p.lower() in texto.lower(): errores.append(f"{x['id']}: contiene «{p}»")
        for t, xs in temas.items():
            if len(xs) > 2: errores.append(f"{m}: tema «{t}» sale {len(xs)} veces")
            if len(xs) == 2:
                a, b = xs
                if a['formula'] == b['formula'] and 'serie' not in a['formula']:
                    errores.append(f"{m}: tema «{t}» repite fórmula")
                if a['lugar_ba'] == b['lugar_ba']: errores.append(f"{m}: tema «{t}» repite lugar")
        todos[m] = lista
        with open(os.path.join(SAL, m + '.json'), 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)
    for g, n in ganchos.items():
        if n > 1: errores.append(f"gancho repetido: {g}")
    escribir_md(todos)
    for e in errores: print('ERROR', e)
    for m, l in todos.items():
        print(m, len(l), 'reels', sum(x['caracteres_voz'] for x in l), 'caracteres')
    print('total', sum(x['caracteres_voz'] for l in todos.values() for x in l))
    return 1 if errores else 0

def escribir_md(todos):
    L = ['# Guiones de reels · tanda del 27/11 al 06/12/2026', '',
         'Todos con voz (ElevenLabs). 4 reels por día y por marca + 4 de reserva por marca. Horarios en hora argentina.',
         'Se arma con `fuente/armar.py` (los datos de cada marca están en `fuente/<marca>.py`). Los JSON están en `guiones/`.',
         'Estado: **especificado** (guiones escritos y validados). No producido, no programado, no publicado.', '',
         '## Totales de caracteres de voz', '', '| Marca | Reels | Caracteres | Promedio |', '|---|---|---|---|']
    tot = 0; n = 0
    for m, l in todos.items():
        c = sum(x['caracteres_voz'] for x in l); tot += c; n += len(l)
        L.append(f"| {MARCA[m]} | {len(l)} | {c:,} | {c // max(len(l),1)} |".replace(',', '.'))
    L.append(f"| **Total** | **{n}** | **{tot:,}** | {tot // max(n,1)} |".replace(',', '.'))
    L += ['', f"Tope pedido: 38.000 caracteres (presupuesto ElevenLabs 40.000). {'Dentro del tope.' if tot <= 38000 else 'FUERA DEL TOPE.'}", '']
    L += ['## Reparto de fórmulas por marca', '']
    for m, l in todos.items():
        c = collections.Counter(x['formula'] for x in l)
        L.append(f"- **{MARCA[m]}:** " + ' · '.join(f"{k} {v}" for k, v in sorted(c.items(), key=lambda z: -z[1])))
    for m, l in todos.items():
        L += ['', f"## {MARCA[m]}", '', '| Día | Hora | Fórmula | Gancho | Palabra | Caracteres |', '|---|---|---|---|---|---|']
        for x in l:
            dia = x['fecha'] if x['fecha'] == 'reserva' else x['fecha'][8:] + '/' + x['fecha'][5:7]
            L.append(f"| {dia} | {x['hora']} | {x['formula']} | {x['gancho_pantalla']} | {x['palabra']} | {x['caracteres_voz']} |")
    with open(os.path.join(AQUI, '..', 'GUIONES.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')

if __name__ == '__main__':
    sys.exit(main())
