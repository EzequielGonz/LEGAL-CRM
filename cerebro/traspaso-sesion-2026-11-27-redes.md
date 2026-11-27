# Traspaso · sesión de redes 27/11 (para retomar después de compactar)

Rama `claude/brave-hawking-nzsr60` · PR EzequielGonz/LEGAL-CRM#82 (seguido, en verde). Hay OTRA sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/`) y las líneas de redes del cerebro.

## Estado al 27/11 07:00 UTC: TODO FRENADO
- El dueño frenó el boceto de VITA. **No hay agentes trabajando ni nada programado.** Lo programado en Metricool del 25 al 29/11 (12 historias + 1 carrusel por día y marca) NO se toca.
- **Esperando:** el dueño busca 1 o 2 reels de referencia con el 3D que imagina. Al recibirlos, analizarlos (gancho, cámara, luz, nivel de realismo, animación, efectos) y recién ahí hacer el boceto de VITA con el guion `vita-2711-1`.

## RITMO VIGENTE (pedido del dueño, 27/11 12:10): manda sobre todo lo anterior
**Desde el 28/11, por marca y por día:**

| Pieza | Cantidad por día |
|---|---|
| Reels | 6 |
| Post | 1 |
| Carrusel | 1 |
| Historias | 2 |

- Lo ya programado no se toca: historias (12 por día) y carruseles (1 por día) hasta el 29/11.
- **Excepción de VITA** (lo hablado): en Instagram los reels suben de 2 a 6 por día, de a poco. Los demás reels de VITA van solo a Facebook.
- Hoy está en producción la tanda 1: 2 reels por día y marca del 28/11 al 02/12. **Faltan, por día y marca, 4 reels y 1 post**, y desde el 30/11 también 1 carrusel y 2 historias.
- Cada corrida programada:
  1. consulta getScheduledPosts;
  2. arma la tabla de faltantes;
  3. calibra con estadísticas, perfiles y competencia;
  4. produce empezando por el día más cercano.

| Cuándo (Buenos Aires) | trigger |
|---|---|
| Hoy 27/11 15:30 | `trig_01TFsMBNJWdP5NcYpjWz86FJ`: termina la tanda 1 y completa el ritmo del 28/11 en adelante |
| Sáb 28/11 13:00 | `trig_01YEtziqXSGoXu3bzb7Byf85` |
| Dom 29/11 13:00 | `trig_01MwTFfvxAabHtoHGCYnjjuW` |
| Dom 29/11 18:00 | `trig_01L6mweLEKYsNRzZNQ4CeFro` |
| Lun 30/11 21:00 | `trig_01UBqJxCNRzNquL65EDWyd6A` |
| 01/12 al 06/12, 16:20 | `trig_01Qh2oAbdu4BMz6qZ7Y67DHE`, `trig_016prp3YvGLMrizyKyfrPXMF`, `trig_01DsjEWxzQQ4kGMZb7U94ZLW`, `trig_01WDgb8tnuJaadoCgBnGoveU`, `trig_01JkeqbxAujLhkS8HYJ7cxFB`, `trig_01R7gV7DBLHXrHd7ZMZeTBjd` (la del 06/12 pregunta si sigue el ritmo después del 07/12) |

- Las del 28/11 al 30/11 son pedido explícito del dueño: como mínimo 2 reels más por marca en cada una, más el resto de los faltantes.
- **Capacidad medida:** un reel 3D tarda unos 5 min en exportarse con RAPIDO=1 y 3 procesos, así que 24 reels por día son unas 2 h de máquina. Más las voces, el alojamiento y Metricool.

## 27/11 12:30 — TANDA 1 EN PRODUCCIÓN (checkpoint para compactar)
**El dueño dio el OK** (27/11 ~11:50) con estos ajustes:
- subtítulos sincronizados y el cartel de arriba sin cortar;
- más animación y animaciones distintas, jugando con todos los rubros;
- voz un poco más rápida;
- ganchos polémicos;
- roles de editor, marketing, estrategia y copy senior;
- usar subagentes.

**Decidió:**
- 2 reels nuevos por día y marca, del 28/11 al 02/12: 40 reels. Los guiones del 27/11 al 01/12 se corren un día.
- Publicar todo en Metricool: Instagram y Facebook, America/Argentina/Buenos_Aires.
- Alojar los videos en `main` de cada landing, en `apps/web/public/redes/2811/`, como siempre.
- La revisión profesional de los textos legales queda cubierta por su OK expreso.

**Tareas programadas** (send_later a esta sesión; el texto de cada una dice qué hacer):

| Cuándo (Buenos Aires) | trigger | Qué hace |
|---|---|---|
| Hoy 27/11 15:30 | `trig_01TFsMBNJWdP5NcYpjWz86FJ` | Tanda 2, del 03/12 al 07/12: 40 reels, más carruseles (1 por día) e historias (6 por día) del 30/11 al 07/12 |
| Sáb 28/11 13:00 | `trig_01YEtziqXSGoXu3bzb7Byf85` | 2 reels más por marca, con calibración previa (estadísticas, perfiles y competencia) |
| Dom 29/11 13:00 | `trig_01MwTFfvxAabHtoHGCYnjjuW` | Ídem |
| Dom 29/11 18:00 | `trig_01L6mweLEKYsNRzZNQ4CeFro` | Ídem |
| Lun 30/11 21:00 | `trig_01UBqJxCNRzNquL65EDWyd6A` | Ídem |

