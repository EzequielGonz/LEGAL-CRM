---
description: Traspaso de la sesión «KOCOS CALL» (20 y 21/11/2026). Leer primero si esta sesión se compacta o se retoma en otra. Resume qué se hizo, qué sigue y cómo seguir sin perder nada.
actualizado: 21/11/2026
---

# Traspaso de sesión · 21/11/2026

Rama de trabajo: `claude/admiring-euler-ctf4sg` → [PR #80](https://github.com/EzequielGonz/LEGAL-CRM/pull/80). Rama de volcado de chats: `cerebro-chats`. `main` está en `66c457b` (cerebro + hook + ramas de redes; Vercel READY, sin cambios de código del panel).

## Lo que ya está hecho

- Cerebro de 12 archivos + bitácora + traspaso en `cerebro/` (también en main). Hook de arranque en `.claude/settings.json` + `.claude/hooks/cerebro-al-arrancar.sh`.
- Los 2 contextos (Fase 1 Cowork y Fase 2 Code) cruzados: 19 contradicciones resueltas (`10-cruce-fase1-fase2.md`).
- Estado real verificado en base, Vercel, Metricool, DNS y el panel (105 pantallas) → `07-estado-verificado.md`. Pendientes priorizados → `08-pendientes-y-plan.md`.
- Chat «Panel Jurídico, Rediseño» (19/11) volcado a `cerebro-chats` (`cerebro/chats/2026-11-19-code-rediseno-panel-juridico.md`, commit `451605f`).
- Plantilla única de volcado: `cerebro/chats/PLANTILLA.md` (con sección de ramas y cambios).
- 51 preguntas para el dueño: `12-preguntas-para-entender.md` (+ Word). **Sin contestar todavía.**

## Decisiones del dueño en esta sesión

- Campañas: las lanza ella siempre. Kocos Marketing (sin ORVIAN). Autos: «Automotores Kocos» o «Autos Kocos», nunca «Agencia Kocos». Cerebro en `cerebro/` de LEGAL-CRM. Pasar a main cerebro y ramas de documentos (hecho). Por ahora entender todo; las instrucciones de trabajo vienen después.
- Quiere todos los chats **unificados en una sola rama** (`cerebro-chats`), sin descargar ni subir nada a mano, y después que yo relea todo.
- Única restricción: no pagar nada sin su autorización. Preocupación vigente: el uso de créditos al leer chats.

## Los 22 chats de Code (ids para leerlos con `mcp__claude-code-remote__list_events`)

Hechos: **Panel Jurídico** `session_01FuLgniyC2tDGbRPYKqpwJN`. Esta sesión: `session_01FuLgnkKbeaUf3pukEpthUr` (KOCOS CALL). Del dueño, a mano: **Metricool context: 4 brands** `session_01FuLgnj5dyMXat2HmKarMfG`.

Pendientes de volcar (19):

| Chat | Id | Fechas |
|---|---|---|
| Traspaso Legal CRM | `session_01FuLgnko39B7TMetzSucFNJ` | 13–15/11 (la sesión más larga; ~USD 238 de uso) |
| Contexto del proyecto | `session_01FuLgnjHoiZTXHqrkcEnPGW` | 01/11–20/11 |
| Contexto completo del proyecto | `session_01FuLgnjPcDVSYDvLxSq9yna` | 20/11 (generó el Word de Fase 2; avisa de una clave de Supabase expuesta en el chat del 07/09) |
| Perfiles redes sociales VITA | `session_01FuLgnii3hdhmn8zyaCJffr` | 20/11 (padre de los 8 de Redes) |
| Configuración de entorno en la nube | `session_01FuLgniXJHc3tJUEKU3LoqM` | 07–16/11 |
| Boceto web inmobiliaria | `session_01FuLgnhx91G4EQjSQ4YU4s9` | 07/11 |
| Favicon y Mercado Pago (AutosMix) | `session_01FuLgnjJGVr9qM17oqUAKRk` | 29/10–01/11 |
| Integración Andreani (AutosMix) | `session_016hDJUYptwN7kMYopiKenTk` | 05–08/10 |
| Landing Estudio Jurídico Integral Vita | `session_011vHQdHYrS5rNBp1Ey4izG5` | 16–17/09 |
| Landing page Estudio Vita | `session_01MHJNPuMA4n3stp3nY8ZCoJ` | 07/09 |
| Sistema automatizado de captación jurídica | `session_01K4ho6TpCXHZYMjPGLbqwWS` | 07/09 (archivado) |
| Redes · VITA · reels 20–24/11 | `session_01FuLgnjhRH4uHSa7R2jXJRk` | 20/11 (falla) |
| Redes · Kocos · reels 20–24/11 | `session_01FuLgnkBTFKPWVo584MMXPv` | 20/11 (falla) |
| Redes · Coberturas · reels 20–24/11 | `session_01FuLgnmCT4QvBrzXiP5Q58T` | 20/11 (falla) |
| Redes · Autos · reels 20–24/11 | `session_01FuLgnhicuPAirHZn4vT48c` | 20/11 (falla) |
| Redes · VITA · reels 25–29/11 | `session_01FuLgnmHMjMRpcqJgTczdhR` | 20/11 (falla) |
| Redes · Kocos · reels 25–29/11 | `session_01FuLgnkyd8hEuZTeGMuA1yf` | 20/11 (falla) |
| Redes · Coberturas · reels 25–29/11 | `session_01FuLgnjq3uVbavjFxLrxiuL` | 20/11 (falla) |
| Redes · Autos · reels 25–29/11 | `session_01FuLgnjU46up7GgBYA7kyCL` | 20/11 (falla) |

**Por qué estaban en falla (21/11 05:57):** se acabó el crédito de uso extra («Usage credits ran out»). Nada de esto fue un error del prompt.

## Cómo leerlos con costo bajo (plan)

1. Un subagente por chat, modelo **Haiku**, de a pocos por vez. Primero 3 de prueba: Traspaso Legal CRM, Contexto del proyecto, Perfiles redes VITA.
2. Leer con `list_events` filtrando `kinds: ["user","result"]`: los mensajes del dueño (sus órdenes textuales) y las respuestas finales de cada turno. **No** pedir `assistant` completo: trae bloques de razonamiento enormes y encarece todo. Paginar con `before_id`.
3. Cada subagente escribe `cerebro/chats/AAAA-MM-DD-code-<tema>.md` con `PLANTILLA.md` y lo sube a `cerebro-chats` (sin claves ni datos personales).
4. Al final: integrar `cerebro-chats`, releer todo junto, cruzar con el cerebro y actualizar archivos 01–11.
5. Claude común: ver opciones en el chat (exportación de datos de claude.ai, que no gasta crédito, o un solo chat con modelo chico).

## Pendientes nuevos de esta vuelta

- **Clave de Supabase expuesta** en el chat del 07/09 (lo informa el chat «Contexto completo»; no verificado). Cambiarla es decisión y tarea del dueño. Después hay que actualizarla en Vercel.
- Línea de Meta de **Marketing sin acceso al número** (no entra nada desde el 06/11).
- Cronograma doble de redes casi sin producir (los 8 chats de Redes cayeron por crédito). Del 25/11 en adelante VITA, Coberturas y Autos no tienen nada programado.
- Confirmar que `Campaña Graves 1911` envió desde las 08:00 del 20/11 y la tasa de fallas.
- Ver `08-pendientes-y-plan.md` para el resto.

## Cómo retomar tras compactar

1. Leer `cerebro/README.md`, este archivo, `02-ordenes-vigentes.md` y `08-pendientes-y-plan.md`.
2. Si pasaron más de 24 h: volver a comprobar `07-estado-verificado.md` (consultas al final del archivo).
3. Seguir el plan de arriba. No lanzar nada que gaste uso sin que el dueño lo apruebe.
