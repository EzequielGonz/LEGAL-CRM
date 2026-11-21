# Subsesiones «Redes · <marca> · reels» (8 sesiones de Code en paralelo, 20/11)

## 1. Encabezado

- **Qué son:** 8 sesiones de Code en la nube creadas por la sesión principal de redes el 20/11/2026 entre las 08:58 y las 09:00 UTC (05:58 a 06:00 BA), con `create_session` y un prompt de producción de reels. Cada una produce solo reels de una marca y un tramo: del 20 al 24/11 (`-1`) o del 25 al 29/11 (`-2`).
- **Quién las creó:** el `parent_session_id` de las 8 es `session_01FuLgnii3hdhmn8zyaCJffr` (el chat «perfiles de redes de VITA», volcado en `2026-11-20-code-perfiles-redes-vita.md`). La sesión que las siguió coordinando y programando desde las 17:15 BA es `session_01FuLgnj5dyMXat2HmKarMfG` (ver `2026-11-20-code-metricool-context-4-brands.md`).
- **Modelo y modo:** `claude-opus-5-5`, permisos en modo automático, entorno `env_01H1c3TBxfKsxB45HXWz22sA`, repo `EzequielGonz/LEGAL-CRM` desde `claude/happy-wozniak-ajfi1z`, etiqueta `redes-2011`.
- **Estado final de las 8:** todas «failed» (límite de uso de 5 horas de la cuenta, «out of usage credits»). Ninguna terminó su tramo.
- **Cómo se leyeron:** las 8 completas con `list_events` (todas las entradas de usuario, asistente y resultado hasta `has_more=false`; de 2 a 5 páginas por sesión). Los mensajes del dueño en estas sesiones: **ninguno**; el único mensaje de usuario es el prompt que armó la sesión principal. No hay órdenes del dueño en ellas.

## 2. Objetivo

Producir en paralelo los reels del cronograma doble (272 reels en total) con el motor propio de mini historias, entregar los mp4 y jpg y que la sesión principal los alojara en las landings y los programara en Metricool.

## 3. Órdenes y decisiones del dueño

Ninguna escrita en estas sesiones. Las reglas que heredan vienen del dueño por la sesión principal: «usa todas las skills plugins conectores… solo si hay que ejecutar un pago»; el prompt agrega «con autorización del dueño del proyecto» (el texto original dice «la responsable»), afirmaciones legales generales y prudentes (laboral y penal aprobados) y la leyenda «Información general: no reemplaza una consulta.» en VITA.

## 4. Correcciones

Ninguna del dueño. Correcciones técnicas de las propias sesiones: sin fuentes Archivo, Plus Jakarta Sans y Outfit el motor dibujaba Times (se sumaron); el calendario cortado en el borde y el gancho sin fondo sobre el documento (Coberturas); apertura en negro por un temblor de cámara que explota en la copia de la toma (Kocos); dos escenas con el mismo nombre que se pisan en el registro (VITA).

## 5. Qué se hizo, con estado

Prompt común: leer `docs/redes/produccion-2011/ENCARGO-SESION.md`, usar su archivo de guiones (`guiones/<marca>-<n>.py`) y su manifiesto (`manifiestos/<marca>-<n>.csv`), empezar por el primer reel del tramo, subir el código a `claude/redes-<marca>-<n>`, subir solo mp4 y jpg a `main` de la landing en `apps/web/public/redes/2011/` y avisar con `send_message` al terminar la preparación y cada 3 reels.

