# Oficina con agentes · especificación visual a partir de los reels de referencia

Documento para los agentes de diseño y de frontend que van a reconstruir la «Oficina» del panel. Sale de ver cuadro por cuadro los dos reels que mandó el dueño. Todo lo que dice **(medido)** sale de los cuadros; lo que dice **(estimado)** es inferencia con muestreo de 2 cuadros por segundo (±0,5 s).

## 0. Fuentes y cómo se vieron

| | Reel 1, la referencia principal | Reel 2, el vocabulario de diseño |
|---|---|---|
| URL | instagram.com/reel/Df2metRMxRX | instagram.com/reel/Df93dArgY10 |
| ¿Se bajó? | Sí, con yt-dlp directo, sin cookies | Sí, con yt-dlp directo, sin cookies |
| Duración y formato | 27,5 s, vertical 1080×1920 | 57,8 s, vertical 1080×1920 |
| Qué es | Un celular filma un monitor curvo ultrapanorámico que muestra una oficina 3D. Una mano se mueve frente a la pantalla y dirige la cámara. Lleva subtítulos quemados y es la promo de una clase. | Un motion graphic que explica Bento grid, Glassmorphism, Neumorphism, Gradient mesh y Parallax, cada uno con su prompt de ejemplo |
| Audio | La transcripción automática falló porque faster-whisper no es compatible con la versión de PyAV instalada. No hacía falta: los subtítulos están quemados en la imagen. | No se transcribió. Todo el texto está en pantalla. |

**Advertencia de medición:** en el reel 1 el monitor está filmado con un celular. Los colores llegan lavados y más cálidos, y la curvatura del monitor deforma la perspectiva en los bordes. Por eso los hex de la §2 se ajustaron a ojo y conviene calibrarlos contra el render propio.

Cuadros completos en `reel1/frames`, `reel2/frames`, `reel1/crops` (solo el monitor, a 2 cuadros por segundo, con la hora sobreimpresa) y `reel1/hd`. Los cuadros clave están en `clave/`:

| Archivo | Momento | Qué muestra |
|---|---|---|
| `01-oficina-vista-3-4-tarjeta-flotante-lucia.jpg` | 0:00,3 | El plano tipo: vista 3/4 con la tarjeta flotante amarilla al 12 % |
| `02-primer-plano-agente-tecleando-progreso-amarillo-28.jpg` | 0:02,6 | Primer plano de un agente tecleando: cubículo, mampara, planta y monitor |
| `03-transicion-zoom-out-lamparas-ventanal-noche.jpg` | 0:03,2 | La cámara se aleja: lámparas colgantes, ventanal de ciudad de noche, cartel «BUILD · 7 AGENTES» |
| `04-plano-medio-estado-entrego-verde-y-etiquetas-de-piso.jpg` | 0:04,1 | Tres estados a la vez (verde ENTREGÓ, amarillo trabajando, gris en espera) y las placas con el nombre en el piso |
| `05-vista-cenital-sala-equipo-desarrollo-7-agentes.jpg` | 0:05,2 | Vista desde arriba de la sala «EQUIPO DESARROLLO», con 7 puestos en dos filas (4 y 3) y una sala vecina verde |
| `06-destello-de-entrega-tarjeta-verde-mateo.jpg` | 0:09,6 | El destello blanco cuando un agente termina; la tarjeta pasa a verde |
| `07-glifo-flotante-roas-sobre-agente.jpg` | 0:21,1 | Una palabra que sube flotando sobre un agente («ROAS»); se ve el detalle del personaje |
| `08-tarjeta-tomi-mas1-y-grilla-de-cubiculos.jpg` | 0:23,6 | Tarjeta con «+1» flotante y la grilla de cubículos de fondo |
| `09-ref-bento-grid.jpg` | 0:09,6 del reel 2 | Bento con seis tarjetas de tamaños distintos |
| `10-ref-glassmorphism-tarjeta.jpg` | | Tarjeta de vidrio esmerilado sobre círculos de color |
| `11-ref-gradient-mesh.jpg` | 0:36,6 del reel 2 | Malla de degradados en violeta, magenta y cian |
| `12-ref-parallax-hero.jpg` | 0:44,3 del reel 2 | Hero con capas en parallax: sol, montañas y texto |

