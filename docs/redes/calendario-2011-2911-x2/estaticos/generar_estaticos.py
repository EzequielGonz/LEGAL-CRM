# Genera las historias y los carruseles del cronograma x2 (20/11 al 29/11/2026) para las 4 marcas.
# Lee calendario.csv y contenido.py, arma una página HTML por día y marca y la exporta a JPG con exportar.mjs.
#
# Uso:
#   python3 generar_estaticos.py <AAAA-MM-DD> [marca ...]       -> build/<fecha>/<marca>.html + piezas.json
#   node exportar.mjs build/<fecha>/<marca>.html <carpeta_salida>
#
# Nombres: h-<marca>-<ddmm>-<hhmm>.jpg (historias) y c-<marca>-<ddmm>-<n>.jpg (láminas del carrusel).
# Historias 1080x1920 y carruseles 1080x1350. Logo y nombre de la marca en todas.
# Encuesta, dato o mito y «respondé con PALABRA»: espacio libre para el sticker y la pregunta en el texto.
# 4 historias extra por día y marca (10:30, 14:30, 17:00 y 22:30) con temas del rubro que no salen ese día.
import csv, html, json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from contenido import C, REEMPLAZOS  # noqa: E402

CAL = os.path.join(AQUI, '..', 'calendario.csv')
LOGOS = os.path.abspath(os.path.join(AQUI, '..', '..', '..', '..', '.claude', 'referencias', 'redes', 'logos'))
FONTS = os.path.join(AQUI, 'fonts')

SLUG = {'VITA': 'vita', 'Coberturas': 'cob', 'Autos': 'autos', 'Kocos Marketing': 'mkt'}
NOMBRE = {'VITA': 'VITA Abogados', 'Coberturas': 'Compara tu Obra Social', 'Autos': 'Automotores Kocos', 'Kocos Marketing': 'Kocos Marketing'}
SITIO = {'VITA': 'estudiojuridicovita.com', 'Coberturas': 'comparatuobrasocial.com', 'Autos': 'autoskocos.com', 'Kocos Marketing': 'kocosmkt.com'}
LOGO = {'VITA': 'vita.png', 'Coberturas': 'coberturas.png', 'Autos': 'autos.png', 'Kocos Marketing': 'marketing.png'}
EXTRA_HORAS = ['10:30', '14:30', '17:00', '22:30']
EXTRA_TIPO = {'10:30': 'mito', '14:30': 'encuesta', '17:00': 'checklist', '22:30': 'responde'}
# Temas que no van como historia extra (tienen fecha propia en el calendario).
NO_EXTRA = {('Coberturas', 'fallo-corte'), ('Autos', 'black-friday'), ('Coberturas', 'reintegros')}

# Portadas de carrusel que se corrigen: sin aumento de prepagas, sin porcentajes en Coberturas
# y sin contar láminas que no coinciden con el diseño.
PORTADA = {
 ('2026-11-21', 'Coberturas'): 'Antes de pagar, *compará.*',
 ('2026-11-26', 'Coberturas'): 'Antes de pagar: *qué mirar en tu plan.*',
 ('2026-11-24', 'Coberturas'): 'Tu recibo explicado: *el aporte a tu obra social.*',
 ('2026-11-29', 'Coberturas'): 'Recibo de sueldo: *a dónde va tu aporte.*',
 ('2026-11-23', 'Kocos Marketing'): 'Tu perfil de negocio en Google, *completo.*',
 ('2026-11-28', 'Kocos Marketing'): 'Perfil de Google *en 4 pasos.*',
 ('2026-11-25', 'VITA'): 'Choque: *las primeras 24 horas.*',
 ('2026-11-21', 'VITA'): 'Aguinaldo de diciembre: *fecha y recibo.*',
 ('2026-11-29', 'Autos'): 'Día del retiro: *la lista para llevar.*',
}

# Ya programado antes en Metricool: no se produce ni se programa de nuevo.
YA_PROGRAMADO = {('2026-11-20', 'VITA')}  # carrusel «Antes de firmar», 11:20, id 435155423

