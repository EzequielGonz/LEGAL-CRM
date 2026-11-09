# Series, ganchos y volumen orgánico

Complementa `direccion-de-arte.md` y `marcas.md`. Los guiones de prueba están en `herramientas/reels/guiones.py`. Cada uno trae palabra clave, fuente y revisión pendiente.

## Qué rinde en cada rubro (referencias revisadas el 09/11/2026)

**Comprobado** (fuente pública):
- Instagram indicó que lo que más pesa es el tiempo de visualización, los «me gusta» por alcance y los envíos por alcance. Los envíos importan más para llegar a quienes no siguen la cuenta (Adam Mosseri, enero de 2025, en Social Media Today).
- Desde agosto de 2025 mide además quién se va en los primeros 3 segundos («skip rate») y la curva de retención.
- En los datos de Socialinsider, los carruseles tienen la mejor tasa de interacción; los reels, el mayor alcance.

**Patrones observados (hipótesis a validar con resultados propios):**
- **Jurídico:** las cuentas grandes de habla hispana (Lawtips, Empleado Informado) responden «¿puede mi jefe…?» o «¿es legal…?», con casos hipotéticos y su solución. Los avisos tipo «no aceptes ni firmes sin ver esto» invitan a guardar y compartir.
- **Coberturas:** mitos frente a hechos, errores que salen caros y preguntas frecuentes locales. En la Argentina, los aumentos y la derivación de aportes son tema de conversación permanente (por ejemplo, Cronista, 2025).
- **Autos:** series con personaje y humor del mundo del concesionario, y transparencia sobre la «fricción» de comprar: costos, trámites, plan de ahorro. Advertencia de la propia industria: muchas vistas no garantizan consultas si no hay un llamado concreto.
- **Agencias:** el antes y después es el formato con más envíos (sostenido por fuentes de la industria, sin datos abiertos). Le siguen el problema → solución → resultado y los datos con fuente.

## Series por marca

| Marca | Serie | Mecánica | Palabra clave de ejemplo |
| --- | --- | --- | --- |
| VITA | «¿Firmás o no?» | Notificación del seguro → votación → respuesta → qué hacer | FIRMA |
| VITA | «Mito o verdad» | Frase común tachada con el sello FALSO → explicación | SEGURO |
| VITA | «Te pasó yendo al trabajo» | Situación concreta → derecho que existe → pasos | TRAYECTO, ART |
| Coberturas | «Tu recibo explicado» | Recibo de sueldo con la línea marcada → qué podés elegir | APORTES |
| Coberturas | «Leé la letra chica» | Aviso de aumento o de la prepaga → qué mirar antes de pagar | COMPARAR |
| Coberturas | «Mito o verdad» | Frase común → sello FALSO → ley que lo dice | PLAN |
| Autos | «Lo que no te dicen del 0 km» | Etiqueta de precio → lo que se suma → precio llave en mano | LLAVE |
| Autos | «Plan de ahorro sin vueltas» | Aviso de cuota → por qué cambia → qué preguntar | PLAN |
| Autos | «¿Cuál elegís?» | Votación con cuenta regresiva → de qué depende | 0KM |
| Marketing | «Este chat perdió una venta» | Consulta a las 21:03 → respuesta al otro día → dato con fuente | CRM |
| Marketing | «Antes y después» | Bio, mensaje o web: antes tachado, después marcado | BIO |
| Marketing | «Arreglos de un día» | Problema visible (47 chats) → tres arreglos concretos | ORDEN |

## Volumen diario por marca

- **2 reels:** uno nuevo y uno reciclado o con otro gancho. Horario de mayor actividad medido en Metricool para VITA: 10 h los días hábiles, con un segundo pico cerca de las 18 h; los fines de semana, la mitad.
- **1 carrusel o post** con el mismo episodio pasado a láminas. La última lámina siempre lleva el llamado a WhatsApp o a responder.
- **4 a 6 historias:** encuesta, respuesta, caja de preguntas y «Respondé esta historia con «PALABRA»», más el enlace a WhatsApp.
- **El mismo día:** el reel también va a TikTok, YouTube Shorts y Reels de Facebook.

## Cuánto rinde cada guion

- Reel con voz, reel sin voz (para el audio en tendencia) y tres ganchos alternativos (se cambia solo la primera escena).
- Carrusel, cuatro historias y una portada.

Son unas diez piezas por guion. Con dos guiones nuevos por semana y por marca se cubre el volumen diario sin producir todo desde cero.

## Reciclado

- A los 7 días, cada pieza se compara contra la mediana de la cuenta en retención a 3 s, tiempo medio, envíos por alcance, guardados y consultas por WhatsApp con su palabra clave.
- **El 20 % de arriba:** vuelve a los 30–45 días con otro gancho y otra portada, o como «Parte 2».
- **El 30 % de abajo durante dos semanas seguidas:** el formato se deja de usar, sin repetirlo.
- Nada se declara viral de antemano. Las palabras clave sirven para saber en el CRM qué pieza trajo cada consulta (origen), sin inventar atribución.

## Producción

- `herramientas/reels/`: motor en código (escenas de notificación, título, votación, lista, sello, dato, chat, antes y después, objeto y cierre), voz es-AR opcional, música y efectos propios y revisión automática de textos.
- Para empezar se corre `preparar.sh` y después los pasos de `build.py` y `render.sh`.
- Para animaciones más ricas se puede sumar GSAP, gratis desde abril de 2025 con todos sus complementos. Sus líneas de tiempo se pueden posicionar en cualquier instante, que es lo que necesita el render cuadro por cuadro.
- Nada se publica ni se programa sin autorización o una política habilitada. Las afirmaciones jurídicas y de cobertura pasan por revisión profesional antes de salir.
