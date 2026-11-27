# Tanda 1 · VITA Abogados (28/11 al 02/12): 10 planes de reel

Planes en `.claude/referencias/redes/herramientas/historias-prototipo/atlas/planes/<id>.json`, según `CONTRATO.md`. Estado: **especificado y validado**. No se grabó, no se renderizó, no se programó ni se publicó nada.

| id | fecha | hora | gancho | palabra | base | fuente |
|---|---|---|---|---|---|---|
| vita-2811-a | 28/11 | 08:40 | Chocaste: pedir perdón te puede jugar en contra. | NUNCA | vita-2711-1 | Ley 17.418, art. 46 (aviso del siniestro en 3 días) |
| vita-2811-b | 28/11 | 21:10 | Heredar la casa no alcanza para venderla. | HERENCIA | vita-2711-4 | — |
| vita-2911-a | 29/11 | 08:40 | Tu culpa no te deja sin ART. | CULPA | vita-2811-1 | Ley 24.557, art. 6, inc. 3 |
| vita-2911-b | 29/11 | 21:10 | El aguinaldo no vence el 31 de diciembre. | AGUINALDO | vita-2811-4 | Ley de Contrato de Trabajo, art. 122 |
| vita-3011-a | 30/11 | 13:40 | Tu liquidación final no se paga cuando quieren. | LIQUIDACION | vita-2911-3 | Ley de Contrato de Trabajo, arts. 128 y 255 bis |
| vita-3011-b | 30/11 | 21:10 | Te detienen: tu silencio es un derecho. | DETENIDO | vita-2911-2 | Constitución Nacional, art. 18 |
| vita-0112-a | 01/12 | 08:40 | La ART te rechazó: no es el final. | ART | vita-3011-1 | Ley 27.348 (Comisiones Médicas) |
| vita-0112-b | 01/12 | 21:10 | Te denunciaron: no lo aclares en redes. | DENUNCIA | vita-3011-2 | — |
| vita-0212-a | 02/12 | 11:10 | Tu baja por ART puede durar dos años. | REPOSO | vita-0112-2 | Ley 24.557, art. 7 |
| vita-0212-b | 02/12 | 21:10 | Te despiden: firmar rápido no te conviene. | COPIA | vita-0112-1 | — |

## Cómo se armó

- **Bases:** los 2 mejores temas de cada día de la tanda, solo entre los guiones que la tanda ya mandaba a Instagram. La tanda no lleva temas de tránsito a Instagram hasta el 03/12, salvo el boceto del 27/11. Por eso quedaron afuera «choque con un auto sin seguro» (vita-3011-4) y «trayecto, parte 2» (vita-0112-3).
- **Voz:** vita-2811-a usa la voz grabada de vita-2711-1, sin cambios. Las otras 9 tienen entre 52 y 63 palabras. Abren con el gancho y cierran con una frase que empalma con él.
- **Datos:** cada voz usa la palabra clave y la fuente de su guion base, sin datos legales nuevos.
- **Horas:** salen de las horas de los guiones base del mismo día. Las «a» van a las 08:40, 11:10 o 13:40, y las «b» a las 21:10. En vita-3011-b, vita-0112-b y vita-0212-b la hora es la de vita-2911-4, vita-3011-4 y vita-0112-4, porque su base salía antes de las 17:00.
- **Choque posible:** estas horas son las mismas de los guiones originales de la tanda. Si se programan los dos juegos, se pisan.
- **Golpes:** cada reel tiene 8 golpes con una secuencia de efectos distinta. Entre los 10 se usan apagon, tachar, sello, flash, lupa, caida, giro, rebote y golpe. Algunos suman despiece, cuenta o barrido.

## Momento «wow» de cada reel

- **vita-2811-a:** «Nunca»: un trazo dorado tacha el globo, que cae por el escotillón; en «Antes» la sala queda a oscuras y se encienden tres candilejas.
- **vita-2811-b:** «Dos»: la casa de cartulina se despieza en tres papeles (partidas, escritura e impuestos) que flotan en el haz.
- **vita-2911-a:** «Falso»: apagón total y el sello FALSO se enciende en dorado y parte el globo.
- **vita-2911-b:** «18»: el 31 se tacha en dorado y las hojas del almanaque vuelan hasta el 18; después el billete se parte en dos mitades.
- **vita-3011-a:** «Cuatro»: apagón y el almanaque enciende cuatro días, uno por uno, como candilejas.
- **vita-3011-b:** Cuadro 1: la sala ya está a oscuras y un único haz cae sobre Nico; en «Tres» se tacha todo lo que sobra del globo.
- **vita-0112-a:** «Carta tres»: el sello RECHAZADO del arranque se tacha en dorado y en su lugar baja la balanza.
- **vita-0112-b:** «Respirá»: apagón, una pausa de silencio y la luz vuelve lenta sobre Nico.
- **vita-0212-a:** «Hasta»: «6 meses» y «1 año» se tachan en dorado y el almanaque gira hasta los 2 años.
- **vita-0212-b:** «Hay tres reacciones»: la silueta de Nico se despieza en tres; la segunda sale del haz y la sala se apaga detrás.

## Una decisión para revisar

El contrato pide cerrar el copy con «El botón está en el perfil.». La orden vigente del dueño del 20/11 (`cerebro/02-ordenes-vigentes.md`, línea 151) dice que no se use nunca, porque el botón no existe. El validador de la tanda (`fuente/armar.py`) también la prohíbe. Por eso ningún copy la lleva. En su lugar, cada copy cierra con «Comentá «PALABRA» y te mando…», la fuente y la aclaración de IA.

## Validación (Python, 27/11)

Los 10 planes pasan todas estas comprobaciones:
- JSON válido.
- Cada golpe cae en una palabra de la voz. La ocurrencia `n` es la misma con la búsqueda por prefijo que usa `escenas/vita.js`.
- Voces de 50 a 68 palabras; vita-2811-a es idéntica a la de vita-2711-1.
- Palabra clave y fuente iguales a las del guion base, sin palabras repetidas dentro de la tanda.
- No aparecen «Black Friday», «garantizado», «ganás seguro» ni «el botón está en el perfil».
- Gancho de hasta 8 palabras y textos de hasta 5.
- Objetos y efectos de la tabla del contrato.
- Horas «a» antes de las 14:00 y «b» después de las 17:00.
- Entre 3 y 5 hashtags por copy.

Falta la revisión de una abogada o un abogado antes de publicar, como pide `marcas.md`.
