# Encargo para cada sesión de producción de reels (cronograma x2, 20 al 29/11)

Sos una de las sesiones en paralelo que producen los reels del cronograma doble de redes. La sesión principal (la que te creó) coordina, integra y controla. Tu tramo (marca y fechas) viene en el mensaje con el que te crearon.

## 0. Antes de empezar (5 minutos)

1. Leé `CLAUDE.md`, `.ai-context/indicaciones-chat-nuevo-redes.md`, las secciones 14 a 16 de `.ai-context/handoff-redes-4-marcas.md` y `.ai-context/prompt-retomar-redes-2011.md`. Este encargo manda sobre ellos donde haya diferencias de reparto.
2. Preparación del motor, en `.claude/referencias/redes/herramientas/historias-prototipo/`:
   - `npm ci` (instala `three`; Playwright y Chromium ya vienen en la máquina: no los reinstales).
   - `pip install edge-tts numpy` si faltan.
   - Bajá la voz de Piper: `piper/es_AR-daniela-high.onnx` y su `.onnx.json` desde HuggingFace (`rhasspy/piper-voices`, carpeta `es/es_AR/daniela/high`). Si no está el ejecutable `piper`, instalá `piper-tts` con pip.
   - `python3 -m http.server 8799` en segundo plano en esa carpeta.
   - Prueba: `python3 historia_voz.py autos && python3 sonido.py autos && bash render_h.sh autos 30 1 4` debe dejar `out/autos-h.mp4`. Si algo falla, arreglalo en el motor sin romper las 4 historias que ya existen.
3. Sumá el repo de la landing de tu marca con `add_repo` (acceso de escritura) y clonalo al lado de LEGAL-CRM:

| Marca | Repo | Sitio | blogId de Metricool |
|---|---|---|---|
| VITA | EzequielGonz/estudio-juridico-vita-final | www.estudiojuridicovita.com | 7549864 |
| Coberturas | EzequielGonz/coberturas-sociales-landing | www.comparatuobrasocial.com | 7549939 |
| Autos | EzequielGonz/0km-kocos-agencia | www.autoskocos.com | 7552104 |
| Kocos | EzequielGonz/agencia-kocos-mkt | www.kocosmkt.com | 7242607 |

4. Probá si tenés Metricool: `getScheduledPosts` del blogId de tu marca para tu primer día. Si funciona, vos programás. Si no, dejás todo en el manifiesto (punto 5) y la sesión principal programa.

## 1. Qué producís

Los reels de `docs/redes/calendario-2011-2911-x2/calendario.csv` con `formato == reel`, de tu marca y tus fechas, en orden de salida (fecha y hora). No toques otras marcas, otras fechas, historias ni carruseles: los hace otra parte del equipo.

Ya están programados y NO se rehacen: los 4 reels del 20/11 a las 13:50 y el TRIAL_REEL de VITA del 20/11 a las 16:30. En el horario de las 13:50 del 20/11 ya hay un reel por marca: saltealo. Si tu tramo empieza el 20/11, los horarios de 08:50 y 10:30 de hoy los hace la sesión principal: empezá en el de 16:30 (Coberturas, Autos y Kocos) o 19:20 (VITA).

Cada fila trae idea, gancho, palabra, cierre, versión (A, B o R), variante_de, cambios, personaje, lugar_ba, conflicto_seg1 y giro_irreal. Usalos.

## 2. Cómo hacer cada reel

- **Id:** `<marca>-<idea_id>-<version>` en minúscula, con `vita`, `cob`, `autos` o `mkt`. Ejemplos: `autos-ruta-b`, `mkt-precio-a`; para las remakes (idea_id `R-vita-trayecto-1`) usá `vita-trayecto-r1`. Sin espacios ni acentos.
- **Guion:** en tu propio archivo `guiones/<marca>-<tramo>.py` (ver `guiones/_ejemplo.py`): `historia_guion.py` los carga solo. No edites `historia_guion.py`. Mismo formato que los guiones existentes: conflicto en el segundo 1, de 20 a 40 s, 3 puntos (`item`), cierre «Comentá PALABRA» (`cta=1`), `marca=` en las frases que disparan eventos visuales.
- **Historia:** un archivo `historias/<id>.js` por reel. Partí de la historia de tu marca (`vita.js`, `cob.js`, `autos.js`, `mkt.js`) y de `historias/comun.js`, `historia/irreal.js` (gigante, caída), `historia/decor.js`, `historia/primerplano.js`, `historia/personaje.js`, `historia/realce.js`. Cada idea nueva lleva su propia escena y su objeto de marca; no repitas la misma escena con otro texto. Las versiones B y R de una idea que ya hiciste pueden reutilizar su historia con `cfg` (otro gancho, otra apertura, otra paleta, otro orden), como `vita-b.js`.
- **Sonido:** `python3 sonido.py <id>` ya reconoce el prefijo de la marca. Si `vita(...)` falla porque tu guion no tiene las marcas del reel original (`sello`, `dolor`, etc.), usá el modo genérico para ese id.
- **Voz:** `python3 historia_voz.py <id>`.
- **Render:** `bash render_h.sh <id> 30 1 4` → `out/<id>-h.mp4`. Después borrá `fr/<id>-h/` para no llenar el disco (la máquina anterior murió por eso).
- **Revisión (obligatoria):** hoja de contactos `ffmpeg -i out/<id>-h.mp4 -vf "fps=1,scale=170:-1,tile=12x3" hoja.png` y mirala; cuadros sueltos con `revision/cuadros.js` donde dude. Chequeá: nada cortado, subtítulos legibles, logo y nombre de la marca visibles, sin carteles ilustrativos, ortografía y signos de apertura. Volumen cerca de −14 LUFS (`-af ebur128`).
- **Portada:** `node revision/stills.js` del plano más fuerte, JPG 1080×1920.

