# Dirección de arte del motor de reels v2 (27/11)

Guía ejecutable para el motor v2 (`historias-prototipo/tanda/motor/` y el futuro `motor2/estilos/<marca>.js`). Reemplaza el estilo del piloto de VITA que el dueño rechazó el 27/11 (fondo oscuro con rayas y bokeh dorado, títulos en mayúscula dentro de recuadros dorados, íconos planos, cartas con «?»).

Estado: **especificado**. No implementado, no renderizado, no probado. Antes de producir en serie: un cuadro de prueba por marca, revisado con la sección 5.

Fuentes: `cerebro/04` (final), `cerebro/14` (gustos y rechazos), `.claude/referencias/redes/direccion-de-arte.md`, `marcas.md`, `03-referencias.md` (16 reels y 3D Atlas), `04-herramientas-motor.md` (three.js r170 sin GPU), `05-estrategia.md` y la hoja del piloto rechazado.

---

## 1. Principios

### 1.1 Por qué el piloto se ve barato (leído en la hoja de contactos)

| Qué se ve en el piloto | Por qué abarata | Regla nueva |
|---|---|---|
| Fondo de rayas verticales doradas con bokeh y haces | Es un papel tapiz: decora, no cuenta nada. Grita «plantilla de casino» o «IA» | El fondo **es** la escena: un lugar físico con piso, horizonte y luz |
| Objetos (auto, documento, cámara) pegados encima, sin piso común ni sombra compartida | Parecen stickers: no hay mundo, no hay escala | Todo apoya en una superficie y recibe la misma luz y sombra |
| Íconos planos (cámara, escudo, marcador) dentro de tarjetas | Clip-art de banco de íconos: es lo más genérico posible | Objetos con volumen y material, y con sentido narrativo (el papel, la patente, el recibo) |
| Título en mayúsculas serif dentro de un recuadro dorado, repetido en 4 cuadros | Texto como etiqueta encima de la imagen y no dentro de ella. La mayúscula serif en caja = look de plantilla | El tema vive dentro de la escena (cartel de calle, etiqueta, patente, pantalla). Sin recuadros |
| Título arriba y subtítulo en el medio, a la vez | Dos textos compiten: no hay jerarquía | Una sola capa de texto por vez |
| Todo dorado: fondo, títulos, cartas, subtítulos resaltados | Cuando todo es acento, nada es acento | Acento único que ocupa como mucho el 10 % del cuadro |
| La mitad de abajo del cuadro vacía (de y = 1000 a 1920 solo rayas) | Cuadro muerto en la zona que más se mira en el teléfono | La escena llega hasta el borde de abajo; el sujeto principal está entre y = 820 y y = 1160 |
| Subtítulo de 40 px, gris sobre gris en palabras inactivas («Te ofrecen arreglar») | No se lee a 390 px | Subtítulo de 68 a 76 px, blanco o tinta con contorno de 10 a 14 px |
| Cartas con «?» que se dan vuelta | Fórmula de plantilla, sin mundo | El progreso es parte de la escena (faroles que se encienden, frasco que se llena, piezas que se separan) |
| Cámara fija con zooms de golpe | Sin profundidad ni intención | Cámara que viaja por un solo mundo continuo, con velocidades definidas |

### 1.2 Qué hace premium a las referencias que eligió el dueño

1. **Un mundo, no un fondo.** konstruu (12), voceconstruiu (16) y los clips del Atlas son una maqueta continua: la cámara recorre el mismo lugar y cada razón es un plano nuevo del mismo mundo.
2. **Luz física.** Sol con dirección, sombras suaves de contacto, oclusión en las juntas y ciclo día → noche (12). La luz cuenta la historia: «se encienden las luces» es la resolución.
3. **Un material reconocible.** Arcilla con huellas, cartulina troquelada, plástico de juguete, metal de producto. Un solo material por pieza da coherencia y se siente artesanal.
4. **Cámara de maqueta.** Tele, vista de 3/4 desde arriba, poca profundidad de campo (miniatura real), órbitas y dolly lentos. Nada tiembla.
5. **El texto está dentro de la escena** (rótulo de plano, cartel, pantalla LED) o es un subtítulo palabra por palabra. Nunca un cartel encima.
6. **Algo avanza siempre** (contador, piezas, kilómetros) y está dibujado en el mundo, no en una barra de interfaz.
7. **Ver por dentro y cambio de escala** (11, 15, 16): el corte, los rayos X o el despiece son el momento «wow».
8. **Un solo color de acento, reservado para el final** (6: el neón «MON»; 12: la casa encendida).
9. **Loop:** el último cuadro empalma con el primero.

### 1.3 Las cuatro marcas, en una tabla

Para que no se confundan, las cuatro difieren en **todos** los ejes a la vez:

