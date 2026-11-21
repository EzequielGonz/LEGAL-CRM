# Cowork · Bot: detención sin apagar al agente, recontacto y hora de 24 h

## 1. Encabezado

- **Título del chat:** no figura en la transcripción. Se lo identifica como «Cierre de bloque bot 24/10 · detención sin apagar al agente, recontacto y hora 24 h».
- **Fecha de inicio:** 24/10/2026 (no confirmado). El primer registro verificable es del 24/10 20:45:10 UTC, la primera compactación. Lo anterior solo existe como resumen.
- **Fecha de fin:** 21/11/2026 (pedido de cierre a las 07:41 UTC).
- **Origen:** Cowork en la nube, proyecto «crm». Continuada tras dos compactaciones (24/10 20:45 UTC y 21/11 07:43 UTC). Trabajo hecho por MCP (GitHub, Supabase, Vercel); sin escritura local.
- **Perfiles y marcas:** Jurídico (Estudio Jurídico Integral Vita; áreas Civil, Penal y ART), Coberturas médicas, Autos 0 km y Marketing (marca del bot: Kocos Marketing). El archivo también nombra a la agencia ORVIAN (ver sección 8).
- **Infraestructura:** repositorio EzequielGonz/LEGAL-CRM; Supabase `enhgkeqiqcuwafsedaza`; Vercel `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt` (equipo `team_DGPKq7VRI79P0koUBcsxu1IH`); producción legal-crm-nine.vercel.app.
- **Modelo:** no verificable antes de la primera compactación. El encabezado de sistema indicó Opus 5.5 al inicio y Sonnet 5.5 después de «hacelo con sonnet» (21/11).
- **Fuente:** `cerebro/chats/cowork/cowork-i-bot-detencion-recontacto-1024.md` (ya redactado; detalle solo desde las 20:45 UTC del 24/10).

## 2. Objetivo

