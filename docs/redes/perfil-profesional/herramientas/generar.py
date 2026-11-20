# Genera las páginas HTML del kit de perfil (piezas por marca y maqueta del perfil).
# Uso: python3 generar.py piezas | maqueta <carpeta_salida_piezas>
import html, re, sys, json, os
from datos import MARCAS

FONTS = '''
@font-face{font-family:"Playfair Display";src:url(fonts/playfair-display-normal-latin-61a963.woff2)}
@font-face{font-family:"Playfair Display";src:url(fonts/playfair-display-normal-latin-ext-ca7410.woff2)}
@font-face{font-family:"Playfair Display";font-style:italic;src:url(fonts/playfair-display-italic-latin-d14361.woff2)}
@font-face{font-family:"Playfair Display";font-style:italic;src:url(fonts/playfair-display-italic-latin-ext-2d6d99.woff2)}
@font-face{font-family:Manrope;src:url(fonts/manrope-normal-latin-58ee19.woff2)}
@font-face{font-family:Manrope;src:url(fonts/manrope-normal-latin-ext-59b5f9.woff2)}
@font-face{font-family:Archivo;src:url(fonts/archivo-normal-latin-2d6953.woff2)}
@font-face{font-family:Archivo;src:url(fonts/archivo-normal-latin-ext-594978.woff2)}
@font-face{font-family:"Plus Jakarta Sans";src:url(fonts/plus-jakarta-sans-normal-latin-d4d84d.woff2)}
@font-face{font-family:"Plus Jakarta Sans";src:url(fonts/plus-jakarta-sans-normal-latin-ext-5d8873.woff2)}
@font-face{font-family:Outfit;src:url(fonts/outfit-normal-latin-973124.woff2)}
@font-face{font-family:Outfit;src:url(fonts/outfit-normal-latin-ext-feaf43.woff2)}
'''

# Tema por marca: fondo oscuro, fondo claro, textos, acentos, tipografías.
T = {
 'vita': dict(osc='radial-gradient(120% 80% at 50% 25%, #16295E 0%, #112250 45%, #0E1218 100%)', osc_plano='#112250',
              cla='#F5F4F0', txt_osc='#F5F4F0', sub_osc='rgba(245,244,240,.84)', txt_cla='#25282B', sub_cla='#4A4D50',
              acc_osc='#D4AF37', acc_cla='#3B507D', linea='#C1AE7A', anillo='#C1AE7A', icono='#D4AF37',
              tf='"Playfair Display"', tw=500, tsz=104, tcase='none', tls='-0.005em', em_it=True,
              bf='Manrope', bw=500, logo_h=118, card='rgba(245,244,240,.06)', card_borde='rgba(193,174,122,.35)'),
 'coberturas': dict(osc='#003D3B', osc_plano='#003D3B', cla='#DAF1DE', txt_osc='#FFFFFF', sub_osc='rgba(255,255,255,.86)',
              txt_cla='#0B2B26', sub_cla='#2F4A43', acc_osc='#8EB69B', acc_cla='#235347', linea='#8EB69B', anillo='#8EB69B', icono='#DAF1DE',
              tf='Manrope', tw=800, tsz=96, tcase='none', tls='-0.02em', em_it=False, marker=True,
              bf='Manrope', bw=500, logo_h=104, card='#FFFFFF', card_borde='rgba(35,83,71,.18)'),
 'autos': dict(osc='#000521', osc_plano='#000521', cla='#FFFFFF', txt_osc='#FFFFFF', sub_osc='rgba(255,255,255,.84)',
              txt_cla='#000521', sub_cla='#33405E', acc_osc='#4E9BE4', acc_cla='#0E4EB2', linea='#207CCF', anillo='#207CCF', icono='#FFFFFF',
              tf='Archivo', tw=800, tsz=92, tcase='uppercase', tls='-0.01em', em_it=False,
              bf='"Plus Jakarta Sans"', bw=500, logo_h=124, card='rgba(32,124,207,.10)', card_borde='rgba(78,155,228,.35)'),
 'kocos': dict(osc='#1B1B1B', osc_plano='#1B1B1B', cla='#FFE7D0', txt_osc='#FFE7D0', sub_osc='rgba(255,231,208,.84)',
              txt_cla='#1B1B1B', sub_cla='#5D493D', acc_osc='#FC6E20', acc_cla='#1B1B1B', linea='#FC6E20', anillo='#FC6E20', icono='#FFE7D0',
              tf='Outfit', tw=700, tsz=104, tcase='none', tls='-0.025em', em_it=False, marker_cla=True,
              bf='Manrope', bw=500, logo_h=70, card='#FFE7D0', card_borde='rgba(252,110,32,.0)'),
}

