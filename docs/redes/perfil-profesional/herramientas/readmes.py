import re
from datos import MARCAS
D='/home/user/LEGAL-CRM/docs/redes/perfil-profesional'
def plano(s): return re.sub(r'\*(.+?)\*', r'\1', s)
for m,M in MARCAS.items():
    L=[f"# {M['nombre']} · perfil profesional (@{M['usuario']})\n",
       "Kit listo para cargar a mano o con Claude in Chrome. **No se publicó ni se cambió nada.** Guía general: [`../README.md`](../README.md).\n",
       "![Maqueta del perfil](perfil-maqueta.png)\n",
       "## 1. Datos del perfil de Instagram\n",
       f"- **Nombre** (campo «Nombre», se busca en Instagram): `{M['nombre_ig']}` ({len(M['nombre_ig'])} caracteres; máximo 64).",
       f"- **Categoría:** {M['categoria']} (o la más parecida que ofrezca la app).",
       "- **Bio** (máximo 150 caracteres). Elegí una:\n"]
    for i,b in enumerate(M['bios']):
        L.append(f"**Variante {'AB'[i]}** ({len(b)} caracteres):\n\n```text\n{b}\n```\n")
    camp=M['campana']; dom=M['dominio']
    L+=["## 2. Enlaces con UTM\n",
        "Los enlaces dicen de qué red y de qué pieza viene cada visita. Las landings todavía no guardan estas etiquetas: sirven en cuanto se instale GA4 o la medición pendiente.\n",
        f"- **Bio de Instagram:** `https://{dom}/?utm_source=instagram&utm_medium=bio&utm_campaign={camp}`",
        f"- **Página de Facebook (sitio web):** `https://{dom}/?utm_source=facebook&utm_medium=perfil&utm_campaign={camp}`",
        f"- **Sticker de enlace en historias:** `https://{dom}/?utm_source=instagram&utm_medium=historia&utm_campaign={camp}&utm_content=destacada-<nombre>`",
        "- **Segundo enlace de la bio, directo a WhatsApp** (Instagram admite hasta 5 enlaces): `https://wa.me/<número de WhatsApp de la marca, sin + ni espacios>?text=Hola%2C%20vengo%20de%20Instagram%20(ref%3A%20IG-BIO)`. El número es el de la landing y de `marcas.md`; no va escrito en ninguna imagen.\n",
        "## 3. Página de Facebook\n",
        "- **Presentación** (máximo 101 caracteres). Elegí una:"]
    for i,t in enumerate(M['fb_intro']): L.append(f"  - {'AB'[i]} ({len(t)}): {t}")
    L.append("- **Descripción larga** (Información › Detalles). Elegí una:")
    for i,t in enumerate(M['fb_desc']): L.append(f"  - {'AB'[i]}: {t}")
    L+=["- **Botón de acción:** «Enviar mensaje de WhatsApp», con el número de la marca. Pasos en la guía general.",
        f"- **Sitio web:** el enlace de Facebook del punto 2.\n",
        "## 4. Destacadas, en orden de recorrido\n",
        "Todas las imágenes son de 1080 × 1920. Las que tienen versión `-guia` muestran en rosa dónde va el sticker de enlace: se publica la versión **sin** `-guia` y se pone el sticker encima de ese espacio.\n",
        "| # | Destacada | Portada | Historias |","|---|---|---|---|"]
    for i,d in enumerate(M['destacadas'],1):
        hs=', '.join(f"`{i:02d}-{d['slug']}-historia-{j}.png`" for j in range(1,len(d['historias'])+1))
        L.append(f"| {i} | {d['nombre']} ({len(d['nombre'])}) | `{i:02d}-{d['slug']}-portada.png` | {hs} |")
    L.append("\nTextos de cada historia (para revisar antes de publicar):\n")
    for i,d in enumerate(M['destacadas'],1):
        L.append(f"**{i}. {d['nombre']}**\n")
        for j,h in enumerate(d['historias'],1):
            t=h['tipo']
            if t=='texto': s=f"{plano(h['titulo'])} — {plano(h['texto'])}"+(f" ({h['fuente']})" if h.get('fuente') else '')
            elif t=='lista': s=f"{plano(h['titulo'])}: "+'; '.join(plano(x) for x in h['items'])
            elif t=='mito': s=f"«{h['cita']}» {h['veredicto']} {h['texto']}"
            else: s=f"{plano(h['titulo'])}: antes «{h['antes']}» / después «{h['despues']}» (ejemplo ilustrativo)"
            if h.get('slot'): s+=' · lleva sticker de enlace a WhatsApp'
            L.append(f"{j}. {s}")
        L.append("")
    L+=["## 5. Portadas de reels y grilla\n",
        "- `portadas-reels/plantilla-guia.png`: dónde va cada cosa. Rosa: lo que se ve en la grilla del perfil (3:4, de y = 240 a y = 1680). Celeste: el centro 1:1, que es lo que ven otras vistas. Amarillo: los botones del reel, donde no va nada importante.",
        "- `portadas-reels/01.png` a `09.png`: portadas de muestra con los temas que mejor rindieron y las series. Sirven como portada propia del reel (se cargan en «Editar portada › Agregar desde la galería»).",
        "- **Regla de la grilla:** se alternan portada oscura y clara (impares oscuras, pares claras), con el logo arriba al centro y el título en el centro. Así la grilla queda en damero, como en la maqueta.\n",
        "## 6. Revisión pendiente\n"]
    if m in ('vita','coberturas'):
        L.append("- Las afirmaciones jurídicas o de coberturas reutilizan textos que la responsable aprobó el 10/11, **sin revisión profesional**. La regla del proyecto pide revisión profesional o aprobación expresa antes de publicar.")
    if m=='vita':
        L.append("- Laboral (despidos e indemnizaciones) y penal se sumaron el 20/11 por dato de la responsable, en términos generales. No hay todavía destacada propia de laboral ni de penal: se puede sumar cuando haya piezas revisadas.")
    if m=='autos':
        L.append("- Nombre: las piezas dicen «Automotores Kocos»; la landing dice «Agencia Kocos». Sigue abierta la contradicción de `marcas.md`.")
    if m=='kocos':
        L.append("- El dato de velocidad web lleva su fuente (Think with Google, 2017). Los antes y después son ejemplos ilustrativos, no clientes.")
    L.append("- No se vio en una pantalla real: color en el teléfono y cómo recorta Instagram la portada de cada destacada (se elige y se ajusta el círculo al cargarla).\n")
    open(f'{D}/{m}/README.md','w').write('\n'.join(L))
print('ok')
