# Traspaso · sesión de redes 27/11 (para retomar después de compactar)

Rama `claude/brave-hawking-nzsr60` · PR EzequielGonz/LEGAL-CRM#82 (seguido). Hay OTRA sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/tanda/`) y las líneas de redes del cerebro.

## Hecho
- Análisis 01–05 en `docs/redes/viral-2511/` (05 = estrategia vigente). Checkpoint: `docs/redes/viral-2511/00-checkpoint.md`.
- Cerebro y memoria actualizados (02, 04, 19, bitácora) con las decisiones del 27/11.
- Lo programado en Metricool del 25 al 29/11 (12 historias + 1 carrusel por día y marca) NO se toca.

## En curso (agentes en segundo plano, retomados tras el límite de uso)
1. Guionista (Opus): `docs/redes/tanda-2811-0712/guiones/{vita,coberturas,autos,marketing}.json` + `GUIONES.md`. 27/11–06/12, por marca 4 reels/día con ElevenLabs + 2/día variantes con voz gratis; VITA IG progresivo 2→6; horarios en `cerebro/04`.
2. Producción (Sonnet): rehace el BOCETO de VITA con el guion `vita-2711-1` («Recién chocaste. Esta frase, nunca.»), 3D diorama, escena centrada, karaoke grande, contador, loop, cierre «Mandáselo a quien maneje…». Entrega en `docs/redes/tanda-2811-0712/boceto-vita/`. El piloto viejo (`salida/vita/vita-piloto.mp4`, guion de prueba) quedó flojo.

## Próximo paso
1. Revisar el boceto (hoja de contactos) y mandarlo al dueño (SendUserFile). **Nada se programa hasta su OK.**
2. Con el OK: producir en lotes de 2 días (24–48 h de ventaja), alojar en la landing de cada marca (`apps/web/public/redes/` en main de cada repo; producción con autorización del dueño ya dada para programar), comprobar 200 y programar en Metricool (zona `America/Argentina/Buenos_Aires`, consultar antes lo programado para no duplicar).
3. A las 24 h de los 2 primeros días: revisar vistas de FB a la noche (regla en `cerebro/04`).
4. Medición a los 7 días según `05-estrategia.md`.

## Datos
- Metricool blogId: VITA 7549864 · Compara Tu Obra Social 7549939 · Automotores Kocos 7552104 · Kocos Marketing 7242607.
- ElevenLabs Starter: 40.000 caracteres/mes; Flash (eleven_flash_v2_5). Voces: Claudiio hVXoK5zuQfMOQB7NrIFY · Sol ijxn8I4NzJccD2Sa7lcj · Franco jbWMqMKDKL7X0v1DXTHH · Santo CNBiCLtxaJJKQwl4Hq2q. Una sola generación por pieza (reintentar cobra de nuevo).
- vidIQ: 80 créditos sin usar.

## Actualización 27/11 06:30 UTC (antes de compactar)
- El dueño RECHAZÓ el diseño del piloto (fondo oscuro con rayas doradas, recuadros dorados, íconos planos). Producción rehace el boceto con escena 3D real (diorama/low-poly), luz natural, la acción dentro de la escena, tipografía sans moderna; primero 3 cuadros de prueba en `docs/redes/tanda-2811-0712/boceto-vita/prueba-*.png`. Voz ya hecha: `salida/vita/vita-2711-1.mp3` (no regenerar).
- Agentes en curso: guionista (guiones 4 marcas), producción (boceto), Artisan (guía visual por marca → `docs/redes/viral-2511/06-direccion-de-arte-v2.md`), Brand Voice QA (informe de errores de guiones, solo en su respuesta).
- Revisión del boceto antes de mandarlo: Artisan cuadro por cuadro + verificador independiente (`ruflo-ai-team:verifier`).
- Regla nueva: usar siempre todo lo instalado que sirva (plugins, conectores, MCP, skills, agentes personalizados, memoria Cognee) y decir qué se usó. Guardada en `02`, `00-arranque` y Cognee.
