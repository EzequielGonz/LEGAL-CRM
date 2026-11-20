# Pedido para retomar la producción de redes (sesión nueva, 20/11)

Pegar este texto entero en una sesión nueva de claude.ai/code con el repo LEGAL-CRM, desde las 05:55 de Buenos Aires.

---

Retomá la producción de redes de las 4 marcas. Trabajá en la rama `claude/happy-wozniak-ajfi1z` de LEGAL-CRM. La sesión anterior se quedó sin máquina; todo su trabajo está subido en esa rama (último commit del traspaso: `adf5471` o posterior).

## 1. Leé primero, en este orden

1. `CLAUDE.md`, que tiene las reglas que no se negocian.
2. `.ai-context/indicaciones-chat-nuevo-redes.md`, con el rol, los permisos, el estándar de calidad y la forma de trabajo. Vale para toda la conversación.
3. Las secciones 14, 15 y 16 de `.ai-context/handoff-redes-4-marcas.md`. Ahí están las decisiones, los archivos del motor, los ids de Metricool, el flujo por pieza, el formato de programación, los hashtags y las lecciones.

No releas todo lo demás: seguí derecho.

## 2. Marcas, cuentas de Metricool y dónde se alojan las piezas

| Marca | blogId de Metricool | Repo de la landing (rama main) | Sitio |
|---|---|---|---|
| VITA Abogados | 7549864 | estudio-juridico-vita-final | www.estudiojuridicovita.com |
| Compara Tu Obra Social | 7549939 | coberturas-sociales-landing | www.comparatuobrasocial.com |
| Automotores Kocos | 7552104 | 0km-kocos-agencia | www.autoskocos.com |
| Kocos Marketing | 7242607 | agencia-kocos-mkt | www.kocosmkt.com |

- Los archivos van en `apps/web/public/redes/2011/` de cada landing, en `main`, y solo pueden ser archivos estáticos.
- Vercel los publica en alrededor de 1 minuto. Antes de programar, comprobá que la URL `https://<sitio>/redes/2011/<archivo>` responda 200.
- Si los repos de las landings no están en la sesión, sumalos con `add_repo`.

## 3. Cronograma: qué sale y cuándo (hora de Buenos Aires)

La fuente es `docs/redes/calendario-2011-2911-x2/calendario.csv`, con 632 filas: 272 reels, 320 historias y 40 carruseles, del 20/11 al 29/11 y para las 4 marcas por igual. Cada fila trae fecha, hora, marca, redes, formato, idea, gancho, palabra, cierre, versión (A, B o R), variante_de, cambios, personaje, lugar_ba, conflicto_seg1 y giro_irreal.

**Horarios por marca:**

| Días | Reels | Historias | Carrusel |
|---|---|---|---|
| 20 al 24/11 | 08:50 · 10:30 · 13:50 · 16:30 · 19:20 · 20:50 | 08:00 · 09:50 · 11:30 · 13:00 · 15:30 · 18:50 · 20:00 · 21:30 | 11:20 |
| 25/11 | 08:30 · 10:30 · 13:30 · 16:30 · 19:00 · 20:30 | 08:00 · 09:30 · 11:30 · 13:00 · 15:30 · 18:30 · 20:00 · 21:30 | 11:00 |
| 26 al 29/11 | 07:30 · 09:00 · 10:30 · 12:00 · 13:30 · 17:00 · 19:00 · 20:30 | igual que el 25/11 | 11:00 |

**Volumen extra pedido por la responsable:**
- Hasta 4 historias más por día y marca, a las 10:30, 14:30, 17:00 y 22:30, con temas del mismo rubro.
- 1 reel de prueba (TRIAL_REEL, solo Instagram) por día y marca, con una versión distinta de un reel ya publicado, a 5 días o más de la original.

**Ya programado del cronograma nuevo. No lo dupliques ni lo toques:**

| Marca | Pieza | Hora del 20/11 | id |
|---|---|---|---|
| VITA | Carrusel guía «Antes de firmar» | 11:20 | 435155423 |
| VITA | Reel «Antes de firmar» A | 13:50 | 435155397 |
| VITA | TRIAL_REEL «Plata rápida» (versión B, solo IG) | 16:30 | 435171038 |
| Coberturas | Reel «La carta» | 13:50 | 435157529 |
| Autos | Reel «El ticket del 0 km» | 13:50 | 435160321 |
| Kocos | Reel «El celular que no para» | 13:50 | 435161701 |

**Grupo de control del 20 al 24/11 (lo programado antes): NO se toca.** Son 10 piezas por día y marca, con reels a las 08:30, 11:00, 13:30, 17:00 y 20:30, posts a las 10:00 y 19:00, carrusel a las 12:30 e historias a las 09:30 y 18:30. Sale igual aunque diga «el botón está en el perfil».

