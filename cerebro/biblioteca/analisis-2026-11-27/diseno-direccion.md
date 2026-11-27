# Análisis del panel · diseno-direccion (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Brief de dirección de arte para el rediseño premium (punto 6), hecho con A1 Gallery en 8 llamadas. Lo medido: hero de software (184 secciones): título p25–p75 48–72 px, mediana 61; cuerpo 16–20, mediana 18; padding 55–160, mediana 104; contenedor 1065–1320, mediana 1216; radio 8–16, mediana 10. Features de finanzas (138 secciones): título 36–52, mediana 44; cuerpo 15–18, mediana 16; padding 49–112, mediana 80; contenedor 1100–1280, mediana 1200; radio 8–20, mediana 16. Bordes en 36–46% de las secciones, sombras en 16–34%, desenfoque de fondo (backdrop blur) solo en 9–15%: los sitios sobrios separan con bordes finos y no con sombras ni vidrio. Inter y Geist son las familias de título más usadas (Inter 12 y Geist 7 de 184 hero, Inter 14 de 138 features) y se emparejan entre sí en 15 sitios. Los fondos oscuros medidos son casi negros neutros o apenas teñidos: #0a0a0a, #100f15, #101211, #0b0a09, #101010; superficie 1 un paso más claro (#141414, #171918, #181818); texto secundario #a7a7a7–#b2afca. Límites de la evidencia: los 4 ejemplos de bento oscuro y los ~8 de hero oscuro son selecciones por búsqueda, no una norma; los hero oscuros con 3D de A1 son pocos (3 coincidencias amplias en 3D oscuro y 1 con brillo y gradientes) y por eso las ideas 3D vienen de esas muestras más criterio técnico propio, no de números. Linear está en A1 pero sin secciones capturadas (solo Inter, oscuro, azul oscuro/violeta). Vercel, Raycast, Arc y Stripe no se consultaron en A1: las menciono como referencia conocida y no tienen valores medidos acá. Las duraciones de animación y las sombras son recomendación mía, A1 no las mide. Las dos direcciones usan los neutros medidos como base y el acento más tenue de cada una.

## Hallazgos