| Eje | VITA | Compara tu Obra Social | Automotores Kocos | Kocos Marketing |
|---|---|---|---|---|
| Estilo del Atlas | Tiny Diorama + Paper Pop-Up | Soft Clay + Marble Run | Studio Product + Exploded View + X-Ray | Toy Blocks + Device Hero (isométrico) |
| Mundo | Esquina porteña en maqueta sobre baldosa flotante | Mesa de arcilla vista desde arriba | Estudio de producto oscuro con piso espejado | Plano isométrico infinito de bloques de juguete |
| Luz | Sol natural de tarde que pasa a farol de noche | Luz de ventana difusa, alta y clara | Cajas de luz de estudio con contraluz azul | Sol duro de mediodía, sombras nítidas |
| Fondo | Claro (marfil y champagne) | Claro (menta) | Oscuro (tinta azul) | Claro (crema) |
| Cámara | Perspectiva tele, 3/4 desde arriba, lenta | Cenital, empujes cortos | Órbitas de producto, barridos rápidos | Ortográfica isométrica, saltos secos |
| Ritmo | Sereno: transiciones de 0,5 s | Blando: 0,35 s con rebote | Enérgico: 0,4 s con rampa de velocidad | Seco: 0,2 a 0,25 s con golpe |
| Tipografía | Manrope + Playfair cursiva en la palabra clave | Manrope sola (800 y 600) | Archivo ancho en mayúsculas + Plus Jakarta Sans | Outfit apretada en minúsculas + Manrope |

---

## 2. Por marca

Medidas en px sobre 1080 × 1920. «Acento único»: el único color saturado del cuadro, para la palabra activa, el objeto clave y la resolución. Ocupa como mucho el 10 % del área.

### 2.1 VITA Abogados: «Buenos Aires en maqueta»

**Concepto.** Una esquina porteña en miniatura (vereda con baldosas, cordón, árbol, farol, semáforo, kiosco, dos autos de maqueta) sobre una baldosa flotante con bisel, a la luz de una tarde de otoño. Los documentos son de cartulina y se despliegan como libro pop-up sobre la vereda. Figuras humanas solo como figuras de maqueta de arquitectura (sin rasgos, color plano navy o zafiro), siempre de lejos.

| Elemento | Especificación |
|---|---|
| Estilo Atlas | Tiny Diorama (mundo) + Paper Pop-Up (papeles, carpetas, calendario) |
| Fondo (cielo) | Degradé vertical muy suave `#F5F4F0` (arriba) → `#E7E2CE` (horizonte). Liso, sin texturas ni bokeh |
| Escena | Vereda `#D9D3C3`, cordón `#B9B2A2`, asfalto `#6D6D69`, fachadas `#E7E2CE` y `#C1AE7A` (líneas finas), autos `#112250` y `#3B507D`, árboles `#5E6B4E`, baldosa flotante con canto `#25282B` |
| Acento único | Dorado `#D4AF37`: el sello del papel clave, el farol que se enciende, la palabra activa |
| Prohibido en VITA | Rojo, verde semáforo saturado, dorado en superficies grandes, fondo navy liso |
| Tipografía | Manrope 700 (subtítulos, rótulos) · Playfair Display Italic 700 solo para la palabra clave activa y el tema dentro de la escena. Nunca en mayúsculas |
| Tamaños | Tema en la escena (cartel de calle o cartulina): Playfair Italic 112 px · Subtítulo: Manrope 700 72 px, interlineado 1,08 · Palabra activa: Playfair Italic 700 80 px · Rótulos de maqueta: Manrope 600 44 px · Contador (días, horas): Manrope 800 140 px con cifras tabulares |
| Luz | Sol `DirectionalLight` `#FFE2B8`, intensidad 2,2, elevación 32°, desde atrás a la izquierda (sombras hacia la cámara, dan volumen). `HemisphereLight` cielo `#EEF1F5`, suelo `#CDBFA3`, 0,6. Sombras de 2048 px con radio 4. GTAO activo (juntas de baldosas y cordón). Bloom apagado, salvo el farol del final (umbral 0,9, intensidad 0,6). Final: el sol baja a 12° y pasa a `#FFB878`, y el farol se enciende en `#D4AF37` |
| Cámara | Perspectiva, FOV 28° (tele de maqueta), elevación 35°. Órbita máx. 3°/s, dolly-in máx. 2 % de la distancia por segundo. Inclinación-desplazamiento con `BokehPass` en una banda horizontal: foco nítido en el 18 % central del alto, desenfoque arriba y abajo. Cambio de foco (rack focus) de 0,6 s para pasar de un objeto a otro |
| Easing | `power2.inOut` en cámara; `back.out(1.2)` solo en los pliegues de cartulina. Sin sacudidas |
| Karaoke | Páginas de 3 a 5 palabras, máx. 2 líneas, centradas en x = 510, banda y = 1260–1480. Resto: Manrope 700 blanco `#FFFFFF` con contorno `#112250` de 14 px. Activa: Playfair Italic 700 `#D4AF37` con el mismo contorno navy (contraste dorado/navy 7,3:1). Cambio de palabra en fundido de 120 ms, sin escala ni rebote |
| Logo | Pastilla navy `#112250` de 56 px de alto con esquinas de 28 px en x = 80, y = 236: logo dorado de 40 px + «VITA Abogados» Manrope 600 30 px `#F5F4F0`. Fija todo el reel, opacidad 100 %. Es el único elemento de interfaz |
| Contador / progreso | Dentro de la escena: **tres faroles** sobre la vereda que se encienden de a uno (paso 1, 2, 3). Si el guion tiene plazo: el número vive en un calendario de cartulina que pasa hojas (Paper Pop-Up), nunca en una barra |
| Transición entre pasos | La cámara viaja por la misma maqueta (dolly lateral 0,5 s `power2.inOut`) más cambio de foco al objeto nuevo. Para un documento: la carpeta pop-up se abre en el piso (bisagra de 0,45 s) |
| Cierre / loop | Último plano = mismo encuadre que el primero, pero de noche con los tres faroles dorados encendidos. El pedido («Comentá PLAZO») está escrito en el cartel de la calle con Playfair Italic. El último cuadro funde en 0,3 s con el primero |
| Escenas tipo de la tanda | «Recién chocaste. Esta frase, nunca»: dos autos de maqueta en la esquina; del capó sale un papel pop-up con la frase. «Te chocaron: el reloj de 3 años ya corre»: calendario de cartulina que pasa hojas sobre la vereda. «Viernes 18:05: te despiden»: la fachada de una oficina en la cuadra; la hora está en el reloj de la esquina |

