# Análisis del panel · diseno-auditoria (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Auditoría visual de solo lectura (punto 6). Fuentes: 21 capturas del recorrido a 1440×900 en modo oscuro (01–17, 23, 25, 28, 31, 32, 37), el código de /home/user/crm-main (rama integracion/rediseno-2211) y consultas de solo lectura a Supabase (esquema de brand_briefs y origen de los logos, sin datos de prospectos). Graphify no estaba instalado en este entorno, así que ubiqué el código con grep. Diagnóstico: el panel no tiene un sistema visual, tiene seis apilados. En cada página se cargan 15 hojas globales (unas 5.900 líneas: globals, panel, controles, marca, renovacion, afinado, tema-premium, ajustes, vidrio, accesible, diseno, premium, panel-premium, motion y vivo) que se pisan entre sí con 230 `!important`. Conviven 374 colores hex sueltos, 11 familias de variables (--c, --d, --pm, --m, --sh, --vv, --jv, --pc, --of3, las de .cz y --rol), 69 radios distintos, 131 animaciones (68 infinitas), 109 `backdrop-filter` y 102 `filter: blur`. La última capa, vivo.css (vuelta 6, 22/11), reintrodujo el gradient mesh, las esferas de color y los pasteles que el dueño ya había descartado ese mismo día («ese fondo raro no… sin gradient mesh ni esferas de color», cerebro/02-ordenes-vigentes.md:291). Por eso «color raro», «llamativo y exorbitante» y «tipografía rara» son síntomas de la misma causa. Causas concretas comprobadas: (a) Tarjetas de perfil: cuatro reglas de sombra compiten, una con `!important`. El logo tiene un marco blanco con anillo alrededor de una placa negra (doble recuadro). Tres de los cuatro logos salen de enlaces externos cargados en Configuración (Supabase: jurídico, coberturas y marketing) y ninguno recibe la escala óptica. Los cuatro archivos «SVG» del repo son en realidad imágenes WebP de 128 px. La banda de cada tarjeta usa colores inventados que no son los de la marca. Además, el color de marca guardado nunca llega a la tarjeta porque el código lee una clave que no existe (`colores.panel`). (b) Tipografía: se cargan cinco familias (Inter Tight, JetBrains Mono, Instrument Serif y Playfair, más copias en /cerebro y /oficina). Hay dos serif itálicas distintas, y una es itálica falsa: Playfair no se carga en itálica. La Oficina cae en Georgia porque nombra fuentes por su nombre literal. En /cerebro hay variables que solo existen si las define la página. Los rótulos en mono con mucha interletra conviven con títulos de peso 800 muy apretados. (c) Color: el modo oscuro aplica a los cuatro rubros una escala de grises cálida (sepia) heredada del dorado de Jurídico, y los pasteles lavanda, rosa, menta y beige no son de ninguna marca. El ámbar y el dorado del «Qué sigue» aparecen también en Autos. Contrastes que fallan AA: text-slate-400 en oscuro 3,65:1 (111 usos), blanco sobre la banda mesh entre 1,46 y 1,69:1, blanco sobre el verde de Coberturas 2,05:1 y sobre el naranja de Marketing 2,84:1, ícono neumórfico 1,75:1. (d) Componentes: bordes izquierdos de 3 px sobre cajas redondeadas que se ven como medialunas (Bandeja, Salud), cajas de cifras con solo un filo de luz arriba, borde doble blanco en la tarjeta seleccionada de Resultados, placa neumórfica clara sobre fondo oscuro, selects y fechas nativas en formato mm/dd/yyyy. En el Cerebro, los rótulos de las caras traseras del anillo 3D se cruzan con «15.196 CONTACTOS QUE CONOCE» (captura 04). (e) Efectos para apagar o suavizar: nubes del mesh desenfocadas y animadas sin fin, esferas rosa y violeta, entradas con resorte que se pasan de largo, brillo que recorre los botones, íconos que rotan al pasar el mouse, inclinación 3D más luz más resplandor del acento en las tarjetas, palabras que entran con desenfoque, recuadro serif que rebota, orbe flotante de Jarvis con insignia. (f) La entrada es una lámpara de pie en SVG con un cordón con resorte físico (lampara-ingreso.tsx). Su «sala» también se dibuja en /perfiles, y la favicon es la misma lámpara. Al final dejo la lista de trabajo para llevar todo el panel a un sistema único, en orden. Límites honestos: no vi modo claro, ni 375 px, ni la pantalla de ingreso renderizada (la lámpara la evalué solo leyendo el código). Las demoras de 11,8 a 12,4 s de /hoy y /salud vienen de los datos del servidor, no del CSS. Las rutas /jarvis, /chats, /citas, /mas, /piezas y /meta dan 404 porque son direcciones que adivinó el recorrido, no enlaces rotos del panel.

## Hallazgos