**Metricool (comprobado en VITA el 27/11):** hay 12 historias y 1 carrusel por día solo hasta el 29/11. Desde el 30/11 no hay nada salvo estos reels. Posts sueltos no hay desde el 24/11.

**Contrato guion ↔ escena:** `docs/redes/tanda-2811-0712/tanda1/CONTRATO.md`.
- Plan por reel en `atlas/planes/<id>.json`, con ids `<marca>-<ddmm>-<a|b>`.
- Objetos por marca y efectos.

**Agentes lanzados a las 12:00 UTC (en segundo plano):**
- 4 guionistas: escriben los 10 planes por marca en `atlas/planes/` y un resumen en `docs/redes/tanda-2811-0712/tanda1/<marca>.md`.
  - `vita-2811-a` usa la voz ya grabada de `vita-2711-1`.
- 3 constructores de escena:
  - `escenas/coberturas.js`: plastilina, prueba con `planes/coberturas-2711-g2.json`;
  - `escenas/autos.js`: estudio de producto, prueba con `autos-2711-g2`;
  - `escenas/marketing.js`: cartel de aeropuerto, prueba con `marketing-2711-g1`.
  - Cada uno deja su hoja en `atlas/prueba/<marca>-hoja.jpg`.
- Al terminar, revisar sus informes y hojas antes de producir.

**Motor:**
- `escenas/vita.js` ahora se arma desde el plan:
  - frontón con el gancho y plano general al principio y al final (loop);
  - biblioteca de objetos de cartulina;
  - los 12 efectos del contrato;
  - carteles colgantes, atril con contador y cierre, y Nico de narrador.
  - Probado con `planes/vita-2711-1.json`; hoja `atlas/prueba/hoja-v3.jpg`.
- El boceto anterior quedó archivado en `escenas/vita-boceto-archivado.js`.
- `base.js` carga `planes/<id>.json` y tiene modo `RAPIDO=1` (sin profundidad de campo ni sombras, ~1,1 s por cuadro).
- `render.js` toma `RAPIDO` del entorno.
- `alinear.py <id> "<voz>" <audio>`: tiempos reales de cada palabra con faster-whisper small, que se instala con pip y baja de Hugging Face. Reconoce el 100 % de las palabras y corrige el karaoke.

**Pipeline que falta por reel:**
1. **Voz:**
   - ElevenLabs `creative_generate_speech`, modelo `eleven_flash_v2_5`, `generations_count: 1`.
   - Voces: Claudiio `hVXoK5zuQfMOQB7NrIFY` (VITA), Sol `ijxn8I4NzJccD2Sa7lcj` (Coberturas), Franco `jbWMqMKDKL7X0v1DXTHH` (Autos) y Santo `CNBiCLtxaJJKQwl4Hq2q` (Marketing).
   - Bajar el audio y acelerarlo con `atempo=1.12` (la herramienta no tiene parámetro de velocidad).
   - Agregar 0,5 s de silencio al principio y guardar `audio/<id>-voz.wav`.
   - Para `vita-2811-a`, acelerar el wav de `vita-2711-1`.
2. **Tiempos:** escribir `audio/<id>-palabras.json` con `{id, voz_fin, total: voz_fin + 1.2, palabras, textos, palabra, gancho}` y después correr `python3 alinear.py <id> "<voz>" audio/<id>-voz.wav`.
3. **Render y mezcla:**
   - `RAPIDO=1 node render.js <id> 30 3`, unos 5 min por reel.
   - `python3 mezcla.py <id>`.
   - ffmpeg a `out/<id>.mp4`: CRF 21, maxrate 14M, AAC 256k, faststart.
4. **Alojamiento:** copiar a `main` de la landing, en `apps/web/public/redes/2811/<id>.mp4`, más la tapa jpg; push y comprobar que responda 200 en el dominio de la landing.
5. **Antes de programar, revisar el copy de cada plan:** sacar «El botón está en el perfil» si aparece (orden del 20/11: ese botón no existe; el contrato lo pedía por error) y cerrar con «Situación ilustrativa. Voz generada con IA.».
6. **Metricool:** `createScheduledPost` con `providers: [instagram, facebook]`, `instagramData.type REEL` con `isAiGenerated: true` y `facebookData.type REEL`, `fecha_pub` y `hora` del plan, y el copy del plan. Antes, getScheduledPosts.

**Consumo:**
- ElevenLabs: 1.305 de 40.000 caracteres usados; las 39 voces usan ~16.000.
- vidIQ: 10 créditos gratis.
- Nada pago.

## 27/11 11:45 — boceto de VITA terminado y enviado al dueño (espera su OK)
- Video: `.claude/referencias/redes/herramientas/historias-prototipo/atlas/out/vita-2711-1-atlas-entrega.mp4` (34,6 s, 1080×1920, 30 fps, 53 MB, −15 LUFS; fuera de git por peso; el maestro CRF 17 pesa 174 MB). Hoja de revisión: `docs/redes/tanda-2811-0712/boceto-vita/atlas-teatrito-video-final.jpg`.
- Estado: especificado, implementado, probado (revisado cuadro por cuadro en 12 momentos, el loop empalma) y **no publicado ni programado**. Ajustes finales: apagón real en «Nunca» (viñeta y luces bajan), atril y Nico dentro del cuadro.
- Detalles a mejorar si da el OK: el resaltado del karaoke de VITA va por reparto proporcional dentro de cada frase (a veces se adelanta una palabra); en el empuje de cámara de los 4 s el frontón queda cortado arriba.

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