### 1. Dirección A «Grafito Nocturno»: neutro frío, sobrio tipo Linear/Vercel

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6. Rediseño premium, colores suaves, animaciones sobrias
- **Cómo está hoy:** Propuesta nueva. Hoy el panel mezcla tipografías y colores sin sistema (punto 6 del dueño). Esta dirección se apoya en los neutros oscuros medidos en A1: #0a0a0a/#141414 (Dovetail, borde sí, sombra no), #101211/#171918 (Torch), #1a1a1a (Paraform).
- **Por qué:** El aspecto «de colegio» sale de fondos con saturación, bordes inconsistentes y acentos intensos. Los sitios premium medidos usan 1 fondo casi negro, 1–2 superficies apenas más claras, texto en gris claro y un solo acento de bajo peso (el acento ocupa 0–3% de la paleta medida).
- **Evidencia:** A1: analyze_design_tokens hero software (184 secciones) y features finanzas (138); secciones Dovetail, Torch, Paraform, Huddlekit, Talent Solutions. Duraciones, sombras y tintes de marca son recomendación mía, no medidos.
- **Riesgo:** Los 4 tintes de marca deben contrastarse con los logos y colores actuales de cada marca (no los revisé en el código). Si un logo tiene su color propio muy distinto, hay que ajustar el tinte o el logo, no los dos a ciegas.
- **Pasos:**
  1. PALETA (hex y rol). Fondo app #0B0C0E. Superficie 1 (tarjetas, panel) #121418. Superficie 2 (hover, inputs) #181B20. Superficie 3 (menús, modales) #1F2329. Borde fino rgba(255,255,255,0.07) y borde fuerte rgba(255,255,255,0.12). Texto principal #ECEEF1. Texto secundario #9AA1AB. Texto terciario/deshabilitado #626872. Acento único (acciones y foco) #8FA3C7 azul pizarra apagado; relleno de botón primario #E8EAEE con texto #0B0C0E (botón claro sobre fondo oscuro, como Peerscale y Metaview).
  2. TINTES DE MARCA APAGADOS (solo para punto, borde superior de tarjeta, brillo suave del perfil; nunca fondo lleno). Jurídico #8B7FB0 ciruela grisácea. Coberturas médicas #6FA8A0 verde agua apagado. Autos 0 km #B08E6A bronce apagado. Marketing #B0788A rosa polvo apagado. Cada uno al 12–18% de opacidad como halo y 100% solo en un detalle de 6–8 px.
  3. ESTADOS: éxito #7FB08F, aviso #C9A86A, error #C97B7B, todos desaturados y usados como texto o punto, no como relleno.
  4. TIPOGRAFÍA (Google Fonts): títulos Geist 500–600, cuerpo Geist 400, números y datos Geist Mono 400 con font-variant-numeric tabular-nums. Geist e Inter se emparejan en 15 sitios de A1. Un solo par en todo el panel; quitar cualquier otra familia.
  5. ESCALA (px / interlineado / tracking): display de ingreso 48/1.1/-0.03em (A1 hero p25=48, mediana=61, usamos el piso porque es panel interno); H1 de pantalla 32/1.15/-0.025em; H2 22/1.25/-0.015em; H3 17/1.35; cuerpo 15/1.5 (features finanzas: mediana 16, p25–p75 15–18); pequeño 13/1.45; etiqueta 11/1.3 con 0.06em en mayúsculas y color terciario. Pesos: 400 y 500; 600 solo en display.
  6. RADIOS: 8 en inputs y botones, 14 en tarjetas (mediana medida de features en finanzas 16, p25–p75 8–20), 20 en tarjetas de perfil grandes, 999 en chips. Un solo radio por nivel, sin mezclar.
  7. SOMBRAS: casi ninguna. Tarjeta: sin sombra, borde 1px de la paleta. Menús y modales: 0 12px 32px rgba(0,0,0,0.45). Foco: anillo 0 0 0 2px #0B0C0E, 0 0 0 4px rgba(143,163,199,0.55). Línea de luz superior en tarjetas: inset 0 1px 0 rgba(255,255,255,0.04).
  8. ESPACIADO: base 4 px; paso 4/8/12/16/24/32/48/72. Padding de tarjeta 20–24. Separación entre tarjetas 16. Padding de sección de página 48 arriba y abajo (A1 p25 de features finanzas=48, mediana 80; en panel interno conviene el piso). Contenedor máximo 1200 (A1 mediana 1200, p25–p75 1100–1280). Barra lateral 232.
  9. ANIMACIÓN: entradas 240–320 ms con cubic-bezier(0.22, 1, 0.36, 1), desplazamiento máximo 8 px y opacidad; hover 140 ms (borde sube de 0.07 a 0.14, fondo pasa a superficie 2, sin escalar más de 1.01); cascada de tarjetas 40 ms entre cada una, máximo 6; números que cuentan 600 ms; nada de rebotes, destellos ni bucles infinitos fuera de la entrada. Todo bajo prefers-reduced-motion: reduce pasa a fundido de 120 ms.
  10. CRITERIO DE CALIDAD: máximo 1 acento visible por pantalla, 2 niveles de borde, 3 niveles de superficie, 2 pesos tipográficos. Si una pantalla supera eso, se simplifica.