**Lo que no llega a tiempo:** los reels de hoy de 08:50 y 10:30 que no estén listos se pasan a otro horario libre de los días siguientes. No se pierden.

## 4. Decisiones de la responsable (20/11)

- Arranca ya: cronograma doble del 20/11 al 29/11. Sin freno por retención o alcance («pegamos o pegamos»).
- **Patentamientos (ACARA): no.** Ya está reemplazado por «¿Contado, prendario o plan?».
- **Aumento de prepagas: no.** Ya está reemplazado por «¿Pagás por cosas que no usás?» (`plan-uso`).
- **Black Friday de Autos (27/11): sí, sin números reales.**
- **Piezas de cuota de Coberturas** («antes de pagar, compará»): aprobadas mientras no tengan números ni porcentajes.
- **Todo lo demás está aprobado y se publica.** Incluye VITA laboral y penal, y «Lo que dijo la Corte» de Coberturas. No queda nada en borrador.
- **Sin carteles en pantalla.** «Situación ilustrativa», «Información general: no reemplaza una consulta» y «Voz generada con IA» van en el texto de la publicación. Con voz sintética va además `isAiGenerated: true`.
- **Logo y nombre de la marca en todas las piezas.**
- **Calidad:** premium y viral. Planos rápidos e irreales, caídas, golpes y efectos «wow», con algo que enganche cada pocos segundos. Más definición y realismo, sonido y pausas con nivel de cine.
- **4K cuando se pueda.** Para producir en serie, 1080×1920 a 30 cps.
- **Versiones B y R:** son cambios reales (otro gancho, escena, voz, música u orden), no trucos para engañar la detección de duplicados.
- **Ortografía y tipeo:** revisar cada pieza antes de programarla.
- **No tocar** el botón ni la bio de los perfiles, ni publicidad paga. Ningún pago ni generador pago (Veo, Kling, Runway, ElevenLabs).
- **Nada se borra:** se archiva o pasa a borrador con motivo.

## 5. Correcciones pendientes, antes de producir en serie

1. En `docs/redes/calendario-2011-2911-x2/estaticos/contenido.py`, volver a poner el tema de Coberturas «fallo-corte» («Lo que dijo la Corte»), que un agente cambió por «reintegros». Usar el texto del calendario sin inventar datos. El cambio «aumento» → «revisar-plan» está bien.
2. Escribir el texto final de las 34 historias que solo tienen el título del tema.
3. En Autos, subir el contraste de las palabras destacadas en azul.
4. Sumar planos irreales a Coberturas, Autos y Kocos (`historia/irreal.js` quedó en curso).
5. Hacer un render de prueba de un cuadro por marca para confirmar que el motor anda después de los cambios a medias.

## 6. Cómo producir cada reel

El motor está en `.claude/referencias/redes/herramientas/historias-prototipo/`. Solo hay 4 historias armadas: `historias/vita.js` (con la versión B en `vita-b.js`), `cob.js`, `autos.js` y `mkt.js`. Hay que crear unas 90 historias base nuevas a partir de las ideas del calendario; las versiones B y R salen de ellas. Reutilizá `historia/irreal.js`, `historias/comun.js`, `historia/realce.js` y `historia/personaje.js`.

**Pasos por pieza:**

1. Levantá `python3 -m http.server 8799` en esa carpeta (se cae si se reinicia el equipo).
2. **Guion:** escribilo en `historia_guion.py`. Conflicto en el segundo 1, de 20 a 40 s, y cierre «Comentá PALABRA».
3. **Voz:** generala con `historia_voz.py <id>`.
   - Usa edge-tts es-AR (Elena y Tomás) y Piper `es_AR-daniela-high`.
   - El modelo `.onnx` de Piper se baja de HuggingFace porque está en `.gitignore`.
   - El parche SSL `_SSL_CTX` con `/root/.ccr/ca-bundle.crt` ya está en el archivo.
4. **Sonido:** mezclalo con `sonido.py <id>`. Va con ambiente, efectos y música que baja con la voz, a −14 LUFS.
5. **Render:** corré `bash render_h.sh <id> 30 1 4`.
   - Para el desenfoque de movimiento, renderizá a 60 cps y aplicá `ffmpeg -vf "tmix=frames=2:weights='1 1',fps=30"`. Tarda 7 veces más: solo para piezas destacadas.
6. **Revisión:**
   - Cuadros sueltos: `revision/cuadros.js <id> <dir> <t1,t2,…>`.
   - Hoja de contactos: `ffmpeg -i x.mp4 -vf "fps=1,scale=170:-1,tile=12x3" hoja.png`.
   - Volumen: `-af ebur128`.
   - Revisá la ortografía de subtítulos y globos.