Contexto del guion del reel 1 (subtítulos, sin datos personales): «una marca manejada por agentes de inteligencia artificial donde cada uno se encarga de cumplir una función: armar los anuncios, buscar los productos, hacer el sitio web, hasta dejar todo prácticamente listo». El mensaje visual que hay que reproducir es **un equipo que trabaja solo mientras uno lo mira**.

---

## 1. Cámara y perspectiva

- **Proyección:** 3D en perspectiva real, no isométrica. El campo de visión es moderado, unos 35–45° **(estimado)**: los escritorios del fondo se achican y convergen.
- **Plano por defecto:** picado de unos 30–40° sobre el piso **(estimado)**, de 3/4, con la fila de cubículos en diagonal de izquierda abajo a derecha arriba. Se ve el ventanal del fondo con la ciudad de noche (`01`).
- **Tres alturas de cámara** que la animación alterna:
  1. **Puesto, en primer plano** (`02`, `06`, `07`): un agente ocupa un tercio de la pantalla y se ven su tarjeta, su monitor, la planta y la lámpara de escritorio. Es el plano más usado: unos 20 de los 27 segundos.
  2. **Plano medio de una fila** (`04`, `08`): de 3 a 6 puestos y las placas del piso.
  3. **Vista cenital de la sala** (`05`): mirando casi en picado de 80–90°, con toda la sala, el cartel del equipo y el borde de la sala vecina.
- **Movimientos (medidos con el reloj de los crops):**
  - 0:00–0:02,5: la cámara se queda en el puesto de Lucía con una deriva lenta, como de órbita.
  - 0:02,5–0:04,0: se aleja hacia atrás y hacia arriba hasta el plano medio.
  - 0:04,5–0:05,0: **inclina hasta la vista cenital en unos 0,5 s**. Es el movimiento más llamativo.
  - 0:05,0–0:07,5: se queda en la cenital con una leve deriva.
  - 0:08,0: **baja en picada** hasta el puesto de Mateo.
  - Después hace paneos laterales de puesto en puesto (Mateo, Sofi a los 11,5 s, Nico a los 18,5 s, Tomi a los 22,5 s y Bruno a los 27 s). Se queda unos 3,5 a 4 s en cada uno y tarda unos 0,4–0,7 s en pasar de uno a otro **(estimado)**.
- **Cómo se siente:** movimientos con suavizado ease-in-out, sin cortes secos. Entre plano y plano la cámara nunca queda quieta del todo: tiene un vaivén suave, como de órbita. Parte de ese vaivén puede ser el pulso de quien filma con el celular; en la web conviene una deriva de ±0,5° muy lenta, de unos 8 s por ciclo.
- **Cómo se maneja en el video:** la persona mueve la mano frente al monitor y la cámara la sigue. Barrer de costado pasa al agente siguiente, empujar con la palma abierta aleja la cámara, y hay un pulgar arriba a los 7–7,5 s. **No se puede confirmar** si es pantalla táctil o seguimiento de la mano con la webcam: en varios cuadros la mano no toca el vidrio. Para la web, ver §4.

## 2. Escena

### 2.1 Qué hay en la escena