### 2.2 Compara tu Obra Social: «la mesa de arcilla»

**Concepto.** Todo es plastilina sobre una mesa menta vista desde arriba: el recibo de sueldo, las monedas, dos frascos («lo que pagás» y «lo que usás»), la cartilla, una lupa. Marble Run: las monedas caen y ruedan. Sin personas; como mucho una mano de arcilla sin detalle.

| Elemento | Especificación |
|---|---|
| Estilo Atlas | Soft Clay (material) + Marble Run (recorridos de monedas y frascos que se llenan) |
| Fondo (mesa) | Menta `#DAF1DE` liso, con ruido de normal muy leve (huellas) para que se lea como arcilla |
| Escena | Objetos en salvia `#8EB69B`, bosque `#235347`, menta media `#D5E6DA`, gris verde `#587268`, blanco hueso `#F7F5EF` (recibos, monedas) |
| Acento único | Verde oficial `#003D3B`: el objeto que importa (la línea del recibo, el frasco que «gana») y la palabra activa |
| Prohibido en Coberturas | Rojo, estetoscopio, corazón con pulso, cruz roja, píldoras, guardapolvo, colores ajenos a la paleta |
| Tipografía | Manrope sola. 800 para el tema y la palabra activa, 600 para el resto |
| Tamaños | Tema dentro de la escena (letras de arcilla extruidas sobre la mesa o etiqueta de frasco): Manrope 800 120 px · Subtítulo: Manrope 600 72 px · Palabra activa: Manrope 800 76 px · Etiquetas: Manrope 700 48 px · Contador (monedas, porcentaje): Manrope 800 150 px |
| Luz | Luz de ventana difusa: `RectAreaLight` 5600 K arriba a la izquierda, intensidad 4, más relleno `HemisphereLight` blanco/menta 0,8. Sombras de contacto suaves (1024 px, radio 8), AO fuerte (es lo que da «arcilla»), exposición alta (high-key). Sin bloom |
| Cámara | Perspectiva, FOV 35°, cenital: elevación de 70° a 85° (flat lay). Empuje (push-in) máx. 4 %/s. Profundidad de campo corta: foco en el objeto activo, fondo apenas desenfocado. Para «ver de cerca» (la línea del recibo): macro con lupa en 0,5 s |
| Easing | `back.out(1.4)` con aplastar y estirar (escala Y 0,92 → 1,04 → 1) cuando algo cae o aparece. Duración base 0,35 s |
| Karaoke | Páginas de 3 a 4 palabras, banda y = 1260–1480, centradas. Resto: Manrope 600 blanco con contorno `#003D3B` de 12 px. Activa: relleno `#003D3B` con contorno blanco de 12 px, se infla de escala 1,00 a 1,06 con `back.out` en 150 ms |
| Logo | Pastilla blanca `#FFFFFF` de 64 px de alto, esquinas de 32 px, en x = 80, y = 236: logo de 48 px + «Compara tu Obra Social» Manrope 700 28 px `#0B2B26` |
| Contador / progreso | **Dos frascos** de arcilla transparente que se llenan con monedas; el número de monedas se escribe en la etiqueta del frasco. Para listas de 3: tres huecos en la mesa que se tapan con una ficha de arcilla |
| Transición entre pasos | Deslizamiento de la mesa: la cámara se corre en cenital 0,35 s y el objeto nuevo entra rodando o cae con rebote. O macro: la lupa atraviesa el objeto y abre la escena siguiente |
| Cierre / loop | El frasco «correcto» lleno y el otro vacío, mismo encuadre cenital del inicio. El pedido («Comentá CUOTA») está escrito con letras de arcilla que caen sobre la mesa. La última moneda rueda fuera del cuadro y entra en el primer cuadro |
| Escenas tipo | «¿Pagás por cosas que no usás?»: monedas que caen en dos frascos. «Tu recibo explicado»: recibo de arcilla con lupa sobre la línea de aportes. «Lo que dijo la Corte»: un expediente de arcilla que se abre como Paper Pop-Up sobre la mesa |

