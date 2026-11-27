# Herramientas para subir el motor de reels a nivel premium (relevamiento 27/11)

Alcance: diseño, motion, 3D, animación, voz, música, sfx, subtítulos karaoke, render 4K, estilos del 3D Atlas y reciclado con edición fuerte.
Regla dura: **no se paga nada sin OK expreso de la responsable.** Todo lo que cobra aparte va marcado «PAGO: pedir OK».
Qué se verificó y qué no: lo de ElevenLabs salió de consultas de lectura (no se generó nada); lo del motor y el render se probó en este entorno; lo de las skills se leyó de su `SKILL.md`; los precios de terceros son los de `cerebro/04` (referencia, no confirmados hoy).

## 1. Lo que ya tenemos y alcanza para el 90 %

Entorno medido: Node 22.23, npm 10, ffmpeg 6.1 (libx264, libx265, SVT-AV1, filtros `subtitles`, `ass`, `xfade`, `zoompan`, `lut3d`, `loudnorm`, `sidechaincompress`, `rubberband`, `minterpolate`), Python 3.13 con numpy, Chrome instalado, Playwright 1.63 global, 4 núcleos, 15 GB de RAM, **sin GPU** (WebGL por software).

Prueba hecha hoy (en una carpeta temporal, sin instalar nada global): three.js r170 con **GTAO (oclusión ambiental), BokehPass (profundidad de campo), UnrealBloom y OutputPass** corriendo en Chrome sin GPU, 40 esferas con sombras de 2048 px: **~33 ms por cuadro a 540×960**. A 1080×1920 son ~4 veces más; un reel de 30 s a 30 cuadros por segundo (900 cuadros) queda en minutos por núcleo. O sea: **bloom, DOF y AO se pueden usar gratis** (ya están en `motor/motor3d.js`: PBR, HDRI, sombras suaves, bokeh, bloom, desenfoque de movimiento, grano, viñeta). Pasadas disponibles en three r170 y gratis: `SSAOPass`, `SAOPass`, `GTAOPass`, `SSRPass`, `OutlinePass`, `RenderPixelatedPass`, `HalftonePass`, `DotScreenPass`, `FilmPass`. Sirven para tinta/toon, pixelado, medios tonos.

Remotion existe en npm (4.0.547, `@remotion/renderer`, `@remotion/three`) y se renderiza solo con Chrome y ffmpeg, sin GPU. Ojo con la licencia: es gratis para individuos y equipos chicos; **para una empresa de más de 3 personas pide licencia paga**. Antes de adoptarlo, la responsable decide si la agencia entra en esa categoría. Mientras tanto no hace falta: nuestro motor ya hace lo mismo (cuadro = función del tiempo, captura con Playwright, ffmpeg arma el mp4).

Limitaciones reales: sin GPU el desenfoque con muchas muestras sube a ~35 min por reel (`cerebro/04`); la salida es H.264 (Meta recomprime igual); no usar drop-shadow en SVG a 4K (corta en bloques).

## 2. ElevenLabs (plan contratado: no se compra nada extra)

