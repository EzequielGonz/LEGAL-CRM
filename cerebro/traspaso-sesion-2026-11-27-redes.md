# Traspaso · sesión de redes 27/11 (para retomar después de compactar)

Rama `claude/brave-hawking-nzsr60` · PR EzequielGonz/LEGAL-CRM#82 (seguido, en verde). Hay OTRA sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/`) y las líneas de redes del cerebro.

## (VIEJO, ya superado) Estado al 27/11 07:00 UTC: TODO FRENADO
- El dueño frenó el boceto de VITA. **No hay agentes trabajando ni nada programado.** Lo programado en Metricool del 25 al 29/11 (12 historias + 1 carrusel por día y marca) NO se toca.
- **Esperando:** el dueño busca 1 o 2 reels de referencia con el 3D que imagina. Al recibirlos, analizarlos (gancho, cámara, luz, nivel de realismo, animación, efectos) y recién ahí hacer el boceto de VITA con el guion `vita-2711-1`.

## CHECKPOINT 27/11 ~19:00 BA (21:56 UTC) — CORRIDA 1 EN PRODUCCIÓN, preparado para compactar
**Destrabado:** el dueño eliminó en claude.ai los plugins `simple-workflow`, `sixth-sense`, `one-shot-prompting` y (a pedido suyo) `naksha`. Sus copias locales se archivaron (no borradas) en `/root/.claude/plugins/archivo-desactivados-2711/` y quedaron en `false` en `/root/.claude/settings.json`. Descargas y `git push` funcionan. El plugin `superstack` pide un recibo en `.superstack/outward-pass` antes de cada push (excluido de git): agregar una línea con la revisión de claves y datos personales y reintentar.

| Pieza | Estado |
|---|---|
| Escenas de las 4 marcas | **Aprobadas** (hojas en `atlas/prueba/<marca>-hoja*.jpg`) |
| Voces de los 40 reels de la tanda 1 | **Listas** en `atlas/audio/<id>-voz.wav` (ElevenLabs Flash, 13.669 de 40.000 caracteres usados en el mes). Lista en `audio/voces-listas.txt` |
| Producción | **Andando sola**: `atlas/cola.sh` recorre 2811 → 2911 → 3011 → 0112 → 0212 (vita, marketing, coberturas, autos; a y b) y corre `lote.py` por reel. Registro: `atlas/lote.log`; salida `atlas/out/<id>.mp4` + `.jpg`; control `atlas/prueba/chk/<id>-0/1/2.jpg` |
| Velocidad medida | **unos 20 a 30 min por reel** (≈1 cuadro por segundo con 3 procesos; 4 núcleos, render por software). 8 reels por día ≈ 3 a 4 h. Si no alcanza: proponer 24 cuadros por segundo |
| Alojar | `atlas/alojar.sh <ddmm> <ids…>` copia a `apps/web/public/redes/<ddmm>/` de cada landing, sube a main y a la rama, y anota el 200 en `atlas/alojados.log` |
| Metricool | Nada programado todavía de la tanda 1. Relevamiento de lo ya programado: `docs/redes/tanda-2811-0712/metricool-programado-2711.md` (28 y 29/11: carrusel 11:00 + 12 historias por marca; Marketing con 5 reels el 28/11, borradores y repetidos viejos que no se tocan; del 30/11 en adelante vacío) |
| Horarios del 28/11 | VITA 08:40 y 21:10 · Autos 09:10 y 17:10 · Marketing 12:20 y 18:40 · Coberturas 12:40 y 18:10 (no pisan lo programado). Todas IG + FB |
| Calibración previa | `docs/redes/tanda-2811-0712/calibracion-2711-1832.md` (parte B vacía) |