### 2.3 Automotores Kocos: «el 0 km por dentro»

**Concepto.** Estudio de producto nocturno: un 0 km genérico (sin marca ni modelo real), hecho de primitivas, sobre un piso espejado. Se despieza (Exploded View), se ve por dentro (X-Ray) y el final enciende las luces. Los documentos (ticket, formulario, crédito) aparecen como láminas que salen del auto despiezado. El ticket que se alarga es una tira de papel que sale de una ranura.

| Elemento | Especificación |
|---|---|
| Estilo Atlas | Studio Product + Exploded View + X-Ray |
| Fondo | Tinta `#000521` con un degradé radial muy amplio hacia `#020C47` detrás del auto (luz del estudio, no decoración) |
| Escena | Carrocería blanca perla `#F2F5FA` o navy `#011F65`, metal `#8A94A6`, vidrios `#0E4EB2` al 30 %, piso `#020C47` con reflejo de rugosidad 0,25 |
| Acento único | Azul `#207CCF` en luces, piezas clave y rótulos; `#4E9BE4` para texto (mejor contraste) |
| Prohibido en Autos | Logos o siluetas de marcas reales, patentes reales, llave con moño, confeti, precio o cuota en pantalla, naranja o dorado |
| Tipografía | Archivo (eje de ancho 112, peso 800, mayúsculas permitidas, interletrado −1 %) para el tema y la palabra activa · Plus Jakarta Sans 700 para el subtítulo |
| Tamaños | Tema dentro de la escena (pantalla LED del estudio o patente genérica): Archivo 800 mayúsculas 118 px · Subtítulo: Plus Jakarta Sans 700 68 px · Palabra activa: Archivo 800 mayúsculas 76 px · Rótulos numerados de piezas: Plus Jakarta Sans 700 44 px con número en Archivo 800 · Contador (odómetro): Archivo 800 160 px |
| Luz | Tres cajas de luz `RectAreaLight`: principal blanca 6500 K de arriba (intensidad 6) y dos tiras de contraluz `#207CCF` a los costados (intensidad 3), que dibujan el perfil. HDRI de estudio oscuro para reflejos. Bloom solo en faros y rótulos (umbral 0,85, intensidad 0,9). X-Ray: material fresnel `pow(1 − n·v, 2.5)` aditivo en `#4E9BE4` con `OutlinePass` |
| Cámara | Perspectiva FOV 24° para el producto, 50° adentro (X-Ray). Órbita de 6 a 8°/s. Barrido entre pasos (whip) de 0,35 s con desenfoque de movimiento. Rampa de velocidad: entra rápido y frena sobre la pieza (`expo.inOut`). Corte con `clippingPlanes` animado para entrar al motor |
| Easing | `expo.inOut` 0,4 s en cámara; piezas del despiece escalonadas 60 ms entre sí con `power3.out` |
| Karaoke | Una o dos palabras por golpe (estilo impacto), máx. 2 líneas, banda y = 1260–1480. Resto: Plus Jakarta Sans 700 blanco con contorno `#000521` de 10 px. Activa: Archivo 800 mayúsculas `#4E9BE4` (7:1 sobre tinta), entra subiendo 8 px en 150 ms `expo.out` |
| Logo | Sin pastilla: logo «S» de 64 px directo sobre la tinta en x = 80, y = 236, más «Automotores Kocos» Archivo 700 30 px blanco |
| Contador / progreso | Odómetro de tambor (Split-Flap) en una pantalla del estudio, o las piezas numeradas del despiece (1, 2, 3) con líneas guía finas de 3 px en `#4E9BE4` |
| Transición entre pasos | Barrido de luz: una franja blanca recorre la carrocería en 0,4 s y la cámara orbita en el mismo gesto a la pieza siguiente |
| Cierre / loop | El auto se rearma (despiece al revés, 0,8 s), los faros se encienden en `#207CCF` y el estudio queda en penumbra. El pedido («Comentá TICKET») aparece en la patente genérica (formato de patente, sin letras ni números reales) o en la pantalla LED. Mismo ángulo 3/4 del primer cuadro |
| Escenas tipo | «El ticket del 0 km»: tira de papel que sale de la guantera y se alarga mientras se suman rótulos sin cifras. «¿Contado, prendario o plan?»: tres autos idénticos en tres carriles de luz; ¿cuál sos? «Tu usado como parte de pago»: X-Ray del usado mostrando qué se revisa |