T = {
 'VITA': dict(osc='radial-gradient(120% 80% at 50% 22%, #16295E 0%, #112250 48%, #0E1218 100%)', cla='#F5F4F0',
              txt_osc='#F5F4F0', sub_osc='rgba(245,244,240,.86)', txt_cla='#25282B', sub_cla='#4A4D50',
              acc_osc='#D4AF37', acc_cla='#3B507D', linea='#C1AE7A', pill_osc='#D4AF37', pill_txt_osc='#0E1218', pill_cla='#112250', pill_txt_cla='#F5F4F0',
              tf='"Playfair Display"', tw=500, tcase='none', tls='-0.005em', em_it=True, bf='Manrope',
              card_osc='rgba(245,244,240,.07)', borde_osc='rgba(193,174,122,.40)', card_cla='#E7E2CE', borde_cla='rgba(59,80,125,.18)', logo_h=150, alt='cla'),
 'Coberturas': dict(osc='#003D3B', cla='#DAF1DE', txt_osc='#FFFFFF', sub_osc='rgba(255,255,255,.88)', txt_cla='#0B2B26', sub_cla='#2F4A43',
              acc_osc='#8EB69B', acc_cla='#235347', linea='#8EB69B', pill_osc='#DAF1DE', pill_txt_osc='#003D3B', pill_cla='#235347', pill_txt_cla='#FFFFFF',
              tf='Manrope', tw=800, tcase='none', tls='-0.02em', em_it=False, bf='Manrope', marker=True,
              card_osc='rgba(255,255,255,.08)', borde_osc='rgba(142,182,155,.45)', card_cla='#FFFFFF', borde_cla='rgba(35,83,71,.18)', logo_h=110, alt='osc'),
 'Autos': dict(osc='radial-gradient(110% 70% at 50% 18%, #011F65 0%, #020C47 45%, #000521 100%)', cla='#FFFFFF', txt_osc='#FFFFFF', sub_osc='rgba(255,255,255,.88)', txt_cla='#000521', sub_cla='#33405E',
              acc_osc='#6FB4F5', acc_cla='#0E4EB2', linea='#207CCF', pill_osc='#207CCF', pill_txt_osc='#FFFFFF', pill_cla='#0E4EB2', pill_txt_cla='#FFFFFF',
              tf='Archivo', tw=800, tcase='uppercase', tls='-0.01em', em_it=False, bf='"Plus Jakarta Sans"',
              card_osc='rgba(32,124,207,.14)', borde_osc='rgba(111,180,245,.45)', card_cla='#EEF4FC', borde_cla='rgba(14,78,178,.20)', logo_h=150, alt='cla'),
 'Kocos Marketing': dict(osc='#1B1B1B', cla='#FFE7D0', txt_osc='#FFE7D0', sub_osc='rgba(255,231,208,.86)', txt_cla='#1B1B1B', sub_cla='#5D493D',
              acc_osc='#FC6E20', acc_cla='#1B1B1B', linea='#FC6E20', pill_osc='#FC6E20', pill_txt_osc='#1B1B1B', pill_cla='#FC6E20', pill_txt_cla='#1B1B1B',
              tf='Outfit', tw=700, tcase='none', tls='-0.025em', em_it=False, bf='Manrope', marker_cla=True,
              card_osc='#323232', borde_osc='rgba(252,110,32,.35)', card_cla='#FFFFFF', borde_cla='rgba(93,73,61,.18)', logo_h=70, alt='cla'),
}

