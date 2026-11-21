# J · Lógica de negocio del CRM (bots, bases, seguimiento, informes, base de datos, separación por rubro, cifras)

Solo lectura. Código: `origin/main` en `/home/user/crm-main` (commit `66c457b`). Rutas relativas a `src/` salvo que diga otra cosa. No se corrió nada, no se consultó la base ni Vercel: lo que depende de datos reales va marcado **«sin verificar en la base»**. Sin valores de claves.

Convención: **[confirmado]** = lo demuestra el código leído. **[hipótesis]** = deducido del código, falta comprobar con datos.

---

## Parte 1 · Los bots

### 1.1 Cómo se arma el prompt de cada bot por rubro

Hay **un agente por área** (Civil, Penal, Coberturas, Autos 0 km y Marketing = 5 filas de `ai_agents`), no uno por rubro: `ai-agent/agent.ts:171-177` lee `ai_agents` con `.eq("area", area).single()`. Jurídico usa Civil y Penal por separado.

El mismo armado lo usan el agente en vivo y «Probar el bot real» (`ai-agent/probar-real.ts`), para que la prueba no se desfase. El orden real de las capas, de arriba hacia abajo (`ai-agent/agent.ts`):

1. **Identidad** (`ai-agent/prompt.ts:89`): «Te presentás como <nombre de presentación>, de <marca>». Sale del perfil (`rubros.agent_presentation_name` y `brand_name`). Si faltan, **el bot no responde** (`agent.ts:179-184`, `agentReadiness`).
2. **Guion del agente** (`prompt.ts:85-91`): `ai_agents.system_prompt`, `qualification_criteria`, `required_fields`, pasados por `guionSegunModo` (`agentes/entrante.ts`). Dos modos: **campaña** (viene de base o campaña: guion tal cual) y **entrante** (escribió por su cuenta, `modoDelContacto`, `agent.ts:262`): venta consultiva general; en Civil el guion se **reemplaza** por el «estudio integral» que atiende también penal (`entrante.ts`, `JURIDICO_INTEGRAL`).
3. **Datos ya conocidos** del contacto (nombre, DNI/CUIL, `qualification_data`, campaña) y nota de «primera respuesta a la campaña» (`prompt.ts:73-114`).
4. **Reglas estrictas** (`prompt.ts:18-30`, `REGLAS_ESTRICTAS`): no inventar, no presentarse como abogado, no prometer día/hora de contacto, no decir que corresponde indemnización, escalar si piden persona.
5. **Criterio de captación del rubro** (`prompt.ts:33-53`, `criterioDelRubro`, datos de `captacion/reglas.ts:22-56`): qué hay que aceptar para captar, datos deseables, zona (AMBA) y qué nunca prometer, más la regla de rechazos (`captacion/insistencia.ts`).
6. **Marketing** (solo ese rubro, `agent.ts:294-312`): análisis del negocio y guía de venta; si la persona acepta escuchar la propuesta se dispara el análisis profundo, esperando hasta 20 s.
7. **Biblioteca de agentes** (`agent.ts:313-340`): si hay asignación activa en `agent_assignments` para el área, el contexto sale de `agent_library` (principal + derivado) y **reemplaza** las capas 2-3, pero se conservan las reglas estrictas y el criterio. Según el mapa de estado, `agent_assignments` está vacía: **sin verificar en la base**.
8. **Conocimiento por versión** (`agent.ts:357`, ver 1.3).
9. **Extras de la versión del laboratorio** y **rol** (`agent.ts:372-378`, `laboratorio/reglas.ts:530-537`, `componerInstrucciones`): conocimiento → extras → rol de campaña/base; el rol del laboratorio solo entra si no hay otro.
10. **Contacto detenido que vuelve** (`agent.ts:384-386`): atenderlo con respeto, sin ofrecer ni insistir.
11. **Ficha del negocio** (`agent.ts:388-389`, `agentes/ficha-negocio.ts`): `rubros.business_sheet`, hasta 6.000 caracteres, «usá solo lo que figura».
12. **Guía común de captación y cierre** (`agent.ts:391`, `agentes/guia-cierre.ts`): todo mensaje se responde, una pregunta por mensaje, nunca dar precios, contestadores = no responder, crisis = escalar.
13. Nota de audio (`agent.ts:393`), respuesta a plantilla/botón (`agent.ts:395-396`) y **horario de atención** (`agent.ts:448`, `horario-atencion.ts:30-40`: el bot atiende 24 h, los asesores lun-sáb 8-21; fuera de horario igual capta y pregunta franja).

Historial: últimos 30 mensajes (`agent.ts:62,191-196`), con plantillas expandidas y marca de tiempo si pasó más de un día (`agent.ts:117-141`).

### 1.2 Roles

Un **rol** (`agent_roles`: nombre, objetivo, tono, instrucciones) se suma al agente del perfil, no lo reemplaza (`agentes/roles.ts`). Precedencia (`roles.ts:32-57`): **rol de la campaña > rol de la base > rol aplicado desde el laboratorio** (por tipo de consulta o por perfil, `laboratorio/reglas.ts:396`). Todas las asignaciones validan que el rol sea del mismo perfil (`roles.ts:102-132`). Archivar un rol suelta bases y campañas que lo usaban (`roles.ts:88-99`).

### 1.3 Conocimiento, versiones y A/B

- **Conocimiento** (`conocimiento/seleccion.ts`): v1 no suma nada. v2 en adelante suma base general + base del rubro (siempre) + hasta **2 temas** + hasta **3 fichas de objeción**, elegidos por palabras disparadoras sobre el último mensaje (pesa 3) y los dos anteriores (pesa 1) (`seleccion.ts:34-37,64-74,105-144`). Tope 12.000 caracteres para temas y fichas. Nunca cruza rubros (`seleccion.ts:117-131`).
- **Versión que toca** (`seleccion.ts:80-87`): tabla `bot_knowledge_assignment` por rubro (`version`, `comparar_con`, `porcentaje`); reparto estable por hash del `conversationId`. **Sin asignación, la predeterminada es v2** (`seleccion.ts:82`). Caché de 60 s (`conocimiento/servicio.ts:10`); ante cualquier error, responde como v1 (`servicio.ts:81-84`).
- **Laboratorio** (`laboratorio/reglas.ts`): una **prueba A/B por campaña** (`varianteAB`, 368-377) cuenta solo si la campaña es la de la prueba, está vigente y el envío a esa persona es posterior al inicio; la variante sale de `hashEstable(pruebaId:conversationId) % 100 < porcentaje` → «prueba» o «control». `planDelTurno` (469-487) decide versión forzada y rol; `ajustesDeVersion` (502-511) aporta modelo y texto de la versión (v3+ son copias editables; v1/v2 nunca suman). Si la versión de prueba no se pudo usar, no se registra la variante (`varianteRegistrable`, 514-517). Una campaña no admite dos pruebas a la vez (`pruebaSuperpuesta`, 380).
- **Comparación de agentes A/B/C** de la etapa 3 (`experimento/*`) quedó apagada; solo sigue usándose `registrarTurno` (`agent.ts:421-443`).