### 2.4 Kocos Marketing: «el negocio en bloques»

**Concepto.** Un barrio comercial de juguete en isométrico (vidriera, mostrador, caja, cartel) sobre un plano crema infinito, y un celular gigante (Device Hero) que se para en la vereda como un edificio: el chat se llena de mensajes sin responder. Plástico satinado de juguete, sombras nítidas, todo encastra.

| Elemento | Especificación |
|---|---|
| Estilo Atlas | Toy Blocks + Device Hero (con Floating Screens para el antes y el después) |
| Fondo | Crema `#FFE7D0` liso, plano infinito con grilla isométrica apenas marcada (`#F2D6BC`, 2 px) |
| Escena | Bloques en tinta `#1B1B1B`, carbón `#323232`, arena `#C9AC93`, marrón `#5D493D`, blanco `#FFFFFF`; celular negro `#1B1B1B` con pantalla blanca |
| Acento único | Naranja `#FC6E20`: notificaciones, la consulta perdida, la palabra activa, el botón |
| Prohibido en Marketing | Cohete, megáfono, bombilla, gráfico de barras genérico que sube, robots, cerebros, «IA» en letras brillantes, degradés violeta-azul |
| Tipografía | Outfit 800 (interletrado −3 %, en minúsculas y oración) para el tema y la palabra activa · Manrope 700 para el subtítulo |
| Tamaños | Tema dentro de la escena (cartel de la vidriera o pantalla del celular): Outfit 800 124 px · Subtítulo: Manrope 700 70 px · Palabra activa: Outfit 800 76 px · Burbujas de chat: Manrope 600 44 px · Contador (mensajes sin responder): Outfit 800 160 px en el globo de notificación |
| Luz | Sol duro de mediodía: `DirectionalLight` blanco cálido `#FFF4E8`, intensidad 2,6, elevación 50°, desde arriba a la izquierda; sombras de 1024 px **sin** radio (bordes nítidos de juguete). Hemisférica crema 0,7. AO suave. Bloom solo en las notificaciones naranjas |
| Cámara | `OrthographicCamera` isométrica (elevación 35,26°, azimut 45°). Desplazamientos secos sobre la grilla en 0,25 s `power4.out`; zoom ortográfico 1,00 → 1,15 en golpe de 0,2 s en las palabras clave. Sin órbitas: el isométrico no gira |
| Easing | `power4.out` y `back.out(1.8)` para bloques que caen y encastran. Duración base 0,2 a 0,25 s, en tiempo con la música |
| Karaoke | Páginas de 3 a 5 palabras, banda y = 1260–1480, alineadas a la izquierda en x = 80 (no centradas: es la marca más editorial). Resto: Manrope 700 tinta `#1B1B1B` con contorno crema `#FFE7D0` de 10 px. Activa: Outfit 800 tinta con **subrayado naranja** `#FC6E20` de 14 px que crece de izquierda a derecha en 180 ms (el naranja no va como texto sobre crema: 2,4:1) |
| Logo | Sin pastilla: logo «M» de 44 px de alto directo sobre crema en x = 80, y = 240, más «Kocos Marketing» Outfit 700 30 px `#1B1B1B` |
| Contador / progreso | Globo de notificación naranja en el celular gigante que sube (3, 12, 47 sin responder) o bloques que se apilan en una torre (uno por paso) |
| Transición entre pasos | Salto de la cámara por la grilla al lote de al lado (0,25 s) mientras el bloque nuevo cae y encastra con rebote. Antes/después: la misma vidriera se rearma bloque por bloque |
| Cierre / loop | Vuelta a la vidriera del inicio, ahora con el cartel encendido y el chat en 0 sin responder. El pedido («Comentá CHAT») está tipeado en la barra del chat del celular gigante. El último bloque cae en el lugar donde arranca el primer cuadro |
| Escenas tipo | «El celular que no para»: celular gigante en la vereda con globos naranja que se apilan. «Este chat perdió una venta»: el cliente de juguete se va de la vidriera mientras el mensaje queda en «visto». «La misma vidriera, 10 reels distintos»: la vidriera rerenderizada en 10 materiales (el único reel que rompe el material único, a propósito) |

### 2.5 Reglas comunes a las cuatro