| Sesión (id) | Tramo | Rama | Creada (UTC) | Última actividad | Costo y salida | Qué quedó hecho |
| --- | --- | --- | --- | --- | --- | --- |
| Redes · Autos · reels 20–24/11 (`session_01FuLgnhicuPAirHZn4vT48c`) | Autos, 27 reels desde el 20/11 16:30 | `claude/redes-autos-1` (existe, 2 commits) | 20/11 08:58 | 15:53 | 9,40 USD, 100 mil tokens de salida | 2 reels entregados y subidos a la rama (ver abajo), `historias/autos-kit.js` (5 lugares, 9 objetos de marca, 12 giros irreales), 6 guiones del 21/11 y los del 22 y 23/11, fuentes. Re-render de `autos-ruta-b` (19:20) pendiente por un globo mal ubicado |
| Redes · Coberturas · reels 20–24/11 (`session_01FuLgnmCT4QvBrzXiP5Q58T`) | Coberturas, 27 reels desde el 20/11 16:30 | `claude/redes-cob-1` (existe, 1 commit) | 20/11 08:59 | 14:07 | 5,54 USD, 46 mil | 1 reel entregado; `servir.js`; kit de Coberturas; los reels del 20/11 a las 19:20 (familia) y 20:50 (recibo) quedaron en preparación |
| Redes · Kocos Marketing · reels 20–24/11 (`session_01FuLgnkBTFKPWVo584MMXPv`) | Kocos, desde el 20/11 16:30 | `claude/redes-mkt-1` (existe, 2 commits) | 20/11 08:59 | 15:52 | 5,06 USD, 42 mil | 3 reels entregados, kit de historias de Kocos, fuente Outfit; arrancó el 21/11 (pantalla «Estados», lugar «parada de colectivo») |
| Redes · VITA · reels 20–24/11 (`session_01FuLgnjhRH4uHSa7R2jXJRk`) | VITA, desde el 20/11 19:20 (el de las 16:30 ya era reel de prueba) | `claude/redes-vita-1` (**no existe** en GitHub) | 20/11 08:59 | 15:53 | 5,78 USD, 52 mil | Nada entregado. Motor de escenas `historias/vitax.js`, guion y voz del primer reel; el render falló por `ffmpeg` («Cannot write more than one file with the same name») a las 14:07 |
| Redes · Autos · reels 25–29/11 (`session_01FuLgnjU46up7GgBYA7kyCL`) | Autos 25 al 29/11 | `claude/redes-autos-2` (existe, 1 commit) | 20/11 09:00 | 11:01 | 2,12 USD, 14 mil | Solo la corrección de fuentes del motor (commit `52caabf`, 09:05) y el análisis de escenas; sin reels |
| Redes · Coberturas · reels 25–29/11 (`session_01FuLgnjq3uVbavjFxLrxiuL`) | Coberturas, 38 reels | `claude/redes-cob-2` (**no existe**) | 20/11 09:00 | 11:02 | 2,35 USD, 13 mil | Preparación y render de prueba; empezó a escribir el kit; sin reels |
| Redes · Kocos Marketing · reels 25–29/11 (`session_01FuLgnkyd8hEuZTeGMuA1yf`) | Kocos, 38 reels | `claude/redes-mkt-2` (**no existe**) | 20/11 09:00 | 09:07 | 1,77 USD, 8 mil | Preparación, render de prueba y primer guion (`mkt-bf-200-b`); empezó un motor propio de escenas; sin reels |
| Redes · VITA · reels 25–29/11 (`session_01FuLgnmHMjMRpcqJgTczdhR`) | VITA, 37 reels | `claude/redes-vita-2` (**no existe**) | 20/11 09:00 | 09:31 | 1,65 USD, 6 mil | Preparación y render de prueba; leyó el motor de VITA; sin reels |

**Reels entregados en las ramas** (todos 1080×1920, de 30 a 31 s, cerca de −14,5 LUFS, 13 a 19 MB, con portada jpg y manifiesto en estado `renderizado`):

- `claude/redes-cob-1`: `cob-reintegros-b` (commit `d8c685c`, 20/11 13:57 UTC).
- `claude/redes-autos-1`: `autos-documentacion-b` (commit `8f3e71c`, 13:59) y `autos-plan-cuota-a` (`aabfea0`, 14:06).
- `claude/redes-mkt-1`: `mkt-catalogo-b` (`9fe6eb4`, 13:57), `mkt-web-movil-b` y `mkt-precio-a` (`1448885`, 14:06).
- La sesión principal los integró (copia a las landings, respuesta 200 y programación): `cob-reintegros-b` 20/11 19:20, `autos-plan-cuota-a` 20/11 19:20, `autos-documentacion-b` 20/11 20:50, `mkt-precio-a` 20/11 19:20, `mkt-web-movil-b` 20/11 20:50 y `mkt-catalogo-b` 21/11 08:50 (ids de Metricool en el volcado de la sesión principal). Entre los 6 no hay duplicados.

## 6. Todo lo concreto

- **Línea de tiempo (UTC):**
  - 20/11 08:58 a 09:00: se crean las 8 sesiones.
  - 08:59 a 09:07: cada una lee el encargo, instala `npm ci`, `edge-tts`, `numpy` y `piper-tts`, baja la voz Piper `es_AR-daniela-high`, hace un render de prueba del reel «autos» (2,5 a 4 minutos) y manda un `send_message` a la sesión principal con «preparación lista» y los bloqueos.
  - **09:07:20: las 8 se cortan a la vez** por el límite de uso de 5 horas («resets 1:50pm UTC»).
  - 09:07 a 11:02: intentos de retomarlas que vuelven a fallar con el mismo mensaje (autos-1 10:59, vita-1 11:00, mkt-1 11:00, cob-2 11:02, autos-2 11:01).
  - 13:52 a 14:07: las cuatro del tramo 20–24/11 retoman después del reinicio del límite y entregan los 6 reels de arriba; a las 14:07 vuelven a cortarse («resets 6:50pm UTC»).
  - 14:08 a 15:53: nuevos intentos fallidos; última actividad de las cuatro del tramo 20–24/11 a las 15:52–15:53.
  - Las cuatro del tramo 25–29/11 no volvieron a producir nada después de las 09:07.