ICONO = {
 'car': '<path d="M16 58 V50 L24 34 Q26 30 31 30 H69 Q74 30 76 34 L84 50 V58 Q84 62 80 62 H20 Q16 62 16 58 Z"/><path d="M16 50 H84"/><circle cx="31" cy="64" r="8" fill="BG"/><circle cx="69" cy="64" r="8" fill="BG"/>',
 'helmet': '<path d="M22 62 A28 28 0 0 1 78 62"/><path d="M14 62 H86 V66 Q86 70 82 70 H18 Q14 70 14 66 Z"/><path d="M43 36 V52 M57 36 V52"/>',
 'steps': '<path d="M22 72 L50 50 L78 28"/><circle cx="22" cy="72" r="9" fill="BG"/><circle cx="50" cy="50" r="9" fill="BG"/><circle cx="78" cy="28" r="9" fill="BG"/>',
 'chat': '<path d="M22 22 H78 Q86 22 86 30 V58 Q86 66 78 66 H46 L30 78 V66 H22 Q14 66 14 58 V30 Q14 22 22 22 Z"/><circle cx="36" cy="44" r="3.6" fill="FG" stroke="none"/><circle cx="50" cy="44" r="3.6" fill="FG" stroke="none"/><circle cx="64" cy="44" r="3.6" fill="FG" stroke="none"/>',
 'compare': '<path d="M20 38 H78 M64 24 L78 38 L64 52"/><path d="M80 62 H22 M36 48 L22 62 L36 76"/>',
 'receipt': '<path d="M28 16 H72 V84 L64 78 L57 84 L50 78 L43 84 L36 78 L28 84 Z"/><path d="M38 36 H62 M38 48 H62 M38 60 H54"/>',
 'wallet': '<path d="M18 36 H76 Q82 36 82 42 V72 Q82 78 76 78 H24 Q18 78 18 72 Z"/><path d="M22 36 L60 22 L65 36"/><path d="M82 50 H67 Q61 50 61 57 Q61 64 67 64 H82"/>',
 'cycle': '<path d="M25 47 A25 25 0 0 1 72 37"/><path d="M75 23 L72 37 L58 35"/><path d="M75 53 A25 25 0 0 1 28 63"/><path d="M25 77 L28 63 L42 65"/>',
 'tag': '<path d="M20 22 H48 L80 54 Q83 57 80 60 L60 80 Q57 83 54 80 L22 48 Q20 46 20 44 Z"/><circle cx="35" cy="37" r="5"/>',
 'key': '<circle cx="34" cy="37" r="15"/><circle cx="34" cy="37" r="4"/><path d="M45 48 L80 83"/><path d="M62 65 L70 57 M71 74 L78 67"/>',
 'doc': '<path d="M28 14 H60 L74 28 V86 H28 Z"/><path d="M60 14 V28 H74"/><path d="M38 46 H64 M38 58 H64 M38 70 H54"/>',
 'shield': '<path d="M50 14 L80 26 V48 Q80 72 50 86 Q20 72 20 48 V26 Z"/><path d="M36 50 L46 60 L66 40"/>',
 'pin': '<path d="M50 86 Q24 58 24 40 A26 26 0 0 1 76 40 Q76 58 50 86 Z"/><circle cx="50" cy="40" r="9"/>',
 'calendar': '<rect x="16" y="22" width="68" height="62" rx="8"/><path d="M16 40 H84 M34 14 V30 M66 14 V30"/><path d="M34 56 H44 M56 56 H66 M34 70 H44"/>',
 'grid': '<rect x="18" y="18" width="27" height="27" rx="6"/><rect x="55" y="18" width="27" height="27" rx="6"/><rect x="18" y="55" width="27" height="27" rx="6"/><rect x="55" y="55" width="27" height="27" rx="6"/>',
}
ICONO_TEMA = {
 'VITA': {'firma': 'doc', 'trayecto': 'car', 'choque-pasos': 'car', 'culpa': 'helmet', 'sin-seguro': 'shield', 'aguinaldo': 'calendar', 'nunca': 'chat',
          'art-rechazo': 'helmet', 'liquidacion': 'receipt', 'alta': 'helmet', 'no-registrado': 'receipt', 'penal-transito': 'shield', 'penal': 'doc',
          'despido': 'doc', 'reforma': 'doc', 'certificado': 'doc', 'telegrama': 'doc', 'danos': 'car'},
 'Coberturas': {'cartilla': 'pin', 'monotributo': 'receipt', 'revisar-plan': 'compare', 'aportes': 'receipt', 'aguinaldo': 'receipt', 'cambio-prepaga': 'compare',
                'familia': 'grid', 'opcion-obra-social': 'cycle', 'plan-a-medida': 'compare', 'preexistencia': 'shield', '65': 'calendar', 'carencias': 'calendar',
                'derivar': 'cycle', 'prepagas-baja': 'steps', 'fallo-corte': 'doc', 'reintegros': 'receipt', 'vacaciones': 'pin'},
 'Autos': {'anticipo-cuota': 'wallet', 'usado': 'car', 'llave-en-mano': 'key', 'voto-0km-usado': 'compare', 'plan-ahorro': 'calendar', 'gastos-fijos': 'wallet',
           'retiro': 'key', 'documentacion': 'doc', 'ruta': 'car', 'hibrido': 'car', 'adjudicacion': 'calendar', 'garantia': 'shield', 'formas-de-pago': 'wallet',
           'seguro': 'shield', 'primer-0km': 'key', 'black-friday': 'tag'},
 'Kocos Marketing': {'temporada': 'calendar', 'orden-chats': 'chat', 'consulta': 'chat', 'whatsapp-business': 'chat', 'web': 'grid', 'precio': 'tag',
                     'seguimiento': 'calendar', 'estados': 'chat', 'google': 'pin', 'link-bio': 'grid', 'resenas': 'chat', 'ausencia': 'chat',
                     'mensajes-ig': 'chat', 'pedidos': 'doc', 'respuestas-rapidas': 'chat'},
}