Mejorar el CRM multirubro y sus bots de captación por WhatsApp, aplicando cambios directamente («arregla todo y aplicalo directamente»), respetando las autorizaciones vigentes (sin campañas, envíos ni gastos sin autorización expresa; Fase 3 pausada). Bloques: (1) derivación a humano, audios, pedidos de origen o baja, calidad de líneas y marca del bot de Marketing (resuelto antes de la compactación, según resumen; PR #69 y #70); (2) regla de respeto al interés de la persona, sin apagar al agente (PR #71); (3) recontacto automático a quien no responde, dentro de la ventana de 24 h de Meta; (4) hora del chat del panel en formato de 24 h; (5) cierre del chat.

## 3. Órdenes y decisiones del dueño

Los cuatro primeros mensajes son anteriores a la compactación. Se reproducen tal como los cita el resumen (con sus puntos suspensivos). Fecha: 24/10/2026; hora no verificable.

- 24/10 (previo, según resumen): «1. Derivación a humano... 5. Marca del bot de Marketing... 1 cuando cierra y le dice que lo va a llamar un asesor yo lo cargo manualmente quien le habla y demas al cliente, lo abordo yo... conviene no prometer horario. 2 pida que le escriban 3 no no, mensaje automatico de disculpas, se encarga el equipo de marketing el origen sale de meta, el agente es asesor y no tiene especificado de donde surge... y detiene la conversacion ahi 4 si, cuando la linea de cualquier rubro este en baja pausar y dar aviso. 5 la marca del bot es Kocos Marketing Armate una ficha con lo que ya sabes, preguntame algo si no te acordas, para marketing el cierre lo hace un humano. arregla todo y aplicalo directamente.»
- 24/10 (previo, según resumen): «espera, frena un segundo, dejate un punto de retorno, con que modelo estas ejecutando esto?».
- 24/10 (previo, según resumen): «Dale listo, tenia la duda del modelo. segui y termina porfa».
- 24/10 (previo, según resumen; con captura de un chat): «Habiamos dicho que si no respondia, se le volvia a enviar mensaje, te acordas? eso tampoco se esta respetando ahora... no frenes, segui, pero tambien hace esto por favor SIEMPRE RESPETANDO EL INTERES DE LA PERSONA SI NO QUIERE QUE LE HABLEN MAS SE DISCULPA Y QUEDA A DISPOSICIÓN, NO SE DETIENE EL AGENTE POR SI DICE ALGO MAS QUE SEA RELEVANTE».
- 24/10 20:50 UTC (mensaje en cola): «Por que tardas tanto? No frenes. esta regla que acabo de decirte, ya que empiece a regir con los chats que tienen la ventana de meta abierta y en todos los rubros.»
- 21/11 07:41 UTC: pedido de cierre completo, con entrega de archivo, sin escrituras en GitHub, commits, pushes ni ramas sin «dale» explícito.
- 21/11 07:42 UTC: «ok».
- 21/11 07:44 UTC: «ok hacelo con sonnet».

Decisiones de negocio vigentes (reglas aprobadas, según los mensajes anteriores):

- Al cerrar y avisar que lo llamará un asesor, el dueño carga manualmente quién le habla. El bot no promete horario.
- Audios: el bot pide que le escriban.
- Pedido de origen o de baja de datos: mensaje automático de disculpas, sin explicar el origen (lo maneja Marketing; los datos salen de Meta), y se detiene el contacto por iniciativa de la empresa.
- Línea de cualquier rubro con calidad baja en Meta: pausar campañas y dar aviso.
- Marketing: marca del bot «Kocos Marketing»; el cierre lo hace una persona.
- Si no responde, se le vuelve a enviar mensaje: recontacto a las 2 h, hasta dos veces, dentro de la ventana de 24 h de Meta.
- Si la persona no quiere que le hablen más: se disculpa, queda a disposición y el agente no se apaga. Si dice algo relevante, se lo atiende. Rige para los chats con ventana de Meta abierta y en todos los rubros.
- Permanentes: nunca lanzar campañas ni contactar prospectos sin autorización expresa; sin pagos sin autorización; secretos solo en Vercel; sin datos personales reales en pruebas; nada se borra, se archiva.

## 4. Correcciones del dueño

1. «Habíamos dicho que si no respondía, se le volvía a enviar mensaje… eso tampoco se está respetando» (24/10, previo). El recontacto no funcionaba. Causa: el motor revisaba siempre los chats más viejos y nunca llegaba a los recientes. Se corrigió en `src/lib/recontacto/motor.ts` (PR #71).
2. Captura del chat con la hora «02:14» donde correspondía 14:14 (formato de 12 h). Se pasó a 24 h, zona Buenos Aires, en `conversation-thread.tsx` (PR #71).
3. El agente no debía apagarse ante «no quiero que me hablen más»; se disculpa y queda a disposición. Se quitó el apagado automático.
4. 24/10 20:50 UTC: «¿Por qué tardás tanto? No frenes.» Y que la regla rija ya en los chats con ventana de Meta abierta y en todos los rubros. Se reactivó el agente en 40 chats detenidos con ventana abierta.
5. «No frenes» (segunda vez, antes de la corrección 4). Se siguió sin pausa.
6. «Frená un segundo, dejate un punto de retorno» (instrucción puntual). Se creó el punto de retorno (rama local `punto-retorno-24-10-bot` y parche en la carpeta de salidas).

## 5. Qué se hizo, con estado

Evidencia: solo cuenta lo que muestra una salida de herramienta posterior a las 20:45 UTC del 24/10. Lo anterior va «según resumen» y no se volvió a verificar.

| Bloque | Especificado | Implementado | Probado | Publicado | Habilitado | Observaciones |
|---|---|---|---|---|---|---|
| A. Ficha del negocio por rubro (4 fichas) y migración 0509 | Sí | Sí | Sí (suite) | Sí, PR #69 | Sí | Según resumen. Sin re-verificar |
| B. Contestadores automáticos, pedido de origen o baja, no prometer horario, calidad de líneas, rescate de turnos, ajustes de prompts | Sí | Sí | Sí (276 pruebas) | Sí, PR #69 | Rige en producción | Según resumen. Rol de Marketing actualizado por la API (según resumen) |
| C. Regla ORIGEN (disculpa y detención sin explicar el origen) | Sí | Sí | Sí, con «Probar el bot real» (según resumen) | Sí, PR #70 | Rige | Según resumen |
| D. Detención sin apagar al agente (PR #71) | Sí (órdenes 4 y 5) | Sí: 8 commits en `bot-24-10-deteccion-y-recontacto`, cada archivo comparado con `cmp` contra la rama remota | Parcial: suite local 276 pruebas, 275 pasan y 1 falla. Preview READY. No se corrió chequeo de tipos local | Sí: merge squash `3f82376` a las 21:01 UTC; producción READY a las 21:02 UTC | Sí, desde ~21:02 UTC | La detención frena campañas, seguimientos y recontactos, pero no las respuestas a quien escribe. Solo el número de una menor, o una detención no comprobable, bloquea la respuesta. La prueba que falla (`asistente-permisos`) falla también en `main` según resumen; no se re-evidenció |
| E. Reactivación del agente en chats detenidos | Sí (orden 5) | Sí: UPDATE con registro en `ops_change_log` | Sin prueba posterior de comportamiento | No aplica (cambio de datos) | Sí: 40 chats reactivados, 40 filas registradas | Chats con ventana de 24 h abierta, sin intervención del equipo, todos los rubros. La afirmación «no se les mandó nada» se apoya en la lectura de sus últimos mensajes y en que el motor descarta contactos detenidos. No hay prueba independiente de ausencia de envíos |
| F. Recontacto a las 2 h (motor corregido) | Sí (orden 4) | Sí: candidatos desde los últimos mensajes del agente sin estado de recontacto; ≤200 conversaciones en lotes de 100; contactos detenidos descartados | Observación en producción (ver sección 8, punto 5) | Sí, dentro del PR #71 | Sí | Consultas de 21:05 a 21:06 UTC: 24 evaluados y 2 enviados en 30 min; 28 evaluados y 4 enviados en 40 min; 8 recontactos enviados en el día; 116 conversaciones pendientes de evaluar a las 21:03 |
| G. Hora de 24 h en el chat del panel | Sí | Sí (`conversation-thread.tsx`) | No hay captura ni prueba visual | Sí, dentro del PR #71 | Sin verificación visual | Pendiente de confirmar a ojo |
| H. Caso de una contacta de Civil que originó la queja | Sí | No aplica | No aplica | No aplica | Sin resolver al último control | A las 21:05 UTC había una conversación activa esperando su turno de recontacto. Al 21:06 no se había enviado nada a ese caso |
| I. Documento `.claude/referencias/reglas-comunes.md` | Sí | Sí, solo en un commit local | No aplica | **No** | **No** | No está en el remoto. El repositorio local ya no existe en este entorno |
| J. `CONTEXTO_ACTUAL_CRM.md` del proyecto | Sí | Sí: reemplazado con el bloque «PR #52 a #71» | No aplica | Guardado en el proyecto | No aplica | Sin secretos ni datos de prospectos |
| K. Verificación de `/api/recontacto` por Chrome | Sí (plan) | No | No | No | No | La pestaña de Chrome ya no existía; se verificó por consultas a la base |
| L. Cierre de este chat | Sí (orden 6) | Sí | Ver sección 9 | Entrega por SendUserFile | No aplica | Sin escrituras en GitHub, commits, pushes ni ramas en este cierre |

## 6. Archivos, ramas, commits, PR, migraciones, despliegues y configuración

Rama y PR del bloque principal:

- Rama `bot-24-10-deteccion-y-recontacto`, creada desde `main` en `55ee44a` (según resumen).
- PR #71 «Detención sin apagar al agente; recontacto revisa las respuestas recientes; hora 24 h en el chat». Cabeza final `70e4e39`. Fusionado con squash en `main` como `3f82376` (con `expectedHeadSha`).
- Commits de la rama en esta parte, en orden: `5a75b5f` (motor de recontacto y prueba del bot), `ac38f21` (entrante: un detenido que vuelve a escribir recibe respuesta), `b6b7342` (hora de 24 h y reglas), `37661fb` (agente: atiende a un contacto detenido que vuelve a escribir), `6712e1e` (prueba A14 y reglas), `042014a` (respuesta a quien vuelve a escribir, con la excepción de la menor), `5e9bb5e` (entrante, sin bloqueo duro), `70e4e39` (agente, sin bloqueo duro). Antes de la compactación hubo otro commit en la rama (`be79dc9`, `src/lib/marketing/leads.ts`, según resumen).
- PR #69 y #70: publicados según resumen y documento de contexto. El resumen menciona PR #52 a #70 como anteriores.
- Rama local `punto-retorno-24-10-bot`: **ya no existe** en este entorno. Queda el parche `punto-retorno-24-10-bot.patch` en la carpeta de salidas (24/10 19:42, hora del contenedor).

Archivos tocados en PR #71:

- `src/lib/captacion/reglas.ts`: los motivos de detención ya no pausan el chat. Menor y tercero siguen pausando.
- `src/lib/messaging.ts`: para el origen «respuesta_entrante» solo bloquea si hay menor o detención no comprobable.
- `src/lib/ai-agent/tools.ts`, `rescate.ts`, `agent.ts`: el agente atiende a un contacto detenido que vuelve a escribir, con nota de sistema (sin ofrecer, sin insistir, sin repetir la disculpa). `finalizar_consulta` cierra el estado sin pausar, con aviso final.
- `src/lib/marketing/leads.ts`: «no interesado» pasa a estado cerrado perdido sin apagar al agente.
- `src/lib/inbound.ts`: compuerta nueva y sin repetir la disculpa si el contacto ya estaba detenido.
- `src/lib/recontacto/motor.ts`: candidatos desde respuestas recientes del agente; descarta contactos detenidos.
- `src/components/inbox/conversation-thread.tsx`: hora de 24 h en Buenos Aires.
- `tests/unitarias/bot-24-10.test.ts` y `tests/unitarias/reglas-base-captacion.test.ts` (prueba A14 actualizada).
- **No subido:** `.claude/referencias/reglas-comunes.md` (decisión del 24/10 sobre detención y recontacto), solo en commit local.
- **No debe subirse:** diferencias locales en `src/app/redes-pieza/[archivo]/route.tsx` y `src/lib/redes/plan-redes-extra.ts` (vienen de una base vieja).

Despliegues:

- Preview (sha `70e4e39`): `dpl_4SPRFZbPTLQdWFcv8F6H4TXj8o6f`, READY a las 21:01 UTC.
- Producción (sha `3f82376`): `dpl_42obTnw5SfSZZ54cUoH5tgJyoojh`, target production, READY a las 21:02 UTC.

Migraciones y base de datos:

- `supabase/migrations/0509_ficha_negocio_y_rescate.sql`: aplicada según resumen. Incluye la columna de control `turn_rescue_at` en `conversations`.
- No hubo migraciones nuevas en esta parte. Un UPDATE de datos: 40 conversaciones reactivadas, 40 filas en `ops_change_log`.

Configuración (solo nombres):

- `system_settings`, clave `calidad_lineas`: vigilancia de calidad de líneas cada 10 minutos desde el latido.
- `ai_agents`: prompts editados con historial. Rol de Marketing actualizado y copia archivada (según resumen).
- Fichas de los cuatro rubros guardadas por `/api/agentes/ficha` (según resumen).
- Proyecto «crm»: `claude/CONTEXTO_ACTUAL_CRM.md` actualizado.
- Variables de entorno: no se modificó ninguna. Los secretos viven solo en Vercel.

Mecánica de entrega: `git push` dio 403 y `gh` tenía un token inválido (según resumen). Se usó el conector de GitHub (`create_branch`, `push_files` con contenido completo, `create_pull_request`, `merge_pull_request`). Cada archivo se verificó con `git fetch` y `cmp` contra la rama remota. `push_files` decodifica dos veces las secuencias `\uXXXX`; los archivos locales se alinearon a la forma remota.

Qué quedó encendido por este chat: el agente responde a quien pidió no ser contactado si vuelve a escribir (salvo menor o detención no comprobable). El recontacto a las 2 h está activo (lunes a sábado, 8 a 21 hora Argentina, según el pendiente 2). Se reactivó el agente en 40 chats detenidos con ventana de 24 h abierta. La Fase 3 sigue pausada.

## 7. Pendientes, bloqueos y preguntas abiertas

Pendientes:

1. Subir la actualización de `.claude/referencias/reglas-comunes.md` (decisión del 24/10). Exige «dale» expreso y reconstruirla, porque el repositorio local ya no existe. No se escribió nada en GitHub en este cierre.
2. Confirmar a ojo en el panel la hora de 24 h y que los recontactos salgan en horario.
3. Verificar el caso de la contacta de Civil: que reciba su recontacto o que quede descartado con motivo.
4. Re-medir el recontacto con corte exacto desde la hora del despliegue (ver sección 8, punto 5).
5. Habilitar el seguimiento de 48 a 72 h por perfil (el resumen lo marca como «(PIN)»; requiere decisión).
6. SEO: sitemap, indexación, identificadores de GA4 y perfil de Google Business.
7. Las plantillas de base fría esperan aprobación de Meta.
8. El programador debe correr `npm ci` y la suite completa. Acá no se pudo instalar dependencias.
9. Incidencias viejas: 225 pendientes desde el 9/10.
10. Base «ART GRAVES» cargada tres veces; «LEVES» sin usar.
11. Confirmar que la Fase 3 sigue pausada. No se lanzó campaña, envío masivo ni gasto.
12. Revisar si una cadena de 44 caracteres de la transcripción cruda es un secreto. No se pudo determinar; no se reproduce.

Bloqueos:

- La línea CIVIL tiene calidad baja en Meta. La campaña ART quedó pausada (según resumen). Hay que revisar las plantillas en Meta.
- Escritura en GitHub: `git push` da 403 y `gh` no autentica. El conector de GitHub sí escribió en esta sesión.
- El entorno local se recicló: ya no están el repositorio clonado ni la rama del punto de retorno (solo el parche).
- La pestaña de Chrome usada para consultar la API del panel ya no existe.

Preguntas abiertas para el dueño:

1. Nombre de presentación del bot por rubro: «Nancy» o «Leonardo Gonzalez».
2. Tres a cinco conversaciones de ejemplo por rubro para completar las fichas.
3. Autos: el bot insiste una vez ante «Ya compré». ¿Se mantiene la regla aprobada?
4. ¿Qué hacer con la base ART GRAVES cargada tres veces?
5. ¿Se habilita el seguimiento de 48 a 72 h por perfil?

## 8. CONTRADICE

1. **Escritura en GitHub.** El pedido del 21/11 dice «hasta ahora no pude escribir en GitHub (403)». `git push` dio 403 y `gh` tenía un token inválido, pero el conector de GitHub escribió sin error: 8 `push_files` posteriores a la compactación, la creación del PR #71 y su merge.
2. **Mensaje de commit contra contenido.** Los commits `b6b7342` y `6712e1e` hablan de «reglas comunes», pero los archivos subidos fueron solo `conversation-thread.tsx` y `reglas-base-captacion.test.ts`. `reglas-comunes.md` nunca llegó al remoto.
3. **Estado del documento de reglas.** El resumen de la segunda compactación lo daba como «guardado en commit local». Hoy el repositorio local no existe, así que nada permite confirmar ese commit. Hay que rehacerlo.
4. **Punto de retorno.** El resumen indicaba la rama local `punto-retorno-24-10-bot` con todos los commits. En este entorno no existe; solo se conserva el parche.
5. **«Desde que se publicó ya evaluó 28 chats y mandó 4 recontactos».** La consulta usó una ventana de 40 minutos (21:06:30 UTC) y producción estaba READY desde ~21:02 UTC. La ventana incluye actividad previa al despliegue, así que las cifras no prueban el efecto de la corrección. Evidencia real: 8 recontactos enviados en el día y 116 pendientes de evaluar a las 21:03.
6. **Compuerta de bloqueo duro.** El resumen de la segunda compactación decía que `hardBlock` seguía impidiendo respuestas. Al final se quitó: solo bloquean la menor o una detención no comprobable. «No quiere que le hablen» ya no corta las respuestas.
7. **Chats «solo con despedidas».** El mensaje final dice que los últimos mensajes de los 40 chats reactivados eran despedidas. Una consulta muestra al menos un caso cuyo último mensaje fue del agente, 9,6 h después del último entrante. No se verificó mensaje por mensaje.
8. **Escritura en la base.** El resumen advertía que `execute_sql` con UPDATE pedía confirmación y se agotaba el tiempo (se usó la API del panel por Chrome). Esta vez el UPDATE se ejecutó sin problema.
9. **Verificación del recontacto.** El plan era verificar `/api/recontacto` desde Chrome; la pestaña no existía y se verificó con consultas SQL.
10. **Agencia.** Este chat usa «Kocos Marketing» como marca del bot. El pedido de cierre del 21/11 dice «con la agencia ORVIAN». La corrección del 20/10 en el chat de landings fue «ORVIAN NO, KOCOS MARKETING ES». Usar Kocos Marketing.
11. **«No les mandé nada» (chats reactivados).** Afirmación del mensaje final, no verificada de forma independiente (ver sección 5, bloque E y punto 7 arriba).
12. Dato sin contradicción pero a tener en cuenta: la fecha de inicio real del chat no es recuperable; el primer registro es una compactación.
