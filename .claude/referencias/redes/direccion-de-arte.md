# Dirección de arte, redacción y revisión de piezas de redes

Complementa `kocos-contenido-y-publicacion` (qué se publica y cómo) con el cómo se ve y se escribe. La identidad de cada marca está en `marcas.md`. Las reglas de negocio de `reglas-comunes.md` prevalecen sobre esta guía.

## 1. Antes de diseñar: la ficha de la pieza

Cada pieza (o cada pantalla de un reel o carrusel) arranca con cinco líneas. Si una no se puede completar, la pieza no está lista:

- **Destinatario:** quién la ve y en qué situación está.
- **Objetivo:** qué tiene que pasar (que mire el reel, que guarde, que responda la historia, que escriba por WhatsApp).
- **Mensaje principal:** una sola idea, en una frase.
- **Apoyo:** el dato o la explicación que lo sostiene, con su fuente si es una afirmación.
- **Acción:** qué hace la persona y cómo. Tiene que ser funcional en la red: responder la historia, sticker de encuesta, pregunta o enlace, botón de WhatsApp del perfil o una palabra clave para escribir por WhatsApp.

## 2. Composición

- **Una idea por pantalla** y recorrido en este orden: mensaje → apoyo → acción.
- **Un elemento domina** (el título o una imagen-objeto) y el resto acompaña. Escala mínima entre el título y el apoyo: 2:1. No todos los textos con el mismo peso.
- **Máximo dos familias tipográficas** por pieza: las de la marca. El contraste se arma con tamaño, peso, cursiva o color, no con una tercera fuente.
- **Grilla:** márgenes laterales de 80 px en 1080 de ancho, columnas alineadas a un mismo borde y separaciones en múltiplos de 8 px. Un solo eje de alineación por pantalla (izquierda o centro), sin mezclar.
- **Aire:** el vacío también compone. Ni bloques amontonados ni zonas muertas sin intención.
- **Texto que entra en el formato:** si sobra información, se resume o se reparte en otra pantalla antes de achicar la letra. Mínimos a 1080 px de ancho: título 72 px, apoyo 38 px (40 px en historias y reels) y textos secundarios 30 px.
- **Zonas seguras** (aproximadas, se verifican en el teléfono):
  - **Reel 1080 × 1920:** nada importante en los 220 px de arriba ni en los 420 px de abajo, ni en los 140 px de la derecha, donde están los botones. Para la portada, título dentro del recorte de la grilla 3:4 (de y = 240 a y = 1680).
  - **Historia 1080 × 1920:** 250 px libres arriba y 300 px abajo, donde va la barra de respuesta.
  - **Carrusel 1080 × 1350:** el texto, dentro de 1012 px centrales, por el recorte 3:4 de la grilla del perfil.
- **Nunca:** superposiciones que tapen información, títulos cortados, logos deformados, recoloreados o con efectos, ni elementos encima del texto.
- **Preferencias de la responsable:**
  - Sin etiquetas en mayúsculas sobre el título («eyebrows») ni textos o numeración en las esquinas.
  - Sin personas: nada se graba y no se usan caras.
  - Nada genérico «hecho con IA»: nada de ilustraciones infantiles, degradés al azar ni íconos de relleno.
  - Sin emojis como íconos de diseño. Dentro de un chat ilustrativo o en el texto de la publicación se usan con moderación.
- **Recursos visuales.** Gráficos y animación hechos con código:
  - **Tipografía protagonista:** la frase es la imagen.
  - **Objetos con sentido:** el documento que te piden firmar, la llave del 0 km, el recibo de sueldo, el celular con la consulta sin responder.
  - **Formas e ilustración vectorial** sobria, en la línea de la marca.
  - **Interfaz o chat:** recurso narrativo, uno más entre otros, no el único.

## 3. Preparación y archivo final: siempre separados

- **Vista de preparación (`-guia`):** muestra con recuadros punteados dónde van la encuesta, la pregunta o el enlace, y notas para quien publica.
- **Archivo final (limpio):** sale sin esos recuadros. Deja el espacio libre y del tamaño correcto para el sticker.
- Las dos versiones salen del mismo diseño: `herramientas/revisar-piezas.mjs` exporta ambas (clase `clean`).

## 4. Redacción

