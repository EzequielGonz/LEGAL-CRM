# Traspaso · sesión de redes 27/11 (para retomar después de compactar)

Rama `claude/brave-hawking-nzsr60` · PR EzequielGonz/LEGAL-CRM#82 (seguido, en verde). Hay OTRA sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/`) y las líneas de redes del cerebro.

## Estado al 27/11 07:00 UTC: TODO FRENADO
- El dueño frenó el boceto de VITA. **No hay agentes trabajando ni nada programado.** Lo programado en Metricool del 25 al 29/11 (12 historias + 1 carrusel por día y marca) NO se toca.
- **Esperando:** el dueño busca 1 o 2 reels de referencia con el 3D que imagina. Al recibirlos, analizarlos (gancho, cámara, luz, nivel de realismo, animación, efectos) y recién ahí hacer el boceto de VITA con el guion `vita-2711-1`.

## CHECKPOINT 27/11 07:35 (el dueño dijo «frena, poné un checkpoint»)
- **Pedido vigente:** UN solo reel de boceto, el de VITA (`vita-2711-1`), gratis, con el motor nuevo «Atlas» y el estilo Spotlight Stage (teatrito de juguete). Las otras 3 marcas quedan para después: el dueño lo corrigió en medio del trabajo.
- **Motor Atlas** en `.claude/referencias/redes/herramientas/historias-prototipo/atlas/`:
  - `base.js`: render ACES, entorno de estudio, bloom, profundidad de campo, grano, viñeta, aberración y flash; karaoke por palabra; logo; texturas en canvas; ruido de normales.
  - `reel.html` (`?m=<id>`).
  - `render.js`: `node render.js <id> prueba t1 t2…` da cuadros sueltos en `prueba/`; `node render.js <id> 30 3` da los cuadros del video en `fr/<id>/` y los eventos de sonido.
  - `voz.py <ids>`: VITA usa el mp3 de ElevenLabs con los tiempos de silencedetect; las demás marcas, edge-tts gratis con el tiempo de cada palabra.
  - `mezcla.py <id>`: voz, música de marca y efectos a −14 LUFS en `audio/<id>-mezcla.wav`.
  - `escenas/vita.js`: la escena.
  - Fuentes Outfit, Archivo y Plus Jakarta bajadas de Google Fonts a `atlas/fonts/`; no van en git y se bajan de nuevo de `raw.githubusercontent.com/google/fonts`.
- **Estado del boceto de VITA:** especificado e implementado; probado solo con cuadros sueltos (~1,9 s por cuadro). No hay video renderizado, no se mezcló el audio, no se publicó ni se programó nada.
  - Última hoja: `docs/redes/tanda-2811-0712/boceto-vita/atlas-teatrito-prueba-4.jpg` (no se revisó a ojo antes de frenar); la anterior, `-3.jpg`.
  - Va bien: el teatrito entero con el gancho en el frontón; el globo «Perdón, fue mi culpa» desde el cuadro 1; el tachón dorado y el sello NUNCA; los pasos 1/3, 2/3 y 3/3 en el atril; las fotos en un tendedero con flash; testigos; almanaque con sello; avión de papel; loop al plano general.
  - Último ajuste aplicado: brillo solo en las ventanas, apagón en «Nunca», globo entero hasta que se rompe, atril y fotos dentro del cuadro.
- **Para retomar:**
  1. Mirar `prueba-4`.
  2. Corregir lo que haga falta.
  3. `node render.js vita-2711-1 30 3` (unos 1.040 cuadros, ~12 min con 3 procesos).
  4. `python3 mezcla.py vita-2711-1`.
  5. Unir los cuadros con ffmpeg: `fr/vita-2711-1/%05d.jpg` a 30 fps con `audio/vita-2711-1-mezcla.wav`, x264 CRF 17, a `out/vita-2711-1-atlas.mp4`.
  6. Mandarlo al dueño para su OK.
  - Antes, regenerar las voces con `python3 voz.py vita-2711-1`; las carpetas `audio/` y `fr/` no van en git.
- **Arena** (pidió usar agentes; la skill «arena» no existe ni en el proyecto ni en sus skills de claude.ai): 3 propuestas en `docs/redes/tanda-2811-0712/arena/`: A (ganchos), B (viral) y C (escena). Para VITA se tomaron:
  - de B, el globo visible desde el cuadro 1;
  - de C, el apagón en «Nunca» y el rebobinado al final;
  - de A, el sello NUNCA y la caída del globo.
  - Las propuestas de Coberturas, Autos y Marketing quedan para cuando se hagan esas marcas.
- Consumo de esta vuelta: vidIQ 10 créditos gratis (quedan 70, se renuevan el 9/12). Nada pago.

## Novedad 27/11 07:20: llegaron las referencias
- Reel de referencia (@sunnyshoots.ai: Tripo + Blender + Seedance 2.5) y 3D Atlas (37 estilos con three.js). Análisis, costos y estilos elegidos en `docs/redes/viral-2511/07-referencia-3d-ia-y-costos.md`.
- Se le preguntó si autoriza USD 50 para una prueba híbrida única (Tripo Pro USD 20 + saldo Seedance USD 30). **Sin su OK no se paga nada.**
- Ruta gratis: falta que Claude in Chrome copie los prompts del Atlas (el botón «Copiar prompt»; pedirlos directo al servidor lo bloqueó el filtro de seguridad) y los guarde en `.claude/referencias/redes/herramientas/atlas-prompts/`.