### 1.4 Cómo califica y cuándo marca «captado», con qué evidencia

1. El modelo recoge datos con `guardar_datos_calificacion` y los evalúa con `evaluar_calificacion`. **El servidor, no el modelo, cambia estados.**
2. Para captar usa la herramienta `captar` con `aceptacion` (boolean) y `evidencia` (texto, «con sus palabras») — `ai-agent/tools.ts:97-108`.
3. Control del servidor, en este orden (`agent.ts:1108-1152`):
   - `solo_precio=true` → **no capta**, va a una persona (`precio_fuera_alcance`).
   - **Segunda llave** `aceptacionReal(último mensaje)` (`agentes/aceptacion.ts:49-58`): regex sobre el último mensaje de la persona; un rechazo duro/suave, o una pregunta sin ninguna señal de sí, bloquean la captación. Si el mensaje está vacío no bloquea.
   - `registrarCaptacion` → `evaluarCaptacion` (`captacion/reglas.ts:79-99`): captar solo si `aceptacion === true` y la evidencia no está vacía. Datos deseables que faltan solo generan **advertencias**, no impiden captar. Zona: `amba` / `fuera` / `sin_confirmar` (nunca se supone AMBA).
   - RPC `capture_register` (`supabase/migrations/0203_etapa2_reglas_base.sql:211-296`): exige evidencia no vacía, guarda un **único `capture_events` por oportunidad** (`event_key = 'captacion:'+id`, evidencia recortada a 2.000 caracteres) y pasa `capture_state = 'captado'`. Una segunda llamada devuelve el evento existente (idempotente).
4. Qué cuenta como aceptación por rubro (`captacion/reglas.ts:22-56`): Jurídico = aceptar el análisis y el contacto del profesional; Coberturas = continuar con el asesor; Autos = contacto del vendedor; Marketing = siguiente paso (análisis, presupuesto o reunión). **Agendar no capta** (`programar_fase2`, `agent.ts:1186`). Derivar es manual.
5. Tras captar: el chat se pausa con acuse final de un solo uso (`pauseWithFinalAck`, `agent.ts:671-705`), y la respuesta tiene que ser un cierre sin preguntas; si no, se pide una corrección y, si falla, sale `cierreDeReserva` (`agent.ts:495-505`).
6. Hay un camino de «posible captación a revisar» (`posible_captacion`) que sale de la relectura de la limpieza (`limpieza/reglas.ts:60-86`), no del bot en vivo.

**Observación**: la «evidencia» es **texto libre que escribe el modelo**; el servidor no comprueba que sea una cita real de la conversación. La única comprobación contra el chat es la regex del último mensaje.

### 1.5 Detención, atención humana y chat tomado

- `escalar_a_humano` / `detener_contacto` → `atencionDelAgente` (`agent.ts:637-669`) → `clasificarAtencion` (`captacion/reglas.ts`, `TRATAMIENTO_ATENCION`) → `solicitarAtencion` (`captacion/index.ts`). Según el motivo: pausa el chat (`ai_enabled=false`, estado `requiere_atencion_humana` o `cerrado_perdido`), abre una incidencia y **difiere** la detención hasta después de la disculpa (`pendingDetention`, `agent.ts:599-612`).
- Un contacto detenido que escribe de nuevo **sí recibe respuesta**, salvo si es el número de una menor o si la detención no se pudo leer (`agent.ts:243-244`).
- Reclamos serios (amenaza legal, queja de un cliente captado) abren incidencia y mandan **aviso push a todos los dispositivos** (`captacion/index.ts:288-309`); la crisis también (`atencion/crisis.ts:88-100`).
- Contestadores automáticos: no se responde y se registra turno «bloqueado» (`agent.ts:215-240`, `agentes/automaticos.ts`).
- Salida validada (`agentes/contrato.ts`, `validarTextoSalida`): retiene precios, cuotas, plazos, promesas. Se pide **una** reparación; si vuelve a fallar, el mensaje queda **retenido** y el chat va a una persona (`agent.ts:507-531`). Ojo: este «retenido del bot» no es el «retenido de Meta» de la Parte 6.
- Antes de enviar se descarta la respuesta si llegó otro mensaje o ya salió otra del bot (`agent.ts:545-562`).

### 1.6 Recontacto del bot

`recontacto/reglas.ts`: dentro de la ventana de 24 h, a las **2 h** de la última respuesta del bot retoma lo hablado, y a las 2 h más saluda y se despide (**máximo 2**, `MAX_RECONTACTOS`), con mínimo 20 min entre mensajes y margen de 15 min antes de que cierre la ventana de Meta; si el plazo cae después de las 21 se adelanta a 10 min antes del cierre (`reglas.ts:45-50,72-122`). Por Wasender no hay ventana de 24 h y se mira hasta 72 h atrás (`recontacto/motor.ts:133-137,198-203`). Se enciende por perfil en `system_settings.recontacto_ia` (por defecto encendido salvo que se apague; solo conversaciones cortadas después de encenderlo, `motor.ts:182`). El modelo decide si escribe: devuelve JSON `{escribir, motivo, texto}` y el texto pasa por `validarTextoSalida`. Nunca a quien dijo «ahora no», está detenido, captado, derivado o espera a una persona (`excluidoDelRecontacto`, `reglas.ts:125-137`).

### 1.7 Audios

`audios/reglas.ts` y `audios/transcribir.ts`: el audio **se pasa a texto con Gemini dentro del webhook**, con tope de **4 MB**, **5 minutos** y **20 s** de presupuesto (`reglas.ts:15-22`). Activación por perfil en `system_settings.audios_a_texto`. El audio original no se toca; el texto vive en columnas del mensaje (`audio_texto`, `audio_texto_estado`: `hecha`, `no_se_entiende`, `demasiado_largo`, `error`). El agente lee el texto como si lo hubiera escrito la persona (`cuerpoParaAgente`, `agent.ts:200`) y recibe una nota (`NOTA_AUDIO_PARA_AGENTE`). Si el audio es ilegible, no responde con contenido: pide que lo escriba.

### 1.8 Gemini y control de costo