- **Sala de planta abierta** apoyada sobre una **alfombra lavanda o violeta** que marca la sala de cada equipo. Alrededor, **piso de tablas de madera** naranja y marrón alternadas, con un patrón grande de ladrillo. La sala vecina tiene **piso verde menta** (`05`), así que el color del piso identifica a cada equipo.
- **Cubículos:** un escritorio de madera clara, con tapa naranja-miel y frente en tono madera, sobre patas negras finas. Lleva un **monitor negro** con un punto de color en el centro de la pantalla (el «estado» de la pantalla, verde agua o amarillo), una **lámpara de escritorio articulada** fina, una **planta suculenta en maceta** de terracota o blanca, una taza y alguna hoja. Lo separan **mamparas de vidrio esmerilado translúcido con marco de madera naranja**.
- **Silla de oficina** gris con respaldo curvo.
- **Pared del fondo** blanca cálida con un **ventanal enorme a una ciudad de noche**: edificios azul oscuro y violeta con ventanitas encendidas, amarillas y algunas rojas. Abajo, un zócalo o repisa de madera oscura.
- **Plantas grandes de interior,** tipo yuca o palmera, en macetas blancas en las esquinas.
- **Lámparas colgantes** de cúpula, blancas o crema, con cable negro, sobre cada fila (`03`, `05`). Los cables se ven como líneas desde la vista cenital.
- **Cartel colgante del equipo:** una placa negra con borde amarillo inclinado y tipografía negrita en mayúsculas, «EQUIPO DESARROLLO», con un subtítulo en amarillo, «BUILD · 7 AGENTES» (`05`, `03`).
- **Un objeto esférico grande** metálico al costado de la sala, en la cenital (`05`). Puede ser una mesa de reuniones redonda vista desde arriba o un adorno.
- **HUD de la pantalla** (no forma parte del mundo 3D):
  - Arriba a la derecha, un chip con un reloj «00:04» y un chip verde con un monto «$5…», que parece un contador de tiempo y de costo.
  - Abajo a la izquierda, una fila de píldoras oscuras chicas con una activa en amarillo, que parecen filtros o comandos.
  - Arriba al centro, un tooltip oscuro con una línea de texto.
  - Todo es diminuto: el texto no se lee en la filmación.

### 2.2 Paleta aproximada

| Rol | Hex de muestra (medido) | Hex propuesto (ajustado a ojo) |
|---|---|---|
| Piso de madera claro | `#BB681E` | `#C9732E` |
| Piso de madera oscuro | `#83372A` | `#8A3B24` |
| Piso «ladrillo» en la cenital | `#993F19` | `#A5481F` |
| Alfombra de la sala (violeta) | `#968BBD` / `#9499CF` | `#8E8FD6` |
| Piso de la sala vecina (menta) | `#7DA48A` | `#86C9A4` |
| Tapa del escritorio | (mezclada) | `#E9A94B` |
| Frente del escritorio | `#85573A` | `#C98A45` |
| Marco de las mamparas | (mezclado) | `#E39A3B` |
| Mampara de vidrio | `#D6B584` (vidrio sobre madera) | `rgba(235,240,255,.35)` |
| Pared | `#DFD2DB` | `#EEE8EC` |
| Ventanal de noche | `#362D3C` | `#1E2244`, con luces `#F5D36B` |
| Cuerpo y gorra del personaje | `#63616F` | `#5E6070` |
| Cara y visera del personaje | `#B48D5C` | `#E2A35A` |
| Planta | `#366C34` | `#4FA35A` / `#7CCB6B` |
| Tarjeta flotante (fondo) | `#282834` / `#3D3D3D` | `#1C1D26` al 92 % de opacidad |
| Borde y barra amarillos (trabajando) | `#DAC433` / `#C2A036` | `#F2C531` |
| Borde, barra y chip verdes (entregó) | `#75D2A5` / `#6DCA9E` | `#6FD3A3` |
| Pantalla del monitor (punto) | `#B0D2C7` | `#A8E0CF` |
| Destello de entrega | `#E5E5E7` | `#FFFFFF` con bloom cálido `#FFE9B0` |
| Placa del piso | `#3C374E` | `#2B2838` al 85 % |

Punto de color por agente, como identidad: azul `#4F8BFF`, violeta `#9B6BFF`, coral `#FF5C5C`, amarillo `#F2C531`, turquesa `#3ED6C6` y lavanda `#B9B3E6` **(estimado)**.

### 2.3 Materiales e iluminación