### 2. Dirección B «Tinta y Marfil»: oscuro cálido, más editorial y «caro»

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6. Rediseño premium, colores suaves
- **Cómo está hoy:** Propuesta nueva. Se apoya en fondos cálidos medidos: #0b0a09 (Giga), #101010 con texto marfil #f4f1eb (Hebbia), #110000 con texto #fdfbee (Eat Real Food), #0e0e0e con texto #f7f6f0 (Harsh Shah).
- **Por qué:** Un oscuro con temperatura cálida y texto marfil, en vez de blanco puro, se lee más lujoso y baja el cansancio visual. Es lo que hacen los sitios de finanzas y estudios medidos con fondo #101010 y texto crema.
- **Evidencia:** A1: fondos y textos medidos en Giga, Hebbia, Talent Solutions, Eat Real Food, Harsh Shah; radios 6 y 12 medidos. Manrope viene de Talent Solutions (heading 56 px). Resto es recomendación.
- **Riesgo:** Con fondo cálido, los tintes de marca pierden contraste entre sí (cobre y terracota se parecen). Probar las 4 tarjetas juntas antes de aprobar.
- **Pasos:**
  1. PALETA. Fondo app #0E0D0C. Superficie 1 #151412. Superficie 2 #1C1A17. Superficie 3 #25221E. Borde rgba(244,241,235,0.08) y fuerte rgba(244,241,235,0.14). Texto principal #F1EDE6 marfil. Texto secundario #A8A298. Terciario #6E695F. Acento único #C8B38A arena/oro apagado (solo foco, enlace activo, línea fina bajo el título); botón primario relleno #F1EDE6 con texto #0E0D0C.
  2. TINTES DE MARCA APAGADOS. Jurídico #8E7C9E malva. Coberturas médicas #7BA39A salvia. Autos 0 km #A8896A cobre. Marketing #A87F7A terracota rosada. Misma regla: halo al 12–18% y un detalle de 6–8 px sólido.
  3. TIPOGRAFÍA (Google Fonts): títulos Manrope 500 (medido en Talent Solutions a 56 px, tracking -0.02em, interlineado 1.2) y cuerpo Inter 400. Sin serif itálica. Datos en Inter con tabular-nums.
  4. ESCALA: display 52/1.15/-0.02em; H1 30/1.2/-0.02em; H2 21/1.3/-0.01em; H3 16/1.4; cuerpo 15/1.55; pequeño 13/1.5; etiqueta 11 en mayúsculas 0.08em.
  5. RADIOS: 6 en inputs y botones (Hebbia mide 6), 12 en tarjetas (Talent Solutions mide 12), 18 en tarjetas de perfil. Más recto que la dirección A, aspecto de papelería fina.
  6. SOMBRAS: igual que A pero con negro cálido rgba(10,8,6,0.5); borde interior superior rgba(255,248,235,0.05).
  7. ESPACIADO: base 4 px, tarjeta 24, separación 20 (Torch mide gap 20, Paraform 20), contenedor 1200, padding de sección 56.
  8. ANIMACIÓN: igual que A pero 280–360 ms, un poco más lenta y sin escala en hover (solo borde y fondo), para dar sensación de calma.
  9. CUÁNDO ELEGIRLA: si el dueño quiere que se sienta «estudio de lujo» y no «herramienta técnica». Riesgo: el acento arena puede chocar con la marca Autos 0 km (bronce/cobre) y habría que bajar ese tinte.