- Cliente: `@google/genai`; modelo = `GEMINI_MODEL` o por defecto `gemini-3.8-flash` (`agentes/modelo.ts:33-38`). Proveedores `gemini_api`, `vertex` (modelo ajustado, necesita variables `GCP_*`) y `simulado`.
- Llamada: **20 s y un reintento** solo para fallas transitorias (`ai-agent/reintento.ts:6,18-24,36-55`); sin parámetros de temperatura (familia 3.x) (`agent.ts:85-104`).
- Por turno: hasta **6 iteraciones** de herramientas (`MAX_TOOL_ITERATIONS`, `agent.ts:58`) + 1 pedido de cierre + 1 de reparación = hasta 8 llamadas, cada una con un reintento posible.
- Registro: `agent_turn_logs` (`registrarTurno`, `agent.ts:421-443`) guarda versión de conocimiento, fichas usadas, tokens de entrada/salida/razonamiento, latencia, resultado y error.
- Si Gemini no conoce el modelo del laboratorio, reintenta con el de siempre (`agent.ts:403-413`).
- **No hay tope de gasto ni de tokens** por día, perfil o conversación en el código. Los únicos topes son: simulaciones del laboratorio por día (`LABORATORIO_SIMULACIONES_POR_DIA`), el informe de mejoras (una vez a la vez, 400 conversaciones), y los límites de negocio que indirectamente acotan turnos (3 automáticos sin respuesta por persona, `contacto/tope.ts`). El costo en USD solo se calcula para la comparación de candidatos (`experimento/reglas.ts:82`), con tarifa cargada a mano.
- Rescate de turnos perdidos: el latido reintenta **una vez** mensajes de texto sin respuesta entre 2 y 60 minutos (`ai-agent/rescate.ts:21-23,30-63`).

---

## Parte 2 · Bases y campañas

### 2.1 Carga de bases

Camino único: el navegador parsea CSV/Excel y sube el original **directo a Storage** (URL firmada, `api/bases/upload-url`, bucket `bases-originales`); después llama `POST /api/bases` con filas ya interpretadas (`app/api/bases/route.ts`). Máximo **5.000 filas** por importación (línea ~70 del archivo). Importar **nunca envía ni agrega a nadie a una campaña** (`import.ts` cabecera).

**Columnas** (`bases/mapping.ts`): se detectan por encabezado con alias (teléfono: `telefono`, `phone`, `celular`, `movil`…; DNI/CUIL; nombre; email; más reconocidas: tipo de consulta, fecha de consulta, observaciones, localidad, diagnóstico, obra social). Para teléfono y nombre hay respaldo por «contiene la palabra» (`mapping.ts:66-110`). Se puede elegir a mano `phone/name/dni` (`{mapping}` del body). Las columnas no reconocidas se conservan intactas en `imported_base_rows.raw_data`.

**Normalización de teléfono** (`phone.ts`): formato `549 + área + abonado`; menos de 9 dígitos = inválido (típicamente un DNI); códigos de área distintos de 11 con «15» → confianza «revisar».

### 2.2 Deduplicación

Tres niveles (`bases/import.ts`):
1. **Archivo repetido**: huella sha256 del contenido (`rowsFingerprint`, ~128-148); si el mismo contenido ya está importado y la base no está archivada → 409 `RepeatedImportError`, salvo `allow_repeat`. Índice único para dobles clics (`import.ts` ~190-205).
2. **Repetidas dentro del archivo**: por teléfono normalizado; solo la primera fila crea contacto (`firstIndexByPhone`).
3. **Contra lo existente, dentro de la misma área**: primero por `contact_identities` (canal whatsapp, mismo `area`), luego por `contacts.phone` del `area` (~pasos 2 y 2.5). **La unicidad es por área** (Civil y Penal tienen contactos separados para el mismo teléfono; esto es coherente con «un contacto por perfil»).
Además marca «contactado anteriormente» (criterio 5.1: oportunidad con respuesta, contactado, o mensajes salientes), «ya estaba en otra base», conflictos de nombre (**nunca se pisa**) y teléfonos detenidos (RPC `detained_phones`). Los nombres en MAYÚSCULA pasan a Formato Título.
Si la importación se corta, la base queda marcada `incompleta` con lo guardado y se libera la huella para reintentar (`import.ts` ~ 215-240); nada se borra.

### 2.3 Armado de una campaña y destinatarios

`POST /api/campaigns` (`app/api/campaigns/route.ts`) crea la campaña en **borrador**: el `area` sale del canal elegido; la línea (`profile_lines`) o la línea Wasender tienen que ser del mismo perfil; el rol también. Destinatarios con `planRecipients` (`campaign-recipients.ts:104-139`): **detenidos nunca entran**, los ya en la campaña se excluyen y los **ya contactados quedan afuera salvo decisión explícita**. Prioridad (`bases/priority.ts`, `computeCampaignPriority`): 0 si el diagnóstico/tipo de consulta contiene fractura, muerte/fallecimiento o amputación; 1 el resto. **Nota**: esa regla es de Jurídico y se aplica igual a los otros rubros (solo inofensiva por falta de coincidencias).

### 2.4 Selección de línea

- **Meta**: `campaigns.line_id` → `profile_lines` (fila por línea, `credential_key`). `campaignReadiness` exige perfil con presentación/marca, línea activa y habilitada para campañas, credenciales (variables `<CLAVE>_PHONE_NUMBER_ID/_ACCESS_TOKEN`) y plantilla aprobada asignada a esa línea para `campana` (`template_assignments`).
- **Wasender**: `wasender_line_id` y plantilla propia (o «rotar»). Preparación en `preparacionWasender`.
- **No hay rotación automática entre líneas**: cada campaña usa **una** línea fija. La «rotación» existente es de **plantillas/textos** en Wasender: `elegirPlantillaDeInicio` (`wasender/campanas.ts:120-124`) elige por hash de la persona entre las plantillas de inicio del perfil, y cada plantilla exige **mínimo 4 textos distintos** (`ritmo.ts:53`, `campanas.ts:76-82`). Cada persona recibe siempre la misma variante (determinístico).
- Las **respuestas** salen por donde escribió la persona (`salidaDeConversacion`, `wasender/equivalencias.ts`).

### 2.5 Ventanas de envío, topes, tandas, ritmo (`lib/campaigns.ts`, `lib/horario.ts`)

El latido llama una vez por minuto a `/api/campaigns/tick`; **cada campaña manda como máximo 1 mensaje por llamada** (`campaigns.ts:25-48`, bucle `tickAllActiveCampaigns` 692-704). Por eso, en la práctica, esperas menores a 60 s no existen aunque el mínimo configurado sea 50 s.