- **Plan:** `starter`, activo, mensual. **Créditos: 40.000 caracteres, usados 0, quedan 40.000.** Sin sobrecosto (0 USD). Voces propias: 10 cupos, 0 usados. Reseteo mensual (próximo: timestamp 1797997913).
- **Costo por cosa (según la guía del propio servicio):** la voz `eleven_v4` cuesta el doble por carácter que `eleven_flash_v2_5` o `eleven_turbo_v2_5`. Una narración de reel de 30 s son ~450 caracteres: **unos 85 reels por mes con v4, o el doble con Flash/Turbo.** No consulté el costo en créditos de música, sfx, imagen y video: no lo informa ninguna lectura. **Antes de generar música, sfx o video, pedir el costo; salen del mismo saldo y pueden gastarlo rápido.** Imagen y video generativos (Kling, Veo, Seedance, Runway, etc., disponibles desde ElevenLabs) son de pago aparte o consumen mucho: no usar sin OK.
- **Modelos de voz:** `eleven_v4` (etiquetas de emoción como `[excited]`, `[whispers]`, `[short pause]`; recomendado), `eleven_v3`, `eleven_multilingual_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2_5`. En v4 se escriben los números tal cual; la pronunciación se corrige con IPA entre barras.
- **Música:** `eleven_music_v2_5` (3 s a 10 min, instrumental o con letra). **SFX:** `eleven_text_to_sound_v3` (0,5 a 30 s, con loop). Los prompts de música describen el sonido (género, energía, instrumentos, tempo), no la escena.
- **Otros nodos útiles (flow):** Voice Changer (misma interpretación con otra voz: sirve para variantes), Voice Isolator, Audio Effects (teléfono, radio, ambiente), Video to Music (música a medida de un mp4), Speech to Text (transcribe con tiempos: base de los subtítulos karaoke), Dubbing, Composition (mezcla con ducking de música bajo la voz).
- **Brand kits:** hay 0 creados. No hacen falta para el motor.
- **Voces argentinas (rioplatense) encontradas** (el filtro devolvió 50; hay más páginas). Para elegir, escuchar el `preview_url` en la propia lista antes de generar. Mi preselección por tipo de pieza:

| Uso | Voz | voice_id |
|---|---|---|
| VITA (serio, confiable, hombre) | Claudiio Antoci (maduro, cálido) | `hVXoK5zuQfMOQB7NrIFY` |
| VITA (grave, documental) | Ciro, narrador documental | `W48EpZKz6eizt72PKBn8` |
| VITA / Coberturas (mujer, cálida, profesional) | Marina Argentina | `6IZ0Ae2RE8wd443OMsV2` |
| Coberturas (mujer, cercana) | Sol, publicidad cálida | `ijxn8I4NzJccD2Sa7lcj` |
| Marketing (reels, directo, energía) | Santo | `CNBiCLtxaJJKQwl4Hq2q` |
| Marketing (mujer, redes y UGC) | Julieta, cálida y amigable | `YLtqUTaEXb7a9MAYuJu4` |
| Marketing (mujer, joven) | Barbie, anuncios sociales | `mPteaOsPT4FrQ0lJIVEm` |
| Autos 0 km (publicidad, seguro) | Franco, publicidad segura | `jbWMqMKDKL7X0v1DXTHH` |
| Autos 0 km (cálida, hombre) | Mauricio, publicidad cálida | `jIgvw3W75cbd6IP0JYwL` |
| Gancho cinematográfico / suspenso | Juanma, profundo cinematográfico | `N6aRe3hk1YqaHDtQpTAH` |
| Gancho con humor / relato | Juanchiofamerica | `CzkPDbeaChfMe9viILX7` |
| Voz joven casual | Cande, la amiga porteña | `yFykvY9iSJewrANOC0cU` |

Más voces para variantes de reciclado: Tomás (alta, amistosa) `gpNJzVUAYfxYn4LZQs0k`, Renzo `vNtowgv1Szxvy9Z3tlRf`, Nicolás `5v6YSGBv8Rbr7ufiFR1t`, Armando `TiySrlWKKU0DJXlzSyO0`, Carolina `0LdgqX7HWxqwl7GGMBS4`, Martina `oq8K6jJPiW08295EbH2y`, Agustina `TZvhlMgMw2P4gPSuD8v7`, Octavio `YmwwQQdY9i3i0hBWn1SD`, Reynaldo `MY8TS35U6LtDduDuWErc`, Uriel (ronca, energética) `S9xWbRwkWxZfSdk9ZG27`, Natali `xLJeSgze3ILKo6rGXhqH`.
Aviso: son voces de biblioteca de terceros. Usar una en producción puede ocupar un cupo de los 10 y tiene sus condiciones de uso; revisar la licencia de la voz elegida y avisar que es voz sintética si la política de cada rubro lo pide. **Una de VITA con tono legal no debe prometer resultados.**

## 3. Tabla de herramientas