### 3. Sitios de referencia (qué copiar de cada uno)

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 6. Referencias de diseño
- **Cómo está hoy:** Lista de 8 referencias. Las marcadas con (A1) están en la galería y las vi con valores medidos; las marcadas (conocida) las cito por conocimiento general del producto, no las consulté ni medí en A1.
- **Por qué:** Hace falta ejemplos reales para que el equipo de implementación no invente: cada referencia aporta una sola cosa concreta.
- **Evidencia:** A1 search_sections (hero oscuro, features bento oscuro), search_websites (3d), get_website Linear. Los nombres de producto no medidos están indicados como «conocida».
- **Riesgo:** Mirá las páginas públicas antes de copiar: son landings de marketing, no paneles. Se copia el sistema visual, no el layout.
- **Pasos:**
  1. Linear https://linear.app/ (A1: Inter, oscuro, azul oscuro/violeta; sin secciones capturadas, no hay números). Copiar: jerarquía con muy poco color, bordes finos, atajos de teclado visibles y densidad de lista limpia para Chats y Captados.
  2. Dovetail https://dovetail.com (A1, slug dovetail-2025). Medido: fondo #0a0a0a, superficie #141414, texto #ffffff y #a7a7a7, radio 8, borde sí, sombra no, contenedor 1152. Copiar: la receta exacta de superficie y borde para tarjetas de perfil.
  3. Torch https://torch.com (A1, slug torch). Medido: fondo #101211, superficie #171918, texto #dbdbdb, radio 20, gap 20, padding 128, Switzer 56 px peso 500. Copiar: tarjetas bento en 2 columnas con ícono de línea fino arriba y título 22/24 abajo.
  4. Paraform https://www.paraform.com (A1). Medido: fondo #1a1a1a, tarjetas radio 10, gap 20, título 22 px peso 500, cuerpo 16 px. Copiar: bento de 4 tarjetas con alturas desiguales y una imagen suave en una de ellas.
  5. Talent Solutions (A1, slug talent-solutions). Medido: fondo #100f15, texto #b2afca y #f6f6f9, acento #8784ac, Manrope 56/400, tracking -0.02em, un arco de luz violeta/azul desenfocado detrás de una forma. Copiar: la entrada con título fino y un único objeto luminoso; es el referente más cercano al efecto «wow» sobrio.
  6. Metaview https://www.metaview.ai (A1). Medido: fondo #0a1a14, título 36 px peso 500, tracking -0.03em, una esfera de gradiente fluido verde-azul con botón blanco encima. Copiar: la idea de un objeto orgánico que se mueve lento como único protagonista.
  7. Phantom Studios https://www.phantom.land/ (A1: 3d, interactivo, oscuro, sans y monoespaciada) y Deeo Studio https://deeo.studio (A1: 3d, interactivo). Copiar: cómo reacciona el 3D al cursor y las transiciones entre estados. Son sitios de agencia: tomar el movimiento, no el volumen de efectos.
  8. Raycast, Vercel, Stripe, Arc (conocida, no verificadas en A1). Copiar: Raycast, brillo tenue en bordes al pasar el mouse; Vercel, tipografía Geist y tablas muy limpias; Stripe, degradados suaves como acento detrás de números; Arc, selector de espacios con color por espacio (útil para el selector de perfil).