HASHTAGS = {
 'Coberturas': '#prepagas #obrasocial #monotributo #saludargentina #buenosaires',
 'Autos': '#0km #autonuevo #concesionaria #buenosaires #autos',
 'Kocos Marketing': '#pymes #emprendedores #ventas #marketingdigital #buenosaires',
}
VITA_TAGS = {
 'transito': '#accidentedetransito #seguros #abogados #buenosaires #CABA',
 'art': '#ART #accidentelaboral #abogados #buenosaires #CABA',
 'laboral': '#derecholaboral #despidos #abogados #buenosaires #CABA',
 'penal': '#derechopenal #abogados #buenosaires #CABA #asesoramientolegal',
}
VITA_AREA = {'firma': 'transito', 'trayecto': 'art', 'choque-pasos': 'transito', 'culpa': 'art', 'sin-seguro': 'transito', 'aguinaldo': 'laboral',
             'nunca': 'transito', 'art-rechazo': 'art', 'liquidacion': 'laboral', 'alta': 'art', 'no-registrado': 'laboral', 'penal-transito': 'penal',
             'penal': 'penal', 'despido': 'laboral', 'reforma': 'laboral', 'certificado': 'laboral', 'telegrama': 'laboral', 'danos': 'transito'}


def hashtags(marca, tema):
    if marca == 'VITA':
        return VITA_TAGS[VITA_AREA.get(tema, 'transito')]
    return HASHTAGS[marca]


def esc(s):
    return html.escape(s, quote=False)


def fmt(s):
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', esc(s))


def plano(s):
    return s.replace('*', '')


def enfatizar(s):
    """Pone en énfasis lo que va después de los dos puntos (o la última parte) si no tiene énfasis."""
    if '*' in s:
        return s
    if ': ' in s:
        a, b = s.split(': ', 1)
        return f'{a}: *{b}*'
    return s


def ficha(marca, tema):
    tema = REEMPLAZOS.get((marca, tema), tema)
    return tema, C[marca][tema]