Prioridad: P1 = sumar ya (gratis), P2 = después, P3 = solo si la responsable lo pide.

| Herramienta | Para qué en el reel | Gratis / pago | Cómo se integra | Prioridad |
|---|---|---|---|---|
| three.js r170 + postprocesado (GTAO, Bokeh, Bloom, Outline, Pixelate, Halftone) | Estilos 3D Atlas, profundidad, bloom, toon | Gratis | Ya está en `motor/motor3d.js`; sumar `GTAOPass` y `OutlinePass` como opciones por estilo | P1 |
| GSAP 3.15 | Easings y timelines de textos, tarjetas, contadores | Gratis | `gsap.timeline({paused:true}).time(t)` dentro de `window.render(t)`; mismo patrón que hoy | P1 |
| Playwright + Chrome + ffmpeg (render_h.js / render_h.sh) | Render cuadro a cuadro, 4K con `dsf=2` | Gratis | Ya anda; agregar render en fragmentos y mezcla `loudnorm` a −14 LUFS | P1 |
| ffmpeg posproceso | LUT, grano, `xfade`, recorte/encuadre, subtítulos `ass`, variantes de salida | Gratis | Paso final del script de variantes | P1 |
| ElevenLabs TTS `eleven_v4` | Voz en off es-AR con etiquetas de emoción | Incluido en el plan (40.000 car.) | Sustituir/complementar edge-tts y Piper en `historia_voz.py`; guardar texto y tiempos | P1 |
| ElevenLabs Speech to Text (Scribe) | Tiempos por palabra para karaoke | Incluido en el plan (verificar costo) | Alternativa: forzar alineación con Whisper local (gratis) | P1 |
| ElevenLabs Voice Changer | Misma actuación con otra voz = variante | Incluido en el plan (verificar costo) | Paso opcional de variantes | P2 |
| ElevenLabs música y SFX | Pista y golpes originales | Incluido, pero gasta del mismo saldo; costo no verificado | **Por defecto usar el sintetizador propio `sonido.py` (gratis)**; ElevenLabs solo para 1 o 2 pistas base | P2 |
| Whisper local (whisper.cpp / faster-whisper) | Alineación palabra por palabra sin gastar créditos | Gratis, requiere bajar modelo (instalación local en carpeta del proyecto) | Reemplaza a Scribe si se agota el plan | P2 |
| Kokoro / Piper (ya hay `es_AR-daniela-high`) | Voz de respaldo sin costo | Gratis | Ya integrado | P1 (respaldo) |
| Remotion 4 (`remotion:*`, `@remotion/captions`, `@remotion/three`) | Subtítulos karaoke listos, plantillas, render paralelo | Gratis solo si la agencia cumple la licencia (hasta 3 personas); si no, paga | Proyecto aparte en `herramientas/remotion/`; no reemplaza el motor. Útil para el karaoke y las tarjetas 2D | P2 |
| Skill `remotion:remotion-captions` | Subtítulos en JSON con `Caption`, página por frase, importar `.srt` | Gratis | Se lee su guía y se reproduce el estilo en nuestro motor | P1 |
| Skill `motion-reel` | Método: rejilla de tiempos, hoja de contactos, críticas, mezcla −14 LUFS, formatos 9:16, 1:1 | Gratis (usa ElevenLabs solo con su add-on) | Tomar el método (ciclo de crítica sobre hojas de contactos) | P1 |
| Skill `it-reelsmaker` | Cortes por audio, subtítulos con tiempo de palabra, escenas de gancho, cita, número, lista, CTA | Gratis | Solo para piezas con material filmado; ideas de escenas ya cubiertas por el motor | P3 |
| Skill `animation-studio` | Película dibujada en canvas con música sintetizada de una sola partitura (`score.js`) | Gratis | Su idea de partitura única (música y animación leen la misma línea de tiempo) mejora `sonido.py` | P2 |
| Skill `video-shotcraft` | Recetas de planos y movimientos de cámara para producto | Gratis | Planos para Autos 0 km (órbita, dolly, rack focus) como funciones de cámara | P2 |
| Skill `soundweaver` | Diseño de sonido | Gratis | Consultar para capas de sfx | P2 |
| `social-media-skills:reels-script`, `hook-writer`, `ai-voiceover`, `ai-music-and-sound`, `content-recycling`, `cross-platform-repurposing` | Guion, ganchos, guía de voz y música, reglas de reciclado (refrescar, no duplicar) | Gratis | Se aplican al guion y a la matriz de variantes (sección 6) | P1 |
| `codesign` (IMG.LY) | PDF y mp4 con audio con control exacto, `animate`, `brand`, `resize` | Cuenta IMG.LY; generar activos con IA puede costar | Útil para portadas y carruseles; para reels el motor propio rinde más | P3 |
| HyperFrames (skills locales `npx skills add heygen-com/hyperframes`) | Composiciones HTML + GSAP, render local con CLI | Skills y CLI gratis; **el render en la nube de HeyGen (`render_video`, proyectos alojados): PAGO/créditos, pedir OK y costo** | Es el mismo enfoque que nuestro motor (HTML por cuadro). No hace falta salvo que se quiera su biblioteca de bloques | P3 |
| Adobe Fonts (`font_search`, `font_recommend`) | Tipografías para títulos | Gratis con cuenta Adobe (verificar licencias de uso comercial) | Elegir y cargar como web font; comprobar que es embebible para video | P2 |
| Adobe `animate_design`, Express, Firefly, `video_resize`, `media_enhance_speech` | Animar piezas de Express, redimensionar, limpiar voz | Parte gratis; **Firefly y varias funciones gastan créditos: PAGO, pedir OK** | Solo para limpiar audio (`media_enhance_speech`) si hace falta | P3 |
| Figma (`use_figma`, `get_motion_context`, `create_shader`, `export_video`) | Diseño de piezas y shaders | Según el plan de Figma ya existente (verificar) | Diseñar tarjetas, exportar a SVG; shaders como fondos | P3 |
| Unsplash | Fotos de fondo | Gratis (licencia Unsplash) | Solo con cuidado: nada de caras reales ni marcas; mejor objetos y texturas | P3 |
| Lookbk, Wunderlust, 21st (video blocks, `video_*`), animatedwebs | Referencias de estilo y bloques de video/animación | Lookbk y Wunderlust: lectura gratis. 21st `video_*` y animatedwebs `generate_component`: cuentas con límites, verificar | Buscar ideas de transiciones y bloques; no integrar en el pipeline | P3 |
| Poly Haven (HDRI/PBR), Quaternius, Kenney (CC0) | Luces HDRI, texturas, modelos opcionales | Gratis (CC0) | Descargar solo lo mínimo a `assets/`; los estilos del Atlas se hacen sin modelos | P2 |
| Kling (`kling-ai:*`, MCP `kling-ai`) | Clips generativos de impacto | **PAGO: pedir OK.** ~1,2 USD por clip Kling 2.5 Turbo (plan ~9 USD/mes), según `cerebro/04` | Importar el mp4 como capa de fondo; etiquetar IA | P3 |
| Arcads (`arcads:*`) | Anuncios UGC con avatares | **PAGO: pedir OK** (costo no verificado) | No para VITA; sin caras reales | P3 |
| admakeai | Imágenes y video de anuncio, investigación de competencia | **PAGO con créditos: pedir OK** (nuevas cuentas traen créditos gratis; el saldo no se consultó) | Solo imágenes estáticas de apoyo | P3 |
| Abracadabrax (video, música, song-maker) y ManyMotions (clipwave, ugc-video-ads, anime-story) | Clips o música generados desde texto | **PAGO con créditos: pedir OK**; costo por escena (anime: 250 créditos por escena) | No sumar: ElevenLabs y el sintetizador propio cubren música | P3 |
| vidIQ (`vidiq_generate_music`, `voiceover`, `motion_graphics`, `find_broll`) | Tendencias y ganchos; generación | Investigación gratis hasta donde no gaste créditos; **generación: PAGO/créditos, pedir OK** | Usar solo `trending_sound_search` y outliers para elegir tema y sonido | P2 (lectura) / P3 |
| Metricool | Programar | Plan ya pago | Ya integrado; ver variantes en sección 6 | ya está |