Orden de las compuertas en `tickLocked` (176+):
1. Campaña `en_curso`, no archivada, **pausa general** (`automation_pause.outbound_paused`).
2. Días de ejecución (`run_days`, 1=lunes…6=sábado; domingos nunca) (206-210).
3. Wasender: preparación completa; si falta algo la campaña **se pausa sola** y se reanuda a mano (215-225).
4. **Límite diario de la línea Wasender** = el menor entre el elegido y el **calentamiento** (20→40→80→150→250 por día, escalones desde los días 1/4/8/15/22, `wasender/ritmo.ts:16-50`), más freno automático por fallas/no entrega y por respuesta <1 % con ≥100 envíos en 7 días (`frenoDeLinea`, 241).
5. **Límite diario de la línea Meta** (`profile_lines.daily_limit`, sumando todas sus campañas) (255-266).
6. **Horario**: `getSendWindow` (`horario.ts`): el de la campaña dentro del general lun-sáb 8-21 (21 excluido), feriados incluidos, con excepciones del calendario (`contact_calendar_exceptions`); si no se puede leer el calendario **no se envía** (270-290).
7. Wasender: **plan del día** de la línea (arranque, cierre, pausas distintos cada día).
8. **Pausa entre tandas** (`batch_paused_until`).
9. **Límite diario de la campaña** (`daily_send_limit`). Diferencia: en Wasender frena el día y **sigue sola mañana**; en Meta **pasa la campaña a `pausada`** y hay que reanudarla a mano (330-352).
10. **Intervalo al azar** entre `min_send_delay_seconds` y `max_send_delay_seconds` (sorteado al enviar, `next_delay_seconds`) (355-368).
11. Wasender: espera de 0-20 s al azar antes de enviar (`desfaseEnElMinuto`, 374).
12. Reserva atómica del destinatario `campaign_claim_next` (orden `priority, queued_at`; `for update skip locked`; `0116_etapa1_envios_seguros.sql:105-127`). Marketing elige al lead mejor calificado (`pickNextMarketingContact`, 387).
13. **Tope por persona**: máximo 3 automáticos sin respuesta (`inicio_campana`, `seguimiento`, `recuperacion`), contados por **teléfono entre todos los perfiles**; si no se puede leer, frena (`contacto/tope.ts`, `campaigns.ts:443`).
14. Compuerta de envío `sendOutboundMessage`: origen obligatorio, pausa, horario, detención, `claim_ai_send`.

Defaults de creación (`api/campaigns/route.ts:145-160`): espera 50-200 s, lotes de **10**, pausa de **300 s**; **modo entrenamiento** (`campanas/entrenamiento.ts:12-16`): 20 por día durante 7 días, espera 90-300 s, lotes de 5, pausa 900 s; un límite diario mayor apaga el entrenamiento. En Wasender las tandas y las pausas son de largo variable (`cortarTanda`, `pausaEntreTandas`). Lock del latido 120 s y reserva 600 s (`campaigns.ts:95-97`). Pausa por calidad baja de la línea Meta (`whatsapp/calidad-servidor.ts`). Estructura base de `campaigns` (batch, delays, ventana 7-21 por defecto) vive en el esquema previo: `tests/integracion/sql/01_estructura_previa_etapa1.sql:43`.

**Orden dentro del latido** (`api/campaigns/tick/route.ts`, `maxDuration=60`): campañas → plantillas → **seguimiento** → recontacto (15 s) → segundo intento → descartes (min%10==0) → caídos (min%10==5) → rescate → calidad → Marketing → tareas del servidor → etc. Las etapas lentas van **después** de las campañas.

---

## Parte 3 · Seguimiento y caídos · el posible error de las 72 horas

### 3.1 El circuito (para ubicarse)

`seguimiento/circuito.ts`: solo entra quien **respondió** y cuya conversación se interrumpió con nuestro último mensaje sin respuesta. Contacto 2 programado a 48–72 h (`planFollowups`, `seguimiento/motor.ts:77-139`); sin respuesta, a las **24 h** pasa a Caídos (`ESPERA_RESPUESTA_HORAS`); contacto 3 si respondió al 2 y se volvió a cortar. Los pasa a ejecutar `runDueFollowups` (`motor.ts:204-232`, hasta 5 tareas por latido) con `decideAtExecution`.

### 3.2 Veredicto: **CONFIRMADO por el código** [confirmado]

El error es real y **determinístico** cada vez que la franja elegida es la de **72 h exactas**. No depende de que el latido «se demore»: el latido nunca cae en el milisegundo exacto.

Cadena de hechos, con líneas:

1. `contacto/reglas.ts:33`: `FOLLOWUP_RANGE = { minHours: 48, maxHours: 72, defaultTargetHours: 72 }`. El objetivo coincide con el tope.
2. `chooseFollowupSlot` (`reglas.ts:175-194`) recorre `k = 48…72` y elige el `k` permitido más cercano al objetivo. Con objetivo 72, si `base + 72 h` cae lunes a sábado entre 8 y 21, **elige k = 72** y programa `scheduled_at = base + 72 h` exactos (`motor.ts:145-157`).
3. `runDueFollowups` toma la tarea cuando `scheduled_at <= now` (`motor.ts:217-222`), es decir **siempre unos segundos o minutos después** del instante exacto.
4. `decideAtExecution` (`reglas.ts:210-231`) calcula `deadline = base + 72 h` y solo envía si `now <= deadline` (línea 218). Como `now > scheduledAt = deadline`, **no envía**.
5. Entra al reintento: `chooseFollowupSlot(..., notBefore: now)` (línea 221). Toda franja `k ≤ 72` está en el pasado → **no hay ninguna** → `ok:false`.
6. Como `now > deadline` (línea 223), devuelve **`conflicto: plazo_vencido`** («Venció el plazo de 72 horas sin una franja válida…», 224-228). `applyTiming` (`motor.ts:375-385`) deja la tarea en `conflicto` (ya no la toma `runDueFollowups`, que solo lee `programada`/`pendiente`, `motor.ts:217`).

Cuándo **no** pasa: si `base + 72 h` cae domingo o fuera de 8-21, el algoritmo elige `k=71, 70…`, que queda **antes** del tope; ahí funciona (y por eso el bug «aparece a veces» y no siempre). El test que debería cubrirlo (`tests/unitarias/reglas-contacto.test.ts:108-125`) usa un `scheduledAt` de 48 h y un `now` bien anterior al tope: **no prueba el caso objetivo=72 h ejecutado después del instante exacto**.

Efectos colaterales leídos:
- Solo se registra un evento en el historial; **la oportunidad queda con `followup_state='activo'`** y `followup_next_at` viejo (el conflicto no actualiza el estado, `motor.ts:375-385`) hasta que el motor de caídos la cierre por silencio de 96 h.
- La interrupción **no vuelve a programarse**: «una interrupción cuya tarea se descartó o falló no vuelve» (`0201_etapa2_seguimiento.sql:27-31`, índice único por interrupción). Resultado: se pierde el contacto 2 de esa persona.
- `rubros.followup_target_hours` **por perfil** manda sobre el `FOLLOWUP_RANGE` (`motor.ts:145`, `row.target_hours`). La migración `0607:166` solo cambió el **default de columna** a 72; las filas ya existentes conservan su valor (60 en el esquema original `0201:37`) hasta que alguien lo cambie. **Sin verificar en la base**: si un perfil tiene 60, no sufre el error por esta vía; si tiene 72, sí. Eso explicaría que unos perfiles tengan «conflicto» y otros no.
- Agravante: las campañas Wasender duermen hasta 20 s cada una, en serie, antes del seguimiento dentro de un latido de 60 s (`campaigns.ts:374`, `tick/route.ts`), así que la tarea se ejecuta aún más tarde.

### 3.3 Propuesta de arreglo (sin aplicar)