def css(marca):
    t = T[marca]
    f = FONTS
    em_osc = f'color:{t["acc_osc"]};' + ('font-style:italic;' if t['em_it'] else 'font-style:normal;')
    if t.get('marker') or t.get('marker_cla'):
        mk = t['acc_osc']
        em_cla = f'font-style:normal;color:{t["txt_cla"]};background:linear-gradient(transparent 70%, {mk} 70%, {mk} 94%, transparent 94%);'
    else:
        em_cla = f'color:{t["acc_cla"]};' + ('font-style:italic;' if t['em_it'] else 'font-style:normal;')
    return f'''
@font-face{{font-family:"Playfair Display";src:url({f}/playfair-display-normal-latin-61a963.woff2)}}
@font-face{{font-family:"Playfair Display";src:url({f}/playfair-display-normal-latin-ext-ca7410.woff2);unicode-range:U+0100-024F}}
@font-face{{font-family:"Playfair Display";font-style:italic;src:url({f}/playfair-display-italic-latin-d14361.woff2)}}
@font-face{{font-family:Manrope;src:url({f}/manrope-normal-latin-58ee19.woff2)}}
@font-face{{font-family:Archivo;src:url({f}/archivo-normal-latin-2d6953.woff2)}}
@font-face{{font-family:"Plus Jakarta Sans";src:url({f}/plus-jakarta-sans-normal-latin-d4d84d.woff2)}}
@font-face{{font-family:Outfit;src:url({f}/outfit-normal-latin-973124.woff2)}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#777;display:flex;flex-wrap:wrap;gap:40px;padding:40px;width:1200px;font-family:{t["bf"]}}}
.ab{{position:relative;overflow:hidden;width:1080px;flex:none}}
.st{{height:1920px}} .cr{{height:1350px}}
.osc{{background:{t["osc"]};color:{t["txt_osc"]}}}
.cla{{background:{t["cla"]};color:{t["txt_cla"]}}}
.marca{{position:absolute;left:80px;top:262px;display:flex;align-items:center;gap:24px}}
.cr .marca{{top:64px;left:72px}}
.marca img{{height:{t["logo_h"] if marca != 'VITA' else 116}px;width:auto;display:block}}
.cr .marca img{{height:{int((t["logo_h"] if marca != 'VITA' else 116)*0.62)}px}}
.marca span{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:40px;letter-spacing:{t["tls"]};{"text-transform:uppercase;" if marca=="Autos" else ""}white-space:nowrap}}
.cr .marca span{{font-size:30px}}
.main{{position:absolute;left:80px;right:80px;top:470px;bottom:330px;display:flex;flex-direction:column;justify-content:center;gap:40px}}
.cr .main{{top:170px;bottom:80px;left:72px;right:72px;gap:34px}}
.t{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:92px;line-height:1.08;letter-spacing:{t["tls"]};text-transform:{t["tcase"]};text-wrap:balance}}
.t.m{{font-size:80px}} .t.s{{font-size:70px}}
.osc em{{{em_osc}}} .cla em{{{em_cla}}}
.rule{{width:120px;height:5px;background:{t["linea"]};border-radius:3px;flex:none}}
.p{{font-weight:500;font-size:46px;line-height:1.38;text-wrap:pretty}}
.osc .p{{color:{t["sub_osc"]}}} .cla .p{{color:{t["sub_cla"]}}}
.fte{{font-size:32px;opacity:.78}}
.q{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:70px;line-height:1.18;{"font-style:italic;" if marca=="VITA" else ""}text-transform:{t["tcase"]};text-decoration:line-through;text-decoration-thickness:6px;text-wrap:balance;opacity:.92}}
.osc .q{{text-decoration-color:{t["acc_osc"]}}} .cla .q{{text-decoration-color:{t["acc_cla"]}}}
.v{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:132px;line-height:1;{"font-style:italic;" if marca=="VITA" else ""}text-transform:{t["tcase"]}}}
.osc .v{{color:{t["acc_osc"]}}} .cla .v{{color:{t["acc_cla"]}}}
.stk{{flex:none;height:300px}} .stk.c{{height:190px}}
.cta{{font-weight:600;font-size:46px;line-height:1.4}}
.cta small{{display:block;font-weight:500;font-size:36px;opacity:.82;margin-top:10px}}
.pill{{display:inline-block;border-radius:999px;padding:6px 30px 10px;font-weight:800;letter-spacing:.02em;white-space:nowrap}}
.osc .pill{{background:{t["pill_osc"]};color:{t["pill_txt_osc"]}}} .cla .pill{{background:{t["pill_cla"]};color:{t["pill_txt_cla"]}}}
.pill.xl{{font-size:84px;padding:10px 46px 16px;margin-top:14px}}
.li{{display:flex;flex-direction:column;gap:22px}}
.it{{display:flex;gap:30px;align-items:flex-start;padding:28px 34px;border-radius:28px}}
.osc .it{{background:{t["card_osc"]};border:2px solid {t["borde_osc"]}}} .cla .it{{background:{t["card_cla"]};border:2px solid {t["borde_cla"]}}}
.ck{{width:58px;height:58px;flex:none;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-top:4px}}
.osc .ck{{background:{t["pill_osc"]}}} .cla .ck{{background:{t["pill_cla"]}}}
.ck svg{{width:36px;height:36px}}
.osc .ck svg{{stroke:{t["pill_txt_osc"]}}} .cla .ck svg{{stroke:{t["pill_txt_cla"]}}}
.it b{{display:block;font-weight:700;font-size:44px;line-height:1.25}}
.it span{{display:block;font-weight:500;font-size:36px;line-height:1.35;margin-top:6px;opacity:.86}}
.lbl{{font-weight:700;font-size:34px;letter-spacing:.01em}}
.osc .lbl{{color:{t["acc_osc"]}}} .cla .lbl{{color:{t["acc_cla"]}}}
.rn{{font-family:{t["tf"]};font-size:52px;line-height:1.2;{"font-style:italic;" if marca=="VITA" else ""}font-weight:{t["tw"]};{"text-transform:uppercase;" if marca=="Autos" else ""}}}
/* Carrusel */
.ic{{width:230px;height:230px;flex:none}} .ic svg{{width:100%;height:100%}}
.osc .ic svg{{stroke:{t["acc_osc"]}}} .cla .ic svg{{stroke:{t["acc_cla"]}}}
.big{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:108px;line-height:1.04;letter-spacing:{t["tls"]};text-transform:{t["tcase"]};text-wrap:balance}}
.desl{{font-weight:700;font-size:36px;display:flex;align-items:center;gap:16px}}
.osc .desl{{color:{t["acc_osc"]}}} .cla .desl{{color:{t["acc_cla"]}}}
.desl svg{{width:56px;height:56px}}
.osc .desl svg{{stroke:{t["acc_osc"]}}} .cla .desl svg{{stroke:{t["acc_cla"]}}}
.num{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:220px;line-height:.9;{"font-style:italic;" if marca=="VITA" else ""}}}
.osc .num{{color:{t["acc_osc"]}}} .cla .num{{color:{t["acc_cla"]}}}
.cr .t{{font-size:88px}} .cr .p{{font-size:46px}} .cr .q{{font-size:66px}} .cr .v{{font-size:120px}}
.sitio{{font-weight:600;font-size:34px;opacity:.82}}
'''


CHECK = '<svg viewBox="0 0 40 40" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21 L17 29 L32 12"/></svg>'
FLECHA = '<svg viewBox="0 0 100 100" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 50 H80"/><path d="M58 28 L80 50 L58 72"/></svg>'


def icono(marca, tema, fondo):
    p = ICONO[ICONO_TEMA[marca].get(tema, 'doc')].replace('BG', fondo).replace('FG', T[marca]['acc_osc'])
    return f'<div class="ic"><svg viewBox="0 0 100 100" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">{p}</svg></div>'