## 3. Reglas de contenido (no se negocian)

- Sin carteles en pantalla («Situación ilustrativa», «no reemplaza una consulta», «Voz generada con IA» van en el texto de la publicación).
- Logo y nombre de la marca en todo el reel; nombre y logo en el cierre.
- Sin números ni porcentajes en Coberturas (cuotas, aumentos) ni en Autos (precios, Black Friday 27/11 sin números reales).
- Sin patentamientos (ACARA) ni aumento de prepagas: si aparecen, usá el reemplazo que ya trae el calendario.
- Sin datos personales reales, sin marcas de terceros, sin prometer resultados. Afirmaciones legales generales y prudentes.
- Nunca «el botón está en el perfil».
- Calidad: planos rápidos e irreales, caídas, golpes, efectos que enganchen cada pocos segundos, sonido con pausas y golpes. Nada genérico.
- Español rioplatense con voseo, ortografía revisada.

## 4. Alojar

Copiá `out/<id>-h.mp4` como `<id>.mp4` y la portada como `<id>.jpg` a `apps/web/public/redes/2011/` del repo de la landing, en `main` (permiso expreso de la responsable para subir solo archivos estáticos ahí). `git pull --rebase` antes de cada push (otra sesión de tu marca sube a la misma rama), commit, push, y esperá que `https://<sitio>/redes/2011/<id>.mp4` responda 200 (Vercel tarda ~1 minuto).

## 5. Programar o dejar en el manifiesto

**Manifiesto (siempre):** `docs/redes/produccion-2011/manifiestos/<marca>-<tramo>.csv` con columnas `fecha,hora,marca,idea_id,version,id,video_url,portada_url,palabra,texto,estado,metricool_id`. `estado` = `alojado` o `programado`. El `texto` es el texto final de la publicación:

> Gancho.
>
> Los 3 puntos.
>
> Comentá «PALABRA» y te respondemos.
>
> Situación ilustrativa. Voz generada con IA. (En VITA, además: «Información general: no reemplaza una consulta.»)
>
> Hashtags de la marca.

Hashtags: VITA `#accidentedetransito #seguros #abogados #buenosaires #CABA` (adaptá a laboral o penal), Coberturas `#prepagas #obrasocial #monotributo #saludargentina #buenosaires`, Autos `#0km #autonuevo #concesionaria #buenosaires #autos`, Kocos `#pymes #emprendedores #ventas #marketingdigital #buenosaires`.

**Si tenés Metricool:** antes de cada día, `getScheduledPosts` de tu blogId para no duplicar. `createScheduledPost` con fecha y hora de la fila, timezone `America/Argentina/Buenos_Aires`, Instagram y Facebook, `instagramData {type: REEL, showReelOnFeed: true, isAiGenerated: true}`, `facebookData {type: REEL}`, `videoThumbnailUrl` con la portada. Anotá el id en el manifiesto y `estado=programado`.

**Si una pieza no llega** con al menos 20 minutos de margen a su horario, programala el mismo día a las 22:15 (o 23:00 si ya está ocupado) o, si ya pasó, el día siguiente a las 07:45, y anotá el cambio en el manifiesto.

## 6. Checkpoints, rama y límites

- Tu código (guiones, historias, arreglos del motor, manifiesto) va a la rama con la que te crearon; commit y push después de cada reel. Pie de commit: el que indique tu sesión.
- Cada 3 reels, mensaje corto a la sesión principal con `send_message` (si lo tenés): qué quedó alojado y programado.
- Si el límite de uso corta: commit, push y `send_later` para seguir cuando se restablezca.
- Ningún pago ni generador pago (Veo, Kling, Runway, ElevenLabs, créditos de plugins). No toques bio, botón, publicidad paga ni lo ya programado.
- Al terminar tu tramo, avisá a la sesión principal con el conteo de lo alojado y programado por día.