Decisión recomendada: **no comprar nada.** El salto de calidad viene de código propio (estilos 3D, karaoke, mezcla) y de la voz ElevenLabs que ya está pagada. Si se quiere un extra, el único candidato razonable es un clip generativo suelto (Kling ~1,2 USD) como plano de transición, siempre con OK.

## 4. Subtítulos karaoke y render 4K

Estado: `historia/base.js` ya muestra subtítulos palabra por palabra en bloques de hasta 3 y `obra.js` da un golpe de zoom en las palabras marcadas (`h`).
Mejora:

1. Tiempos: ElevenLabs Scribe o Whisper local sobre la pista final; guardar `{t, start, end}` por palabra (formato `Caption` de Remotion para poder pasar de un lado al otro).
2. Estilo karaoke: palabra activa con color de acento y escala 1,08 con `backOut`; resto en blanco con contorno oscuro de 14 px (lección ya documentada); páginas de 3 a 5 palabras; zonas seguras del reel (220 arriba, 420 abajo, 140 derecha).
3. Variantes de estilo de subtítulo (relleno, recuadro, subrayado que crece, palabra suelta grande) elegibles por receta (sección 6).
4. 4K: `render_h.sh <id> 30 2 4` ya rinde a `dsf=2` (2160×3840). Para ahorrar: renderizar el 3D a 1080×1920 y los textos vectoriales a 4K en capa aparte, y escalar con `lanczos` solo la capa 3D; Instagram no sube de 1080×1920, así que el 4K solo vale para archivo maestro y recortes. Codec maestro `libx264 -crf 14`, entrega `crf 18-20`, `-movflags +faststart`.
5. Sonido: voz y música por pista, `sidechaincompress` (la música baja con la voz), `loudnorm` a −14 LUFS, versión con voz y sin voz (ya existe en `sonido.py`).