def lockup(marca):
    return f'<div class="marca"><img src="{LOGOS}/{LOGO[marca]}" alt=""><span>{esc(NOMBRE[marca])}</span></div>'


def tam(txt, grande=46, medio=64):
    n = len(plano(txt))
    return '' if n <= grande else (' m' if n <= medio else ' s')


def palabra_pill(p, xl=False):
    return f'<span class="pill{" xl" if xl else ""}">{esc(p)}</span>'


# ---------- Historias ----------

def h_mito(marca, f, pal):
    if 'dato' in f:  # dato con fuente (Coberturas, «Lo que dijo la Corte»)
        dato, fuente = f['dato']
        cuerpo = (f'<div class="rule"></div><div class="t{tam(f["t"])}">{fmt(f["t"])}</div><div class="p">{fmt(dato)}</div>'
                  f'<div class="p fte">{fmt(fuente)} {fmt(f["mito"][1])}</div>')
        texto = [plano(f['t']), dato, fuente, f['mito'][1]]
    else:
        cita, verdad = f['mito']
        cuerpo = f'<div class="q">«{fmt(cita)}»</div><div class="v">Falso.</div><div class="p">{fmt(verdad)}</div>'
        texto = [f'«{cita}»', 'Falso.', verdad]
    cuerpo += f'<div class="stk"></div><div class="cta">¿Te pasó? Respondé con {palabra_pill(pal)}</div>'
    texto.append(f'¿Te pasó? Respondé con «{pal}».')
    return cuerpo, texto


def h_encuesta(marca, f, pal, pregunta=None, opciones=None):
    q, a, b = f['enc']
    if pregunta:
        q = pregunta
        if opciones:
            a, b = opciones
    cuerpo = (f'<div class="rule"></div><div class="t{tam(q, 40, 60)}">{fmt(q)}</div><div class="p">{fmt(plano(f["p"]))}</div>'
              f'<div class="stk"></div><div class="cta">Respondé esta historia: «{esc(a)}» o «{esc(b)}».'
              f'<small>Con {esc("«" + pal + "»")} te contamos más.</small></div>')
    return cuerpo, [q, plano(f['p']), f'Respondé esta historia: «{a}» o «{b}».', f'Con «{pal}» te contamos más.']


def h_responde(marca, f, pal, titulo=None):
    titulo = enfatizar(titulo or f['t'])
    cuerpo = (f'<div class="rule"></div><div class="t{tam(titulo)}">{fmt(titulo)}</div><div class="p">{fmt(plano(f["p"]))}</div>'
              f'<div class="stk"></div><div class="cta">¿Te pasó? Respondé esta historia con<br>{palabra_pill(pal, True)}</div>')
    return cuerpo, [plano(titulo), plano(f['p']), f'¿Te pasó? Respondé esta historia con «{pal}».']


def h_checklist(marca, f, pal):
    items = ''.join(f'<div class="it"><div class="ck">{CHECK}</div><div><b>{fmt(a)}</b><span>{fmt(b)}</span></div></div>' for a, b in f['pts'])
    cuerpo = (f'<div class="t{tam(f["t"], 34, 52)}">{fmt(f["t"])}</div><div class="li">{items}</div>'
              f'<div class="stk c"></div><div class="cta">Respondé con {palabra_pill(pal)} y te respondemos.</div>')
    return cuerpo, [plano(f['t'])] + [f'{a} {b}' for a, b in f['pts']] + [f'Respondé con «{pal}» y te respondemos.']


def h_detras(marca, f, pal, reel, row):
    lugar = row['lugar_ba'].strip().rstrip('.')
    giro = row['giro_irreal'].strip().rstrip('.')
    pasos = [('La escena', lugar[0].upper() + lugar[1:] + '.'), ('El giro', giro[0].upper() + giro[1:] + '.'), ('Lo que te llevás', plano(f['p']))]
    items = ''.join(f'<div class="it"><div><div class="lbl">{esc(a)}</div><b style="font-weight:600;font-size:40px;margin-top:8px">{fmt(b)}</b></div></div>' for a, b in pasos)
    cuerpo = (f'<div class="t m">Así armamos <em>el giro</em> del reel</div><div class="rn">«{esc(reel)}»</div><div class="li">{items}</div>'
              f'<div class="stk c"></div><div class="cta">Respondé con {palabra_pill(pal)} y te respondemos.</div>')
    return cuerpo, ['Así armamos el giro del reel', f'«{reel}»'] + [f'{a}: {b}' for a, b in pasos] + [f'Respondé con «{pal}» y te respondemos.']


def historia_html(marca, fondo, cuerpo, pid):
    return f'<div class="ab st {fondo}" id="{pid}" data-formato="historia">{lockup(marca)}<div class="main">{cuerpo}</div></div>'