7. **Portada:** sacala con `revision/stills.js` del plano más fuerte.
8. **Alojar:** copiá el mp4 y la portada a la landing (`main`, `/redes/2011/`, nombre `<marca>-<idea>-<versión>.mp4`), hacé push y esperá el 200.
9. **Liberar disco:** borrá la carpeta `fr/` (cuadros) de ese reel. La sesión anterior murió por espacio.

## 7. Cómo programar en Metricool

Antes de cada día y marca, corré `getScheduledPosts` para no duplicar.

**Reels** (`createScheduledPost`):
- Fecha y hora con timezone `America/Argentina/Buenos_Aires`. Metricool la muestra en Europe/Madrid, con 4 horas más.
- Redes: Instagram y Facebook.
- `instagramData {type: REEL, showReelOnFeed: true, isAiGenerated: true}`, `facebookData {type: REEL}` y `videoThumbnailUrl` con la URL de la portada.

**Reels de prueba:** `TRIAL_REEL`, solo Instagram. En Kocos fallaron antes por el mínimo de seguidores: si falla, anotalo y seguí.

**Texto de cada reel:**
- Gancho.
- 3 puntos.
- «Comentá «PALABRA» y te respondemos.».
- Al final, «Situación ilustrativa. Voz generada con IA.». En VITA se suma «Información general: no reemplaza una consulta.».
- Hashtags.

**Hashtags:**
- **VITA:** #accidentedetransito #seguros #abogados #buenosaires #CABA (adaptar al tema: laboral, penal, etc.).
- **Coberturas:** #prepagas #obrasocial #monotributo #saludargentina #buenosaires
- **Autos:** #0km #autonuevo #concesionaria #buenosaires #autos
- **Kocos:** #pymes #emprendedores #ventas #marketingdigital #buenosaires

**Historias y carruseles:**
- Se generan con `docs/redes/perfil-profesional/herramientas/generar.py` y `datos.py`, con la identidad de cada marca, y con `estaticos/contenido.py`.
- Formato: historias 1080×1920 y carruseles 1080×1350.
- Se alojan igual que los reels y se programan como STORY o carrusel en Instagram y Facebook.

**Nunca escribir «el botón está en el perfil» en piezas nuevas.**

## 8. Reparto del trabajo, para ir más rápido

- **Render:** cada sesión en la nube tiene su propia máquina de 4 núcleos (unos 6 minutos por reel).
  - Creá sesiones con `create_session`: primero una de prueba y, si renderiza y aloja bien, sumá hasta 8.
  - Cada una toma un tramo del calendario en orden de salida: primero lo que queda de hoy (16:30, 19:20 y 20:50), después el 21/11, el 22/11 y así hasta el 29/11.
  - Cada una sube su código a su propia rama y sus archivos a las landings. Vos integrás el código en `claude/happy-wozniak-ajfi1z`.
  - Pasale a cada sesión este mismo pedido, con su tramo asignado.
- **Esta sesión:** usá subagentes locales para programar en Metricool lo ya alojado y para producir las historias y los carruseles, que son estáticos y rápidos.
- **Orden:** siempre por fecha de salida, con 24 a 48 horas de ventaja sobre la publicación.

## 9. Límite de uso y checkpoints

- El límite de uso es uno solo para toda la cuenta: las sesiones en paralelo lo gastan más rápido.
- Se recomendó a la responsable dejar desactivado el pase automático a créditos pagos, o ponerle un tope de gasto. Desde la sesión no se ve cuándo empieza a cobrar.
- **Checkpoint después de cada tanda:**
  - commit y push en LEGAL-CRM (rama `claude/happy-wozniak-ajfi1z`) y en las landings (`main`);
  - una nota en la sección 15 del traspaso con lo hecho, lo alojado y lo programado, con los ids de Metricool.
- Si el límite corta, dejá el checkpoint y programá con `send_later` cuándo seguir, para cuando se restablezca.
- Pie de los commits: `Co-Authored-By` y `Claude-Session`, según el aviso de la sesión.

## 10. Qué entregarle a la responsable

- Al terminar cada día del calendario: un mensaje corto con lo programado ese día por rubro (reels, historias, carruseles y reels de prueba).
- Al final:
  - el conteo total programado por rubro y día;
  - el Excel del cronograma por rubro y día;
  - lo que no se pudo hacer y por qué.
- Cada informe distingue qué está hecho, revisado, alojado y programado.

Textos y documentos en español rioplatense, con voseo, claros para alguien no técnico.