### 4. Entrada 3D, idea 1: «Orbe de luz» (esfera de gradiente líquido que sigue al mouse)

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6. Efecto 3D «wow» en la entrada en lugar de la lámpara
- **Cómo está hoy:** Reemplaza la lámpara actual. Referencia en A1: Metaview (esfera fluida verde-azul centrada bajo el título) y Talent Solutions (arco de luz).
- **Por qué:** Un único objeto luminoso lento, sobre fondo casi negro, da el efecto «caro» sin el recargo de una escena.
- **Evidencia:** A1: Metaview (heading 36/500, fondo #0a1a14, gradient true), Talent Solutions (fondo #100f15, 56 px, gradient true). Peso y rendimiento son estimaciones técnicas mías.
- **Riesgo:** Un shader mal limitado puede subir el consumo de batería en el celular. Limitar pixel ratio y pausar fuera de foco.
- **Pasos:**
  1. QUÉ SE VE: fondo #0B0C0E, una esfera de unos 360 px con shader de ruido (gradiente fluido en tonos pizarra, y un halo muy leve de los 4 tintes de marca en órbita lenta), título «Ingresá» 48/500 debajo y el campo de código. Sin otros elementos.
  2. QUÉ SE MUEVE: el ruido del shader avanza muy lento (ciclo de 20–30 s); la esfera respira 2% de escala cada 8 s. Al enviar el código, la esfera se expande 600 ms y se funde al panel.
  3. RESPUESTA AL MOUSE: la esfera se inclina hasta 6° y el punto de luz sigue al cursor con inercia (lerp 0.06). En táctil, sigue el giroscopio solo si el usuario lo permitió; si no, queda quieta.
  4. TECNOLOGÍA Y PESO: un solo canvas WebGL con un plano y un fragment shader, sin three.js (OGL o WebGL a mano, 6–10 KB gzip) o three.js importado dinámico solo en esta ruta (~150 KB gzip). Cargar con dynamic import para no tocar el resto del panel. Frame objetivo 60 fps con pixel ratio máximo 1.5.
  5. RESPALDO SIN WEBGL: imagen WebP/AVIF del mismo orbe de ~25 KB como fondo y un CSS radial-gradient animado con 2 capas desfasadas (animación de 24 s). Detectar con canvas.getContext('webgl2') y con el evento webglcontextlost.
  6. REDUCIR MOVIMIENTO: si prefers-reduced-motion: reduce, se muestra el cuadro estático (sin avance del shader, sin inclinación por mouse) y la transición al panel pasa a un fundido de 150 ms.
  7. RENDIMIENTO: pausar con IntersectionObserver y con document.visibilitychange; no renderizar si la pestaña está oculta. Prueba objetivo: INP bajo 200 ms en un celular de gama media (cifra a medir con Lighthouse, no la medí).

### 5. Entrada 3D, idea 2: «Llave y cerradura» (un cristal facetado que se abre al ingresar el código)

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 6. Efecto 3D «wow» en la entrada
- **Cómo está hoy:** Alternativa más conceptual y sobria. Referencia lejana en A1: Talent Solutions (forma abstracta con arco de luz). No hay un equivalente medido exacto en la galería.
- **Por qué:** Une el 3D con la acción real de la pantalla (entrar con código): da sentido al movimiento y no queda decorativo.
- **Evidencia:** Sin medición directa en A1 para este objeto; la parte medida es la paleta y el tipo de Talent Solutions. El peso se basa en el tamaño habitual de three.js, no lo medí en este proyecto.
- **Riesgo:** MeshPhysicalMaterial con transmission pesa en celulares de gama baja; por eso va con falso vidrio y respaldo CSS. Es la idea más cara de construir.
- **Pasos:**
  1. QUÉ SE VE: un monolito de cristal oscuro (prisma de 4 caras, material de vidrio esmerilado) flotando centrado, con borde de luz fino de color arena/azul pizarra, sobre #0B0C0E con viñeta. Título 48 px a la izquierda o abajo.
  2. QUÉ SE MUEVE: rotación lenta de 0.05 rad/s sobre el eje vertical y flotación de 6 px. Al teclear cada dígito del código, una de las 6 aristas se enciende (confirmación visual). Al validar, el prisma se abre por una cara y deja pasar un haz de luz hacia el panel (900 ms).
  3. RESPUESTA AL MOUSE: paralaje de 8° en x e y; el reflejo de borde sigue el cursor. Error de código: temblor de 8 px y 2 ciclos en 300 ms, sin rojo estridente (borde #C97B7B).
  4. TECNOLOGÍA Y PESO: three.js con un solo mesh, MeshPhysicalMaterial con transmission (puede ser costoso) o un falso vidrio con envmap de 128×128. Modelo procedural, sin archivo .glb. Aproximadamente 170 KB gzip con three, más 20 KB de código propio, importado dinámico solo en esta ruta. Alternativa más liviana: renderizar el prisma con CSS 3D (transform-style: preserve-3d), 0 KB extra, con menos realismo.
  5. RESPALDO SIN WEBGL: versión CSS 3D del prisma (6 caras con borde y backdrop-filter limitado) o, si tampoco hay backdrop-filter, una ilustración SVG estática del prisma de unos 6 KB.
  6. REDUCIR MOVIMIENTO: prisma quieto, aristas que se iluminan con fundido de 120 ms (sin rotación, sin temblor, sin haz); el error se muestra solo con texto y borde.
  7. ACCESIBILIDAD: el campo de código conserva etiqueta, orden de foco y aria-live para el error; el 3D es aria-hidden.

### 6. Entrada 3D, idea 3: «Campo de partículas con relieve» (cuadrícula de puntos que se ondula con el cursor, liviana)

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 6. Efecto 3D en la entrada
- **Cómo está hoy:** Alternativa de menor riesgo técnico. Referencia en A1: Phantom Studios y Invertase (3d, patrón, brillo, degradados desenfocados).
- **Por qué:** Es la opción más ligera y robusta: no depende de shaders complejos ni de materiales, y se degrada bien.
- **Evidencia:** A1: Phantom Studios (interactivo, 3d, oscuro), Invertase (3d, pattern, glow). Peso y puntos son estimaciones técnicas mías.
- **Riesgo:** Cuadrículas de puntos son un recurso muy visto; hay que cuidar color y ritmo para que no parezca plantilla.
- **Pasos:**
  1. QUÉ SE VE: cuadrícula de puntos finos (unos 60×34) en perspectiva, grises #2A2E35, con un resplandor tenue arriba en el color de la marca activa (o pizarra por defecto). Título 48/500 y campo de código en una tarjeta con borde fino de superficie 1.
  2. QUÉ SE MUEVE: una onda lenta recorre la cuadrícula (amplitud 6 px, período 12 s). Cerca del cursor, los puntos se elevan y se aclaran hasta #8FA3C7.
  3. RESPUESTA AL MOUSE: el campo reacciona con radio de 160 px y suavizado; en táctil, un toque emite una onda desde el punto. Al validar, la onda se expande y borra la grilla en 500 ms.
  4. TECNOLOGÍA Y PESO: canvas 2D (sin WebGL), 2–4 KB de código propio, 0 dependencias. Con 2000 puntos corre bien en un celular de gama media; si hace falta, bajar a 1000 en pantallas chicas.
  5. RESPALDO SIN WEBGL: no usa WebGL, así que el respaldo es solo el CSS: patrón de puntos radial-gradient estático con máscara suave.
  6. REDUCIR MOVIMIENTO: sin onda ni reacción al cursor; cuadrícula estática y resplandor fijo.
  7. POR QUÉ ELEGIRLA: menor riesgo de rendimiento y menos mantenimiento. Contra: menos «wow» volumétrico que las otras dos; se compensa con la transición de salida.

### 7. Pantalla de elección de perfil, idea 1: cuatro tarjetas bento con inclinación 3D y brillo de marca

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 6. Perfiles: tarjetas, logos, efecto 3D
- **Cómo está hoy:** Propuesta nueva para la pantalla de perfiles. Referencia en A1: bento oscuros de Paraform (gap 20, radio 10), Torch (radio 20, gap 20), Dovetail (superficie #141414 con borde) y Huddlekit.
- **Por qué:** Hoy las tarjetas tienen bordes mal hechos, logos que no coinciden y color raro (punto 6). Un molde único con la marca como único cambio elimina la inconsistencia.
- **Evidencia:** A1: Torch, Paraform, Dovetail, Huddlekit (medidos: gap 20 y radios 10–20, superficies #141414 a #181818). El tamaño exacto de tarjeta e inclinación son recomendación mía.
- **Riesgo:** La inclinación 3D con muchos elementos dentro puede verse borrosa en pantallas de baja densidad; mantener el texto fuera del plano inclinado o usar solo 3–5°.
- **Pasos:**
  1. QUÉ SE VE: cuatro tarjetas iguales en grilla 2×2 (en celular 1 columna), cada una 360×220, radio 20, superficie 1, borde 1px; arriba el logo ya normalizado en un recuadro de 56×56 (mismo tamaño, mismo padding, monocromo claro), debajo el nombre del rubro 22/500 y una línea de estado en gris (por ejemplo cantidad de chats sin leer, sin datos personales). El tinte de marca aparece como halo radial del 14% en la esquina superior y un punto de 8 px.
  2. QUÉ SE MUEVE: entrada en cascada de 40 ms entre tarjetas. Hover: la tarjeta se inclina hasta 5° siguiendo el cursor (transform perspective(900px) rotateX/rotateY), el halo se desplaza hacia el cursor y el borde sube a 0.14. Al elegir, la tarjeta se expande a pantalla completa en 450 ms y se convierte en el encabezado del perfil.
  3. MOUSE: inclinación y brillo solo con puntero fino. Teclado: flechas y Enter con el mismo estado de foco que hover más anillo de foco visible.
  4. TECNOLOGÍA Y PESO: CSS puro más 1.5 KB de JavaScript, sin librería. Cero peso extra relevante.
  5. RESPALDO: sin transform 3D, solo cambio de borde y fondo.
  6. REDUCIR MOVIMIENTO: sin inclinación ni expansión; hover cambia borde y fondo, el click navega con fundido de 120 ms.
  7. LOGOS: exportar los 4 logos a SVG monocromo con el mismo viewBox y área segura de 56×56; es lo que arregla «logos que no coinciden». No toca docs/redes.

### 8. Pantalla de elección de perfil, idea 2: «Selector de espacios» con carrusel de profundidad

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6. Efecto 3D en la pantalla de perfiles
- **Cómo está hoy:** Alternativa más espectacular. Referencia conocida: selector de espacios de Arc (no medida en A1); en A1 el tratamiento de objeto luminoso de Metaview y Talent Solutions.
- **Por qué:** Con 4 perfiles la pantalla es muy corta; un carrusel en profundidad da «wow» sin llenar de elementos.
- **Evidencia:** A1: Metaview y Talent Solutions para el resplandor de color y el objeto central; Arc y el valor de perspectiva son criterio mío, sin medición.
- **Riesgo:** Esconder 3 de 4 perfiles detrás del activo obliga a un click más para ver los demás. Si el dueño usa los 4 a diario, la idea 1 (todo visible) es más práctica.
- **Pasos:**
  1. QUÉ SE VE: cuatro paneles en perspectiva sobre un escenario oscuro; el activo al centro (400×460), los otros tres detrás y a los costados, más chicos (escala 0.86) y con menos brillo. Fondo con un resplandor suave del tinte del perfil activo que cambia al pasar.
  2. QUÉ SE MUEVE: flechas, arrastre o rueda cambian el panel activo con un desplazamiento de 420 ms (cubic-bezier 0.22,1,0.36,1); el resplandor de fondo se funde al nuevo tinte en 500 ms. Enter o click entra.
  3. MOUSE: leve paralaje de 6° en el panel activo; el resto no reacciona (para no marear).
  4. TECNOLOGÍA Y PESO: CSS 3D (perspective 1200px, translateZ y rotateY), 2 KB de JavaScript. Sin WebGL. Puede coexistir con la entrada del orbe, que es el único elemento WebGL del flujo.
  5. RESPALDO: sin 3D, lista vertical de 4 tarjetas planas (idea 1 sin inclinación).
  6. REDUCIR MOVIMIENTO: cambio instantáneo del panel activo con fundido de 120 ms, sin rotación ni escala.
  7. ACCESIBILIDAD: es un grupo de 4 botones con aria-current en el activo; orden de foco lineal; en celular se usa la lista vertical.

### 9. Qué evitar (lo que hace que se vea llamativo o «de colegio»)

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 6. Evitar lo llamativo y exorbitante
- **Cómo está hoy:** Criterios de descarte basados en lo medido y en la queja del dueño («llamativo, exorbitante, de colegio»).
- **Por qué:** El gusto del dueño pide sobriedad; la evidencia lo respalda: los sitios oscuros premium medidos usan 1 fondo casi negro, bordes finos y acento mínimo, no color saturado ni vidrio.
- **Evidencia:** A1: effectShare (hero software: borde 46%, sombra 34%, gradiente 31%, blur 15%; features finanzas: borde 36%, sombra 16%, gradiente 17%, blur 9%).
- **Riesgo:** Que se aplique el sistema solo en algunas pantallas y el panel quede mezclado. Conviene definir los valores como variables CSS (--bg, --surface-1, --accent, --radius-card) en un único archivo y borrar los colores sueltos.
- **Pasos:**
  1. No usar fondos con color de marca lleno ni degradados multicolor en tarjetas. El color de marca es un halo y un punto, no un bloque.
  2. No mezclar más de un par tipográfico ni más de 2 pesos por pantalla. Evitar serif itálica decorativa (pedido del brief) y las tipografías de display exóticas medidas en la galería (PP Mondwest, Feature Display, DenimInk): son de marketing y cansan en un panel de uso diario.
  3. No usar sombras grandes ni neón (A1: solo 16–34% de las secciones usan sombra; la mayoría usa borde). Nada de glow saturado ni bordes arcoíris.
  4. No usar vidrio esmerilado (backdrop blur) en todas las tarjetas: A1 lo mide en solo 9–15% de las secciones, y encarece el pintado en celulares. Reservarlo a menús y modales.
  5. No dejar animaciones infinitas en la interfaz de trabajo (lista de chats, tablas, formularios). Solo en la entrada y en el selector de perfil, y siempre con opción de reducir movimiento.
  6. No poner 3D pesado en el panel de uso diario: cada KB y cada frame cuestan velocidad, y el punto 6 pide más velocidad. Todo lo 3D va en la entrada y en perfiles, importado de forma diferida.
  7. No usar emojis como íconos. Ícono de línea de 1.5 px de un solo set (por ejemplo Lucide) con tamaño 16 o 20.
  8. No copiar el texto ni las imágenes de los sitios de referencia: se toma el sistema, no el contenido.
  9. No dejar texto superpuesto sobre animaciones (queja actual del Cerebro): todo texto va sobre superficie sólida o con un margen de seguridad de 24 px respecto de la animación, y se prueba a 320, 768 y 1440 px.
  10. Contraste mínimo: texto principal sobre superficie 1 por encima de 12:1 y secundario por encima de 4.5:1. Con #9AA1AB sobre #121418 da alrededor de 6.5:1 (estimación mía; verificarlo con una herramienta antes de aprobar).

## Propuestas

- **Archivo único de tokens de diseño (variables CSS) y borrar colores sueltos** (M). El problema de «tipografía rara en TODO el panel» y bordes inconsistentes se resuelve en el origen definiendo --bg, --surface-1/2/3, --border, --text, --text-2, --accent, 4 tintes de marca, radios y duraciones en un solo lugar, y reemplazando los valores sueltos. Sin esto el rediseño vuelve a degradarse.
- **Selector de tema con vista previa lado a lado (A y B) solo para el dueño** (S). Evita discutir en abstracto: el dueño ve las dos direcciones sobre sus propias pantallas y elige. Se guarda la elección por usuario.
- **Barra de comandos (Cmd+K) para ir a chats, captados, plantillas y perfiles** (M). Es el rasgo más copiado de Linear y Raycast y responde de forma directa a «cuesta encontrar las cosas» y a «más funciones»; suma velocidad percibida.
- **Estados de carga con esqueletos y transiciones de vista** (S). Aumenta la sensación de velocidad (punto 6) sin tocar el servidor: esqueletos con la forma de la tarjeta final, y transición de vista de 200 ms entre pantallas.
- **Prueba visual automática de las pantallas principales a 320, 768 y 1440 px** (M). Evita regresiones como el texto superpuesto del Cerebro; una captura de referencia por pantalla permite comparar antes de publicar.
- **Logos de las 4 marcas normalizados en SVG monocromo con área segura común** (S). Corrige «logos que no coinciden» y permite recolorear por tema; es una tarea chica con efecto visible inmediato.

## Preguntas para el dueño

- ¿Qué dirección preferís? A) «Grafito Nocturno», oscuro frío y técnico, o B) «Tinta y Marfil», oscuro cálido y más de estudio de lujo. Si no te decidís, mi recomendación es la A para un panel de uso diario.
- Para la entrada: ¿orbe de luz (idea 1, más segura), cristal que se abre con el código (idea 2, más conceptual y más cara) o campo de puntos (idea 3, la más liviana)? Recomiendo la 1.
- Para perfiles: ¿las cuatro tarjetas siempre visibles con inclinación (idea 1) o el carrusel en profundidad (idea 2, más vistosa pero esconde tres perfiles)? Recomiendo la 1.
- ¿Los colores de cada marca que hoy usa el panel son los oficiales de cada marca o se pueden reemplazar por los tintes apagados propuestos? No pude comprobar los colores actuales en el código.

## Herramientas usadas

- ToolSearch (carga de herramientas A1)
- mcp__a1__analyze_design_tokens (hero software 184 secciones; features finanzas 138 secciones)
- mcp__a1__search_sections (hero oscuro con brillo suave; features bento oscuro)
- mcp__a1__search_websites (3d oscuro interactivo; oscuro con brillo y degradados; resultados ampliados, pocos)
- mcp__a1__find_font_pairings (Inter con Geist y otros pares)
- mcp__a1__get_website (Linear, sin secciones capturadas)
