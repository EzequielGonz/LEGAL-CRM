# Cowork · CRM multirubro: campañas de Kocos, límite diario editable y asistente

## 1. Encabezado

- **Título del chat:** CRM multirubro (Legal CRM) y agencia Kocos Marketing: campañas, circuito de Kocos y asistente.
- **Fecha de inicio:** 19/10/2026 19:47 (no confirmado: es el inicio del tramo disponible en la transcripción; lo anterior sale solo del resumen de compactación).
- **Fecha de fin:** 21/11/2026 (cierre del chat con la entrega de este archivo).
- **Origen:** Cowork, proyecto «crm». Repositorio EzequielGonz/LEGAL-CRM. Producción: legal-crm-nine.vercel.app. Supabase: proyecto `enhgkeqiqcuwafsedaza`. Vercel: proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, equipo `team_DGPKq7VRI79P0koUBcsxu1IH`.
- **Perfiles y marcas:** Jurídico Vita (Civil y Penal), Coberturas médicas, Autos 0 km (Automotores Kocos), Kocos Marketing. El archivo también menciona a la agencia ORVIAN (ver sección 12).
- **Fuente:** `cerebro/chats/cowork/cowork-g-campanas-kocos-1019.md` (ya redactado). La transcripción cubre solo el tramo posterior a la compactación.

## 2. Objetivo

Mejorar el CRM multirubro y sus landings, con entregas por ramas, PR y despliegue en Vercel. Puntos centrales: corregir los estados de línea de WhatsApp, mostrar campañas activas en Inicio, pasar a Perdido a quien se da de baja, rehacer las métricas de Oportunidades y Captación, y cerrar el circuito de Kocos Marketing (extracción de base, apertura, análisis IA y venta consultiva en el mismo chat). También que el asistente del panel entienda el CRM y pueda cambiar el límite diario de una campaña.

## 3. Órdenes y decisiones del dueño

Órdenes anteriores al 19/10 19:47: sin transcripción, solo del resumen de compactación (sin fecha exacta):

- Trabajar una tarea por vez, con respuestas breves en español rioplatense y con evidencia.
- Mantener `CONTEXTO_ACTUAL_CRM.md` al día, en el repo y en el proyecto.
- No declarar nada como publicado o habilitado sin evidencia.
- Nunca lanzar campañas ni contactar prospectos sin autorización expresa. Ningún pago sin autorización. Claves solo en Vercel.
- No descifrar variables de entorno. No borrar: archivar con motivo. Aplicar migraciones solo después de revisar la base real.
- La Preview comparte base con producción («solo se mira»). La Fase 3 queda pausada hasta indicación expresa.
- El PIN de acceso compartido en el chat debe rotarse (acción del dueño).

Tramo visible:

- 19/10 (tramo previo, sin hora): «revisión manual es algo muy extremo» (un prospecto que se queja o no avanza pasa a Perdido).
- 19/10 (tramo previo): «es gasto innecesario» (el análisis detallado no se hace a toda la base, sino solo a quienes respondieron que quieren escuchar una propuesta).
- 19/10 (tramo previo): «En todos los perfiles hace los cambios». Lista de cambios según el resumen: Inicio con campañas activas; Oportunidades sin «Hablando ahora» para perdidos o quejosos; Captación con «respuestas» como clientes que contestaron; bases ya cargadas al lanzar campañas; estadísticas de Perfiles actualizadas; pendientes de más de una semana fuera de la lista.
- 19/10 19:47 (resumen): «Si, exactamente, que sea asi el circuito de kocos, primero extraemos la base, la cargamos, y los que vayan diciendo que si, el analisis se hace automatico y a su vez una venta consultiva todo en el mismo chat del cliente, que no sea manual el analisis, justamente por eso piden presupuesto porque les damos una propuesta en base a un analisis IA. explicale el contexto de todo al asistente personal, no entiende muchas cosas.»
- 19/10 19:47 (resumen): «NO PUEDO MODIFICAR EL LIMITE DE ENVIO MAXIMO DE MENSAJES POR DIA EN UNA CAMPAÑA EN CURSO, NI EN BORRADOR NI NADA, HACE QUE SE PUEDA EDITAR EL LIMITE MAXIMO DE ENVIO DE MENSAJES AUNQUE ESTE EN CURSO Y QUE EL ASISTENTE TAMBIEN PUEDA HACERLO».
- 19/10 20:12: «LISTO YA QUEDO. por que la linea de kocos marketing no se aprueba?».
- 19/10 20:15: el dueño indicó el número de Kocos Marketing y dijo que figura pendiente en Meta aunque hicieron todo para la aprobación hace varios días.
- 19/10 20:15: cambio de modelo a `claude-haiku-5-5` con el comando del sistema.
- 21/11 07:31: cierre completo con entrega de archivo, sin preguntas salvo dato imprescindible, sin escrituras en GitHub, commits, pushes ni ramas sin «dale» explícito, y con secretos y datos de prospectos redactados.