## 5. Plan del «motor v2»: estilos del 3D Atlas con three.js y sin modelos

Idea base: cada estilo es un **«paquete de estilo»** = materiales + luz + cámara + postproceso + paleta, aplicado a la **misma escena lógica** (el mismo guion y los mismos objetos geométricos). Así un guion se renderiza en varios estilos (sirve para el reciclado y para el reel «el mismo negocio en 10 estilos»).

Estructura propuesta (carpeta nueva `historias-prototipo/motor2/`, sin tocar `motor/` hasta probar):

- `estilos/<id>.js` exporta `{ materiales(M), luz(escena), camara(t), post(composer), fondo, paleta, cadencia }`.
- `escena-logica.js`: lista de «piezas» abstractas (caja, plano, esfera, extrusión de silueta, texto en plano, panel) con posición y animación por tiempo; el estilo las viste.
- `textoGeom.js`: letras 3D con `TextGeometry` (fuente cargada desde `fonts/`) o SVG→`ExtrudeGeometry`, para carteles, cartulinas y neón.
- `variar.js`: toma una receta (sección 6) y arma estilo + cámara + orden + duración.
- Todo sigue siendo función pura del tiempo, `window.render(t)`.

Siete estilos prioritarios (receta técnica sin modelos):

| Estilo | Geometría | Material y luz | Cámara y post | Dificultad |
|---|---|---|---|---|
| **Low-poly** | `IcosahedronGeometry` y terreno con `PlaneGeometry` desplazada por ruido, `flatShading: true` | `MeshStandardMaterial` mate, 4 a 6 colores de paleta por altura; luz directa + hemisférica; agua con `MeshPhysicalMaterial` baja opacidad | Órbita lenta; bloom suave, viñeta; sin AO fuerte | Baja |
| **Paper pop-up** | Capas de `ExtrudeGeometry` finas (1 a 3 mm) de siluetas recortadas (formas simples o SVG), apiladas en Z con separación; pliegues como bisagras que giran (`rotation.x`) con `backOut` | Cartulina: `MeshStandardMaterial` rugosidad .9 con textura de fibra generada en canvas; luz de lámpara cálida direccional con sombra suave que cae sobre la capa de atrás (da la profundidad) | Dolly lento, DOF al fondo, grano; `GTAOPass` marca las juntas | Media |
| **Soft clay** | Formas redondeadas (`SphereGeometry`, `CapsuleGeometry`, `TorusGeometry`, extrusión con `bevel` grande) | `MeshPhysicalMaterial` con `roughness .6`, `clearcoat .15`, ruido de normal (huellas) generado en canvas; luz de estudio suave de 3 puntos + HDRI claro | DOF corto (efecto miniatura), bloom leve, AO fuerte | Media |
| **Tiny diorama** | Baldosa flotante (caja con bisel) con edificios de cajas, árboles de conos, camiones de cajas animados sobre rieles | Colores planos pastel, sombras duras nítidas de una luz solar, fondo degradé | Cámara a 3/4 desde arriba; **inclinación-desplazamiento (tilt-shift)** con `BokehPass` en banda horizontal | Media |
| **X-ray** | Objeto (cafetera, auto, casa) hecho de primitivas; cada pieza duplicada: cáscara y órganos internos | Material `ShaderMaterial` fresnel: `pow(1-dot(n,v), 2.5)`, mezcla aditiva, fondo oscuro azul; rótulos LED en planos | Bloom fuerte, `OutlinePass`, corte transversal con `clippingPlanes` animado | Media |
| **Exploded view** | Mismo objeto en N piezas con posición «armada» y «despiezada» a lo largo del eje; interpolar con `easeInOut`, escalonado por pieza | PBR limpio (metal/plástico), fondo de estudio gris; líneas guía con `Line2` o cilindros finos y rótulos numerados | Órbita lenta, DOF suave, reflejos con HDRI | Media |
| **Blueprint build** | Líneas: `EdgesGeometry` + `LineSegments2`; entra en fase «plano» (azul, cotas con texto) y luego «se rellena» creciendo en Y con material sólido | Fase 1: fondo azul #0b3d91, líneas blancas, grilla; fase 2: material blanco mate y sombras. Transición con `clipping` animado | Dibujo de trazo con `drawRange` o `dashOffset`; bloom mínimo | Media-alta |