def icono(nombre, color, fondo, sw=5.2):
    P = {
     'arrow': '<path d="M20 50 H76"/><path d="M56 30 L76 50 L56 70"/>',
     'car': '<path d="M16 58 V50 L24 34 Q26 30 31 30 H69 Q74 30 76 34 L84 50 V58 Q84 62 80 62 H20 Q16 62 16 58 Z"/><path d="M16 50 H84"/><circle cx="31" cy="64" r="8" fill="{f}"/><circle cx="69" cy="64" r="8" fill="{f}"/>',
     'helmet': '<path d="M22 62 A28 28 0 0 1 78 62"/><path d="M14 62 H86 V66 Q86 70 82 70 H18 Q14 70 14 66 Z"/><path d="M43 36 V52 M57 36 V52"/>',
     'steps': '<path d="M22 72 L50 50 L78 28"/><circle cx="22" cy="72" r="9" fill="{f}"/><circle cx="50" cy="50" r="9" fill="{f}"/><circle cx="78" cy="28" r="9" fill="{f}"/>',
     'mitos': '<path d="M50 22 V78"/><path d="M16 50 L25 59 L38 42"/><path d="M62 41 L80 59 M80 41 L62 59"/>',
     'chat': '<path d="M22 22 H78 Q86 22 86 30 V58 Q86 66 78 66 H46 L30 78 V66 H22 Q14 66 14 58 V30 Q14 22 22 22 Z"/><circle cx="36" cy="44" r="3.6" fill="{c}" stroke="none"/><circle cx="50" cy="44" r="3.6" fill="{c}" stroke="none"/><circle cx="64" cy="44" r="3.6" fill="{c}" stroke="none"/>',
     'compare': '<path d="M20 38 H78 M64 24 L78 38 L64 52"/><path d="M80 62 H22 M36 48 L22 62 L36 76"/>',
     'receipt': '<path d="M28 16 H72 V84 L64 78 L57 84 L50 78 L43 84 L36 78 L28 84 Z"/><circle cx="42" cy="38" r="5"/><circle cx="58" cy="58" r="5"/><path d="M60 34 L40 62"/>',
     'wallet': '<path d="M18 36 H76 Q82 36 82 42 V72 Q82 78 76 78 H24 Q18 78 18 72 Z"/><path d="M22 36 L60 22 L65 36"/><path d="M82 50 H67 Q61 50 61 57 Q61 64 67 64 H82"/>',
     'cycle': '<path d="M25 47 A25 25 0 0 1 72 37"/><path d="M75 23 L72 37 L58 35"/><path d="M75 53 A25 25 0 0 1 28 63"/><path d="M25 77 L28 63 L42 65"/>',
     'tag': '<path d="M20 22 H48 L80 54 Q83 57 80 60 L60 80 Q57 83 54 80 L22 48 Q20 46 20 44 Z"/><circle cx="35" cy="37" r="5"/>',
     'key': '<circle cx="34" cy="37" r="15"/><circle cx="34" cy="37" r="4"/><path d="M45 48 L80 83"/><path d="M62 65 L70 57 M71 74 L78 67"/>',
     'grid': '<rect x="18" y="18" width="27" height="27" rx="6"/><rect x="55" y="18" width="27" height="27" rx="6"/><rect x="18" y="55" width="27" height="27" rx="6"/><rect x="55" y="55" width="27" height="27" rx="6"/>',
     'beforeafter': '<rect x="14" y="24" width="72" height="52" rx="8"/><path d="M50 24 V76"/><path d="M24 41 H40 M24 51 H40 M24 61 H34"/><path d="M58 51 L64 57 L76 44"/>',
     'wrench': '<path d="M66 16 A18 18 0 0 0 50 40 L20 70 Q16 74 20 78 L22 80 Q26 84 30 80 L60 50 A18 18 0 0 0 84 34 L74 44 L62 40 L58 28 Z"/>',
    }[nombre].replace('{f}', fondo).replace('{c}', color)
    return f'<svg viewBox="0 0 100 100" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{P}</svg>'

def fmt(s):
    s = html.escape(s, quote=False)
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', s)