- Español rioplatense natural, con voseo y el tono de cada marca (`marcas.md`). Frases cortas y concretas que entren cómodas en el diseño.
- **Sin relleno ni clichés:** nada de «¿Sabías que…?», «En el mundo de hoy…», «Te contamos todo» ni «No te lo pierdas».
- **Sin promesas de resultados ni afirmaciones sin respaldo.** Las jurídicas, médicas y comerciales registran fuente y revisión.
- **Las conversaciones y situaciones inventadas son ilustrativas:**
  - Nunca se presentan como testimonios ni como casos reales.
  - Llevan nombres genéricos («Aseguradora · Siniestros») y no nombran empresas reales como villanas.
  - Si hay duda, el texto de la publicación aclara «Situación ilustrativa».
- **Cierre de carrusel:** la última lámina dice qué hacer y cómo: «Escribinos «PALABRA» por WhatsApp · botón en el perfil», «Respondé esta historia» o «Mandáselo a…». Nunca solo el logo o una frase de marca.
- La palabra clave de WhatsApp es única por pieza o serie, para saber qué publicación trajo la consulta.

## 5. Investigación y viralidad

- Las referencias se muestran como ejemplos concretos (cuenta, pieza, enlace) y con el recurso visual o narrativo que conviene tomar. No se copian diseños, personajes ni marcas.
- Hay que separar lo comprobado de lo que es hipótesis:
  - **Comprobado:** métricas públicas con fuente y fecha, como lo que dijo Instagram sobre tiempo de visualización, «me gusta» y envíos.
  - **Hipótesis:** «este formato va a retener».
- La viralidad es una posibilidad: cada pieza se evalúa con sus resultados (retención a 3 s, tiempo medio, envíos, guardados, respuestas, consultas por WhatsApp). Ninguna se presenta como viral de antemano.

## 6. Animación (reels)

- Cada escena se puede leer en el teléfono: el texto queda quieto al menos 0,6 s por cada 10 palabras antes de cambiar.
- Los movimientos sirven al mensaje: entrar, señalar o cambiar de escena. Nada de sacudidas ni zooms constantes.
- Un zoom o encuadre nunca corta un texto ni el logo, ni lo saca de la zona segura.
- Transiciones de 0,2 a 0,5 s, con una lógica de movimiento por pieza.
- La música y los efectos acompañan y no tapan la voz. Mezcla a −14 LUFS y una versión sin música para sumar el audio en tendencia desde la app.

## 7. Revisión visual obligatoria antes de entregar

Renderizar en 4K no es revisar. Para cada pieza:

1. Renderizar y **abrir las imágenes**: tamaño completo y en una hoja reducida a ~390 px de ancho, que es el tamaño aproximado en un teléfono.
2. Pasar `herramientas/revisar-piezas.mjs`, que detecta texto desbordado, elementos que se pisan y contenido fuera de la zona segura. Los avisos se corrigen o se justifican.
3. En video: revisar fotogramas cada 0,5 s y en cada transición, al inicio, al medio y al final, más una hoja de contactos.
4. Comprobar que:
   - el mensaje se entiende en 2 segundos;
   - todo se lee al tamaño del teléfono;
   - ningún texto queda cortado ni se cruza con otro;
   - la marca se reconoce;
   - la animación no recorta elementos;
   - el ritmo deja leer;
   - el resultado coincide con la dirección elegida.
5. Corregir, volver a renderizar y volver a mirar.
6. El informe dice qué se verificó de verdad y qué no se pudo ver: color en pantalla real, sonido, la interfaz real de Instagram.

## 8. Producción técnica (sin costo)

- Diseño en HTML/CSS y renderizado con Playwright (Chromium preinstalado):
  - Piezas fijas: cada pieza es un `.ab` con su tamaño en px. Se exporta a 2× (2160 px de ancho) con `herramientas/revisar-piezas.mjs`.
  - Reels: `window.render(t)` es una función pura del tiempo, se capturan los fotogramas a 30 fps y se codifican con ffmpeg (libx264, yuv420p, CRF 15-16, más una copia en 1080p).
- Fuentes de Google Fonts descargadas en la carpeta de trabajo, nunca enlazadas en la pieza final.
- Voz opcional:
  - Edge TTS es-AR (gratis, uso comercial a confirmar) o voz real grabada por el equipo.
  - Las voces pagas requieren autorización.
- Música y efectos sintetizados propios.
- Nada se publica ni se programa sin la política habilitada o una autorización expresa. Las pruebas no usan datos personales reales.