### 1. Tarjetas de perfiles: bordes que se ven mal (sombras en competencia, recuadros dobles, cajas con un solo filo)

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 6 · Perfiles: tarjetas con bordes mal hechos
- **Cómo está hoy:** La tarjeta `li.perfil-pc` (src/components/perfiles/selector-pc.tsx:81) acumula las clases perfil-pc, tarjeta-perfil, d-tarjeta--brillo, rounded-3xl (24 px) y data-inclinar. Le aplican estilo cinco hojas: renovacion.css:493-500 (sombra y desplazamiento), vidrio.css:405-407 (resplandor del acento), vivo.css:478-479 (perspectiva, preserve-3d y una sombra al pasar con !important), tema-premium.css:124-133 (fondo grafito con !important) y renovacion.css:241 (fondo blanco en claro). Adentro: la banda mesh tiene radio 0 y nubes con blur(34px) (vivo.css:247-249,469); la luz `.vv-luz` usa mix-blend soft-light (vivo.css:481); el brillo d-tarjeta--brillo es un círculo de 220 px que sale por la esquina (diseno.css:196-209). Las cajas de cifras `.perfil-pc-cifra` reciben dos sombras distintas: renovacion.css:514-517 y vidrio.css:409-411, que deja solo un filo blanco arriba. En la captura 03__perfiles.png se ven cajas «abiertas» abajo y a los costados. El logo va dentro de un cuadrado blanco de 64 px con radio 18 y anillo blanco de 3 px (vivo.css:472-476), y adentro una placa negra con radio heredado y !important (renovacion.css:244-246 y 505-509): resultan dos marcos y un filo blanco en las esquinas (03__perfiles.png).
- **Por qué:** Cada vuelta (18/10, 13/11, 22/11) agregó una capa sin sacar la anterior. Combinar transform 3D, overflow hidden, radio grande, filtros de desenfoque y mezcla de capas hace que Chrome dibuje mal el recorte de las esquinas mientras la tarjeta se inclina, y las sombras de distintas épocas no coinciden con el radio.
- **Evidencia:** 03__perfiles.png (cajas de cifras con solo el filo superior, doble marco del logo); selector-pc.tsx:81-88; vivo.css:478-487 con !important
- **Riesgo:** Cambiar la tarjeta también afecta el esqueleto de carga (perfiles/page.tsx:83-99), que usa las mismas clases.
- **Pasos:**
  1. Crear un único componente TarjetaPerfil (src/components/perfiles/tarjeta-perfil.tsx) con su CSS propio en src/components/perfiles/tarjeta-perfil.css; sacar de la tarjeta las clases tarjeta-perfil, d-tarjeta--brillo y vv-luz, y el data-inclinar
  2. Archivar (comentar con motivo, sin borrar) las reglas perfil-pc de renovacion.css:493-530, vidrio.css:403-411, vivo.css:468-487 y 617, tema-premium.css:124 y renovacion.css:241-246
  3. Superficie: un solo radio (--r-tarjeta: 20 px), borde de 1 px con el token --borde, una sola sombra suave en dos capas y nada de !important
  4. Logo: una placa de 56 px, fondo --superficie-alta, radio 14 px, sin anillo blanco ni segundo cuadrado; la imagen con object-fit contain al 80 % de alto
  5. Cajas de cifras: fondo --superficie-alta, borde de 1 px completo y radio 12 px; sacar la sombra inset de vidrio.css:409
  6. Inclinación: si se mantiene, 2° como máximo, sin preserve-3d en el contenedor que recorta y solo con (hover:hover) y sin reducir movimiento
- **Archivos:** `src/components/perfiles/selector-pc.tsx`, `src/app/vivo.css`, `src/app/renovacion.css`, `src/app/vidrio.css`, `src/app/tema-premium.css`, `src/app/diseno.css`