**Próximo paso (control programado `trig_01QZhmnBj84nRBryACu9WkBh`, 22:19 UTC):**
1. Revisar `prueba/chk/vita-2811-a-*.jpg` y `lote.log`.
2. Cuando estén los 8 de 2811: `./alojar.sh 2811 vita-2811-a vita-2811-b marketing-2811-a marketing-2811-b coberturas-2811-a coberturas-2811-b autos-2811-a autos-2811-b` y programar en Metricool (REEL, `isAiGenerated: true`, IG + FB, hora del plan, copy del plan, tapa como `videoThumbnailUrl`), registrar en `docs/redes/programadas.jsonl`.
3. Repetir por día; dejar un control programado cada ~2 h hasta terminar la tanda 1.
4. Pendiente de la corrida 1: parte B de la calibración, tanda 2 (03 al 07/12), posts, carruseles e historias desde el 30/11, informe al dueño y marcar la fila 1 del calendario `06`.
- Pendiente de decisión del dueño: pasar a borrador los repetidos viejos de Marketing en Metricool (ofrecido, sin respuesta).

## CORRIDA 1 · 27/11 18:32 (Buenos Aires) — FRENADA POR PLUGINS NUEVOS (resuelto, ver arriba)
- Hecho: los 3 agentes de escena retomados; inventario de herramientas en `docs/redes/tareas-programadas/07-herramientas.md`; análisis previo en curso (`calibracion-2711-1832.md`); `atlas/lote.py` (alinear → render → mezcla → mp4 → tapa → 3 cuadros de control); cierre «Escribinos por WhatsApp» agregado a la voz de `vita-2811-a`. Commit `c7b0751`, **sin subir**.
- Voz de `vita-2811-a` generada y pagada (374 caracteres, flow `mqs9MS7CnBo1i9GNz2Mg`), **sin bajar**: el link vence el 28/11 00:00 UTC; después se baja desde el flow de ElevenLabs sin volver a pagar. No generar las otras 39 hasta poder bajarlas.
- Bloqueos (hooks de plugins sincronizados, no se saltean):
  - `simple-workflow`: bloquea `curl`/`wget` (no se pueden bajar las voces ni comprobar el 200).
  - `sixth-sense`: bloquea todo `git push` (no se puede alojar en las landings ni subir el repo).
  - `one-shot-prompting`: bloquea comandos que nombran ciertas palabras (falso positivo).
  - `superstack`: pide un recibo de revisión antes de publicar (se resuelve con `.superstack/outward-pass`, excluido de git).
- Al destrabar: subir `c7b0751`, bajar la voz de `vita-2811-a`, generar las 39 voces restantes (subagente, orden por día) y correr `lote.py` por día.

## CHECKPOINT 27/11 09:40 (Buenos Aires) — PAUSA pedida por el dueño, se retoma a las 18:32
El dueño pidió «dejá un checkpoint y pausá» , después «pasala para las 14:30» y a las 14:30 «reprogramá para las 18:32». La corrida 1 (antes 15:30) quedó a las 18:32 (`trig_01TFsMBNJWdP5NcYpjWz86FJ`).

| Pieza | Estado al pausar |
|---|---|
| Carpeta `docs/redes/tareas-programadas/` y 21 corridas programadas | Hecho y subido |
| Cierre «Escribinos por WhatsApp» en los 40 planes y en la placa de `escenas/vita.js` | Hecho, probado con un cuadro (`prueba/vita-pcta-32.50.jpg`) y subido |
| Objetos cliché fuera (balanza, martillo, estetoscopio, megáfono) | Hecho en planes y contrato |
| Escena VITA (`escenas/vita.js`) | Lista para producir |
| Escena Coberturas (`escenas/coberturas.js`) | Hecha. Hoja `prueba/coberturas-hoja.jpg` revisada. **Frenada a mitad de las correcciones**: personaje cortado en el borde, cambio de texto más corto (0,25 s), flash al 35 %, gancho de 3 renglones de 110 px o más y estetoscopio cambiado por credencial. Hoja nueva con `coberturas-2811-a` y `coberturas-0212-b` |
| Escena Autos (`escenas/autos.js`, plan `autos-2711-g2`) | **Frenada probando cuadros** (sin errores, menos de 1 s por cuadro). Falta la hoja `prueba/autos-hoja.jpg` y el informe |
| Escena Marketing (`escenas/marketing.js`, plan `marketing-2711-g1`) | **Frenada antes del primer render de prueba**. Falta la hoja y el informe. Ya sabe: cierre «Escribinos por WhatsApp» y megáfono → chat |
| Reels de la tanda base 1 | Ninguno producido, alojado ni programado |