- **Bloqueos de permisos (los 8, hasta 09:05 UTC):**
  - `add_repo` de las landings con acceso de escritura, rechazado por el clasificador de permisos del modo automático («Unauthorized Access»). cob-2 además comprobó con `git push --dry-run` que el proxy de git niega el repo de la landing de Coberturas.
  - Levantar `python3 -m http.server 8799` en segundo plano, rechazado («Undermining Oversight») en varias; cob-1 lo resolvió con `servir.js` (Playwright sirve los archivos del disco).
  - `getScheduledPosts` de Metricool: funciona (solo lectura); la escritura no se probó.
  - Consecuencia: cambio de entrega el 20/11 06:05 BA: las sesiones dejan `entregas/<tramo>/` en su rama y la sesión principal corre `integrar.py`.
- **Archivos tocados por las ramas:** `docs/redes/produccion-2011/entregas/<tramo>/`, `manifiestos/<tramo>.csv` y `.py`, `guiones/<marca>-1.py`, `.claude/referencias/redes/herramientas/historias-prototipo/{historias,fonts,revision}/`.

## 7. Datos del negocio

Ninguno nuevo. Reparto del cronograma doble: 272 reels (68 por marca, cuenta propia: 272 ÷ 4), con los reels del 25 al 29/11 de VITA 37, de Coberturas 38, de Kocos 38 y de Autos (no leído).

## 8. Pendiente, a medias o bloqueado

- Los reels de los dos tramos que no se hicieron (ver el volcado de la sesión principal: faltaban los del 21/11 de la tarde y todos del 22 al 29/11; el agente de la sesión principal los retoma solo).
- Rescatar de las ramas `claude/redes-autos-1`, `claude/redes-cob-1`, `claude/redes-mkt-1` y `claude/redes-autos-2` los kits de escenas de Autos, Coberturas y Kocos (`autos-kit.js`, y los equivalentes) y las fuentes; solo las fuentes y las entregas están integradas. Los kits de Coberturas y Kocos no se confirmó si se integraron (no confirmado).
- Las 8 sesiones están en estado «failed» y desconectadas: no hay nada que reanudar; si se vuelven a necesitar, lanzar sesiones nuevas con el mismo encargo y mirar `registro.csv` para no duplicar.

## 9. Aprendizajes

- Con 8 sesiones pesadas en paralelo más 5 agentes locales, el límite de 5 horas de la cuenta se agota en minutos: las 8 cayeron juntas a los 7 minutos de arrancar. El paralelismo en la nube no ayudó; sin créditos de uso extra, el cuello de botella es la cuota, no la cantidad de sesiones.
- Las sesiones en la nube no pueden escribir en las landings ni programar; hay que diseñar la entrega por rama y que la sesión principal integre.
- El clasificador del modo automático rechaza `add_repo` y servidores locales en segundo plano; conviene dar la lista de permisos antes de lanzar o evitar depender de ellos.
- Cada render cuesta de 2,5 a 4 minutos de máquina; el cuello de botella real es el tiempo de render más la cuota de modelo.

## 10. Preguntas abiertas

- ¿Se vuelven a lanzar sesiones en la nube para los reels del 22 al 29/11 cuando haya cuota, o los termina el agente local de la sesión principal?
- ¿Se rescatan y archivan las 4 ramas `claude/redes-*` que existen?

## 11. Ramas y cambios

- Existen en `EzequielGonz/LEGAL-CRM`: `claude/redes-autos-1` (`8f3e71c`, `aabfea0`), `claude/redes-cob-1` (`d8c685c`), `claude/redes-mkt-1` (`9fe6eb4`, `1448885`) y `claude/redes-autos-2` (`52caabf`). Salieron de `claude/happy-wozniak-ajfi1z` del 20/11 08:58 UTC; ninguna tiene PR ni está integrada a `main`; la rama principal ya incorporó los reels por `integrar.py`. Acción sugerida: rescatar los kits y archivar (no borrar).
- No existen: `claude/redes-vita-1`, `claude/redes-vita-2`, `claude/redes-cob-2`, `claude/redes-mkt-2`.
- Migraciones: ninguna. Despliegues: ninguno de estas sesiones (los mp4 subidos a las landings los hizo la sesión principal).
- Configuración fuera del código: ninguna. Encendido o apagado: nada.

## 12. CONTRADICE

- **CONTRADICE:** el registro de órdenes de la sesión principal dice que «los chats paralelos quedaron sin usar»; en realidad produjeron 6 reels que se programaron.
- **CONTRADICE:** el prompt dice «Otra sesión hace VITA del 20 al 24/11 (rama `claude/redes-vita-1`)»; esa rama nunca se subió.
- **CONTRADICE:** el prompt dice «con autorización de la responsable»; el dueño es hombre.