- Corregir en `decideAtExecution`: comparar contra `deadline` **más una gracia** (por ejemplo, hasta el final de la hora programada o +1 h), o directamente tratar `now <= scheduledAt + 59 min` como «en plazo». Así coincide con la granularidad horaria de las franjas.
- Y/o que `chooseFollowupSlot` busque hasta `maxHours - 1` cuando el objetivo sea el tope, o que el objetivo por defecto sea 70.
- Agregar un test: objetivo 72, `scheduledAt = base+72h`, `now = scheduledAt + 1 min` → debe devolver «enviar».
- Recuperar lo ya afectado: tareas `conflicto` con `status_reason` «Venció el plazo de 72 horas» → una consulta a la base (solo lectura primero) para dimensionar; decidir con la responsable si se reprograman a mano.
- Que un `conflicto` actualice `followup_state`/`followup_next_at` para que el panel no muestre «Programado» sin serlo.

### 3.4 Caídos y segundo intento (resumen leído)

`seguimiento/caidos.ts` y `caidos-motor.ts` (se corre cada 10 min, min%10==5): cae por no responder al seguimiento (24 h), por silencio de 96 h sin seguimiento, o por 7 días sin poder enviarse; **nunca** cae un captado, perdido, detenido o quien espera a una persona. `segundo-intento.ts`: solo Wasender, uno solo, 5–7 días después, hasta 10 días, solo si el primero se entregó; apagado por defecto. `hoy/descartes*` (min%10==0): último mensaje negativo + 6 h = perdido con motivo.

---

## Parte 4 · Informes: qué genera el sistema, dónde se guarda y dónde se ve

| Informe | Quién lo genera | Dónde se guarda | Dónde se ve |
|---|---|---|---|
| **Informe de mejoras del bot** | Gemini sobre hasta 400 conversaciones reales del perfil (`agentes/informe-mejoras.ts`, `api/agentes/informes/route.ts`, en segundo plano con `after`, `route.ts:46`) | `bot_informes_mejora` (estado procesando/listo/error, `resultado`, `metricas`, `aplicadas`); aplicar una propuesta suma una ficha al bot o crea un rol y deja `ops_change_log` | Pantalla **Bot IA** del perfil → componente `components/agentes/informe-mejoras.tsx` (montado en `agentes-perfil-view.tsx:60`) |
| **Puntaje de los bots** | Calculado de `agent_turn_logs` | Lectura al vuelo (`agentes/puntaje.ts`) | Bot IA → `puntaje-bots.tsx` |
| **Laboratorio**: simulaciones, A/B, aplicaciones | Servidor (`laboratorio/servicio.ts`, `bot-base.ts`) | `bot_lab_*` (versiones, pruebas_ab, aplicaciones, simulaciones, roles) y `ops_change_log` | Bot IA → «Laboratorio del bot» (`conocimiento-bot.tsx:178`, `laboratorio-bot.tsx`) |
| **Estadísticas de conocimiento por versión** | RPC `conocimiento_estadisticas` (`conocimiento/estadisticas.ts`) | Cálculo en la base | Bot IA → conocimiento |
| **Resumen de la semana** (7 días vs 7 anteriores) | `asistente/semana.ts` (solo conteos) | No se guarda | Asistente general (`/asistente`) |
| **Resultados / embudo / día por día** | RPC `embudo_etapa`, `embudo_por_dia`, `profile_metrics` | Cálculo en la base; `profile_metrics` con caché de 20 s (`metrics.ts:66`) | `/resultados`, Hoy (Resumen/Resultados/Historial), Estadísticas |
| **Salud del sistema** | `salud/index.ts` + `salud/fallas.ts` | `system_settings.ultimo_latido` (tiempos por etapa, `salud/index.ts:12-31`); fallas avisadas por push (`salud/avisar-fallas.ts`) | `/salud` y la barra de salud de cada perfil |
| **Calidad de líneas Meta** | `whatsapp/calidad-servidor.ts` | `system_settings.calidad_lineas` | Salud y push «Calidad baja en una línea» |
| **Incidencias y retenidos** | Sistema y bot (`captacion/index.ts`, `atencion/crisis.ts`) | `incidences`, `contact_detentions`, `webhook_quarantine` | `/incidencias` (pestañas) y el cartel de crisis (`components/perfiles/cartel-crisis.tsx`) |
| **Cambios del sistema (auditoría)** | Cada API que modifica configuración | `ops_change_log` (antes/después) | **No hay pantalla general**; se ve en `/limpieza` (movimientos de la limpieza con deshacer) y por el Asistente |
| **Auditoría de landings / Search Console / contenido** | `seo/auditoria.ts`, `contenido/*` | `landing_audits`, `content_results` | `/contenido` |
| **Informes de Claude (bandeja)** | La responsable / Claude | `bandeja_claude` | `/bandeja` |
| **Acciones propuestas por el asistente** | `asistente/*` | `asistente_acciones`, `asistente_charlas` | `/asistente` |

Los informes de entrega, pruebas y migraciones (`docs/etapaN/`, `cerebro/`) son del repositorio, no del sistema en producción.

---

## Parte 5 · La base de datos

### 5.1 Migraciones

84 archivos en `supabase/migrations/` (el `0511` son 4 partes de contenido de conocimiento v2). Por etapa: `0001-0005` (init, RLS, bases, campañas avanzadas, pipeline de marketing); `0100-0117` y `0199` (etapa 1: oportunidades, detenciones, acceso/seguridad, envíos seguros, adjuntos, métricas); `0200-0207` (etapa 2: calendario, seguimiento, reglas de captación, biblioteca de agentes, contenido/SEO); `0300/0310/0311/0312` (etapa 3: agentes, comparación, Marketing extraer y presupuestos, índices); `0400`; `0500-0511` (asistente, redes, roles por base y campaña, ficha del negocio, conocimiento); `0600-0634` (Wasender, seguimiento automático, caídos, audios, embudo, informes de mejora, crisis, PIN atómico, laboratorio, asistente general y charlas). Última en main: **`0634_asistente_charlas`**. **Las migraciones no reconstruyen la base desde cero**: parte del esquema original (por ejemplo `rubros`, la estructura de `campaigns`) vive en `tests/integracion/sql/01_estructura_previa_etapa1.sql`.

### 5.2 Tablas clave (resumen funcional)