# ---------- Carrusel ----------

def carrusel(marca, f, tema, portada, pal, base):
    t = T[marca]
    fondo_icono = '#112250' if marca == 'VITA' else ('#003D3B' if marca == 'Coberturas' else ('#000521' if marca == 'Autos' else '#1B1B1B'))
    portada = enfatizar(portada)
    laminas = []
    laminas.append(('osc', f'{icono(marca, tema, fondo_icono)}<div class="big">{fmt(portada)}</div>'
                    f'<div class="desl">Deslizá {FLECHA}</div>'))
    laminas.append(('cla', f'<div class="rule"></div><div class="t">{fmt(f["t"])}</div><div class="p">{fmt(plano(f["p"]))}</div>'))
    for i, (a, b) in enumerate(f['pts'], 1):
        laminas.append(('cla', f'<div class="num">{i}</div><div class="t">{fmt(a)}</div><div class="p">{fmt(b)}</div>'))
    if len(laminas) < 6:
        cita, verdad = f['mito']
        laminas.append(('cla', f'<div class="q">«{fmt(cita)}»</div><div class="v">Falso.</div><div class="p">{fmt(verdad)}</div>'))
    laminas.append(('osc', f'<div class="t">Guardalo <em>y comentá</em></div>{palabra_pill(pal, True)}'
                    f'<div class="p">y te respondemos.</div><div class="sitio">{SITIO[marca]}</div>'))
    out = []
    for n, (fondo, cuerpo) in enumerate(laminas, 1):
        out.append(f'<div class="ab cr {fondo}" id="{base}-{n}" data-formato="carrusel">{lockup(marca)}<div class="main">{cuerpo}</div></div>')
    return out, len(laminas)


def caption(marca, tema, f, portada, pal):
    lineas = [plano(enfatizar(portada)), '']
    for a, b in f['pts']:
        lineas.append(f'✔ {a} {b}')
    lineas += ['', f'Comentá «{pal}» y te respondemos.', '']
    nota = 'Situación ilustrativa.'
    if marca == 'VITA':
        nota += ' Información general: no reemplaza una consulta.'
    lineas.append(nota)
    lineas += ['', hashtags(marca, tema)]
    return '\n'.join(lineas)


# ---------- Armado por día ----------

def filas(fecha):
    rows = list(csv.DictReader(open(CAL, encoding='utf-8')))
    return [r for r in rows if r['fecha'] == fecha and not r['formato'].startswith('reel')]


def dia_idx(fecha):
    return int(fecha[-2:]) - 20


def parse_encuesta(idea):
    s = idea.split('Encuesta:', 1)[1].strip()
    i = s.rfind('?')
    q = s[:i + 1].strip()
    resto = s[i + 1:].strip()
    ops = [x.strip() for x in resto.split(' / ')] if ' / ' in resto else None
    return q, (ops if ops and len(ops) == 2 else None)


def parse_tema(idea):
    m = re.search(r'\(tema: (.+)\)\s*$', idea)
    return m.group(1).strip().rstrip('.') if m else None


def parse_reel(idea):
    m = re.search(r'«(.+)»', idea)
    return m.group(1) if m else ''


PROHIBIDO = {
 'Coberturas': [r'%', r'\$', r'\baument'],
 'Autos': [r'%', r'\$', r'ACARA', r'patentamientos'],
 '*': [r'botón está en el perfil', r'el botón del perfil'],
}


def revisar(marca, tema, textos):
    avisos = []
    todo = ' '.join(textos)
    for pat in PROHIBIDO.get(marca, []) + PROHIBIDO['*']:
        if re.search(pat, todo, re.I):
            if marca == 'Coberturas' and pat == r'\baument' and tema == '65':
                continue
            avisos.append(pat)
    return avisos


