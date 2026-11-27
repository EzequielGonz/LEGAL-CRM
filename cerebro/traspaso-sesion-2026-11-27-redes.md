# Traspaso · sesión de redes 27/11 (para retomar después de compactar)

Rama `claude/brave-hawking-nzsr60` · PR EzequielGonz/LEGAL-CRM#82 (seguido, en verde). Hay OTRA sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/`) y las líneas de redes del cerebro.

## Estado al 27/11 07:00 UTC: TODO FRENADO
- El dueño frenó el boceto de VITA. **No hay agentes trabajando ni nada programado.** Lo programado en Metricool del 25 al 29/11 (12 historias + 1 carrusel por día y marca) NO se toca.
- **Esperando:** el dueño busca 1 o 2 reels de referencia con el 3D que imagina. Al recibirlos, analizarlos (gancho, cámara, luz, nivel de realismo, animación, efectos) y recién ahí hacer el boceto de VITA con el guion `vita-2711-1`.

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