- **Personas y chats**: `contacts` (con `area`, `rubro_id`, `qualification_data`, `imported_base_id`), `contact_identities`, `conversations` (`ai_enabled`, `status`, `area`, `line_id`, `wasender_line_id`), `messages` (`origin`, `sender_type`, `audio_texto*`, `duplicate_of`), `message_attachments`.
- **Embudo**: `opportunities` (cinco dimensiones que coexisten: `contact_state`, `capture_state`, `attention_state`, `followup_state`, `derivation_state`, más `attention_category`, `ultima_palabra`, `last_inbound_at`, `posible_captacion`, `location_zone`), `opportunity_events`, `capture_events` (evidencia), `capture_notices`, `contact_detentions`, `incidences`.
- **Campañas**: `campaigns`, `campaign_contacts` (`priority`, `queued_at`, `claim_token`), `imported_bases`, `imported_base_rows`, `followup_tasks`, `wasender_segundos_intentos`.
- **Líneas y plantillas**: `profile_lines`, `whatsapp_templates`, `template_assignments`, `wasender_lineas`, `wasender_plantillas`.
- **Bots**: `ai_agents`, `agent_roles`, `agent_library`/`_versions`, `agent_assignments`, `agent_turn_logs`, `bot_knowledge_{versions,items,assignment}`, `bot_lab_*`, `bot_informes_mejora`.
- **Operación**: `system_settings`, `ops_change_log`, `access_pin`, `access_events`, `access_origin_limits`, `webhook_quarantine`, `push_subscriptions`/`push_deliveries`, `admin_notifications`, `notification_phones`, `admin_profiles`.

### 5.3 Funciones SQL relevantes (sin acceso público, solo `service_role`)

Reserva y envío: `campaign_claim_next`, `campaign_claim_recipient`, `campaign_mark_sending`, `campaign_finish_send`, `campaign_recover_stale`, `campaign_tick_lock`/`unlock`, `claim_ai_send`, `claim_manual_send`, `grant_ai_final_ack`, `grant_crisis_ack`. Seguimiento: `followup_candidates`, `followup_claim`, `followup_gate`, `followup_finish`, `followup_release`, `followup_recover_stale`, `caidos_candidatos`. Captación: `capture_register`. Cifras: `profile_metrics` (`0616` una pasada), `embudo_etapa`, `embudo_por_dia`, `personas_que_escribieron`, `conversation_last_messages`, `contacts_last_outbound`, `detained_phones`/`detained_contact_ids`, `conocimiento_estadisticas`. Laboratorio: `laboratorio_crear_version`, `_crear_ab`, `_cortar_ab`, `_aplicar_rol`, `_aplicar_version`, `_revertir`, `_estadisticas_ab`. Acceso: `access_try_attempt`, `access_register_failure`, `access_attempt_ok`. Protección: `prevent_hard_delete`, `prevent_row_changes` (nada se borra). Triggers de oportunidad: `opportunity_on_message_insert`, `opportunity_on_contact_insert`.

### 5.4 pg_cron

Hay **un solo job**, `campaigns-tick`, cada minuto, que con `pg_net` hace un POST a `/api/campaigns/tick` con un `Authorization: Bearer` (el secreto va dentro del comando del job, no versionado). Lo prueban `docs/SETUP.md:103-135` y `0101_etapa1_acceso_y_seguridad.sql:153-170` (función para activarlo/desactivarlo sin exponer el comando). `0100:137` documenta cómo desactivarlo sin borrarlo. Vercel no tiene `crons`. **Todo el sistema automático (campañas, seguimiento, recontacto, caídos, rescate, tareas, Marketing) depende de ese único job.** El estado real del job y de `net._http_response`: **sin verificar en la base**.

### 5.5 Configuración que vive en la base (no en el código ni en variables)

- `rubros`: `brand_name`, `agent_presentation_name`, `whatsapp_phone`, `business_sheet` (ficha del negocio), `followup_target_hours` (48–72), `followup_enabled_since`, `inbound_24h_enabled`.
- `ai_agents` (por área): `system_prompt`, `qualification_criteria`, `required_fields`, `active`; historial en `ai_agent_prompt_history`.
- `bot_knowledge_items` / `bot_knowledge_assignment`: el conocimiento y qué versión usa cada rubro (y el A/B).
- `agent_roles`, `agent_library`, `agent_assignments`, `bot_lab_*`.
- `profile_lines` (línea, `credential_key`, `daily_limit`, `use_for_campaigns`, `active`), `template_assignments` (plantilla por propósito), `wasender_lineas` (estado, `habilitada`, `calentamiento_desde`, límites).
- `contact_calendar_exceptions` (días cerrados u horarios cortos).
- `system_settings` (llave → JSON): `automation_pause` (`ai_replies_paused`, `outbound_automations_paused`; **falla cerrada**: si falta el registro o no se puede leer, el sistema se considera pausado, `automation-pause.ts`), `tareas_servidor`, `ultimo_latido`, `audios_a_texto`, `recontacto_ia`, `caidos_automaticos`, `avisos_meta`, `calidad_lineas`, `catalogo_auto_sync`, `limites_outscraper`, `evaluacion_plantillas`, `agente_ganador`, `publicidad`, `corpus_desde`.
- `content_policies` (destino Metricool por perfil), `personalizacion_perfil`, `notification_phones`, `admin_profiles` (destinatarios de avisos), `access_pin` (hash y versión de sesión).

---

## Parte 6 · Separación por rubro: por qué aparecen cosas en los 4 perfiles

La separación del código es **de navegación y de filtros** (URL, cookie `perfil_activo`, `rubro_id`/`area`), no de permisos (hay un solo PIN y todas las lecturas usan la clave de servicio). Donde un recurso **no tiene `rubro_id`** o el filtro **no se aplica**, aparece en todos. Causas encontradas:

### 6.1 Los «retenidos» [confirmado]

- La tabla `webhook_quarantine` **no tiene columna de perfil** (`0101_etapa1_acceso_y_seguridad.sql:107-118`: `source`, `reason`, `account_id`, `payload`, `detail`…). Guarda el evento crudo de Meta.
- Aun así, cada pantalla la **cuenta sin filtrar**:
  - `/incidencias`: contador (`app/incidencias/page.tsx:54`) y lista (`page.tsx:358-363`), a pesar de que el encabezado dice `perfil`.
  - Configuración → «Mensajes retenidos por seguridad» (`components/configuracion/ajustes-generales.tsx:32`).
  - Salud → fallas por perfil (`lib/salud/fallas.ts:55`): `retenidos` sin filtro por `rubroId`, a diferencia de sus vecinas (mensajes fallidos, archivos, seguimiento) que sí filtran.
  - Salud → ítem `cuarentena`, declarado **global a propósito** (`lib/salud/por-perfil.ts:12`, `GLOBALES`), con otra ventana (solo últimas 24 h, `salud/index.ts:56-62`).
  - Acciones sobre un retenido (`api/revision/retenidos/[id]`) tampoco comprueban perfil.
- Resultado: el mismo número de retenidos se ve en **los cuatro perfiles** y en Jurídico se suma a otra cifra que sí es por perfil. La pantalla «sin cuarentena» y «4 retenidos» contradictorias se explican por **ventana distinta** (24 h contra todos los pendientes) más el hecho de que no se filtra por perfil.
- Además `profile_metrics.retenidos_revision` (`metrics.ts:20`, `components/ui/metrics-panel.tsx:38`) es **otra cosa con el mismo nombre**: detenciones con motivo «no confirmado», **sí** por perfil. Un tercer significado de «retenidos».
- **Arreglo posible**: resolver el perfil del evento al guardarlo (la línea o el `phone_number_id` ya se conocen en `webhooks/process.ts:29-48`) y guardar `rubro_id`/`area` en la cuarentena; filtrar en las cuatro lecturas; los sin línea asignada (`linea_no_asignada`) mostrarlos solo en una vista «General».