def css(m):
    t = T[m]
    em_osc = f'color:{t["acc_osc"]};' + ('font-style:italic;' if t['em_it'] else 'font-style:normal;')
    if t.get('marker'):
        em_cla = f'font-style:normal;color:{t["txt_cla"]};background:linear-gradient(transparent 72%, {t["acc_osc"]} 72%, {t["acc_osc"]} 94%, transparent 94%);'
    elif t.get('marker_cla'):
        em_cla = f'font-style:normal;color:{t["txt_cla"]};background:linear-gradient(transparent 74%, {t["acc_osc"]} 74%, {t["acc_osc"]} 94%, transparent 94%);'
    else:
        em_cla = f'color:{t["acc_cla"]};' + ('font-style:italic;' if t['em_it'] else 'font-style:normal;')
    return FONTS + f'''
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#777;display:flex;flex-wrap:wrap;gap:40px;padding:40px;width:1200px}}
.ab{{position:relative;overflow:hidden;width:1080px;height:1920px;flex:none}}
.osc{{background:{t["osc"]};color:{t["txt_osc"]}}}
.cla{{background:{t["cla"]};color:{t["txt_cla"]}}}
.in{{position:absolute;left:80px;right:80px;top:272px;bottom:320px;display:flex;flex-direction:column}}
.lg{{height:{t["logo_h"]}px;width:auto;align-self:flex-start}}
.body{{flex:1;display:flex;flex-direction:column;justify-content:center;gap:44px;padding-bottom:40px}}
.t{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:{t["tsz"]}px;line-height:1.08;letter-spacing:{t["tls"]};text-transform:{t["tcase"]};text-wrap:balance}}
.osc em{{{em_osc}}} .cla em{{{em_cla}}}
.rule{{width:120px;height:4px;background:{t["linea"]};border-radius:2px}}
.p{{font-family:{t["bf"]};font-weight:{t["bw"]};font-size:50px;line-height:1.36;text-wrap:pretty}}
.osc .p{{color:{t["sub_osc"]}}} .cla .p{{color:{t["sub_cla"]}}}
.f{{font-family:{t["bf"]};font-size:30px;opacity:.75}}
.li{{display:flex;flex-direction:column;gap:22px}}
.it{{display:flex;gap:28px;align-items:flex-start;padding:30px 34px;border-radius:28px;background:{t["card"]};border:2px solid {t["card_borde"]}}}
.kocos .it{{color:#1B1B1B}}
.n{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:64px;line-height:1;min-width:56px;color:{t["acc_osc"] if m!="coberturas" else "#235347"}}}
.vita .n{{font-style:italic}}
.kocos .n{{color:#FC6E20}}
.dot{{width:18px;height:18px;border-radius:50%;background:{t["acc_osc"] if m!="coberturas" else "#235347"};margin-top:20px;flex:none}}
.it span{{font-family:{t["bf"]};font-weight:600;font-size:46px;line-height:1.3}}
.q{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:{int(t["tsz"]*0.78)}px;line-height:1.2;{"font-style:italic;" if m=="vita" else ""}text-transform:{t["tcase"]};text-decoration:line-through;text-decoration-color:{t["acc_osc"] if m!="coberturas" else "#235347"};text-decoration-thickness:6px;opacity:.9;text-wrap:balance}}
.v{{font-family:{t["tf"]};font-weight:{t["tw"]};font-size:{int(t["tsz"]*1.25)}px;line-height:1;color:{t["acc_osc"] if m!="coberturas" else "#235347"};{"font-style:italic;" if m=="vita" else ""}text-transform:{t["tcase"]}}}
.ad{{display:flex;flex-direction:column;gap:24px}}
.adc{{border-radius:28px;padding:34px 38px;display:flex;flex-direction:column;gap:14px}}
.adc b{{font-family:{t["bf"]};font-weight:700;font-size:32px}}
.adc span{{font-family:{t["bf"]};font-weight:500;font-size:42px;line-height:1.32}}
.antes{{background:#323232;color:rgba(255,231,208,.8)}} .antes span{{text-decoration:line-through;text-decoration-color:#FC6E20;text-decoration-thickness:4px}}
.despues{{background:#FFE7D0;color:#1B1B1B;border:4px solid #FC6E20}}
.slot{{border:5px dashed #FF3B6B;border-radius:24px;height:150px;width:600px;display:flex;align-items:center;justify-content:center;font:600 30px Manrope;color:#FF3B6B;background:rgba(255,59,107,.08);text-align:center;padding:0 20px}}
.clean .slot{{visibility:hidden}}
/* Portadas de destacadas */
.cv{{background:{t["osc_plano"]}}}
.ring{{position:absolute;left:100px;top:520px;width:880px;height:880px;border-radius:50%;border:16px solid {t["anillo"]};opacity:.9}}
.ic{{position:absolute;left:310px;top:730px;width:460px;height:460px}}
.ic svg{{width:100%;height:100%}}
/* Portadas de reels */
.rlg{{position:absolute;left:50%;transform:translateX(-50%);top:300px;height:{int(t["logo_h"]*1.25)}px}}
.rt{{position:absolute;left:110px;right:140px;top:420px;height:1080px;display:flex;align-items:center;justify-content:center;text-align:center}}
.rt .t{{font-size:{int(t["tsz"]*1.36)}px}}
.rline{{position:absolute;left:50%;transform:translateX(-50%);top:1440px;width:140px;height:5px;border-radius:3px;background:{t["linea"]}}}
.g{{position:absolute;border:5px dashed #FF3B6B;display:flex;align-items:flex-start;justify-content:flex-end;padding:14px 20px;font:700 30px Manrope;color:#FF3B6B;height:auto;width:auto;border-radius:0;background:none}}
.g34{{left:0;right:0;top:240px;bottom:240px}}
.g11{{left:0;right:0;top:420px;bottom:420px;border-color:#00C2FF;color:#00C2FF}}
.gui{{left:940px;right:0;top:1100px;bottom:0;border-color:#FFB800;color:#FFB800;align-items:flex-end;justify-content:center;writing-mode:vertical-rl}}
'''