- **Una capa de texto por vez.** De 0 a 2 s manda el tema escrito dentro de la escena. Después, el karaoke. El tema puede seguir visible dentro de la escena (cartel, etiqueta), nunca como cartel encima.
- **Logo fijo** en x = 80 y y = 236 a 300. Es la única pieza de interfaz: sin barras de progreso, sin numeración en esquinas, sin etiquetas en mayúsculas sobre el título.
- **Sujeto principal** entre y = 820 y y = 1160; la escena llega hasta y = 1920. Horizonte o canto de la baldosa entre y = 560 y y = 760.
- **Material único por pieza** (salvo el reel de Marketing «10 estilos»).
- **Texto 3D dentro de la escena:** `TextGeometry` o SVG → `ExtrudeGeometry` con la fuente de la marca descargada en `fonts/`, de frente a cámara (desvío máx. 12°) para que se lea.
- **Fuentes:** todas de Google Fonts (Playfair Display, Manrope, Archivo, Plus Jakarta Sans, Outfit), descargadas en la carpeta de trabajo, nunca enlazadas.
- **Rendimiento sin GPU:** sombras de 1024 px en pruebas y de 2048 px solo en el render final; GTAO y Bokeh solo donde la tabla lo pide.

### 2.6 Paquete de estilo para el motor (punto de partida)

```js
// motor2/estilos/<marca>.js · valores de esta guía
export const vita = {
  atlas: ['tiny-diorama', 'paper-pop-up'],
  fondo: { tipo: 'degrade', arriba: '#F5F4F0', abajo: '#E7E2CE' },
  acento: '#D4AF37',
  luz: { sol: { color: '#FFE2B8', int: 2.2, elev: 32 }, hemi: ['#EEF1F5', '#CDBFA3', 0.6], sombra: 2048, gtao: true, bloom: false },
  camara: { tipo: 'persp', fov: 28, elev: 35, orbitaMax: 3, dollyMax: 0.02, tiltShift: 0.18, ease: 'power2.inOut' },
  texto: { sub: ['Manrope', 700, 72, '#FFFFFF', '#112250', 14], activa: ['Playfair Display', '700i', 80, '#D4AF37'], banda: [1260, 1480], alinear: 'centro' },
  transicion: { tipo: 'dolly+foco', dur: 0.5 },
  progreso: 'faroles-3', cierre: 'noche-faroles+cartel-calle',
};
export const coberturas = {
  atlas: ['soft-clay', 'marble-run'],
  fondo: { tipo: 'liso', color: '#DAF1DE' }, acento: '#003D3B',
  luz: { area: { k: 5600, int: 4 }, hemi: ['#FFFFFF', '#DAF1DE', 0.8], sombra: 1024, radio: 8, gtao: 'fuerte', bloom: false },
  camara: { tipo: 'persp', fov: 35, elev: [70, 85], pushMax: 0.04, ease: 'back.out(1.4)' },
  texto: { sub: ['Manrope', 600, 72, '#FFFFFF', '#003D3B', 12], activa: ['Manrope', 800, 76, '#003D3B', '#FFFFFF', 12], banda: [1260, 1480], alinear: 'centro' },
  transicion: { tipo: 'desliza-mesa|macro-lupa', dur: 0.35 },
  progreso: 'frascos-2|huecos-3', cierre: 'frasco-lleno+letras-arcilla',
};
export const autos = {
  atlas: ['studio-product', 'exploded-view', 'x-ray'],
  fondo: { tipo: 'radial', centro: '#020C47', borde: '#000521' }, acento: '#207CCF', acentoTexto: '#4E9BE4',
  luz: { cajas: [['#FFFFFF', 6], ['#207CCF', 3], ['#207CCF', 3]], hdri: 'estudio-oscuro', piso: { rugosidad: 0.25 }, bloom: { umbral: 0.85, int: 0.9 } },
  camara: { tipo: 'persp', fov: [24, 50], orbita: [6, 8], whip: 0.35, ease: 'expo.inOut' },
  texto: { sub: ['Plus Jakarta Sans', 700, 68, '#FFFFFF', '#000521', 10], activa: ['Archivo', 800, 76, '#4E9BE4', null, 0, { mayus: true, wdth: 112 }], banda: [1260, 1480], alinear: 'centro' },
  transicion: { tipo: 'barrido-luz+orbita', dur: 0.4 },
  progreso: 'odometro|piezas-numeradas', cierre: 'rearmado+faros+patente',
};
export const marketing = {
  atlas: ['toy-blocks', 'device-hero'],
  fondo: { tipo: 'liso+grilla-iso', color: '#FFE7D0', grilla: '#F2D6BC' }, acento: '#FC6E20',
  luz: { sol: { color: '#FFF4E8', int: 2.6, elev: 50 }, hemi: ['#FFE7D0', '#C9AC93', 0.7], sombra: 1024, radio: 0, bloom: 'solo-notificaciones' },
  camara: { tipo: 'orto-iso', salto: 0.25, zoomGolpe: [1.0, 1.15, 0.2], ease: 'power4.out' },
  texto: { sub: ['Manrope', 700, 70, '#1B1B1B', '#FFE7D0', 10], activa: ['Outfit', 800, 76, '#1B1B1B', null, 0, { subrayado: ['#FC6E20', 14, 0.18] }], banda: [1260, 1480], alinear: 'izquierda' },
  transicion: { tipo: 'salto-grilla+encastre', dur: 0.25 },
  progreso: 'notificacion|torre', cierre: 'vidriera-encendida+chat-tipeado',
};
```