- **Estilo:** low-poly y estilizado, a medio camino entre juguete y diorama. Usa colores planos con sombreado suave, sin texturas fotográficas. No hay neón: el «brillo» lo dan el bloom de los destellos y las lámparas.
- **Materiales:**
  - Madera mate con un poco de brillo.
  - Vidrio esmerilado translúcido en las mamparas: deja ver las sombras de atrás.
  - Plástico mate en los personajes.
  - Metal satinado en las patas, las lámparas y la esfera.
- **Luz:**
  - Ambiente cálida de día dentro de la oficina y noche afuera. Ese contraste es lo que da el clima.
  - Una luz principal suave desde arriba a la izquierda, con **sombras de contacto suaves** bajo los escritorios y las sillas, y algo de oclusión ambiental en las esquinas.
  - Cada lámpara de escritorio forma un charco de luz cálida en la tapa.
- **Efectos:** bloom leve en los destellos, en el ventanal y en las cúpulas, y una profundidad de campo suave en los primeros planos (el fondo se desenfoca un poco en `02` y `07`).

## 3. Personajes y agentes

- **Aspecto:**
  - Figuras tipo chibi o muñeco: cabeza grande y redonda, torso corto y brazos de cápsula, sin dedos detallados.
  - **Gorra gris con un logo amarillo chico** (un «7») y la cara cubierta por una **visera o antiparras** color piel o naranja, así que no se ven facciones.
  - Buzo gris oscuro. Todos llevan el mismo modelo y los distingue **el punto de color y la tarjeta**, no la ropa (`07`).
- **Qué hacen:**
  - **Teclean** sentados, con los brazos alternando sobre el teclado. Es el estado base y casi todo el video.
  - **Celebran al terminar:** levantan los dos brazos, como un festejo, durante 1 a 1,5 s cuando la tarjeta pasa a «ENTREGÓ» (Tomi, de 0:25 a 0:26).
  - **En el video no caminan ni llevan papeles ni se reúnen.** Todo el movimiento está en el puesto, los efectos y la cámara. Caminar sería un agregado propio (ver §7, opcional).
- **Cómo muestran el estado:**
  1. **Tarjeta flotante sobre la cabeza,** siempre mirando a la cámara:
     - Forma de rectángulo redondeado (radio de unos 14 px a escala), fondo casi negro.
     - **Borde de 2 px del color del estado.**
     - Adentro: punto de color, **nombre** en negrita blanca (unos 18 px) y **rol** debajo («Investigación», «Branding», «Copywriter», «Fotógrafo», «Dev Shopify», «Director») en gris claro, más chico.
     - **Chip de estado** a la derecha: porcentaje en amarillo («12 %», «28 %»), «ENTREGÓ» en verde o «EN ESPERA» en gris.
     - **Barra de progreso** fina abajo.
     - Colgando de la tarjeta, un **tooltip negro diminuto** con la tarea actual en una línea.
  2. **Colores del estado:**
     - Trabajando: borde, barra y chip amarillos.
     - Entregó: borde verde, barra verde completa y chip «ENTREGÓ».
     - En espera: tarjeta gris apagada, sin borde de color y con más transparencia (Mateo al principio, `01`).
     - La tarjeta del agente enfocado es más grande y opaca. Las del resto se achican y pierden opacidad con la distancia.
  3. **Glifos flotantes según el rol** que suben del agente mientras trabaja y se desvanecen: «{ }» y «</>» (desarrollo), «$», «#», «AD», «ROAS», «CTR» (anuncios) y «+1» (cuando suma una entrega). El texto es blanco o grisáceo, a veces con un brillo suave (`07`, `08`).
  4. **Destello de entrega:** un estallido de luz blanca cálida con partículas tipo confeti blanco sobre el puesto (`06`), al mismo tiempo que la tarjeta cambia a verde.
  5. **Pantalla del monitor:** muestra un punto de color, que funciona como un LED de actividad.
  6. **Placas en el piso** delante de cada puesto, visibles en los planos medios (`04`): un rectángulo oscuro translúcido con el punto, el nombre grande y el rol.