def historia(m, h, osc=True):
    t = T[m]
    logo = f'<img class="lg" src="logos/{MARCAS[m]["logo"]}">'
    cuerpo = ''
    tipo = h['tipo']
    if tipo == 'texto':
        cuerpo = f'<div class="rule"></div><div class="t">{fmt(h["titulo"])}</div><div class="p">{fmt(h["texto"])}</div>'
        if h.get('fuente'): cuerpo += f'<div class="f">{fmt(h["fuente"])}</div>'
    elif tipo == 'lista':
        items = ''.join(f'<div class="it">{f"<div class=n>{i+1}</div>" if h.get("num") else "<div class=dot></div>"}<span>{fmt(x)}</span></div>' for i, x in enumerate(h['items']))
        cuerpo = f'<div class="t">{fmt(h["titulo"])}</div><div class="li">{items}</div>'
    elif tipo == 'mito':
        cuerpo = f'<div class="q">«{fmt(h["cita"])}»</div><div class="v">{fmt(h["veredicto"])}</div><div class="p">{fmt(h["texto"])}</div>'
    elif tipo == 'ad':
        cuerpo = f'<div class="t">{fmt(h["titulo"])}</div><div class="ad"><div class="adc antes"><b>Antes</b><span>{fmt(h["antes"])}</span></div><div class="adc despues"><b>Después</b><span>{fmt(h["despues"])}</span></div></div><div class="f">Ejemplo ilustrativo.</div>'
    if h.get('slot'):
        cuerpo += '<div class="slot">Acá va el sticker de enlace a WhatsApp</div>'
    return logo, cuerpo

def piezas(m):
    t = T[m]; M = MARCAS[m]; out = []
    fondo_plano = t['osc_plano']
    for i, d in enumerate(M['destacadas'], 1):
        base = f'd{i:02d}-{d["slug"]}'
        out.append(f'<div class="ab cv" id="{base}-portada" data-formato="historia"><div class="ring"></div><div class="ic">{icono(d["icono"], t["icono"], fondo_plano)}</div></div>')
        for j, h in enumerate(d['historias'], 1):
            # Coberturas: historias claras (menta); el resto, oscuras.
            clase = 'cla' if m == 'coberturas' else 'osc'
            logo, cuerpo = historia(m, h)
            out.append(f'<div class="ab {clase} {m}" id="{base}-historia-{j}" data-formato="historia"><div class="in">{logo}<div class="body">{cuerpo}</div></div></div>')
    # Plantilla y portadas de reels
    out.append(f'<div class="ab osc {m}" id="r00-plantilla" data-formato="reel"><img class="rlg" src="logos/{M["logo"]}"><div class="rt"><div class="t">Tu título va acá, en *dos o tres líneas*</div></div><div class="rline"></div>'
               '<div class="slot g g34">Grilla del perfil 3:4</div><div class="slot g g11">Centro 1:1</div><div class="slot g gui">Botones del reel</div></div>'.replace('*dos o tres líneas*', '<em>dos o tres líneas</em>'))
    for k, titulo in enumerate(M['reels'], 1):
        clase = 'osc' if k % 2 == 1 else 'cla'
        out.append(f'<div class="ab {clase} {m}" id="r{k:02d}" data-formato="reel"><img class="rlg" src="logos/{M["logo"]}"><div class="rt"><div class="t">{fmt(titulo)}</div></div><div class="rline"></div></div>')
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{css(m)}</style></head><body>{"".join(out)}</body></html>'