---

## 3. Prohibido

### 3.1 Lo del piloto rechazado (no vuelve)

- Fondo oscuro con rayas verticales, bokeh dorado, haces de luz y polvo como decoración.
- Títulos en mayúsculas dentro de recuadros o marcos (dorados o de cualquier color).
- Íconos planos (cámara, escudo, marcador, tilde) y tarjetas con «?» que se dan vuelta.
- Objetos flotando sin piso, sin sombra ni luz compartida.
- Todo en un solo color dorado; dorado como fondo o superficie grande.
- Título y subtítulo en pantalla a la vez.
- Mitad de abajo del cuadro vacía.
- Subtítulos chicos o con palabras inactivas en gris.

### 3.2 Clichés de «hecho con IA» y de plantilla

| Prohibido | Usar en cambio |
|---|---|
| Degradé violeta-azul, gradient mesh, esferas de color de fondo | El fondo de la marca, liso o con la luz de la escena |
| Glassmorphism, tarjetas de vidrio flotantes | Objetos con material físico |
| Partículas, chispas, destellos (lens flare) y brillos sin motivo | Bloom solo en una fuente de luz real (farol, faro, notificación) |
| Neón genérico, aberración cromática, glitch, grano fuerte, viñeta pesada | Grado de color limpio; grano ≤ 2 %, viñeta ≤ 8 % |
| Personaje 3D blanco sin cara («hombrecito 3D»), robots, cerebros, manos realistas | Figuras de maqueta de lejos, objetos protagonistas |
| Clichés de rubro: balanza y martillo de juez (VITA), estetoscopio y corazón con pulso (Coberturas), llave con moño y confeti (Autos), cohete, megáfono y bombilla (Marketing) | Objetos de la situación: el papel a firmar, el recibo, el ticket, el chat |
| Emojis como íconos, flechas genéricas, tildes verdes de interfaz | El progreso dibujado en la escena |
| Eyebrows en mayúsculas, numeración «01/05» o textos en esquinas, barras de progreso de interfaz | Contador diegético (sección 2) |
| Zoom pulsante en cada palabra, sacudidas, texto que rebota, cámara que tiembla | Un golpe de cámara solo en la palabra clave del paso |
| `drop-shadow` en SVG (en 4K corta en bloques) y sombras de texto difusas | Contorno de 10 a 14 px |
| Carteles de aclaración en el video («Situación ilustrativa», «Voz generada con IA») | Van en el texto de la publicación |
| Caras reales, fotos de personas, logos o modelos de marcas reales, patentes reales | Objetos genéricos y figuras sin rasgos |
| Más de dos familias tipográficas; tipografías del sistema o Inter | Las de la tabla de cada marca |
| Colores, logos o recursos de otra marca | Cada marca con su mundo (tabla 1.3) |

---

## 4. Plantilla de 6 escenas (reel de 23 s)

Para las fórmulas de la tanda con tres pasos (advertencia, tres cartas, contador, ¿cuál sos?). Las listas cortas (10–16 s) comprimen E3 a E5 a 1,5 s cada una; los relatos (25–45 s) estiran E3 a E5 a 4–6 s.

| Escena | Tiempo | Qué pasa | Cámara | Texto | Acento | Verificar |
|---|---|---|---|---|---|---|
| **E1 · Gancho** | 0,0–2,0 s | La escena ya se mueve en el cuadro 0. Aparece el conflicto (autos que se tocan, moneda que cae, pieza que se suelta, globo de notificación) | Plano de apertura (el mismo del cierre), ya en movimiento | Tema escrito dentro de la escena, legible en el cuadro 0 | Ninguno o un destello en el objeto del conflicto | Mensaje claro en 2 s; nada de logo grande ni intro |
| **E2 · Tensión** | 2,0–5,0 s | Aparece lo que está en juego (el papel, el frasco vacío, el ticket, el chat) y el contador en la escena en 0 | Dolly o empuje hacia el objeto (velocidad máx. de la marca) | Empieza el karaoke | Palabra activa | El contador se ve y se entiende |
| **E3 · Paso 1** | 5,0–9,5 s | Primer avance: se enciende el farol 1, cae la primera ficha, primera pieza despiezada, primer bloque | Transición de la marca (0,2–0,5 s) + recorrido nuevo dentro del mismo mundo | Karaoke; rótulo del paso dentro de la escena si suma | Objeto del paso 1 | Cambio visual cada 1,5–3 s; nunca más de 1 s quieto |
| **E4 · Paso 2** | 9,5–14,0 s | Segundo avance, más grande que el primero (cambio de escala o ver por dentro) | Ángulo distinto al de E3 | Karaoke | Objeto del paso 2 | El paso es más grande que el anterior |
| **E5 · Paso 3** | 14,0–18,5 s | Tercer avance: el momento «wow» (corte, rayos X, macro, la torre que llega arriba) | El movimiento más amplio del reel | Karaoke | Objeto del paso 3 | Momento «wow» visible a 390 px |
| **E6 · Giro, pedido y loop** | 18,5–23,0 s | Resolución con luz (se encienden los faroles, se llena el frasco, faros, cartel encendido). El pedido aparece escrito dentro de la escena. Último cuadro igual al primero | Vuelta al encuadre de E1 | Pedido «Comentá PALABRA» dentro de la escena + karaoke de cierre | El acento crece a su máximo (≤ 10 %) | Pedido legible ≥ 1,5 s; el fundido 0,3 s empalma con el cuadro 0 |