## 4. Interacción

En el video solo se ve control por gestos de la mano: barrer, empujar con la palma y señalar con el dedo. No se ven clics, paneles ni menús, salvo el HUD diminuto. Para la web se propone esta interacción equivalente:

| Gesto en el video | Equivalente en la web |
|---|---|
| Barrer al costado → siguiente agente | Flechas `←`/`→`, botones «Anterior» y «Siguiente», deslizar en táctil y rueda horizontal |
| Palma que empuja → alejar | `Esc`, `-` o un botón «Ver sala» → plano medio; un botón «Vista de planta» → cenital |
| Señalar un puesto → acercarse | Clic o `Enter` sobre un agente o su tarjeta → la cámara vuela al puesto y se abre un **panel lateral** |

- **Hover:** la tarjeta sube 4 px, el borde gana brillo y se ilumina un aro en el piso del puesto. En el video hay unos **aros concéntricos tenues** bajo algunos puestos (`01`, `05`), que pueden reutilizarse como indicador de foco. El cursor cambia a puntero.
- **Panel del agente:**
  - Un cajón de vidrio oscuro a la derecha (glassmorphism del reel 2) con rol, tarea actual, progreso, últimas entregas y acciones.
  - En celular se abre como una hoja que sube desde abajo.
  - Cuando se abre, la cámara corre el puesto hacia la izquierda para que el panel no lo tape.
- **Selector de sala:** pestañas o píldoras arriba con cada equipo, a la manera de las píldoras del HUD del video.
- **Control por webcam como en el video:** no se recomienda (pide permisos, pesa y genera preocupación por la privacidad). Queda como un posible juguete futuro.

## 5. Ritmo y animaciones

Todos los tiempos son **(estimados)**: salen de 2 cuadros por segundo.

| Animación | Duración | Easing | Bucle |
|---|---|---|---|
| Teclear (brazos alternados) | 0,25–0,35 s por ciclo | lineal o seno | infinito mientras trabaja, con desfase aleatorio por agente |
| Respirar o balancearse en la silla | 3–4 s | seno | infinito, amplitud de 1–2° |
| Glifo flotante | sube 30–50 px en 1,6–2,2 s | ease-out; la opacidad hace 0 → 1 → 0 | uno cada 2,5–5 s por agente que trabaja, aleatorio |
| La barra de progreso avanza | interpolación de 400 ms en cada cambio de dato | ease-out | según los datos |
| Pasar de amarillo a verde (entrega) | 300 ms el borde y la barra; el chip entra con escala 0,8 → 1 | ease-out con un leve rebote (`cubic-bezier(.34,1.56,.64,1)`) | una vez |
| Destello de entrega | 600–900 ms; el pico de luz a los 150 ms | ease-out | una vez |
| Festejo con brazos arriba | 1,0–1,5 s | ease-in-out | una vez y vuelve a teclear |
| «+1» | 1,2 s, sube y se desvanece | ease-out | una vez por entrega |
| Vuelo de la cámara de puesto a puesto | 600–900 ms | `cubic-bezier(.65,0,.35,1)` | según la interacción |
| Paso de plano medio a cenital | 500–700 ms (en el video, unos 0,5 s) | ease-in-out | según la interacción |
| Deriva de la cámara en reposo | 8–12 s | seno | infinito, ±0,5° |
| Pulso de la tarjeta enfocada | 2 s | seno | infinito, sombra o brillo de 0,6 a 1 |
| Ventanal de noche | parpadeo esporádico de alguna ventana cada 3–6 s | instantáneo | infinito |

Ritmo general: **algo pasa en algún lugar de la escena cada 1 a 2 segundos** (un glifo, una barra que avanza, una entrega), pero no todo a la vez. Ese escalonamiento es lo que la hace sentir viva.

## 6. Qué la hace sentir «premium y viva» frente a una grilla de tarjetas