def maqueta(m, dir_piezas):
    t = T[m]; M = MARCAS[m]
    bio = html.escape(M['bios'][0]).replace('\n', '<br>')
    dest = ''.join(f'<div class="hl"><div class="hc" style="background-image:url({dir_piezas}/d{i:02d}-{d["slug"]}-portada.png)"></div><div class="hn">{html.escape(d["nombre"])}</div></div>' for i, d in enumerate(M['destacadas'], 1))
    grid = ''.join(f'<div class="tile" style="background-image:url({dir_piezas}/r{k:02d}.png)"></div>' for k in range(1, 10))
    avatar_bg = t['osc_plano']
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{FONTS}
*{{box-sizing:border-box;margin:0;padding:0}} body{{background:#777;padding:40px;width:1200px}}
.ab{{position:relative;width:1080px;background:#fff;color:#111;font-family:Manrope;overflow:hidden}}
.top{{padding:56px 48px 0;display:flex;align-items:center;gap:40px}}
.av{{width:220px;height:220px;border-radius:50%;background:{avatar_bg};display:flex;align-items:center;justify-content:center;flex:none;border:6px solid #fff;box-shadow:0 0 0 3px #ddd}}
.av img{{max-width:62%;max-height:62%}}
.user{{font-weight:700;font-size:44px}}
.cat{{font-size:32px;color:#737373;margin-top:8px}}
.txt{{padding:28px 48px 0;font-size:34px;line-height:1.4}}
.txt b{{font-size:36px}}
.link{{color:#00376B;font-weight:600;font-size:32px;margin-top:6px}}
.btns{{display:flex;gap:16px;padding:32px 48px 0}}
.btn{{flex:1;background:#EFEFEF;border-radius:20px;text-align:center;font-weight:700;font-size:32px;padding:22px 0}}
.btn.pri{{background:#0095F6;color:#fff}}
.hls{{display:flex;gap:26px;padding:44px 48px 36px;overflow:hidden}}
.hl{{display:flex;flex-direction:column;align-items:center;gap:14px;width:144px;flex:none}}
.hc{{width:144px;height:144px;border-radius:50%;background-size:144px auto;background-position:center;border:5px solid #fff;box-shadow:0 0 0 3px #DBDBDB}}
.hn{{font-size:26px;white-space:nowrap}}
.tabs{{border-top:2px solid #DBDBDB;height:12px}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}}
.tile{{aspect-ratio:3/4;background-size:100% auto;background-position:center}}
.nota{{font-size:30px;color:#737373;padding:28px 48px 40px}}
</style></head><body>
<div class="ab" id="perfil-maqueta">
<div class="top"><div class="av"><img src="logos/{M["logo"]}"></div><div><div class="user">{M["usuario"]}</div><div class="cat">{html.escape(M["categoria"].split(" (")[0])}</div></div></div>
<div class="txt"><b>{html.escape(M["nombre_ig"])}</b><br>{bio}<div class="link">{M["dominio"].replace("www.","")}</div></div>
<div class="btns"><div class="btn pri">Seguir</div><div class="btn">Mensaje</div><div class="btn">WhatsApp</div></div>
<div class="hls">{dest}</div><div class="tabs"></div><div class="grid">{grid}</div>
<div class="nota">Maqueta ilustrativa del perfil con la bio, las destacadas y la grilla propuestas. La interfaz real de Instagram puede variar.</div>
</div></body></html>'''

if __name__ == '__main__':
    modo = sys.argv[1]
    for m in MARCAS:
        if modo == 'piezas':
            open(f'{m}-piezas.html', 'w').write(piezas(m))
        else:
            open(f'{m}-maqueta.html', 'w').write(maqueta(m, f'out/{m}'))