Ritmo: el texto se queda al menos 0,6 s cada 10 palabras; transiciones de 0,2 a 0,5 s según la marca; un solo golpe de cámara por paso, en la palabra clave.

---

## 5. Revisión visual por cuadro

Se corre sobre los cuadros cada 0,5 s, cada transición y la hoja de contactos (`revision_t.js`, `revision/cuadros.js`, `revision/stills.js`). Un «no» frena la producción.

### 5.1 Zonas y composición

| # | Control | Pasa si | Cómo se mide |
|---|---|---|---|
| 1 | Zona segura de arriba | Nada importante en y < 220 (solo escena) | Cajas de texto y logo con y ≥ 220 |
| 2 | Zona segura de abajo | Nada importante en y > 1500 (escena sí) | Banda del karaoke de 1260 a 1480 |
| 3 | Zona segura derecha | Nada importante en x > 940 | Borde derecho de cada caja de texto ≤ 940; margen izquierdo de 80 |
| 4 | Logo | Presente en todos los cuadros, en y = 236–300, nunca tapado ni recortado | Comparar recorte del logo cuadro a cuadro |
| 5 | Mitad de abajo llena | De y = 960 a y = 1920 hay escena (piso, objetos) en todos los cuadros; ninguna zona plana sin objeto de más de 300 × 300 px | Desvío estándar de luminancia por bloque de 300 × 300 en la mitad inferior > umbral; marcar bloques planos |
| 6 | Sujeto | El objeto del paso está entre y = 820 y y = 1160 y no lo tapa el karaoke | Caja del objeto proyectada contra la banda del karaoke |
| 7 | Una capa de texto | Nunca tema encima y karaoke a la vez fuera de la escena | Contar capas de texto 2D activas por cuadro ≤ 1 |
| 8 | Nada cortado | Ningún texto, logo ni objeto clave cortado por el borde o por un zoom | Cajas dentro de 0–1080 × 0–1920 en todo el movimiento |

### 5.2 Legibilidad a 390 px

| # | Control | Pasa si | Cómo se mide |
|---|---|---|---|
| 9 | Tamaño | Subtítulo ≥ 68 px a 1080 (≥ 24 px a 390); rótulos ≥ 44 px (≥ 16 px a 390) | Hoja de contactos reducida a 390 px de ancho, abierta y mirada |
| 10 | Contraste | Texto vs. contorno ≥ 4,5:1 y contorno presente en toda palabra sobre escena | Muestreo de color en la caja del texto |
| 11 | Mensaje en 2 s | El tema se entiende en el cuadro de 2 s visto a 390 px | Mirar el cuadro 2,0 s reducido |
| 12 | Palabra activa | Se distingue del resto sin leer (color o subrayado) | Mirar a 390 px |
| 13 | Tiempo de lectura | Cada página de karaoke ≥ 0,6 s por cada 10 palabras | Tiempos por palabra del archivo de subtítulos |

### 5.3 Estilo y marca

| # | Control | Pasa si |
|---|---|---|
| 14 | Mundo | Fondo = escena con piso y luz; nada flota sin sombra |
| 15 | Acento | Un solo color saturado; ocupa ≤ 10 % del cuadro (≤ 20 % solo en el cierre) |
| 16 | Marca | Fuentes, colores, logo y mundo de la marca; nada de otra marca (tabla 1.3) |
| 17 | Prohibidos | Ninguno de la sección 3 (revisar la hoja de contactos completa contra la lista) |
| 18 | Movimiento | Nunca más de 1 s quieto; ninguna sacudida; la cámara respeta las velocidades máximas de la marca |
| 19 | Transiciones | Entre 0,2 y 0,5 s, con la lógica de la marca; ninguna corta texto |
| 20 | Loop | El último cuadro empalma con el primero (diferencia visual mínima en el fundido) |
| 21 | Sin carteles | Ninguna aclaración en el video; caras reales: cero |
| 22 | Ortografía | Texto en pantalla revisado palabra por palabra, voseo, tildes y signos de apertura |

### 5.4 Qué dice el informe

Qué controles se corrieron y con qué resultado; qué no se pudo ver (color en pantalla real, sonido, interfaz real de Instagram); versión del motor y de la receta. Distinguir especificado, implementado, probado y publicado.