Orden de trabajo:

1. **Semana 1:** `motor2` con estilos Low-poly, Soft clay y Tiny diorama sobre una escena lógica simple (vidriera de un negocio: sirve al reel de Marketing). Medir tiempo por cuadro.
2. **Semana 2:** Paper pop-up, Exploded view y X-ray (Autos 0 km «por dentro»), más karaoke nuevo.
3. **Semana 3:** Blueprint build, matriz de variantes, script que renderiza N variantes en lote y arma las hojas de contactos para revisar.
Cada estilo: prueba de un cuadro por marca antes de producir en serie (pendiente ya anotado en `cerebro/04`), y revisión con `revision/cuadros.js` y `revision/stills.js` (cuadros cada 0,5 s, volumen, ortografía).

Límites honestos: sin GPU, AO + DOF + sombras de 2048 px cuestan; para producción usar sombras de 1024 en pruebas y 2048 solo en el render final. Los estilos de «material» (arcilla, cartulina) dependen de texturas procedurales: hay que ajustarlas a ojo. Nada de caras reales; las marcas se muestran con objetos.

## 6. Reciclado con edición fuerte: variantes que no sean «la misma pieza»

Principio (de `content-recycling`): **se recicla el insight, no el archivo.** Meta penaliza el contenido repetido o poco original; no hay garantía de qué detecta, así que la meta no es «engañar» a nadie sino que cada variante sea de verdad una pieza distinta. Cambiar solo filtro, espejo o velocidad **no alcanza** y está mal visto. Se cambian los ejes que ve y siente la persona:

| Eje | Opciones concretas (el motor las elige por receta) |
|---|---|
| Estilo / material | Los 7 estilos del punto 5 (low-poly, arcilla, cartulina, diorama, rayos X, despiezado, plano) + paleta distinta por marca |
| Gancho | 3 a 5 primeras frases por idea (pregunta, «vos», mito roto, número, cartas cerradas); el cuadro 1 cambia de verdad |
| Orden | Reordenar bloques del cuerpo (lista 1-2-3 / 3-2-1, resultado primero o último); loop con otro empalme |
| Voz | Otra voz de la tabla (2) y otro modelo/etiquetas de emoción; con Voice Changer se conserva la actuación |
| Música y sfx | Otra pista (sintetizada con otra semilla, escala y tempo ±10 BPM, otra instrumentación) y otro set de golpes |
| Encuadre | Otra cámara (órbita, dolly, 3/4 alto, primer plano), otro foco, otro recorte de zona segura |
| Duración | 12 s loop / 22 s / 35 s con distinto ritmo de cortes (cambio cada 1,5 a 6 s) |
| Subtítulos | Otro estilo de karaoke y otro texto (no solo otro color) |
| Cierre (CTA) | Otra palabra clave y otro pedido (guardar / comentar / «¿cuál sos?») |

Reglas:

1. **Receta por variante:** un JSON `{id, estilo, gancho, orden, voz, musica, camara, duracion, subtitulo, cta, semilla}`. Un generador `variantes.py` arma el lote cumpliendo: **dos variantes de la misma idea no pueden compartir más de 2 de los 9 ejes**, y nunca repetir a la vez estilo + gancho + voz.
2. **Cadencia:** misma idea, como mucho 1 variante por semana por cuenta, con al menos 10 días entre dos del mismo estilo; priorizar las ideas con mejor retención según Metricool (ordenar por ganadoras, no de memoria).
3. **Texto, hashtags y portada** nuevos en cada publicación; no reusar el mismo archivo ni el mismo hash. Re-codificar el mp4 final con parámetros distintos no cuenta como variación.
4. Mantener `isAiGenerated: true` en las etiquetas, como ya está en el formato de Metricool.
5. Antes de programar: consultar lo ya programado (regla existente) para no duplicar; revisar hoja de contactos de cada variante.
6. Medir: cada variante es un experimento (skill `experimentation-and-ab-testing`); la que gane se recicla con otro eje cambiado.

Con 7 estilos, 4 ganchos, 3 voces, 3 músicas, 3 cámaras y 3 duraciones salen miles de combinaciones; con la regla de 2 ejes compartidos, 20 a 30 variantes realmente distintas por idea están al alcance sin gastar un peso.

## 7. Qué pedir a la responsable (todo opcional)

- **OK de pago: ninguno es necesario** para el plan de 3 semanas.
- Decidir la licencia de Remotion si se quiere usar (gratis solo hasta 3 personas).
- Si se quiere un clip generativo puntual: Kling ~1,2 USD por clip, con OK expreso.
- Confirmar qué voces se usan por marca (escuchar las previews de la tabla del punto 2).
- Autorizar bajar a la carpeta del proyecto `three`, `gsap` y, si se decide, `whisper` (instalación local, no global).

## 8. Herramientas usadas en este relevamiento

Lectura de `cerebro/00`, `04`, `18` y `03-referencias`; ElevenLabs (`account_get_usage`, `creative_list_voices`, `creative_get_flow_node_types`, `creative_list_brand_kits`, `creative_get_model_guide` de v4 y música; no se generó nada); lectura de `SKILL.md` de remotion-render, remotion-captions, it-reelsmaker, animation-studio, motion-reel y content-recycling; prueba de render WebGL con three.js en una carpeta temporal (nada instalado global). No se consultaron saldos de Kling, admakeai, vidIQ ni Adobe (podrían gastar o requerir login).