1. **Espacio y lugar:** hay un piso, una pared, una ventana y un afuera de noche. El trabajo pasa en un sitio, no en una tabla.
2. **La cámara cuenta la historia:** acercarse a quien trabaja, alejarse para ver el equipo y bajar desde arriba. El zoom semántico (sala → fila → puesto) reemplaza la navegación por páginas.
3. **Se lee de un vistazo:** amarillo es trabajando, verde es entregó, gris es en espera. La tarjeta flotante dice quién, qué y cuánto, sin abrir nada.
4. **Microvida continua y escalonada:** teclear, glifos del rol, barras que avanzan, parpadeos en el ventanal y deriva de la cámara.
5. **Recompensa visible:** el destello, el festejo y el «+1» convierten un cambio de estado en un momento.
6. **Personalidad sin caras:** personajes simpáticos y genéricos, todos iguales, con identidad por color y rol. No es inquietante ni parece infantil.
7. **Contraste de materiales:** madera cálida, vidrio esmerilado, tarjetas negras con borde de color y la noche fría afuera.
8. **Jerarquía de profundidad:** lo enfocado es grande, opaco y nítido; lo lejano es chico, translúcido y algo desenfocado.
9. **HUD discreto:** un reloj, un costo y filtros en píldoras. Parece la consola de un juego de gestión, no un formulario.
10. **Del reel 2 se toma el lenguaje del «cromo»** (todo lo que rodea la escena):
    - Tarjetas de vidrio esmerilado (glassmorphism) para el panel lateral.
    - Bento para el resumen de métricas junto a la oficina.
    - Gradient mesh violeta, magenta y cian (`#2E236F`, `#5F1B40`, `#1E646C` sobre `#110F1C`) solo como fondo de los encabezados o de los estados vacíos.
    - Parallax suave con el puntero en la versión CSS.
    - El neumorphism del reel 2 (`#E9EAF0`, botones en relieve) **no** encaja con esta estética y conviene evitarlo.

Paleta del bento del reel 2 **(medido)**: violeta `#8871F9`, lavanda `#A8B0F9`, menta `#6AFBD4`, amarillo `#FAD36A` y rosa `#F49DD4`, sobre `#110F1C`. Usa tipografía grotesca geométrica negrita para los títulos y una serif itálica para los acentos, con un marco de selección violeta sobre las palabras clave.

## 7. Propuesta de reconstrucción en la web

### 7.1 Arquitectura en tres capas, siempre con la capa 0

1. **Capa 0, la fuente de verdad accesible (DOM):** una lista semántica de salas y agentes (nombre, rol, estado, progreso, tarea) renderizada en el servidor.
   - Los lectores de pantalla y el teclado la recorren siempre.
   - Un `aria-live="polite"` anuncia las entregas, agrupadas a no más de una cada 10 s.
   - La escena visual es `aria-hidden` y un espejo de esta lista.
2. **Capa 1, diorama en CSS 3D** (para celular, movimiento reducido, sin WebGL o con equipos lentos):
   - Una sala en perspectiva axonométrica con `transform: rotateX(55deg) rotateZ(-45deg)` sobre un plano. Los puestos son `div` con caras extruidas (tapa más frente) y los personajes son SVG o PNG en sprites de 2 o 3 cuadros (teclear, festejar).
   - Las tarjetas flotantes son HTML normal posicionado encima: texto nítido y accesible.
   - El «zoom» es `transform: scale() translate()` sobre el contenedor de la sala, con la transición de la §5.
   - Peso: unos 0 KB de librerías y 30–80 KB de sprites en SVG o WebP.
3. **Capa 2, escena 3D con react-three-fiber** (escritorio con WebGL2 y sin movimiento reducido):
   - Es la que logra lo que pide el dueño: cámara libre (cenital ↔ 3/4 ↔ primer plano), luz, sombras de contacto y profundidad.