## 4. Correcciones del dueño

- El panel no permitía editar el límite diario en campañas en curso, en borrador ni en ningún estado. Lo corrigió con la orden del 19/10 19:47.
- El análisis IA del circuito de Kocos debía ser automático al decir que sí, no manual.
- El análisis de cada base extraída era un gasto innecesario.
- El asistente debía entender el contexto completo del CRM («no entiende muchas cosas»).
- Los datos de la prueba del panel eran ficticios.

## 5. Qué se hizo, con estado

Escala: especificado / implementado / probado / publicado / habilitado.

- **PR #27 y #30 (pulido de diseño):** publicado según el resumen. Sin verificación en este tramo.
- **PR #28 y #31 (documento de contexto):** publicado según el resumen.
- **PR #33 (líneas «Conectada» con código vencido):** publicado según el resumen y probado en base para el canal Civil. Las otras líneas no se pudieron leer porque sus secciones estaban plegadas.
- **PR #34 (campañas activas en Inicio):** publicado según el resumen.
- **PR #35 (Perdido automático, «Hablando ahora» con 72 h, «Piden persona» de 7 días, Conversaciones con «Esta semana», «Respondieron» con detalle, reutilización de bases):** publicado según el resumen. Incluye un respaldo de 11 registros en la base (migración de datos, no versionada). Merge confirmado en `main` (`96bd775`).
- **PR #36 (límite diario editable en cualquier estado, operación del asistente, contexto del CRM y circuito de Kocos):** implementado, probado (214 de 214 pruebas unitarias), publicado (merge `a91d16a`). Despliegue de producción en READY. Sin errores en la última hora (consulta de las 20:03).
- **Migración 0503 (`limite_campana` en el tipo de acción del asistente):** aplicada en la base real con la herramienta de Supabase, tras confirmar que la última era la 0502.
- **PR #37 (análisis IA automático para bases extraídas, `analizar_negocio` sin parámetros cuando hay ficha):** implementado, probado (verificación de paridad de archivos), publicado (merge `0cca938`). Despliegue en READY. Sin errores en la última hora.
- **Campo «Máximo de mensajes por día» en la ficha de campaña:** implementado y publicado (confirmado por el despliegue). **No se verificó en pantalla** ni con una propuesta real del asistente.
- **Análisis automático al decir «sí»:** existía desde el 16/10 según el resumen. Reforzado con #37.
- **Documento `CONTEXTO_ACTUAL_CRM.md` con #33 a #37:** **pendiente**. El asistente anunció que lo haría después de #37, pero no hay evidencia.
- **Diagnóstico de la línea de Kocos Marketing:** diagnosticada, **no resuelta** (ver sección 7).
- **Revisión del webhook («no entran mensajes hace 19 días»):** ofrecida, **no hecha**.
- **Rotación del PIN de acceso:** acción del dueño. Pendiente.

## 6. Archivos, rutas, repos, PR, commits, migraciones y despliegues

Archivos del último tramo:

- `supabase/migrations/0503_asistente_limite_campana.sql`: amplía el check del tipo de acción del asistente con `limite_campana`. Aplicada en la base real.
- `src/app/api/campaigns/[id]/route.ts`: PATCH acepta `daily_send_limit` en cualquier estado (de 1 a 1000, o nulo para sin límite propio) y registra el valor anterior en `ops_change_log`.
- `src/components/campanas/campaign-setup.tsx` y `campaign-setup-section.tsx`: campo «Máximo de mensajes por día».
- `src/lib/asistente/permisos.ts`: `TIPOS_ACCION` pasa a 8 entradas. Prueba en `tests/unitarias/asistente-permisos.test.ts` actualizada.
- `src/lib/asistente/contexto-crm.ts` (nuevo): función `contextoCrm(slug)` con el contexto común y el circuito de Kocos.
- `src/lib/asistente/motor.ts`: inserta `contextoCrm` en el mensaje de sistema.
- `src/lib/asistente/operaciones.ts`, `acciones.ts`, `herramientas.ts` y `src/components/asistente/asistente-panel.tsx`: operación `proponer_limite_diario` y su confirmación.
- `src/lib/ai-agent/agent.ts`, `tools.ts` y `src/lib/marketing/leads.ts`: circuito de Kocos y `analizar_negocio`.
- `src/components/marketing/circuitos-marketing.tsx`: contadores y pasos del circuito.

Ramas y commits (todas fusionadas en `main`):