def armar(fecha, marcas=None):
    ddmm = fecha[8:10] + fecha[5:7]
    rows = filas(fecha)
    marcas = marcas or ['VITA', 'Coberturas', 'Autos', 'Kocos Marketing']
    salida = os.path.join(os.environ.get('ESTATICOS_BUILD', os.path.join(AQUI, 'build')), fecha)
    os.makedirs(salida, exist_ok=True)
    piezas = []
    for marca in marcas:
        sl = SLUG[marca]
        mrows = sorted([r for r in rows if r['marca'] == marca], key=lambda r: r['hora'])
        temas_dia = set()
        bloques = []
        for r in mrows:
            tema, f = ficha(marca, r['tema'])
            temas_dia.add(tema)
            pal = r['palabra']
            hora = r['hora'].replace(':', '')
            fmt_ = r['formato']
            if fmt_ == 'carrusel guía':
                if (fecha, marca) in YA_PROGRAMADO:
                    continue
                portada = PORTADA.get((fecha, marca)) or r['gancho']
                if tema == 'revisar-plan' and (fecha, marca) not in PORTADA:
                    portada = f['t']
                base = f'c-{sl}-{ddmm}'
                lams, n = carrusel(marca, f, tema, portada, pal, base)
                bloques += lams
                cap = caption(marca, tema, f, portada, pal)
                av = revisar(marca, tema, [cap, portada, f['t'], f['p']] + [a + b for a, b in f['pts']])
                piezas.append(dict(fecha=fecha, hora=r['hora'], marca=marca, tipo='carrusel', tema=tema, archivos=[f'{base}-{i}.jpg' for i in range(1, n + 1)],
                                   texto=cap, palabra=pal, avisos=av, formato=fmt_))
                continue
            alt = (r['version'] in ('B', 'R'))
            fondo = T[marca]['alt'] if alt else ('cla' if marca == 'Coberturas' else 'osc')
            if fmt_ == 'historia: dato o mito':
                cuerpo, txt = h_mito(marca, f, pal)
            elif fmt_ == 'historia: encuesta':
                q, ops = parse_encuesta(r['idea'])
                if tema != r['tema'] and not (tema == 'documentacion'):
                    q, ops = None, None
                if r['tema'] == 'diciembre-enero':
                    q, ops = None, None
                cuerpo, txt = h_encuesta(marca, f, pal, q, ops)
            elif fmt_ == 'historia: respondé con PALABRA':
                titulo = parse_tema(r['idea'])
                if marca == 'Coberturas' and titulo and '%' in titulo:
                    titulo = f['t']
                elif marca == 'Coberturas' and titulo and re.search(r'aument', titulo, re.I):
                    titulo = 'Antes de pagar, compará: *qué plan tenés y qué usás.*'
                cuerpo, txt = h_responde(marca, f, pal, titulo)
            elif fmt_ == 'historia: checklist':
                cuerpo, txt = h_checklist(marca, f, pal)
            elif fmt_ == 'historia: detrás de escena animado':
                cuerpo, txt = h_detras(marca, f, pal, parse_reel(r['idea']), r)
            else:
                raise SystemExit(f'formato desconocido: {fmt_}')
            pid = f'h-{sl}-{ddmm}-{hora}'
            bloques.append(historia_html(marca, fondo, cuerpo, pid))
            piezas.append(dict(fecha=fecha, hora=r['hora'], marca=marca, tipo='historia', tema=tema, archivos=[pid + '.jpg'], texto='\n'.join(txt),
                               palabra=pal, avisos=revisar(marca, tema, txt), formato=fmt_))
        # Historias extra
        pool = [k for k in C[marca] if k not in temas_dia and (marca, k) not in NO_EXTRA]
        d = dia_idx(fecha)
        start = (d * 4) % len(pool)
        elegidos = [pool[(start + i) % len(pool)] for i in range(4)]
        for i, (hh, tema) in enumerate(zip(EXTRA_HORAS, elegidos)):
            f = C[marca][tema]
            pal = f['pal']
            tipo = EXTRA_TIPO[hh]
            fondo = T[marca]['alt'] if i % 2 else ('cla' if marca == 'Coberturas' else 'osc')
            if tipo == 'mito':
                cuerpo, txt = h_mito(marca, f, pal)
            elif tipo == 'encuesta':
                cuerpo, txt = h_encuesta(marca, f, pal)
            elif tipo == 'checklist':
                cuerpo, txt = h_checklist(marca, f, pal)
            else:
                cuerpo, txt = h_responde(marca, f, pal)
            pid = f'h-{sl}-{ddmm}-{hh.replace(":", "")}'
            bloques.append(historia_html(marca, fondo, cuerpo, pid))
            piezas.append(dict(fecha=fecha, hora=hh, marca=marca, tipo='historia extra', tema=tema, archivos=[pid + '.jpg'], texto='\n'.join(txt),
                               palabra=pal, avisos=revisar(marca, tema, txt), formato='extra: ' + tipo))
        pagina = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{css(marca)}</style></head><body>{"".join(bloques)}</body></html>'
        open(os.path.join(salida, f'{sl}.html'), 'w', encoding='utf-8').write(pagina)
    json.dump(piezas, open(os.path.join(salida, 'piezas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return piezas


if __name__ == '__main__':
    fecha = sys.argv[1]
    marcas = sys.argv[2:] or None
    p = armar(fecha, marcas)
    for x in p:
        print(x['hora'], x['marca'], x['tipo'], x['tema'], len(x['archivos']), 'AVISOS:' + ','.join(x['avisos']) if x['avisos'] else '')