- **Aviso de las 14:30:** llegó igual, porque se disparó segundos antes del cambio. No se ejecutó por orden del dueño. La única corrida de hoy es la de las 18:32.
- **Preparado para compactar (27/11 14:35):** todo commiteado y subido. Último commit al cierre de la vuelta: `218ff4a`.
- **Archivos locales fuera de git**, presentes al cerrar:
  - `atlas/fonts/` (Archivo, Outfit y Plus Jakarta);
  - `atlas/audio/` (voces de prueba);
  - `atlas/prueba/` (hojas);
  - `node_modules/three`;
  - faster-whisper instalado con pip.
- **Si el contenedor se renueva:**
  - las fuentes se bajan de `raw.githubusercontent.com/google/fonts`;
  - `npm ci` en `historias-prototipo/`;
  - `pip install faster-whisper`;
  - la voz de VITA base está en `docs/redes/tanda-2811-0712/salida/vita/vita-2711-1.mp3`.

**Para retomar a las 18:32:**
1. SendMessage a los 3 agentes (ids en la tabla del calendario `06`; Coberturas `ae2799403b7f4cbb6`, Autos `a7a30568baff16336`, Marketing `a236a25ba8ca1a6e0`) para que sigan. Mientras, arrancar VITA (voces, alinear, render, mezcla).
2. Revisar cada hoja y después seguir el README de la carpeta.

## 27/11 09:30 (Buenos Aires) — CARPETA DE TAREAS PROGRAMADAS: manda sobre todo lo de abajo
- **Todo está en `docs/redes/tareas-programadas/`:**
  - `README.md`: arranque y pasos;
  - `01`: ritmo y grilla de horarios;
  - `02`: análisis antes y a mitad de cada corrida;
  - `03`: reels;
  - `04`: posts, carruseles e historias;
  - `05`: alojar y programar;
  - `06`: calendario de las 21 corridas con sus ids.
- **2 corridas por día hasta el 07/12** (21 en total). Cada una hace como mínimo 2 reels más por marca y completa el ritmo: 6 reels, 1 post, 1 carrusel y 2 historias por marca y día.
- Cada tarea programada arranca leyendo el README.
- **Cierre: solo «Escribinos por WhatsApp.»** (pedido del dueño, 27/11). Ya no hay palabra clave ni nada para cargar en los bots. Los 40 planes de la tanda 1 y la placa final de `escenas/vita.js` ya están corregidos; se avisó a los 3 constructores de escena.
- Metricool todavía no tiene datos de mejor horario: devuelve 0 en las 4 marcas. La grilla sale de lo que ya rindió (`05-estrategia.md`).

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

**Guiones de la tanda 1: los 40 planes terminados y validados** (resúmenes en `docs/redes/tanda-2811-0712/tanda1/<marca>.md`). Antes de programar, revisar:
- ~~Marketing: que el bot acepte «reseñas» además de RESENAS~~ (ya no aplica: el cierre es «Escribinos por WhatsApp»). Confirmar en la ayuda oficial los datos de plataforma que se nombran (historias de un día, link de reseñas de Google, «Solicitudes» de Instagram, horarios especiales).
- Autos: ~~en 0KM, SENA y CFT la voz dice «comentá la palabra»~~ (ya no aplica: la voz cierra con «Escribinos por WhatsApp»).
- Coberturas: los personajes pasaron a Lucía o Gabriel.
- Las horas son las de los guiones base: chequear en Metricool que no se pisen con lo ya programado.

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