### 6.2 El «aviso» de Penal ofrecido en los 4 perfiles [confirmado el mecanismo; el dato sin verificar]

Es la línea **PENAL** «ofrecida como asignar» en Configuración de los otros perfiles (el recorrido C lo vio rotulado «PENAL · Civil»).
- `lib/profiles.ts:59-64` `detectedCredentialKeys()` lista **todas** las variables `WHATSAPP_*_PHONE_NUMBER_ID` del entorno, sin mirar de qué perfil son.
- `components/perfiles/profile-settings-section.tsx:36-43` las filtra solo contra `profile_lines` **activas**: «una conexión que ya usa otro perfil no se ofrece para asignar acá». Como Penal **no tiene fila activa** en `profile_lines` (el estado de Penal es «faltan variables», no hay línea), su clave aparece como «detectada y sin asignar» en **cada** perfil (`components/perfiles/profile-settings.tsx:208-225`, botón «… · asignar»).
- El rótulo «Civil» sale del área por defecto del formulario de línea del perfil (`profile-settings.tsx`, `areas`), no de una decisión sobre Penal.
- **Arreglo posible**: no ofrecer claves cuyo prefijo corresponda a otro perfil (comparar contra el mapa de claves por rubro) o restringir `detected` al prefijo del perfil actual; y crear la fila `profile_lines` de Penal (o decidir «Penal dentro de la línea de Civil», ya anotado como pendiente P3).

### 6.3 «Algunos chats» en los 4 perfiles: no encontré un chat que se filtre en la lista, sí cuatro causas estructurales [hipótesis]

La lista de chats está bien filtrada (`api/inbox/route.ts:98`: `.in("area", areasPerfil)`) y el detalle redirige al perfil dueño (`components/inbox/hilo-chat.tsx:13,33-38`). Lo que sí hace que algo «se vea en el perfil equivocado»:
1. **Cookie `perfil_activo` única por navegador** (`lib/perfil-activo.ts:13-25`, escrita por el middleware, 30 días): cualquier pantalla o llamada API **sin `?perfil=`** usa «el último perfil visitado». Con dos pestañas de perfiles distintos, la segunda lista **los chats del otro perfil**.
2. **Dos fuentes de «dueño» distintas**: la lista usa `conversations.area`, el detalle usa `contacts.area` (`hilo-chat.tsx:36`) y `perfilDeArea(null)` cae en **Jurídico** (línea 13). Si ambas difieren, un chat aparece en un perfil y, al abrirlo, salta a otro.
3. **Elementos «globales» de Salud**: `entrantes`, `cuarentena`, `latido`, `pausa` son globales por diseño (`salud/por-perfil.ts:12`); el «último error de IA» enlaza a una conversación con el nombre del perfil de otra (`salud/index.ts:77-105`).
4. **Avisos push sin perfil**: `push_subscriptions` es una lista única de dispositivos y `sendToDevices` manda a **todos** los activos (`lib/push.ts:84-92`). Un aviso de crisis, reclamo o línea caída llega al mismo teléfono sin importar el rubro (el enlace sí lleva `?perfil=` del dueño en reclamos y crisis).
Pedir a la responsable **un ejemplo concreto** (pantalla + chat) para confirmar cuál de las cuatro es.

### 6.4 Otros recursos sin perfil

`admin_profiles` y `notification_phones` (destinatarios de avisos) son **una lista global**: todos los avisos de agendado y de caso calificado de **todos** los rubros van a los mismos teléfonos (`lib/notify.ts:35-60`), y la línea de salida se elige por área (`wasender/avisos.ts`). El contador `/prospectos` es solo Jurídico (`(dashboard)/prospectos/page.tsx`, `.eq("rubro_id", RUBRO_IDS.juridico)`).

---

## Parte 7 · «Esperan a una persona»: por qué marca 4, 5, 6 o 14

No hay una sola definición: hay **al menos cinco consultas distintas** con la misma etiqueta. Todas leen `opportunities.attention_state = 'requiere_humano'` (o parientes), pero con filtros diferentes.

| # | Pantalla / etiqueta | Archivo | Qué cuenta exactamente |
|---|---|---|---|
| A | **Estadísticas del perfil**: «Esperan a una persona» (y su lista «Requieren intervención humana») | `components/estadisticas/estadisticas-perfil.tsx:44`; `lib/metrics.ts` → RPC `profile_metrics` (`0616…sql:31`: `count(*) filter (where attention_state='requiere_humano')`); lista `lib/indicadores.ts:63` | **Todas** las oportunidades del rubro en `requiere_humano`, **de todos los tiempos**, incluidas perdidas, detenidas y caídas. El mayor de los números. |
| B | **Perfiles** (tarjeta «piden persona») y **Resumen de la semana del Asistente** | `lib/perfiles-stats.ts` (~línea 83); `lib/asistente/semana.ts:56` | `requiere_humano` **y** `capture_state <> 'perdido'` **y** sin detención **y** `updated_at` en los últimos **7 días**. Si falla la consulta cae a la cifra A (`perfiles-stats.ts`, `piden.error ? metrics… : piden.count`), así que **cambia de significado** según falle o no. |
| C | **«Oportunidades reales»** (Activos, Hoy → cola «piden persona») | `lib/indicadores.ts:71` (`piden_persona`); `lib/cartera.ts:45`; `components/inicio/tablero-hoy.tsx:104` | `requiere_humano` **y** `capture_state ∈ {nuevo, en_conversacion, en_seguimiento}` **y** sin detención **y** `followup_state <> 'caido'`. Sin límite de fecha. Excluye captados. |
| D | **Hoy → «Esperan tu respuesta»** y filtro **«esperan»** del Inbox | `lib/hoy/colas.ts:70-118`; `api/inbox/route.ts:105-118` | **No mira `attention_state`**: parte del indicador `te_escribio` (la última palabra del chat es de la persona, últimos 7 días, no perdido) dentro de una ventana de 21 días y 150 chats, descarta a quien el bot aún puede contestar (10 min de gracia, `GRACIA_BOT_MIN`) y a detenidos/perdidos, y en el Inbox **suma captados sin derivar que volvieron a escribir**. |
| E | **Prospectos → «Esperan a una persona»** (solo Jurídico) | `app/(dashboard)/prospectos/page.tsx:31,72` | `attention_state = 'requiere_humano'` sin otro filtro, **paginado de a 50**, **solo `rubro_id` Jurídico**. Mismo universo que A pero acotado a un rubro y sin caché. |
| F | Supervisión de agenda (pestaña «atención») | `components/agenda/agenda-supervision.tsx:83,131` | `requiere_humano` **más `humano_en_curso`** (dos estados sumados). |