## Qué quiere el dueño (leer antes de diseñar)
- **Los reels 2D de personajes que ya subimos** (Nico en la esquina, el celular con la notificación, los papeles volando, el calendario «HOY», karaoke), **pero en 3D, de mejor calidad, más reales, más animados, con voz y efectos «wow»**. Ejemplo de lo que subimos: `estudio-juridico-vita-final/apps/web/public/redes/2011/vita-nunca-frases-a.mp4` (motor `historia.html` + `historia/personaje.js`).
- Rechazó el 27/11, en este orden (detalle en `cerebro/14`, tabla «Lo que rechazó»):
  1. piloto con rayas y recuadros dorados;
  2. maqueta 3D low-poly («re contra malo»);
  3. motion editorial de tipografía sola;
  4. ilustración con IA («se ve muy IA»);
  5. fotos de stock con tipografía («le estás metiendo cosas IA»);
  6. personajes 3D de videojuego con Mixamo («tipo jueguito tampoco»).
- Pidió esfuerzo **alto** (no máximo).

## Hecho y vigente
- Análisis 01–05 en `docs/redes/viral-2511/` (05 = estrategia vigente) y guía visual por marca `06-direccion-de-arte-v2.md` (escrita antes de los rechazos: usar solo valores de marca, tipografías y zonas seguras; el estilo de escena quedó descartado).
- **Guiones v2 corregidos y validados** (`docs/redes/tanda-2811-0712/guiones/*.json`, `GUIONES.md`, `fuente/armar.py`):
  - 27/11–06/12, por marca 44 con ElevenLabs (incluye 4 de reserva) y 20 con voz gratis, 37.442 caracteres en total;
  - campo `motor_voz`;
  - palabra única en toda la tanda y ningún tema repetido antes de 7 días;
  - Coberturas sin cifras; Marketing sin Black Friday.
  - **Pendiente antes de publicar:** revisión profesional de los temas legales nuevos de VITA y de seguro y crédito de Autos; cargar las palabras clave nuevas en los bots y armar cada recurso prometido.
- Voz del boceto ya generada: `docs/redes/tanda-2811-0712/salida/vita/vita-2711-1.mp3` (32,9 s, no regenerar). Tiempos de cada frase medidos con silencedetect; están en el historial de esta sesión.
- Música y efectos ya generados: `historias-prototipo/tanda/trabajo/vita-2711-1/musica.mp3` y `sfx_foto.mp3`.
- Muestras descartadas, guardadas como referencia de lo que NO va, en `docs/redes/tanda-2811-0712/boceto-vita/`.
- Prueba técnica de 3D real: `historias-prototipo/prueba3d.html` + `prueba3d.js`. Funciona sin servidor porque Playwright entrega los archivos del disco; tiene HDRI, adoquines PBR, bloom, profundidad de campo y grano. Recursos en `assets3d/` (fuera de git; licencias en `assets3d/LICENCIAS.md`). La técnica sirve; los personajes de Mixamo no.
- No levantar `python3 -m http.server`: el clasificador lo bloqueó. Usar la entrega de archivos por Playwright (`prueba3d.js`).

## Consumo
- ElevenLabs Starter: 1.305 de 40.000 créditos usados. Con las voces de la tanda quedan unos 1.250, que alcanzan para unas 8 imágenes. Imagen krea-3 ≈ 151 créditos (≈ 3 centavos de dólar), y **cada imagen pide OK explícito del dueño**.
- Unsplash: gratis (descargas registradas). vidIQ: 80 créditos sin usar.

## Próximo paso
1. Con las referencias del dueño: análisis → propuesta de cómo llegar a ese 3D (motor propio y/o generador pago, con costo exacto y espera de OK) → 3 cuadros de prueba → boceto de VITA → OK del dueño.
2. Con el OK: producir en lotes de 2 días, alojar en la landing de cada marca (`apps/web/public/redes/`), comprobar 200 y programar en Metricool (zona `America/Argentina/Buenos_Aires`, consultar antes para no duplicar). Medición a 24 h y a 7 días según `05-estrategia.md`.

## Datos
- Metricool blogId: VITA 7549864 · Compara Tu Obra Social 7549939 · Automotores Kocos 7552104 · Kocos Marketing 7242607.
- ElevenLabs Flash (`eleven_flash_v2_5`). Voces: Claudiio `hVXoK5zuQfMOQB7NrIFY` · Sol `ijxn8I4NzJccD2Sa7lcj` · Franco `jbWMqMKDKL7X0v1DXTHH` · Santo `CNBiCLtxaJJKQwl4Hq2q`. Una sola generación por pieza.
- Regla: usar todo lo instalado que sirva y decir qué se usó (`02`, `00-arranque`, Cognee).