**Recomendación:** la capa 2 en escritorio y la capa 1 como alternativa automática. Si hay que elegir una sola por tiempo o peso, la capa 1 bien hecha da un 70 % de la sensación. La vista cenital y el vuelo de cámara del video solo se logran con la capa 2.

### 7.2 Detalles de la capa 2

- **Dependencias:** `three`, `@react-three/fiber` y, con importaciones puntuales, `@react-three/drei` (`ContactShadows`, `Html` o `Billboard`, `CameraControls`, `Instances`). Peso aproximado: three ~155 KB gz + r3f ~45 KB gz + drei con tree-shaking ~20–40 KB gz, unos **220–250 KB gz** en total.
- **Carga:** `next/dynamic(() => import('./OficinaEscena'), { ssr: false })` solo en la ruta de la Oficina. Mientras carga se muestra la capa 1 o un póster estático (WebP de la sala).
- **Modelos sin descargas pesadas:**
  - Personajes armados con primitivas: cápsula de torso, esfera de cabeza, cilindro achatado de gorra, caja de visera y cápsulas de brazos. Se animan por código (rotación de los brazos con seno), sin esqueletos ni GLTF.
  - Escritorio, mampara, monitor, lámpara y maceta también salen de cajas y cilindros, con `InstancedMesh` para todos los puestos.
  - Si se quiere un modelo más fino, un único GLB con meshopt o Draco de **menos de 300 KB** con todo el kit.
- **Materiales y luz:**
  - `MeshStandardMaterial` con colores planos, rugosidad 0,7–0,9.
  - `HemisphereLight` cálida más una `DirectionalLight` **sin sombras dinámicas**: las sombras se resuelven con `ContactShadows` horneadas una vez (`frames={1}`).
  - El vidrio de las mamparas es `MeshPhysicalMaterial` con `transmission`, **solo en calidad alta**; en calidad media va `transparent` con `opacity .35`.
  - El ventanal es un plano con textura generada en canvas (edificios y ventanitas) y emisivo.
- **Brillo sin postprocesado:** el bloom de `postprocessing` suma unos 60 KB y cuesta GPU. Se lo imita con sprites aditivos (`AdditiveBlending`) para el destello y las cúpulas. El bloom real queda como opción de calidad alta.
- **Tarjetas flotantes:** `drei/Html` con `transform={false}` y `occlude`, o tarjetas DOM posicionadas proyectando la posición de la cabeza a la pantalla en un único `useFrame`. Siempre en HTML, nunca texto en el canvas, por nitidez y accesibilidad. Escalado y opacidad según la distancia.
- **Glifos y partículas:** un pool fijo de 30–40 sprites de texto (canvas → textura) reciclados, sin crear objetos por evento.
- **Cámara:** `CameraControls` de drei con `setLookAt(..., true)` para los vuelos y presets por sala y por puesto. La órbita libre queda desactivada: solo presets más una deriva leve. Así no se desorienta nadie.
- **Rendimiento:**
  - `dpr={[1, 1.5]}` y `frameloop="demand"` cuando no hay animación visible, invalidando en cada tic de animación a 30 fps.
  - Pausa con `document.visibilitychange` y cuando el canvas sale de la pantalla (`IntersectionObserver`).
  - `PerformanceMonitor` de drei para bajar la calidad: sin vidrio físico, menos partículas y DPR 1.
  - Objetivo: 60 fps en una notebook integrada con 7–12 agentes por sala.
- **Datos:** el estado (trabajando/entregó/en espera y el progreso) llega de Supabase Realtime o de un sondeo. Ese estado se mapea a animaciones con una **función pura en `src/lib/`** (por ejemplo `estadoVisualDelAgente`) con pruebas unitarias, según la convención del repo.

### 7.3 Reglas del proyecto que afectan la escena

- **Cada rubro separado:** **una sala por perfil** (Jurídico Civil, Jurídico Penal, Coberturas médicas, Autos 0 km, Marketing).
  - La vista cenital muestra solo la sala del rubro activo.
  - **No** hay salas vecinas visibles de otro rubro. En el video se ve la sala verde de al lado; eso hay que reemplazarlo por pared o vacío.
  - El cambio de sala es un selector, no un paneo continuo.