### 2. Logos que no coinciden: tres vienen de enlaces externos sin escala, los del repo son WebP de 128 px y la placa los achica

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 6 · Perfiles: logos que no coinciden
- **Cómo está hoy:** Supabase (brand_briefs, solo lectura): jurídico, coberturas_medicas y marketing tienen logo_panel con un enlace externo; agencia_0km usa /logos/agencia_0km.svg. LogoPerfil aplica la escala óptica solo al logo original (src/components/ui/logo-perfil.tsx:27-44), así que tres de los cuatro se ven sin igualar. Los cuatro archivos de public/logos/*.svg son un <image> con WebP de 128×128 en base64 (comprobado al decodificarlos): no son vectores. La tinta ocupa cajas muy distintas: Jurídico 84×116 con trazo fino y semitransparente, Marketing 116×60 apaisado. El ancho de la imagen cambia según dónde aparece: 84 % (marca.css:52-58), 72 % en la tarjeta (renovacion.css:510-513) y transform scale en el original. En 03__perfiles.png y 10__resultados.png la figura de VITA se ve diminuta y oscura sobre la placa negra, mientras el rayo de Autos llena la suya. El sello «P» de perfiles/page.tsx:51 (MarcaPanel) no corresponde a ninguna de las cuatro marcas.
- **Por qué:** Hay dos orígenes de logo (Configuración y repo) con reglas de tamaño diferentes, imágenes rasterizadas de baja resolución con márgenes propios, y una placa negra fija para todas las marcas que oscurece al logo dorado de VITA.
- **Evidencia:** 03__perfiles.png, 10__resultados.png y 37__panel_coberturas_medicas.png (tamaños de logo en la barra lateral muy desparejos); consulta de solo lectura a brand_briefs; logos decodificados en /tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/analisis2711/logos/tira.png
- **Riesgo:** Nada se borra: los enlaces externos quedan guardados en Configuración.
- **Pasos:**
  1. Pedir los originales vectoriales (ver preguntas). Mientras tanto, guardar en public/logos/ una versión PNG o WebP de 512 px recortada a la tinta, sin márgenes, para cada marca (así se versionan; los enlaces externos quedan en Configuración como respaldo)
  2. En src/lib/marca.ts, sumar por marca `cajaLogo` (relación de aspecto) y `fondoPlaca` (oscuro o claro). Calcular la escala óptica sobre el área de tinta y aplicarla también al logo cargado en Configuración (logo-perfil.tsx:44)
  3. Unificar el tamaño de la imagen en una sola regla (`.placa-logo img`) y archivar renovacion.css:510-513
  4. Fondo de placa por marca: VITA sobre navy #112250 (su paleta), Coberturas sobre #0B2B26, Autos sobre #020C47 y Marketing sobre #1B1B1B, en lugar del #000 fijo de marca.css:49
  5. Reemplazar el sello «P» de /perfiles por el logotipo del panel o por los cuatro logos en fila (va con el pedido del efecto 3D)
- **Archivos:** `public/logos/juridico.svg`, `public/logos/coberturas_medicas.svg`, `public/logos/agencia_0km.svg`, `public/logos/marketing.svg`, `src/components/ui/logo-perfil.tsx`, `src/lib/marca.ts`, `src/app/marca.css`, `src/app/renovacion.css`, `src/components/ui/marca-panel.tsx`

### 3. El color de marca configurado no llega a las tarjetas: se lee una clave que no existe

- **Tipo:** existe sin conectar · **Esfuerzo:** S · **Punto del pedido:** 6 · Perfiles: color raro
- **Cómo está hoy:** src/app/perfiles/page.tsx:34 arma `acento: marcas[s].colores?.panel`. En la base, las claves de color son principal, secundario, acento, claro, oscuro, fondo, neutro, gris, negro y profundo: no hay ninguna `panel`. Por eso variablesAcento(null) no hace nada en selector-pc.tsx:75. El color sale entonces de TONO_MESH, que está fijo en el código (selector-pc.tsx:13), con mezclas inventadas en vivo.css:241-244: Jurídico usa marrón, amarillo y naranja (#7a4a12, #ffcf6b, #ff8a4c), no navy y dorado; Autos azul, cian y violeta (#8a6bff); Coberturas verde, agua y celeste (#3cb7ff); Marketing naranja y rosa (#ff5fa2).
- **Por qué:** Nombre de clave equivocado, más una paleta decorativa que se agregó encima de las paletas aprobadas de marca.ts:46-80.
- **Evidencia:** perfiles/page.tsx:34; consulta de solo lectura a brand_briefs (claves de color); 03__perfiles.png (banda naranja y marrón en VITA, azul y violeta en Autos)
- **Pasos:**
  1. Cambiar perfiles/page.tsx:34 para que use `colores.principal ?? colores.acento` (normalizarColores ya devuelve principal)
  2. Archivar TarjetaMesh en la tarjeta y reemplazar la banda por un fondo sólido o un degradé de dos tonos de la paleta aprobada de cada marca (marca.ts `paleta`), sin nubes ni rosa ni violeta
  3. Agregar una prueba unitaria en tests/unitarias que compruebe que el acento de la tarjeta sale de brand_briefs.colores.principal
- **Archivos:** `src/app/perfiles/page.tsx`, `src/components/perfiles/selector-pc.tsx`, `src/components/vivo/tarjeta-mesh.tsx`, `src/app/vivo.css`

### 4. Tipografía: cinco familias, dos serif itálicas (una falsa), caídas a Georgia y variables sin definir

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 6 · Tipografía rara en todo el panel
- **Cómo está hoy:** src/app/layout.tsx:2-28 carga Inter Tight (variable), JetBrains Mono, Instrument Serif (400, normal e itálica) y Playfair Display (solo 600 y 700, sin itálica). /cerebro (src/app/cerebro/page.tsx:25-28) y /oficina (src/app/oficina/page.tsx:15-16) vuelven a cargar Inter Tight con pesos fijos 300-800, JetBrains e Instrument: son archivos de fuente extra. Mezclas comprobadas: (1) serif itálica recuadrada para palabras clave, vía `.vv-p--marca` (vivo.css:47-59), `.cz-cartel__clave` (cerebro/centro.css:53) y `.of3-titulo .recuadro` (oficina.css:13), en «perfil», «noches.», «cajitas», «todo», «ordenale» y «trabajando» (capturas 01, 02, 04, 05, 09); (2) Jarvis usa otra serif: --jv-serif = Playfair (jarvis-vivo.css:32,176) en itálica 600, que no se cargó, así que el navegador la inclina artificialmente («secretario», 07__asistente.png); (3) oficina.css:7 nombra «Instrument Serif» y «Playfair Display» por su nombre literal, pero next/font les pone nombres internos con hash, así que la Oficina cae en Georgia; (4) en el modo oscuro, tema-premium.css:174-175 pone los h1 y las cifras en Playfair y diseno.css:117 lo deshace después: dos reglas que pelean; (5) los rótulos `.d-kicker` son mono, mayúsculas y 0,14 em (diseno.css:128-133), igual que la píldora amarilla de vivo.css:62-68 y los rótulos de /cerebro: «ESTA SEMANA», «SALUD DEL SISTEMA», «TAREAS PARA CLAUDE»; (6) títulos en peso 800 con -0,035 em de interletra (diseno.css:119-124, vivo.css:43) junto a texto de 300 (cerebro). Hay nueve pesos distintos en CSS (300 a 800, incluidos 550, 650 y 750) y ocho valores de interletra positiva. tailwind.config.ts:32-46 declara 'Inter' y 'Playfair Display' con nombre literal (Inter nunca se carga); controles.css:213-214 lo tapa.
- **Por qué:** Cada vuelta sumó su voz tipográfica (la serif clásica de la marca, la itálica de los carteles del reel, el mono del Cerebro) sin un documento de tipografía. El resultado son cuatro estilos en una misma pantalla y fuentes que no se cargan como se pensaba.
- **Evidencia:** 01__.png, 02__hoy.png, 04__cerebro.png, 05__oficina.png, 07__asistente.png, 08__bandeja.png, 09__resumen.png, 11__salud.png
- **Pasos:**
  1. Definir la tipografía en un solo archivo de tokens (src/app/tokens.css): --fuente-texto (Inter Tight, ya cargada como variable) y --fuente-cifras (la misma con tabular-nums). Opcional: una sola serif editorial (Instrument Serif) solo para el título de entrada y de Perfiles, si el dueño la quiere (ver preguntas)
  2. Escala fija: 12, 13, 14, 16, 18, 22, 28, 36 y 48 px; pesos 400, 500, 600 y 700; interletra 0 en texto, -0,01 em en títulos y +0,04 em solo en rótulos en mayúscula, que pasan a la sans (no mono)
  3. Archivar en layout.tsx la carga de Playfair si no queda uso. Si queda, cargarla con style ['normal','italic'] para que la itálica no sea falsa
  4. Quitar las cargas duplicadas de next/font en cerebro/page.tsx:25-28 y oficina/page.tsx:15-16; definir --cz-f, --cz-mono y --cz-serif en :root apuntando a --font-sans, --font-mono y --font-cartel (así .cz no depende del estilo en línea)
  5. Corregir oficina.css:7: --of3-serif-f: var(--font-cartel), Georgia, serif
  6. Archivar la regla serif de tema-premium.css:174-175 y unificar `.cifra-premium`, definida tres veces (tema-premium.css:175 y 249, diseno.css:118-124)
  7. Corregir tailwind.config.ts fontFamily a var(--font-sans), var(--font-mono) y var(--font-cartel), y archivar controles.css:213-214
  8. Reemplazar el componente Cartel (palabra recuadrada) por un título simple en todas sus apariciones (21 usos: hoy-bento, perfiles, resumen, asistente, centro-cerebro, pin-login-form, cabecera, jv-bento, jarvis-hoja, vista-cartera)
- **Archivos:** `src/app/layout.tsx`, `tailwind.config.ts`, `src/app/controles.css`, `src/app/diseno.css`, `src/app/tema-premium.css`, `src/app/vivo.css`, `src/components/jarvis/jarvis-vivo.css`, `src/app/oficina/oficina.css`, `src/app/cerebro/centro.css`, `src/app/cerebro/cerebro.css`, `src/app/cerebro/page.tsx`, `src/app/oficina/page.tsx`, `src/components/vivo/cartel.tsx`

### 5. Color: seis paletas superpuestas, grises sepia para todos los rubros y pasteles que no son de ninguna marca

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 6 · Color raro; colores suaves
- **Cómo está hoy:** Paletas que conviven: (1) --c-slate y --c-gold por rubro (globals.css:12-107), que Tailwind usa como slate y gold; (2) el modo oscuro invierte slate a un gris cálido (tema-premium.css:9-98: slate-400 = 111 107 95, slate-500 = 150 145 130) idéntico en los cuatro rubros, así que el texto secundario de Autos (azul) y Coberturas (verde) se ve beige o sepia; (3) --d-* de diseno.css:33-102; (4) --pm-* de premium.css:65-89, redefinidas en panel-premium.css:28-48; (5) los pasteles --vv-* (vivo.css:15-24: #bcb9d2 lavanda, #d6c4cc rosa, #d9d1ba beige, #bdd1cb menta), repetidos en el Cerebro (centro.css:9-13) y usados en el bento de Hoy, Resumen, Resultados, Chats, Laboratorio y Jarvis (capturas 02, 07, 09, 10, 12, 28). En el Laboratorio, a Jurídico le toca lavanda y a Autos beige, colores que no pertenecen a esas marcas (12__laboratorio.png); (6) violeta y rosa sin dueño: barras índigo en Resumen (09), esferas rosa y violeta en Hoy (02, 31, 37), núcleo rosa #ff4f9a en el Cerebro (cerebro.css:10), mesh magenta y cian en Jarvis (07). A eso se suman 374 hex sueltos en CSS y unas 700 clases de estado fijas (amber 245, red 231, emerald 130, green 65). El «Qué sigue» es dorado y ámbar también en la ficha de Autos (32__ficha_*.png), y el chip «Civil» usa bg-civil-light (#dbeafe), un celeste de modo claro sobre fondo negro (25__prospectos_*.png). El verde de Coberturas en el modo oscuro es lima #7FC843 (tema-premium.css:52), no el #8EB69B aprobado (marca.ts:57).
- **Por qué:** Las paletas de marca se generaron con un script (globals.css:10) y luego la vuelta 6 del 22/11 agregó una paleta pastel genérica y efectos de color que la corrección del dueño de ese mismo día ya había descartado (cerebro/02-ordenes-vigentes.md:291).
- **Evidencia:** 02__hoy.png, 07__asistente.png, 09__resumen.png, 12__laboratorio.png, 25__prospectos_9b7b7c82_*.png, 32__ficha_f15d6ed9_*.png, 37__panel_coberturas_medicas.png
- **Pasos:**
  1. Tokens en tres niveles en src/app/tokens.css: paleta de referencia (las aprobadas en marca.ts), roles semánticos (--fondo, --superficie, --superficie-alta, --borde, --texto, --texto-suave, --acento, --acento-texto, --exito, --aviso, --peligro, --info) y, por data-tema, solo cambia --acento con su escala
  2. Neutros del modo oscuro: una escala fría y neutra (por ejemplo #0B0C0F, #14161B, #1C1F26, #2A2E37; texto #ECEEF2 y #A3A9B6) compartida por los cuatro rubros; el color del rubro aparece solo en el acento
  3. Archivar los pasteles --vv-* y los data-color del Cerebro; las tarjetas pasan a --superficie con un detalle del acento del rubro (borde superior de 2 px o ícono)
  4. Estados (éxito, aviso, peligro) como tokens propios para claro y oscuro; migrar por lotes las clases amber, red, emerald y green, empezando por las fichas
  5. Reemplazar bg-civil y bg-penal (tailwind.config.ts:20-27) por chips con tokens; además Penal se unifica con Civil (punto 7)
  6. Usar en Coberturas el verde aprobado (#8EB69B, con una variante clara para texto) en lugar del lima, y regenerar la escala en globals.css y tema-premium.css con docs/estetica/gen_tema.py
- **Archivos:** `src/app/globals.css`, `src/app/tema-premium.css`, `src/app/vivo.css`, `src/app/diseno.css`, `src/app/premium.css`, `src/app/panel-premium.css`, `src/app/cerebro/centro.css`, `src/app/cerebro/cerebro.css`, `tailwind.config.ts`, `src/lib/marca.ts`, `docs/estetica/gen_tema.py`

### 6. Contrastes que fallan WCAG AA (medidos)

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 6 · Accesibilidad dentro del rediseño
- **Cómo está hoy:** Medido con la fórmula de WCAG sobre los valores reales: text-slate-400 en oscuro sobre slate-50: 3,65:1; sobre la superficie: 3,45:1 (111 usos de text-slate-400 en .tsx, por ejemplo la bajada de /perfiles en src/app/perfiles/page.tsx:57 y la salida en :64). --dim del Cerebro #6b6879 sobre #07070a: 3,72:1. Gris de la Oficina #6f6a80: 3,88:1. Blanco sobre la banda mesh (nombre y bajada de cada marca, vivo.css:251-253) sobre las nubes claras #ffcf6b y #4fd6ff: 1,46 y 1,69:1. Blanco sobre el lima de Coberturas: 2,05:1; sobre el naranja de Marketing: 2,84:1; sobre el azul de Autos: 3,23:1. Ícono violeta #b3b0cc sobre la placa neumórfica #e7eaf2: 1,75:1 (vivo.css:314). Arco blanco de los anillos sobre lavanda: 1,91:1 (10__resultados.png). En modo claro, gold-500 sobre blanco da 2,27:1. Lo que cumple: el kicker dorado sobre grafito (8,09:1), el texto oscuro sobre el azul de Autos (5,55:1) y slate-500 en oscuro (5,84:1).
- **Por qué:** Los colores se eligieron por efecto y no se volvieron a medir después de invertir la escala ni de sumar fondos animados debajo del texto.
- **Evidencia:** Cálculo de contraste sobre los valores de tema-premium.css:9-21 y vivo.css:241-253; 03__perfiles.png; 10__resultados.png
- **Pasos:**
  1. Fijar --texto-suave ≥ 4,5:1 sobre --superficie y migrar text-slate-400 a ese token (reemplazo masivo revisado pantalla por pantalla)
  2. Texto sobre el acento: elegir automáticamente texto claro u oscuro según el contraste (ya existe la idea en marca.ts ROLES; aplicarla a .btn-gold y a los botones del rubro)
  3. Sin texto sobre fondos animados: la banda de marca pasa a sólida (ver tarjetas)
  4. Anillos y barras: la pista con --borde y el arco con --acento, ≥ 3:1 sobre la superficie (criterio 1.4.11)
  5. Agregar una prueba unitaria que recorra los pares de roles de cada tema y falle si alguno baja de 4,5:1 o de 3:1
- **Archivos:** `src/app/tema-premium.css`, `src/app/vivo.css`, `src/app/cerebro/cerebro.css`, `src/app/oficina/oficina.css`, `src/lib/marca.ts`, `src/app/perfiles/page.tsx`

### 7. Componentes inconsistentes: medialunas de color, bordes dobles, neumorfismo claro sobre fondo oscuro y controles nativos

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 6 · Rediseño estético general
- **Cómo está hoy:** (1) `.d-tarjeta[data-estado]` agrega border-left de 3 px a una caja de radio 16 px (diseno.css:178 y 213): el borde se curva en medialuna en Bandeja (08__bandeja.png: Te esperan, Trabajando, En cola) y en Salud (11__salud.png, cajas rojas y ámbar). (2) La tarjeta seleccionada de Resultados lleva un borde blanco grueso más un anillo: doble recuadro (10__resultados.png, Captados). (3) La placa neumórfica clara #e7eaf2 de los atajos Chats, Contactos, Citas y Seguimiento queda en medio de una página negra (02, 31 y 37, vivo.css:297-317). (4) Hay tres familias de botón: .btn-gold (globals.css:209-225, que dice «no se desplaza ni brilla»), el mismo botón con relieve, brillo y resorte en vivo.css:321-339 (contradice al anterior) y los .cz-btn y .cz-neu del Cerebro con otro radio y otra sombra (cerebro.css:141, centro.css:61). Chips punteados violetas en el Laboratorio (12). (5) Radios: 69 valores distintos en CSS (8, 10, 12, 14, 16, 18, 20, 22, 24, 26 px, 22 %, 999 px…) y en .tsx rounded-lg 497 veces, xl 198, 2xl 73, 3xl 5; tres tokens que no coinciden (--d-r-*, --pm-r-* redefinido entre premium.css:65 y panel-premium.css:47). (6) Inputs de fecha nativos con formato mm/dd/yyyy y selects nativos (14__contactos.png, 12__laboratorio.png). (7) Las fichas de Jurídico (/prospectos/[id]) y de los otros rubros (/ficha/[id]) tienen encabezados con estructuras distintas (25 contra 32). En la ficha de Jurídico el menú marca «Más» y la miga dice «Contactos». (8) Teléfonos sin formato en la ficha.
- **Por qué:** No hay una biblioteca de componentes única: src/components/ui tiene stat-card, metrics-panel y diseno.tsx, pero cada sección armó su propia piel en CSS global.
- **Evidencia:** 08__bandeja.png, 11__salud.png, 10__resultados.png, 02__hoy.png, 12__laboratorio.png, 14__contactos.png, 25__prospectos_9b7b7c82_*.png, 32__ficha_f15d6ed9_*.png
- **Pasos:**
  1. Componentes base en src/components/ui/ con tokens: Boton (primario, secundario, fantasma, peligro), Tarjeta (normal, destacada, de estado con una franja interna en lugar de border-left), Chip, Cifra, Anillo, Campo, Selector, Fecha y Pestañas
  2. Estado en tarjetas: barra vertical interna de 3 px con su propio radio (pseudo-elemento ::before con inset), no border-left sobre el contenedor redondeado
  3. Seleccionado: un solo anillo de 2 px con el acento y nada más
  4. Archivar el neumorfismo claro y los atajos de Hoy en una fila de botones secundarios del sistema
  5. Selector y fecha propios, o al menos con estilo del sistema y locale es-AR (formato dd/mm/aaaa)
  6. Encabezado de ficha único para /prospectos/[id] y /ficha/[id] (misma estructura y mismo componente), y marcar en el menú la sección de origen
  7. Formatear teléfonos con un helper puro en src/lib (+54 9 11 …) con prueba unitaria
- **Archivos:** `src/app/diseno.css`, `src/app/vivo.css`, `src/app/globals.css`, `src/app/cerebro/cerebro.css`, `src/app/cerebro/centro.css`, `src/components/ui/`, `src/components/ficha/`, `src/app/contactos/`

### 8. Texto encimado bajo la animación del Cerebro

- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto del pedido:** 3 y 6 · Texto debajo de la animación del Cerebro superpuesto
- **Cómo está hoy:** En 04__cerebro.png, «15.196 CONTACTOS QUE CONOCE» se cruza con «SEMANA» y «DECISIONES». El núcleo (`.cz-nucleo`, cerebro/centro.css:119-125) está en el plano 0 dentro de una cámara preserve-3d, sin fondo y sin translateZ. Las tarjetas del anillo tienen una cara trasera (`.cz-pant__dorso`, centro.css:136) con el nombre de la sección en mono, y las del fondo quedan detrás del núcleo con el texto visible a través de la esfera de puntos. Además el rótulo del núcleo usa var(--cz-mono), que depende del estilo que pone la página.
- **Por qué:** Se apilan capas 3D y 2D sin un orden de profundidad, y las caras traseras llevan texto en lugar de quedar mudas.
- **Evidencia:** 04__cerebro.png; 04__cerebro.txt (cada sección aparece dos veces: cara y dorso)
- **Pasos:**
  1. Sacar el texto de `.cz-pant__dorso` (dejar solo el color o un ícono) o darle opacidad 0 cuando la tarjeta está a más de 90° del frente
  2. Sacar `.cz-nucleo__txt` de la cámara 3D y ubicarlo como capa 2D debajo de la esfera, con una placa de fondo (--superficie al 80 %) y margen fijo
  3. Comprobar a 1440, 1024 y 375 px que ningún texto se cruce, guardar capturas de antes y después
- **Archivos:** `src/app/cerebro/centro.css`, `src/components/cerebro/centro-cerebro.tsx`

### 9. Efectos «llamativos y exorbitantes» para apagar o suavizar

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6 · Animaciones con vida pero sobrias
- **Cómo está hoy:** Hay 68 animaciones infinitas, 109 backdrop-filter y 102 filter: blur. Las más visibles: nubes del mesh en las cuatro tarjetas (vivo.css:255-259, blur 34 px, 12 a 17 s infinitas); esferas rosa, amarilla y violeta de «Para decidir hoy» (vivo.css:224-226, capturas 02, 31 y 37); sol, montañas y noche violeta del saludo de Hoy, idénticos en los cuatro rubros; el mesh magenta y cian con el orbe de Jarvis (jarvis-vivo.css:237-240, 430-432; 07); el orbe flotante con insignia roja en todas las pantallas; manchas de fondo de 38 a 56 s (vidrio.css:203-205, premium-fondo.css:33-57); entradas con resorte que se pasan de largo (--vv-resorte cubic-bezier(0.34,1.56,0.64,1): vivo.css:26,73,166-168,484-487 con !important); la palabra recuadrada que entra rotando y rebota (vivo.css:70); el brillo que recorre .btn-gold, .ac-resumen y .cc-enviar al pasar el mouse (vivo.css:321-334); íconos del menú que rotan 8° y crecen al 118 % (vivo.css:355); la tarjeta de perfil que se inclina, sube el logo en Z y lo rota -3° (vivo.css:478-482); cifras que cuentan desde cero en cada carga (efectos-vidrio.tsx); en el Cerebro, partículas titilantes, latidos, brillo cada 3,6 s y parallax (centro.css:34,45,124,133,210,221). Sí se respeta prefers-reduced-motion en casi todos.
- **Por qué:** La vuelta 6 trasladó al panel todos los recursos del reel de referencia al mismo tiempo, y quedaron sumados a los de las vueltas anteriores.
- **Evidencia:** 02__hoy.png, 31__panel_agencia_0km.png, 37__panel_coberturas_medicas.png, 07__asistente.png, 03__perfiles.png, 04__cerebro.png
- **Pasos:**
  1. Regla del sistema: solo se anima la entrada (opacidad y desplazamiento de 8 px, 200 a 320 ms, curva sin rebote), el hover (color o sombra, 150 ms) y los cambios de estado. Nada infinito salvo los indicadores de carga
  2. Apagar (archivar con motivo): mesh y nubes, esferas de color, fondo con manchas, brillo que recorre botones, rotación de íconos, resorte con rebote, palabra recuadrada animada y conteo de cifras en cada visita (dejarlo solo la primera vez del día)
  3. Suavizar: inclinación de tarjetas a ≤ 2° y solo en Perfiles; orbe de Jarvis quieto, con un pulso único cuando hay novedades; esfera del Cerebro a 30 fps con pausa fuera de pantalla (IntersectionObserver)
  4. Limitar backdrop-filter a la barra lateral y al panel de Jarvis (lo que pidió el dueño el 22/11) y archivar el resto
- **Archivos:** `src/app/vivo.css`, `src/app/vidrio.css`, `src/app/premium-fondo.css`, `src/app/motion.css`, `src/components/jarvis/jarvis-vivo.css`, `src/app/cerebro/centro.css`, `src/components/ui/efectos-vidrio.tsx`, `src/components/inicio/hoy-bento.tsx`, `src/components/vivo/`

### 10. La entrada (lámpara) y su «sala» en Perfiles

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 6 · Efecto 3D «WOW» en la entrada en lugar de la lámpara, y lo mismo en Perfiles
- **Cómo está hoy:** src/app/login/page.tsx envuelve el formulario de PIN en LamparaIngreso (src/components/acceso/lampara-ingreso.tsx): un SVG de 220×440 con lámpara de pie de latón, pantalla de tela, cono de luz y un cordón con resorte físico en requestAnimationFrame (k=210, c=8,5), que se tira con el puntero o con Enter. Los dibujos están en src/components/ui/lampara-dibujo.tsx (149 líneas) y la sala (pared con boiserie y piso) en panel.css:28-30 y 85-240, con ajustes en tema-premium-ajustes.css:24-33. /perfiles también dibuja la sala (perfiles/page.tsx:9 y 40) y la favicon es la lámpara (layout.tsx:51). El botón de ingreso tiene un brillo infinito cada 3,2 s (motion.css:88-101). No hay captura del ingreso en el recorrido: lo evalué solo por código.
- **Por qué:** Fue el «Lamp Login» del 16/10. Es interactivo pero no comunica las cuatro marcas, y su estética de sala clásica choca con el resto.
- **Evidencia:** Código (no hay captura del ingreso); 01__.png y 03__perfiles.png muestran la sala oscura de fondo en Perfiles
- **Riesgo:** Un 3D pesado empeora la velocidad que también pidió el dueño: hay que cargarlo diferido, con pausa fuera de pantalla y sin bloquear el PIN.
- **Pasos:**
  1. Archivar (sin borrar) LamparaIngreso y SalaLampara: dejar los archivos y quitarlos de login/page.tsx y perfiles/page.tsx
  2. Nueva escena de entrada en src/components/acceso/entrada-3d.tsx, cargada con next/dynamic y ssr:false para que el formulario de PIN aparezca enseguida. Opción liviana: CSS 3D (perspective) con los cuatro logos en placas que giran y se ordenan en abanico, unos 0 KB extra. Opción WOW: un canvas WebGL propio, una sola escena de unos 20-30 KB sin three.js, con las placas de marca en relieve e iluminación suave
  3. En Perfiles, la misma escena continúa: las cuatro placas pasan a ser las cabeceras de las tarjetas (transición compartida con View Transitions API), con reducción de movimiento que muestra el estado final quieto
  4. Logos en relieve: necesitan versión vectorial o PNG de 1024 px; con los WebP de 128 px actuales se verían pixelados
  5. Medir el LCP del ingreso antes y después (objetivo: menos de 1,5 s en 4G); el formulario no debe esperar a la escena
- **Archivos:** `src/app/login/page.tsx`, `src/components/acceso/lampara-ingreso.tsx`, `src/components/ui/lampara-dibujo.tsx`, `src/app/perfiles/page.tsx`, `src/app/panel.css`, `src/app/tema-premium-ajustes.css`, `src/app/motion.css`, `src/app/layout.tsx`

### 11. Peso visual que frena: 15 hojas globales en cada página

- **Tipo:** velocidad · **Esfuerzo:** L · **Punto del pedido:** 6 · Más velocidad
- **Cómo está hoy:** src/app/layout.tsx:3-18 importa 15 hojas (unas 5.900 líneas) para todas las rutas, incluidas reglas que solo usan el Cerebro, Perfiles o el ingreso. A eso se suman 109 backdrop-filter y 102 blur, que son costosos de dibujar con capas animadas, y tres o cuatro fuentes por página (/cerebro y /oficina recargan las suyas). En el recorrido (_rutas.json), /hoy y /salud tardaron 11,8 s y los Hoy de Autos y Coberturas 12,3 y 12,4 s; las demás pantallas entre 1,5 y 3 s. Esa demora es del servidor y los datos, no del CSS (va en el área de velocidad del Hoy), pero la capa visual suma trabajo de pintado en el cliente.
- **Por qué:** Se acumularon hojas por vuelta en lugar de reemplazar, y todos los efectos están en CSS global.
- **Evidencia:** layout.tsx:3-18; _rutas.json del recorrido (ms por ruta)
- **Pasos:**
  1. Pasar a una sola hoja global de tokens y base (tokens.css + base.css, menos de 800 líneas) y CSS por componente o ruta (CSS Modules o archivos importados desde el componente)
  2. Archivar las hojas reemplazadas en src/app/_archivo-estilos/ con un README del motivo (nada se borra)
  3. Limitar blur y backdrop-filter como se indica en Efectos, y pausar los canvas fuera de pantalla
  4. Medir con Lighthouse o web-vitals (LCP, INP, CLS) en /perfiles, /hoy y /cerebro antes y después, y guardar los números en docs/etapaN/INFORME.md
- **Archivos:** `src/app/layout.tsx`, `src/app/*.css`

### 12. Lista de trabajo: llevar TODO el panel a un sistema único, en orden

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 6 · Rediseño estético general
- **Cómo está hoy:** No hay un sistema único: tokens repartidos en 11 familias, componentes base a medias (src/components/ui) y estilos por vuelta en CSS global. La orden del 27/11 pide primero una página de muestra (cerebro/02-ordenes-vigentes.md:330); ya existe la ruta /diseno-muestra (src/app/diseno-muestra/) de la fundación del 22/11, que se puede reutilizar.
- **Por qué:** Rediseños por capas sin retirar las anteriores.
- **Evidencia:** Todo lo anterior
- **Pasos:**
  1. 0. Fotos de antes: capturar 1440 y 375 en oscuro y claro de cada pantalla (scratchpad, sin datos personales en documentos)
  2. 1. Tokens (tokens.css): neutros fríos, acento por data-tema, estados, radios (8, 12, 20, píldora), sombras (2 niveles), espacios en escala de 8, tipografía y movimiento. Corregir tailwind.config.ts para que slate, gold y fontFamily lean los roles
  3. 2. Fuentes: Inter Tight única (más una serif opcional, a confirmar), sin cargas duplicadas, sin itálicas falsas ni nombres literales
  4. 3. Componentes base en src/components/ui con estados de carga, error, vacío, deshabilitado, foco y seleccionado: Boton, Tarjeta, Chip, Cifra, Anillo, Campo, Selector, Fecha, Pestañas, Encabezado de pantalla, Aviso y Placa de logo
  5. 4. Página de muestra /diseno-muestra con los cuatro rubros lado a lado, para el ok del dueño antes de tocar pantallas
  6. 5. Ingreso: nueva entrada 3D (lámpara archivada)
  7. 6. Perfiles: tarjeta única, logos corregidos, acento desde brand_briefs y continuidad con la escena 3D
  8. 7. Barra lateral y encabezado del perfil (aparecen en todas las pantallas): placa de logo, ítem activo sin resplandor, vidrio sutil solo acá
  9. 8. Hoy de cada perfil: sin noche ni esferas ni pasteles, compacto (coordinar con el área del punto 10)
  10. 9. Chats e inbox, ficha única (/prospectos y /ficha con el mismo encabezado) y conversación
  11. 10. Contactos, Captados, Campañas, Resultados y Estadísticas: cifras con Cifra y Anillo del sistema, filtros con Selector y Fecha propios
  12. 11. Salud, Bandeja para Claude y Configuración: tarjetas de estado sin medialunas
  13. 12. Jarvis (/asistente): sin mesh ni serif propia; vidrio sutil permitido
  14. 13. Cerebro y Oficina: adoptar tokens y tipografía, corregir el texto encimado y reducir efectos; mantener la esfera y la oficina 3D con menos brillo
  15. 14. Laboratorio, Biblioteca y Comparar agentes (dentro de Bot IA, coordinar con el punto 9)
  16. 15. Archivar las hojas viejas, medir velocidad y accesibilidad (A02 a A07, A33, A34 y criterios WCAG 1.4.3, 1.4.11, 2.4.7, 2.3.3) y dejar la entrega documentada en docs/etapaN/ENTREGA.md e INFORME.md
- **Archivos:** `src/app/tokens.css (nuevo)`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/components/ui/`, `src/app/diseno-muestra/`

### 13. Lo que ya funciona y conviene conservar

- **Tipo:** anda bien · **Esfuerzo:** S · **Punto del pedido:** 6
- **Cómo está hoy:** Configuración (17__configuracion.png) es la pantalla más prolija: lista de grupos clara, íconos alineados y jerarquía simple. Ya existen la escala de acento por rubro con data-tema (globals.css), el respeto de prefers-reduced-motion (globals.css:278-290, vivo.css:520-526), el foco visible con anillo propio en modo oscuro (tema-premium.css:228), los objetivos táctiles de 44 px (.tactil) y la etiqueta lang="es" (layout.tsx:69).
- **Por qué:** Se construyó con los componentes de diseno.css y sin efectos de la vuelta 6.
- **Evidencia:** 17__configuracion.png
- **Pasos:**
  1. Usar Configuración como referencia de densidad y jerarquía para el resto
  2. Mantener data-tema por rubro, el soporte de movimiento reducido y los objetivos táctiles en el sistema nuevo
- **Archivos:** `src/app/configuracion/`, `src/app/globals.css`

## Propuestas

- **Página de muestra con los cuatro rubros lado a lado** (M). El dueño pidió ver primero una muestra (27/11). Reutilizar /diseno-muestra para aprobar tokens, tipografía, tarjetas, botones y la placa de logo en las cuatro marcas antes de tocar las pantallas evita otro «lo dejaste más feo».
- **Prueba automática de contraste y de tokens** (S). Una prueba unitaria que recorra los roles de color de cada tema (claro y oscuro) y falle por debajo de 4,5:1 o de 3:1 impide que una vuelta futura vuelva a romper la legibilidad.
- **Regresión visual con capturas** (M). Reusar el script del recorrido para sacar capturas de 1440 y 375 de las pantallas clave antes y después de cada bloque, y compararlas, como evidencia de cada entrega sin datos personales en los documentos.
- **Placa de marca inteligente** (S). Calcular la escala óptica y el fondo de la placa según el área real de tinta del logo (también para los logos cargados en Configuración) hace que los cuatro se vean iguales en el menú, Perfiles, Teléfono y la entrada.
- **Presupuesto de movimiento** (S). Fijar en los tokens las duraciones, curvas y una lista cerrada de animaciones permitidas (entrada, hover, estado) mantiene el panel «con vida pero sobrio» y frena la acumulación de efectos.
- **Hojas de estilo por ruta** (L). Pasar de 15 hojas globales (unas 5.900 líneas) a tokens y base globales más CSS por componente reduce lo que se descarga y se pinta en cada pantalla y facilita archivar sin romper otras pantallas.

## Preguntas para el dueño

- Modo de color: ¿(a) solo oscuro, (b) oscuro por defecto y claro opcional como hoy, o (c) claro por defecto? Define cuántas variantes hay que diseñar y probar.
- Tipografía: ¿(a) una sola sans elegante en todo el panel (Inter Tight, sobria), (b) sans más una serif editorial solo en los títulos de la entrada y de Perfiles, o (c) sacar del todo las palabras en itálica recuadradas («perfil», «noches», «cajitas»)?
- Logos: ¿tenés los originales en vector (SVG, AI o PDF) de VITA, Compara tu Obra Social, Automotores Kocos y Kocos Marketing? Si no, ¿autorizás redibujarlos en vector a partir de los actuales? Sin pagar nada: lo hace Claude.
- Efecto 3D de la entrada: ¿(a) los cuatro logos en placas con relieve que giran y se acomodan como puertas a cada perfil, (b) una escena de partículas con la marca del panel que se arma y da paso al PIN, o (c) las cuatro tarjetas de perfil que se despliegan en 3D? En todos los casos el PIN aparece enseguida.
- Tarjetas de colores pastel (lavanda, rosa, menta, beige) de Hoy, Resumen, Resultados y Laboratorio: ¿se reemplazan por superficies grafito con el color de cada marca como detalle, o querés conservar algún pastel?

## Herramientas usadas

- Skill kocos-crm-diseno-y-accesibilidad (criterios del proyecto y WCAG AA)
- Skill ui-design-review:ui-review (método de revisión: propósito, jerarquía, consistencia, aspecto genérico de IA, accesibilidad)
- Read sobre las capturas 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 16, 17, 25, 28, 31, 32 y 37 del recorrido
- Bash con grep, sed y awk sobre el repo (solo lectura). Graphify no estaba instalado en este entorno, así que ubiqué el código con grep
- Python con PIL para decodificar los logos WebP incrustados en los SVG y medir su tinta, y para calcular los contrastes WCAG
- Supabase execute_sql: solo SELECT sobre information_schema y sobre el origen de los logos y las claves de color de brand_briefs (datos de marca, sin datos de prospectos)
- Lectura de cerebro/02-ordenes-vigentes.md (órdenes del 22/11 y del 27/11) y de cerebro/14-estilo-del-dueno.md
- Revisé _rutas.json y _errores.txt del recorrido (tiempos y 404)
- No usé frontend-design ni design:design-critique: con las dos skills de arriba alcanzó para los criterios de esta auditoría