**Mapeo probable de las cifras (hipótesis, hay que cotejarlo con la base)**: 14 = A/E (todo el histórico); 6 = B (últimos 7 días, sin perdidos ni detenidos); 5 = C (además sin caídos y solo etapas abiertas); 4 = D (chats cuya última palabra es de la persona, ventana de 21 días). Distintos denominadores y ventanas, no un error de conteo.

Otras causas de desfase: caché de `profile_metrics` de 20 s (`metrics.ts:66`) frente a consultas en vivo; la cifra A viene de una RPC y la lista que abre, de PostgREST con las mismas condiciones, por eso coinciden entre sí.
**Verificación sugerida (solo lectura en la base)**: contar por separado `attention_state='requiere_humano'` con y sin `capture_state<>'perdido'`, con y sin detención, con y sin `followup_state='caido'` y con `updated_at` de 7 días, por `rubro_id`. Con esas 4 consultas se reproducen exactamente 14, 6 y 5.
**Propuesta**: una sola definición con nombre propio (por ejemplo «Esperan a una persona (activos)» = definición C) y renombrar las demás («Pidieron una persona alguna vez», «Te escribieron y nadie contestó»).

---

## Errores o riesgos (propuestas, sin aplicar)

**Críticos / confirmados**
1. **Seguimiento en «conflicto: plazo vencido» con objetivo 72 h** (`contacto/reglas.ts:33,175-231`; `seguimiento/motor.ts:145,217,375-385`). Se pierde el contacto 2 de quienes caen en k=72 (según el perfil, **sin verificar en la base**). Arreglo y test en 3.3. Además el estado queda en «activo» y no se reprograma.
2. **«Retenidos» sin perfil** en Incidencias, Configuración y Salud (`app/incidencias/page.tsx:54,358`, `ajustes-generales.tsx:32`, `salud/fallas.ts:55`): rompe «cada rubro separado». Agregar perfil a `webhook_quarantine` al guardar y filtrar.
3. **Línea de Penal ofrecida en los 4 perfiles** (`lib/profiles.ts:59`, `profile-settings-section.tsx:36-43`). Filtrar por perfil dueño.

**Altos**
4. **Sin tope de costo de IA**. Hasta 8 llamadas por turno ×2 por reintento, `thinking` por defecto, historial de 30 mensajes más prompt largo (ficha 6.000 + conocimiento 12.000 caracteres). Un contestador en bucle o una campaña grande suben el gasto sin freno. Proponer tope diario de tokens por perfil con aviso, usando lo ya registrado en `agent_turn_logs`.
5. **Recontacto sin tiempo máximo** (`recontacto/motor.ts:292`): llama a `generateContent` directo, sin `conTiempoYReintento`, dentro de un latido de 60 s. Una llamada colgada puede consumir el latido y atrasar seguimiento, rescate y tareas del servidor.
6. **Latido sobrecargado**: las campañas Wasender duermen hasta 20 s cada una, **en serie** (`campaigns.ts:374`), delante de todas las demás etapas dentro de `maxDuration=60`. Con 3 campañas activas puede no alcanzar para seguimiento, caídos y rescate. Medir `latidoTiempos` en Salud; mover el sueño a un desfase en el instante de envío o limitar a una campaña Wasender por latido.
7. **Evidencia de captación no verificable**: `evidencia` es texto del modelo; solo se valida con una regex del último mensaje (`agentes/aceptacion.ts`). Proponer guardar el `id` del mensaje de la persona que sustenta la aceptación y mostrar la cita real en la ficha.
8. **Webhook sincrónico con Gemini** (`maxDuration=60`, `api/webhooks/whatsapp/route.ts:7`): turno con hasta 8 llamadas de 20 s + 1 reintento + transcripción de audio de 20 s puede pasar de 60 s; Meta reintenta. Hay reserva atómica y rescate, pero conviene medir.
9. **Un solo job `pg_cron`** y no versionado: si cambia el dominio o el secreto, todo lo automático se detiene en silencio (solo avisa «latido fallido»). Versionar la definición sin el secreto y alertar cuando `ultimo_latido` supera N minutos.

**Medios**
10. **Cookie `perfil_activo` global**: pantallas sin `?perfil=` toman el último perfil visitado (`lib/perfil-activo.ts`). Hacer que toda pantalla y API de perfil exijan el perfil en la URL, o scoping por pestaña.
11. **Dueño del chat con dos fuentes** (`conversations.area` vs `contacts.area`, `hilo-chat.tsx:13,36`) y `area` nula = Jurídico. Unificar en `conversations.rubro_id`.
12. **Cinco definiciones de «Esperan a una persona»** (Parte 7), más tres de «retenidos» (6.1). Una definición por nombre.
13. **Avisos push y teléfonos de aviso globales** (`push.ts:84-92`, `notify.ts:35-60`): todos los dispositivos reciben avisos de todos los rubros. Agregar `rubro_id` opcional a dispositivos y destinatarios.
14. **Asimetría Meta/Wasender en el límite diario de campaña**: Meta pausa y exige reanudar a mano; Wasender sigue al día siguiente (`campaigns.ts:343-352`). Documentar o unificar.
15. **Ritmo mínimo irreal**: con el latido cada minuto, cada campaña envía como máximo 1 por minuto; el mínimo de 50 s del formulario (y el de 90 s del entrenamiento) se comporta como ≥60 s.
16. **`followup_target_hours` por perfil** puede ser 60 en perfiles viejos y 72 en nuevos (solo cambió el default de columna, `0607:166`): comportamiento distinto sin que se vea. Verificar y alinear.
17. **Prioridad por fractura/muerte/amputación** se aplica a todos los rubros (`bases/priority.ts`); definirla por perfil.
18. **Pausa general falla cerrada**: si falta la fila `automation_pause`, el bot calla y no sale nada, con solo un `console.warn`. Verificar la fila (ambos `false`) y avisar a la responsable si se pausa por error de lectura.
19. **Importación**: límite de 5.000 filas por carga y deduplicación solo contra contactos de la misma área; un mismo teléfono en Civil y Penal queda como dos contactos (coherente, pero hay que saberlo al contar «personas»).
20. **Código sin uso y comentarios obsoletos** (flujo `ai-agent/intake-flow.ts`, comentarios que dicen «Anthropic/Claude», `campaigns/tick/route.ts` que habla de cron-job.org): ya listados en `A-codigo-crm.md`; confunden al leer la lógica.

**Qué falta comprobar en la base (todo solo lectura)**: `rubros.followup_target_hours` por perfil; tareas `followup_tasks` en `conflicto` con motivo «plazo de 72 horas»; fila `automation_pause`; job `campaigns-tick` y sus últimas ejecuciones; `bot_knowledge_assignment` (versión y A/B por rubro); `agent_assignments` (¿vacía?); `webhook_quarantine` pendientes y su `account_id`; filas de `profile_lines` (¿existe PENAL?); los cuatro conteos de la Parte 7.