- **Datos personales:** las tarjetas, los glifos y los tooltips muestran **rol, tarea genérica y progreso**, nunca nombres ni datos de prospectos. Los nombres de agente del video (Lucía, Mateo…) son ficticios y no hace falta copiarlos.
- Los glifos se adaptan por rubro y rol: por ejemplo «§» o «art.» para jurídico, «$» y «CTR» para marketing y «0 km» para autos.

### 7.4 Movimiento reducido y celular

- **`prefers-reduced-motion: reduce`:**
  - Capa 1 con la cámara fija, los cambios de plano por corte (`transition: none`), sin teclear, sin glifos, sin destello y sin deriva.
  - El cambio de estado se muestra solo con el color, el texto y el ícono de la tarjeta.
  - Las barras saltan al valor nuevo sin interpolar.
- **`prefers-reduced-transparency`** o el modo de alto contraste: tarjetas y paneles opacos (`#1C1D26` sólido) y mamparas opacas.
- **Celular (menos de 768 px):**
  - Capa 1 con la sala en perspectiva arriba, con altura limitada a unos 45vh.
  - Debajo, una **lista de puestos desplazable** con las mismas tarjetas.
  - Tocar abre una hoja desde abajo.
  - Gestos: deslizar sobre la sala cambia de agente.
  - Sin WebGL por defecto. Se puede ofrecer «Ver en 3D» como opción.
- **Contraste y estados:**
  - Texto blanco sobre `#1C1D26`: mayor a 15:1.
  - El amarillo `#F2C531` y el verde `#6FD3A3` sobre `#1C1D26` dan más de 9:1 en chips y barras. **El estado nunca va solo por color:** el chip lleva texto («Trabajando 28 %», «Entregó», «En espera») y un ícono.
- **Teclado:**
  - Cada agente es un botón de la capa 0 con foco visible.
  - El foco mueve la cámara al puesto (o lo resalta en la capa 1).
  - `Esc` cierra el panel y devuelve el foco al agente.

### 7.5 Riesgos de peso y de producto

| Riesgo | Mitigación |
|---|---|
| Unos 250 KB gz de JavaScript extra en la ruta de la Oficina | Carga diferida solo en esa ruta, póster previo y que el resto del panel no lo importe. Medir con `next build` y el analizador de bundle. |
| GPU en notebooks viejas o en celulares: calor y batería | Capa 1 por defecto en celular, `PerformanceMonitor`, `frameloop="demand"` y pausa fuera de la pantalla |
| Vidrio con `transmission` y bloom muy caros | Solo en calidad alta, con imitaciones por defecto |
| Texto dentro del canvas ilegible o inaccesible | Tarjetas siempre en HTML |
| Cámara libre que desorienta | Solo presets con transiciones; sin órbita libre |
| Demasiada animación que distrae del trabajo | Escalonar los eventos (máximo 2 glifos simultáneos por sala) y un control «Pausar animaciones» persistente por usuario |
| Hidratación y SSR con three | `ssr: false` y un componente cliente aislado |
| Que parezca un juego y no una herramienta | El HUD con métricas reales y el panel lateral con acciones concretas; la escena es la puerta a los datos, no un adorno |
| Mezclar rubros en una vista | Una sala por rubro y ninguna vista global con salas visibles de otro perfil |

### 7.6 Orden sugerido de implementación

1. La capa 0 (lista accesible) y la función pura de estado visual, con sus pruebas.
2. La capa 1 en CSS 3D con tarjetas, estados y entrega (destello CSS con `@keyframes`), más movimiento reducido y celular.
3. La capa 2 con react-three-fiber detrás de una detección de capacidad, con los presets de cámara (sala, fila, puesto, cenital).
4. Pulido: glifos por rol, festejo, ventanal vivo, HUD y panel de vidrio.