- Rama `limite-diario-kocos-contexto` (PR #36, merge `a91d16a`). Commit de lote `c95d3a6` (lote 1, 8 archivos), más los lotes 2/4 y 3/4 de la misma rama.
- Rama `kocos-analisis-automatico` (PR #37, merge `0cca938`), creada desde `main` en `a91d16a`.
- `main` local quedó sincronizado con `origin/main` tras los merges.

Despliegues: producción de #36 y #37 en READY.

## 7. Datos del negocio y estado de líneas

- Línea de Kocos Marketing: Meta devuelve estado PENDING para ese número. Causa más probable: el número no está registrado en la API de WhatsApp Cloud (falta el paso de registro con PIN de 6 dígitos). Otras posibles: nombre visible en revisión, falta de método de pago o de verificación del negocio, o un identificador de número que no corresponde a Kocos.
- Falta confirmar qué muestra la pantalla API Setup de Meta para ese número, y si el identificador coincide con `WHATSAPP_MARKETING_PHONE_NUMBER_ID`. Esa comprobación la hace alguien con acceso a Vercel. Registrar el número en Meta solo lo hace el dueño o con su autorización expresa.
- Estado de Civil: «Conectada» (única línea leída).

## 8. Pendientes, bloqueos y preguntas abiertas

1. Línea de Kocos Marketing pendiente en Meta (ver sección 7).
2. Revisión del webhook: el panel muestra «No entran mensajes hace 19 días». Se ofreció revisar; no se hizo.
3. Actualizar `CONTEXTO_ACTUAL_CRM.md` con #33 a #37 y la migración 0503, sin pisar la sección de la Bandeja para Claude que mantiene otro chat (PRs #29 y #32). Hay que releer `main` antes de editar.
4. Verificación en pantalla: recargar la campaña, confirmar el campo «Máximo de mensajes por día» y probar una propuesta real del asistente.
5. Rotación del PIN de acceso compartido en el chat: [secreto: PIN de acceso al panel — hay que cambiarlo].
6. Escrituras en GitHub: en el cierre de este chat no hubo ninguna. No se recibió «dale».

Preguntas abiertas:

- ¿Qué hacer con el diagnóstico de la línea de Kocos Marketing, si la pantalla API Setup de Meta confirma el registro pendiente?
- ¿Se confirma el registro del número en Meta? Solo lo decide el dueño.

## 9. Aprendizajes

- Los PR #36 y #37 se publicaron con pruebas unitarias y despliegue READY. La verificación en pantalla quedó pendiente.
- Las escrituras por `git push` dieron 403 en tramos anteriores. Se usó la herramienta de GitHub del conector, que sí escribió.
- Al leer el estado de las líneas, las secciones del panel estaban plegadas y no se pudo leer el estado de las líneas de Penal y Coberturas. Hay que verlas en pantalla.

## 10. Navegador del panel

- El resumen decía que el dueño había reconectado Opera. En la consulta de las 20:12 la herramienta respondió «Browser not connected». Tomar la última como vigente.

## 11. Ramas y cambios (explícito)

| Rama | Para qué | Base | Estado | PR | Qué hacer |
|---|---|---|---|---|---|
| `limite-diario-kocos-contexto` | Límite diario editable, asistente, contexto del CRM y circuito de Kocos | `main` | Fusionada (`a91d16a`) | #36 (cerrado por merge) | Ninguno; verificar en pantalla |
| `kocos-analisis-automatico` | Análisis IA automático de bases extraídas | `a91d16a` | Fusionada (`0cca938`) | #37 (cerrado por merge) | Ninguno |
| Base de PR #35 | Perdido automático y reutilización de bases | no indicada | Fusionada (`96bd775`) | #35 | Ninguno |

Migraciones: 0503 aplicada en la base real. La de datos de PR #35 (11 registros de respaldo) no tiene número de migración.

Configuración: sin cambios de Meta, Metricool ni de cuentas por parte del asistente. Variables mencionadas (solo nombres): `WHATSAPP_MARKETING_PHONE_NUMBER_ID`, `WHATSAPP_MARKETING_WABA_ID` y una variable de token de Meta para Marketing (su nombre no figura en el archivo). Los valores están cifrados y no se leyeron.

Qué quedó encendido o apagado por este chat: el límite diario es editable en campañas en cualquier estado, y el asistente puede proponerlo con confirmación. Las campañas no se lanzaron. La línea de Kocos Marketing sigue sin aprobar.

## 12. CONTRADICE

- **CONTRADICE:** el archivo nombra la agencia como ORVIAN en el encabezado y en el pedido de cierre. La corrección del dueño del 20/10 fue «ORVIAN NO, KOCOS MARKETING ES». Usar Kocos Marketing.
- **CONTRADICE:** el resumen de compactación da por reconectado Opera. La herramienta respondió «Browser not connected» a las 20:12. Vale la última.
- **CONTRADICE:** las atribuciones de los commits decían «Claude Opus 5.5», pero la sesión estaba configurada como `claude-haiku-5-5` (cambio del 19/10 20:15). La atribución no coincide con el modelo configurado.
- **CONTRADICE:** el resumen da por verificado que la línea de Civil aparece «Conectada». Del resto de líneas (Penal, Coberturas) no se pudo leer el estado; no se puede afirmar.
