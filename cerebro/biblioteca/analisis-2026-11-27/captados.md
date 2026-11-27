# Análisis del panel · captados (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Captados y Hoy: el panel hoy decide mal quién está captado y lo muestra en demasiados lugares sin una lista única ni la prueba. Los dos problemas del dueño son reales y comprobados.

(a) Captado en el código = "aceptación con evidencia". Pero «aceptación» se comprueba con muy poco: `aceptacionReal()` (src/lib/agentes/aceptacion.ts) solo descarta rechazos y preguntas sin «sí». Cualquier frase afirmativa sin signo de pregunta pasa. Además `aceptacion: true` lo declara el modelo (agent.ts:1163) y tres atajos captan sin pedir aceptación (`exigirAceptacion:false`, agent.ts:907, 976 y 1046). Nadie verifica que haya pedido o aceptado la llamada. El doc 15-hallazgos H6.1 ya lo decía: «cualquier sí/ok = captado».

En la base (solo agregados) hay 36 captados: Jurídico 21 (2 derivados), Coberturas 4, Autos 0 km 4, Marketing 7 (5 derivados).
- Todos los marcó la IA. Ninguno vino de un operador ni de la limpieza.
- Solo 6 tienen guardado el id del mensaje real (los posteriores al 22/11). Los otros 30 guardan la frase que el modelo dijo que la persona había dicho.
- La evidencia menciona llamada u horario en 16 de 36. En 20 no: Jurídico 8, Coberturas 1, Autos 0 km 4 de 4, Marketing 7 de 7.
- Contando los mensajes entrantes por palabras de llamada u horario (heurística, no lectura de chats), 19 de 36 no tienen ninguno: Jurídico 10, Coberturas 3, Autos 0 km 4, Marketing 2.
- 0 tienen cita (agendar no capta, correcto).
- Jurídico: 20 de 21 tienen horario cargado en la ficha (lo pide `finalizar_consulta`). Autos 0 km, Coberturas y Marketing: 0.

(b) Los captados aparecen en al menos 13 pantallas con ventanas y definiciones distintas. No hay una lista única ni se ve la prueba: `capture_events.evidence` se escribe pero ninguna pantalla la lee.

(c) El «Hoy» de cada perfil tiene unos 10 bloques. Las 5 «cajitas», la barra «paso a paso» y el anillo no tienen enlace; la barra y las cajas repiten las mismas 4 cifras de Resultados. Los botones «Responder» y «Derivar» de «Para decidir» solo recargan la misma página con «Ver más» abierto. «Derivar» además lleva a la ficha y no deriva. En /resumen sí existe derivar en el lugar, y la pantalla no lo aprovecha. El primer pantallazo (1440×900) muestra banner, franja, saludo, un «3» decorativo y atajos que duplican el menú; las acciones reales quedan bajo el pliegue. Autos 0 km, Coberturas y Marketing tardan ~12 s en cargar contra ~2,4 s Jurídico (_rutas.json).

Camino propuesto, sin borrar nada:
1. Función pura `pidioLaLlamada()` y captación solo con ella.
2. Estado «Interesados» sin tocar el CHECK de `capture_state`: se reutiliza en_conversacion + requiere_humano/posible_captacion.
3. Migración 0651 que permite revocar una captación con motivo.
4. Relectura de los 36 captados y reclasificación con deshacer.
5. Lista única «Captados» por perfil.
6. «Hoy» compacto con 3 a 5 acciones que hacen algo en el lugar y una sola fila de cifras clickeables.

## Hallazgos

### 1. El bot marca captado por un «sí» suelto o por un atajo, sin comprobar que pidió o aceptó la llamada

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 8
- **Cómo está hoy:** Definición vigente: reglas.ts:68-87 `evaluarCaptacion` = aceptacion:boolean + evidencia no vacía; la tabla de reglas-comunes.md:20-26 dice «aceptó el siguiente paso» y nunca exige llamada. La «segunda llave» `aceptacionReal` (aceptacion.ts:45-58) devuelve ok:true para cualquier mensaje que no sea rechazo ni pregunta sin «sí» (por ejemplo una frase afirmativa de relato). En `captar` (agent.ts:1149-1165) la aceptación es `input.aceptacion === true`, o sea lo que declara el modelo. Tres atajos captan con `exigirAceptacion:false` (solo se descarta el rechazo claro): `finalizar_consulta` completado de Civil (agent.ts:907), `registrar_resultado_marketing` aprobado (agent.ts:976) y `pedir_presupuesto` (agent.ts:1046). Marketing captado por pedir presupuesto es una regla expresa del 16/10 (agent.ts:1042 y circuitos de Marketing: «se pide el presupuesto (captado)»), que contradice la orden del 27/11. El operador puede «Marcar como captado» con cualquier nota (api/oportunidades/[id]/route.ts:79-86). La limpieza puede dejar captado sin pasar por `registrarCaptacion` (limpieza/servidor.ts:232, sin evento ni prueba); hoy 0 filas lo usaron.
- **Por qué:** La regla de negocio vigente y el entrenamiento dicen «aceptó el siguiente paso», y el código solo verifica ausencia de rechazo. «Pidió la llamada» (definición del dueño y de la relectura del 13/11, concreto_llamada) no existe como condición en el código ni en la base. Prompt y herramienta (prompt.ts:43, tools.ts:97) también hablan de «aceptó el siguiente paso».
- **Evidencia:** Supabase (agregados, 27/11): 36 captados (Jur 21, Cob 4, 0 km 4, Mkt 7). Evidencia que menciona llamada u horario: 16; no la menciona: 20 (Jur 8, Cob 1, 0 km 4/4, Mkt 7/7). Por mensajes entrantes (regex de llamada/horario, solo orientativo): sin ningún pedido 19 (Jur 10, Cob 3, 0 km 4, Mkt 2). Captados por la IA: 36/36; sin evento de captura: 0. Capturas 02__hoy, 23__panel_juridico, 31__panel_agencia_0km y 37__panel_coberturas_medicas muestran «Hay N captados para pasar a quien los atiende» (19 / 4 / 4). cerebro/15-hallazgos-21-11.md H6.1: «cualquier sí/ok = captado».
- **Riesgo:** Menos captados nuevos en el corto plazo (es lo buscado). El modelo puede tardar más en proponer la llamada: reforzar el prompt para que ofrezca «¿te llamamos mañana o a la tarde?» antes de intentar captar.
- **Pasos:**
  1. Crear src/lib/captacion/llamada.ts (pura, con prueba): `pidioLaLlamada(historial)` devuelve {ok, messageId, tipo:'pidio'|'acepto_propuesta', horario?}. Vale un entrante que pide contacto con sus palabras (reusar PIDE_CONTACTO de aceptacion.ts más «llamen/llamame/pueden llamarme/a las 18/mañana a la tarde») o un «sí/ok/dale» corto que responde al saliente inmediatamente anterior que proponía la llamada o el contacto. Un sí suelto o un relato no valen.
  2. `evidenciaDeCaptacion` (evidencia.ts) pasa a usar `pidioLaLlamada` sobre los últimos entrantes, no solo el último, y guarda el id del mensaje de la prueba. Se elimina `exigirAceptacion:false` en agent.ts:907 y 976. `finalizar_consulta` completado queda captado solo si el historial muestra pedido o aceptación de contacto (la disponibilidad que cargó el bot no basta); si no, queda como «interesado» con el horario anotado.
  3. `evaluarCaptacion` (reglas.ts) suma el parámetro `llamadaPedida` y el motivo `sin_pedido_de_llamada`; `registrarCaptacion` (captacion/index.ts) lo exige para actor ia.
  4. Marketing: `pedir_presupuesto` (agent.ts:1042-1046) deja de captar y pasa a estado «Pide presupuesto / Interesado»; captado solo si pide reunión o llamada. Ver pregunta 1: es decisión del dueño porque revierte la del 16/10.
  5. Operador (route.ts:79): exigir `mensajeId` de la prueba o un campo explícito «decisión mía, sin mensaje» que se guarda y se ve en la prueba. Limpieza (servidor.ts:232): llamar a `registrarCaptacion` en vez de escribir capture_state a mano.
  6. Prompt y herramienta: reescribir tools.ts:97 y prompt.ts:43 («captá solo cuando la persona pidió o aceptó que la llamen; si solo mostró interés, usá `registrar_interes` y seguí proponiendo la llamada») y la guía de cierre (guia-cierre.ts:14). Actualizar el criterio por rubro en reglas.ts `CRITERIO_POR_RUBRO.aceptacion`, reglas-comunes.md sección 3 y cerebro/03.
  7. Pruebas: tests/unitarias/captacion-llamada.test.ts con casos «sí suelto no capta», «relato sin pedido no capta», «llamame mañana a la tarde capta», «sí a la propuesta de llamada capta», «Marketing presupuesto no capta», «rechazo posterior no capta». Agregar A36 a A38 en .claude/referencias/casos-de-aceptacion.md.
- **Archivos:** `src/lib/captacion/reglas.ts`, `src/lib/captacion/evidencia.ts`, `src/lib/agentes/aceptacion.ts`, `src/lib/ai-agent/agent.ts`, `src/lib/ai-agent/tools.ts`, `src/lib/ai-agent/prompt.ts`, `src/app/api/oportunidades/[id]/route.ts`, `src/lib/limpieza/servidor.ts`, `src/lib/marketing/derivar-presupuesto.ts`

### 2. Dos definiciones de «captado» conviven: oportunidad vs. estado del contacto «cerrado_ganado»

- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto del pedido:** 8
- **Cómo está hoy:** El listado y los contadores cuentan `opportunities.capture_state='captado'` (indicadores.ts:57-60), pero el estado visible del chat considera captado también a quien tenga `contacts.status='cerrado_ganado'` (definiciones/estado-chat.ts:46). Ese estado de contacto lo siguen escribiendo el cuestionario viejo (intake-flow.ts:214), `finalizar_consulta` (agent.ts:904, antes de comprobar la evidencia) y Marketing (marketing/leads.ts:250).
- **Por qué:** Herencia del flujo anterior a las oportunidades (comentario en intake-flow.ts:200-212: «cerrado directamente sin paso manual»). Nunca se retiró.
- **Evidencia:** Supabase: Jurídico tiene 22 contactos cerrado_ganado y 21 captados; 2 son cerrado_ganado sin estar captados y 1 captado no es cerrado_ganado. Esas 2 personas se ven como «Captado: falta derivar» en Chats sin contar en ningún indicador ni en Hoy. Autos 0 km, Coberturas y Marketing: 0 diferencias.
- **Riesgo:** Bajo. Revisar campaigns.ts:1158-1159 y recontacto/reglas.ts:117, que leen el estado de contacto.
- **Pasos:**
  1. estado-chat.ts:46: quitar `|| i.contactStatus === 'cerrado_ganado'`; el estado sale solo de la oportunidad.
  2. agent.ts:904, intake-flow.ts:214 y marketing/leads.ts:250: dejar de escribir `cerrado_ganado` (o escribirlo solo después de que `registrarCaptacion` devuelva captado). Revisar campaigns.ts:1158-1159 (embudo de campañas por estado de contacto) para que cuente por oportunidad.
  3. Corrección de datos: las 2 personas «cerrado_ganado sin captar» pasan a revisión por la relectura (hallazgo de reclasificación), no se borran.
- **Archivos:** `src/lib/definiciones/estado-chat.ts`, `src/lib/ai-agent/agent.ts`, `src/lib/ai-agent/intake-flow.ts`, `src/lib/marketing/leads.ts`, `src/lib/campaigns.ts`, `src/lib/recontacto/reglas.ts`

### 3. La prueba de captación se guarda pero ninguna pantalla la muestra; tampoco hay «estado de la llamada»

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 8
- **Cómo está hoy:** `capture_events.evidence` y `evidence_message_id` (migraciones 0203 y 0637) solo se escriben (captacion/index.ts:123); `grep capture_events src` no encuentra ninguna lectura de pantalla. La ficha muestra solo ubicación y faltantes (ficha-section.tsx:197-205). En Hoy, cada captado dice un texto fijo «Aceptó el siguiente paso» (src/app/hoy/page.tsx, armado de `captados`), que no es la prueba. No existe un estado de la llamada (pidió horario / cita agendada / llamada hecha), aunque los datos están en tres lugares: `contacts.qualification_data.disponibilidad_para_reunion`, `appointments` (con `opportunity_id`) y `opportunities.post_derivation_state`.
- **Por qué:** Se construyó el registro de evidencia (22/11) pero no su lectura en el panel; la lista de captados se arma desde `opportunities` sin unir `capture_events`.
- **Evidencia:** Supabase: 30 de 36 captados sin `evidence_message_id` (anteriores al 22/11); citas ligadas a captados: 0; Jurídico 20 de 21 con horario en la ficha, los demás rubros 0. Capturas 28__conversaciones y 14__contactos: filas sin prueba; el texto de la fila es «Captado: falta derivar» o «Espera a una persona».
- **Riesgo:** Las pruebas viejas están redactadas por el modelo, no por la persona: mostrarlas rotuladas para no darles más peso del que tienen.
- **Pasos:**
  1. Migración 0651: vista `captados_vista` (opportunity_id, rubro_id, contact_id, captured_at, capture_events.evidence y evidence_message_id, horario de la ficha, próxima cita, estado de derivación y resultado posterior, zona, última entrada). Solo SELECT, sin permisos para la clave pública; índice parcial existente (0103:192).
  2. Función de servidor src/lib/captacion/lectura.ts: `listarCaptados(rubroId, filtro)` sobre la vista; la usan Hoy, la lista única y los contadores.
  3. Mostrar la prueba (frase corta y hora) con enlace «Ver en el chat» (ancla al mensaje por `evidence_message_id`). Para los 30 sin id, rotular «prueba anterior al 22/11: sin mensaje guardado» y marcarlos «revisar prueba».
  4. Calcular `estadoLlamada` pura: sin horario / pidió horario / cita agendada / llamada hecha (post_derivation_state contactado_por_profesional o avanzo).
- **Archivos:** `src/lib/hoy/colas.ts`, `src/app/hoy/page.tsx`, `src/components/ficha/ficha-section.tsx`, `src/lib/cartera.ts`, `supabase/migrations (nueva 0651)`

### 4. Regla nueva y reclasificación de los 36 actuales sin borrar nada

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 8
- **Cómo está hoy:** No hay mecanismo para quitarle el captado a alguien. `capture_events` tiene `opportunity_id UNIQUE` y `event_key UNIQUE` y un trigger que impide borrar (0203:112-147), y `capture_register` devuelve «ya existe» si hay evento (0203:235-239). Si se reclasifica sin tocar eso, nadie podría volver a captarse después. `capture_register` también cancela las tareas de seguimiento al captar, y eso no se restaura solo. No existe el estado «interesado»: el CHECK de `capture_state` es nuevo, en_conversacion, en_seguimiento, captado, perdido (0103:151) y hay decenas de consultas con `.in('capture_state',[...])` y `not in (captado,...)` (detention.ts:173, limpieza, seguimiento).
- **Por qué:** El diseño tomó la captación como evento único e irreversible. La orden del 27/11 exige poder separar «interesado» de «captado» y corregir lo ya marcado.
- **Evidencia:** Fuentes: supabase/migrations/0103:151,192; 0203:112-125,211-258; src/lib/opportunities.ts:148-164 (`alCerrarseOportunidad`); detention.ts:173. Ya existen «Oportunidades reales» (attention_state=requiere_humano, sin captados ni perdidos) y «Posible captación a revisar» (`posible_captacion`) que son, en la práctica, el estado «interesado».
- **Riesgo:** Los avisos de captación ya enviados (capture_notices) y las tareas de seguimiento ya canceladas no se deshacen. Para Autos 0 km y Marketing la reclasificación depende de la pregunta 1 y 3: con una regla estricta caerían casi todos (4 de 4 y 7 de 7 sin mención de llamada en la evidencia). Estimación orientativa de caídas con la heurística de mensajes: ~19 de 36, a confirmar con la relectura.
- **Pasos:**
  1. Estado «Interesados» sin ampliar el CHECK: interesado = en_conversacion o en_seguimiento con attention_state requiere_humano o posible_captacion. Rebautizar en la interfaz «Oportunidades reales» como «Interesados» (cartera.ts:44-45) con la frase de por qué. Solo si el dueño quiere un estado propio, ampliar el CHECK y repasar todos los `capture_state in (...)`.
  2. Migración 0651 (repetible, con RLS, sin permisos para la clave pública): `capture_events` agrega revoked_at, revoked_by, revoked_reason, call_message_id y basis ('mensaje'|'operador_sin_mensaje'|'relectura'). Reemplazar el UNIQUE de `opportunity_id` por un índice único parcial `where revoked_at is null`. `capture_register` ignora eventos revocados y arma un `event_key` nuevo. El trigger de no borrar se mantiene.
  3. scripts/reclasificar-captados.ts con dry-run por defecto: para cada captado corre `releerChat` (limpieza/servidor.ts:204, ya existe; Gemini dentro del tope de USD 30 compartido, 36 chats es poco) y `pidioLaLlamada`. Clases: confirmado (pidió o aceptó) queda captado y guarda su prueba; dudoso pasa a «Posible captación a revisar» y lo decide una persona; no pidió pasa a en_conversacion conservando requiere_humano (aparece como Interesado), revoca el evento con motivo y registra el evento de oportunidad `captacion` captado a en_conversacion, actor sistema, con el motivo.
  4. No tocar los 7 ya derivados (Jurídico 2, Marketing 5): se rotulan «prueba a revisar» y los mira una persona. Ya se los pasaron al profesional y deshacerlo desde el sistema sería peor.
  5. Dejar un registro de qué se movió, con botón «Deshacer» por fila (como la limpieza: `limpieza_movimientos` con `deshecho_at`).
  6. Corregir `alCerrarseOportunidad`: al volver de captado a otro estado, reabrir `followup_state` solo si la persona lo decide; no reactivar envíos automáticos solos (el circuito de seguimiento tiene reglas de 3 ciclos).
- **Archivos:** `supabase/migrations/0651_captado_con_llamada.sql (nueva)`, `src/lib/captacion/index.ts`, `src/lib/captacion/reglas.ts`, `src/lib/limpieza/servidor.ts`, `src/lib/cartera.ts`, `src/lib/indicadores.ts`, `scripts/reclasificar-captados.ts (nuevo)`

### 5. Los captados se ven en al menos 13 pantallas, sin lista única, con ventanas distintas y con la etiqueta equivocada

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 8
- **Cómo está hoy:** Lugares que listan o cuentan captados: (1) /hoy, 6 apariciones en la misma pantalla (frase del saludo, fila «Derivar a N captados», celda «Captados sin derivar», celda «Captados» de la semana, barra «paso a paso», cola «Captados para derivar» detrás de «Ver más»); (2) /conversaciones, grupo «Para cerrar» (cartera.ts:42), que es la lista más completa; (3) /contactos «Etapas» (recorrido «Captados 21», «Clientes derivados»); (4) /resultados «Captados · esta semana»; (5) /resumen «Derivar a N captados» (resumen/filas.ts:71); (6) /estadisticas «Captados sin derivar», «21 captadas»; (7) /oportunidades?indicador=captado (oculta); (8) /casos-cerrados y los de cada rubro (solo redirigen, cartera.ts `destinoDeCasosViejos`); (9) /prospectos con filtro de derivación (Jurídico, oculta); (10) /prospectos-por-base; (11) /telefono/[slug]/clientes; (12) agenda-supervision pestaña «sin derivar»; (13) /perfiles (tarjeta con últimos casos); y además Jarvis (asistente/semana.ts) y la ficha. Cada una usa otra ventana: «sin derivar hoy», «captados de la semana por captured_at» o «histórico».
- **Por qué:** Cada rediseño sumó una vista (12/11, 13/11, 22/11) y ninguna retiró las anteriores. El principio de la skill («el contador y su lista comparten consulta») se cumple por indicador, pero no hay una pantalla que sea «la» lista. Además estado-corto (inicio.ts:83) da prioridad a attention_state=requiere_humano sobre captado, así que en «Para cerrar» muchos captados dicen «Espera a una persona» en vez de «Captado».
- **Evidencia:** Capturas 28__conversaciones (filas de «Para cerrar 19» rotuladas «Espera a una persona» y «Captado: falta derivar»), 14__contactos, 10__resultados, 09__resumen (17 menciones), 30__estadisticas. Supabase: 18 de 36 captados tienen attention_state=requiere_humano (Jur 12, Cob 1, 0 km 3, Mkt 2). «Esperan a una persona»: 15 en Estadísticas, 5 en Hoy, 3 en «Oportunidades reales» de Chats, 4 en Resultados.
- **Riesgo:** Mover pantallas rompe enlaces guardados: dejar redirecciones y respetar «nada de un perfil se ve desde otro» (`perfil` obligatorio en la lista).
- **Pasos:**
  1. Crear la pantalla única «Captados» por perfil, por ejemplo /captados?perfil=X (con atajo en Contactos > Etapas). Filtros: Para derivar (por defecto) · Esperan más de 24 h · Escribieron de nuevo · Con cita · Derivados · Prueba a revisar · Fuera de AMBA o ubicación sin confirmar · Todos. Columnas: nombre, cuándo captó, prueba (frase y hora con enlace al chat), llamada (sin horario / pidió horario / cita / hecha), zona, derivación y resultado, base u origen.
  2. Acciones en la fila, reusando `lista-en-lugar.tsx` (POST /api/oportunidades/:id): Derivar (con destinatario recordado), Registrar resultado (ResultadoPosteriorForm), «No pidió la llamada» (devuelve a Interesados con motivo), Chat y Ficha. Derivar sigue siendo manual (regla de negocio); «Compartir» no marca derivado.
  3. Que todos los contadores sean enlaces a esa lista con el filtro correspondiente (Resultados, Estadísticas, Resumen, Perfiles, Jarvis); retirar «Captados y casos» y «Lista» ocultas del menú (menu.ts:113-123 y 128) y dejar redirecciones.
  4. `estadoCorto` (inicio.ts:83): un captado muestra «Captado: falta derivar» y, aparte, un chip «Escribió de nuevo» si requiere_humano; no tapar uno con el otro.
  5. Probar con resumen-lista.test.ts y hoy-colas.test.ts que cada contador devuelve la misma cantidad que su lista, por rubro.
- **Archivos:** `src/lib/cartera.ts`, `src/lib/menu.ts`, `src/lib/indicadores.ts`, `src/lib/inicio.ts`, `src/app/contactos (pantalla Etapas)`, `src/app/oportunidades/page.tsx`, `src/app/resultados/page.tsx`, `src/app/(dashboard)/estadisticas/page.tsx`, `src/lib/resumen/filas.ts`, `src/components/resumen/lista-en-lugar.tsx`

### 6. «Hoy» de cada perfil: botones que solo recargan la página y cifras sin enlace

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 10
- **Cómo está hoy:** Bloques en el orden en que aparecen (hoy-bento.tsx y tablero-hoy.tsx): 1) banner global «Cambiá el código»; 2) franja de estado, con botón «Ver qué hacer» a /salud (funciona); 3) saludo de Jarvis con dos frases («N te esperan», «Hay N captados») y los botones «Ver N cosas para decidir» (ancla de scroll) y «Hablar con Jarvis» (abre Jarvis, funciona; hay otro botón igual arriba a la derecha y la burbuja flotante); 4) tarjeta de vidrio «Para decidir hoy: 3», decorativa (sin enlace), repite el número del botón; 5) atajos Chats, Contactos, Citas y Seguimiento (enlaces que duplican el menú lateral); 6) «Tu semana, en cajitas», cinco cajas sin enlace: Captados sin derivar (con anillo «Derivados»), Escribieron, Captados, Derivados, Contactados; 7) caja «La semana, paso a paso» con las mismas 4 cifras en barras; 8) «Para decidir» con filas Responder / Derivar / Revisar campaña / Revisar posible captación; 9) «Ver más» cerrado: chips de línea y campaña, motivos de paro (repite la franja), cola «Atención humana» y cola «Captados para derivar» (12 filas cada una), descartes con «Cerrar descartes» (único botón que ejecuta algo, POST /api/hoy/descartar) y «Qué está haciendo el bot»; 10) solo Marketing: «Los dos circuitos de Marketing» (informativo, estático); 11) frase final que remite a Resultados. `CeldaColor` ya admite `href` (vivo/bento-color.tsx:28-46) pero hoy-bento.tsx no lo pasa. Los botones de «Para decidir» llevan a `/hoy?perfil=X&todo=1#hoy-cola` o `#hoy-captados` (resumen-hoy.ts `hrefResponder`/`hrefDerivar`): recarga el servidor y abre «Ver más». El botón «Derivar» de cada fila abre la ficha (tablero-hoy.tsx `FilaTrabajo`), donde hay que tocar otro botón («Marcar como derivado») y completar el formulario. En /resumen sí se puede derivar en el lugar (lista-en-lugar.tsx:133), y en /hoy no.
- **Por qué:** El 22/11 se rehízo Hoy como bento «vistoso» y se dejó el tablero anterior detrás de «Ver más». Las cajitas y el vidrio se armaron para mostrar, no para llevar a una acción. La acción en el lugar se construyó para el Resumen y no se reutilizó. Por eso el dueño ve «ningún botón ni cartel funcional».
- **Evidencia:** Capturas 02__hoy (Marketing), 23__panel_juridico, 31__panel_agencia_0km y 37__panel_coberturas_medicas: en 1440×900 se ven banner, franja, saludo, tarjeta «3», atajos y el inicio de las cajitas; «Para decidir» y las colas quedan bajo el pliegue y las colas detrás de «Ver más». Textos de las capturas: «Responder a 5 personas / Responder», «Derivar a 19 captados / 15 esperan hace más de 24 horas / Derivar». Código: src/components/inicio/hoy-bento.tsx, tablero-hoy.tsx, src/lib/hoy/resumen-hoy.ts:67-85. Las portadas /panel/<rubro> son redirecciones a /hoy (src/app/panel/agencia_0km/page.tsx); src/app/panel/[slug]/page.tsx conserva un texto viejo («todavía no tiene su motor») que ya no corresponde.
- **Riesgo:** El rediseño visual general (punto 6) se está definiendo en paralelo: separar la estructura de Hoy (lo de acá) del estilo, para no rehacerlo dos veces. La muestra de diseño que pidió el dueño debería incluir este Hoy compacto.
- **Pasos:**
  1. Reemplazar el bento por «Hoy compacto» (hoy-compacto.tsx, servidor) con una isla de cliente `AccionesHoy` que reusa `lista-en-lugar.tsx` y /api/resumen/lista?perfil&clave. Cada tarjeta-acción muestra N, el verbo y un botón que hace algo en el lugar (ver propuestas).
  2. Eliminar: tarjeta de vidrio, atajos duplicados, cajitas grandes, barra «paso a paso», anillo, segundo botón Jarvis, «Qué está haciendo el bot» (queda en Bot IA/Salud), motivos de paro duplicados, frase final.
  3. Una sola fila de cifras (5 chips con enlace a la lista filtrada): Contactados · Escribieron · Interesados · Captados · Derivados, de la semana, desde `cifrasDePeriodo`.
  4. Conservar «Cerrar descartes» como una acción más. Corregir el texto fijo «Aceptó el siguiente paso» por la prueba real. Borrar el texto viejo de src/app/panel/[slug]/page.tsx (redirigir a /hoy?perfil=slug o 404).
  5. Actualizar tests/unitarias/hoy-resumen.test.ts y hoy-colas.test.ts, y agregar una prueba de que cada fila de «Para decidir» tiene `href` o `accion`.
- **Archivos:** `src/app/hoy/page.tsx`, `src/components/inicio/hoy-bento.tsx`, `src/components/inicio/tablero-hoy.tsx`, `src/lib/hoy/resumen-hoy.ts`, `src/lib/hoy/colas.ts`, `src/components/vivo/bento-color.tsx`, `src/components/resumen/lista-en-lugar.tsx`, `src/app/panel/[slug]/page.tsx`

### 7. Cifras que Hoy repite respecto de Resumen, Resultados y Estadísticas, y cifras que se contradicen

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 10
- **Cómo está hoy:** Matriz de repeticiones en Hoy (Jurídico, captura 23): «19 captados» aparece 4 veces en la misma pantalla (frase del saludo, fila «Derivar a 19 captados», celda «Captados sin derivar» y la cola «Captados para derivar»), más Estadísticas («Captados sin derivar 19») y Chats («Para cerrar 19»); «Derivados» 3 veces (anillo, celda, barra); «Contactados 318 / Escribieron 34 / Captados 4 / Derivados 0» dos veces (cajitas y barra «paso a paso») y otra vez íntegras en Resultados (el código dice «las mismas cuentas que Resultados», tablero-hoy.tsx: `cifrasDePeriodo`); «N esperan una respuesta» en el saludo, en «Para decidir», en la cola «Atención humana» y en la tarjeta de vidrio. Contradicciones: «Escribieron 4 de 0 contactados» (Coberturas, 37__panel_coberturas_medicas); «Escribieron 0» con «Una persona te espera» (Autos 0 km, 31__panel_agencia_0km); «Captados 4 de 34 que escribieron» mezcla captados de la semana con escribientes que pueden ser otros; «esperan a una persona» vale 5 en Hoy, 15 en Estadísticas, 3 en Chats y 4 en Resultados.
- **Por qué:** Cada bloque pide su propio dato y lo muestra con su propio rótulo; las definiciones de «esperan» y «oportunidad real» no son una sola. «Escribieron» cuenta personas con mensaje entrante en la semana sin exigir que hayan sido contactadas por campaña, y se las presenta como parte de «contactados».
- **Evidencia:** Capturas 02__hoy, 23__panel_juridico, 31, 37, 09__resumen, 10__resultados, 30__estadisticas. Código: periodos.ts:106-123 (`cifrasDePeriodo`), hoy-bento.tsx cajas y BarrasMini, resumen-hoy.ts.
- **Riesgo:** Cambiar la definición de «esperan» mueve cifras que el dueño ya vio; avisarlo en el informe de la entrega.
- **Pasos:**
  1. Regla de Hoy: cada cifra aparece una sola vez y es un enlace a su lista. Lo que quede fuera de Hoy está en Resultados.
  2. Una sola definición de «esperan a una persona» y de «interesado» (indicador `piden_persona`/`requiere_humano`, sin captados): que Hoy, Chats, Estadísticas y Resultados usen el mismo indicador y su misma lista.
  3. «Escribieron» pasa a mostrarse como «Respondieron a la campaña» (de contactados) o «Escribieron» (sin denominador); no mezclar los dos.
  4. Prueba automática de coherencia: contador y lista devuelven lo mismo por rubro (tests/unitarias/hoy-colas.test.ts).
- **Archivos:** `src/lib/hoy/periodos.ts`, `src/lib/indicadores.ts`, `src/lib/estadisticas-personas.ts`, `src/components/inicio/hoy-bento.tsx`, `src/lib/resumen/filas.ts`

### 8. Hoy tarda ~12 s en tres de los cuatro perfiles

- **Tipo:** velocidad · **Esfuerzo:** S · **Punto del pedido:** 6 (velocidad, aplicado a Hoy)
- **Cómo está hoy:** Del recorrido: /hoy de Marketing 11,8 s, panel Autos 0 km 12,3 s y Coberturas 12,4 s, contra 2,4 s Jurídico y ~2 s las demás pantallas (_rutas.json, n=2, 31 y 37). Hoy dispara unas 15 consultas por perfil (cifras, colas, campañas, agentes, salud) y consulta el estado de las líneas contra Meta con `consultarEstadosLineas(..., {memoria:true})` (tablero-hoy.tsx; estado-linea.ts:122 con timeout de 7 s). La «memoria» es un Map por instancia de la función (estado-linea.ts:90): en Vercel no se comparte entre invocaciones.
- **Por qué:** Causa probable, no medida: en los perfiles cuya línea de Meta tiene el token vencido o falla (Autos 0 km lo dice en la franja) la llamada espera su timeout de 7 s en cada carga, y la memoria por instancia no la evita. Jurídico usa líneas que responden rápido o en caché.
- **Evidencia:** tour2711/_rutas.json: n=2 (11823 ms), n=31 (12327 ms), n=37 (12443 ms), n=23 (2384 ms). Código en tablero-hoy.tsx y estado-linea.ts. La captura 31 muestra «el token de acceso de Meta no sirve (vencido o revocado)».
- **Riesgo:** Mostrar «sin comprobar» en vez de un dato fresco de la línea; la franja roja de Salud sigue avisando los problemas reales.
- **Pasos:**
  1. Medir antes de tocar (Vercel runtime logs o `Server-Timing`) para confirmar que es la llamada a Meta.
  2. Sacar la consulta a Meta del camino crítico: leer el estado de línea de la tabla de salud ya cacheada (`saludResumida`, unstable_cache de 60 s) o guardarlo con `unstable_cache` por clave de línea, con un tope de 1,5 s y «sin comprobar» si no responde.
  3. Con el Hoy compacto bajan las consultas (sin cajitas, sin colas completas): partir la página con Suspense para que las acciones salgan antes que las cifras.
  4. Verificar en Vercel que ningún perfil pase de 3 s.
- **Archivos:** `src/components/inicio/tablero-hoy.tsx`, `src/lib/whatsapp/estado-linea.ts`, `src/lib/salud/por-perfil.ts`, `src/app/hoy/page.tsx`

### 9. Operador y relectura: rutas manuales que cierran el círculo

- **Tipo:** riesgo · **Esfuerzo:** S · **Punto del pedido:** 8
- **Cómo está hoy:** Aunque el bot se corrija, hay dos entradas que pueden volver a ensuciar la lista: la acción «Es captado» de la ficha (ficha-actions.tsx:225-249) acepta cualquier nota y la relectura de limpieza `cambioPorAccion('captar')` (limpieza/servidor.ts:232) cambia el estado sin crear evento. «Posible captación a revisar» sí existe (reglas-comunes.md:70) pero hoy hay 0 posibles; el bot nunca las marca (en la base: 0 en los 4 perfiles) y todo lo dudoso se capta directamente.
- **Por qué:** La figura de duda existe en la interfaz pero el bot no la usa: o capta o no capta. Sin salida intermedia, lo dudoso termina captado.
- **Evidencia:** Supabase: posible_captacion=true en 0 oportunidades no captadas en los 4 rubros. Código en agent.ts (no hay llamada que setee `posible_captacion` desde el agente).
- **Riesgo:** Bajo.
- **Pasos:**
  1. Agregar la herramienta `registrar_interes` (el bot marca interés sin llamada: attention_state requiere_humano con motivo `pide_persona`, o posible_captacion con frase) para que lo dudoso tenga dónde ir.
  2. En la ficha, el texto del campo de captación cambia a «¿Qué pidió o aceptó? (idealmente pegá su mensaje)» y se guarda `basis='operador_sin_mensaje'` cuando no hay mensaje.
  3. Relectura: `captar` solo si `pidioLaLlamada` lo confirma; si no, queda «Posible captación a revisar».
- **Archivos:** `src/lib/ai-agent/agent.ts`, `src/lib/ai-agent/tools.ts`, `src/components/ficha/ficha-actions.tsx`, `src/lib/limpieza/servidor.ts`

## Propuestas

- **«Hoy» compacto: 3 a 5 acciones del día, cada una con un botón que hace algo en el lugar, y una sola fila de cifras** (M). Se queda con lo que lleva a una acción y saca el resto. Acciones (se ordenan por urgencia y desaparecen si valen 0): 1) Responder a N: abre el primer chat de la cola ordenada por interés, con «Ver los N» en un panel. 2) Derivar N captados (M esperan más de 24 h): panel en el lugar con «Marcar derivado» por fila y destinatario recordado, reusando lista-en-lugar.tsx. 3) Revisar N posibles captaciones o pruebas: «Es captado / No lo es» en el lugar. 4) Citas de hoy: «Abrir chat» y «Se hizo / No se hizo». 5) Resolver línea o campaña: solo si está en rojo, con botón a Salud. Debajo, una fila de 5 chips con enlace (Contactados, Escribieron, Interesados, Captados, Derivados de la semana). Se van la tarjeta de vidrio, los atajos duplicados, las cajitas, la barra «paso a paso», el anillo y las colas duplicadas. Además baja la carga y el tiempo de Hoy.
- **Lista única «Captados» por perfil con prueba, estado de la llamada y acciones** (L). Reemplaza las 13 pantallas. Filtros: Para derivar, Esperan más de 24 h, Escribieron de nuevo, Con cita, Derivados, Prueba a revisar, Fuera de AMBA. Cada fila muestra la frase que lo prueba con enlace al mensaje, el horario pedido, la cita, el estado de la llamada y las acciones Derivar, Registrar resultado, «No pidió la llamada», Chat y Ficha. Sale de una vista SQL única (`captados_vista`) para que contador y lista coincidan.
- **Derivar con un toque: resumen listo para pasar al profesional** (S). Hoy derivar son tres pasos (Hoy, ficha, formulario) y compartir no marca derivado. Un botón «Copiar resumen / Abrir WhatsApp» arma el texto con nombre, motivo, horario pedido y la frase de prueba, sin marcar derivado; después «Marcar derivado» en el lugar. Reduce el tiempo de espera de los captados (hoy 24 de 36 esperan más de 24 h) sin enviar nada solo.
- **Alarma de calidad de captación y regresiones** (S). Indicador semanal en Salud: captados sin llamada registrada a las 48 h, captados que escribieron de nuevo y tasa captado a contactado por el profesional. Más una prueba automática que falla si aparece un captado sin `call_message_id` o sin base explícita. Hace que la regla se cumpla en el código, como pidió el dueño, y no solo en el prompt.
- **Estado de la llamada como semáforo en cada captado** (S). Hoy la ficha no dice si la llamada se pidió, se agendó o se hizo. Con una pura `estadoLlamada` (sin horario, pidió horario, cita agendada, llamada hecha) la persona que deriva ve qué hay que hacer y el dueño ve cuántas llamadas pedidas quedaron sin hacer.

## Preguntas para el dueño

- Marketing: hoy «pide presupuesto» y «presupuesto aprobado» cuentan como captado (decisión del 16/10, en las reglas y en el panel). ¿Qué hacemos? A) Solo cuenta como captado si pide una reunión o llamada; pedir presupuesto queda como «Interesado / Pide presupuesto». B) Se mantiene como está (presupuesto = captado). C) Captado si pide reunión o llamada, y el presupuesto se muestra como un estado aparte dentro de la lista.
- Autos 0 km y Coberturas: ¿«pidió la llamada» incluye que acepte que lo contacte un vendedor o asesor por WhatsApp, sin pedir una llamada telefónica? A) Sí, cualquier contacto de una persona que él acepta. B) Solo llamada telefónica. Hoy los 4 captados de Autos 0 km aceptaron contacto de un vendedor y ninguno nombró una llamada.
- Los 36 captados actuales: ¿cómo se reclasifican? A) Automático con la relectura del bot y botón «Deshacer» por fila (recomendado). B) El bot propone y vos confirmás fila por fila. Los 7 ya derivados (Jurídico 2, Marketing 5) se dejan como están y se marcan para revisar.
- ¿Te sirve el nombre «Interesados» para los que muestran interés o piden hablar pero todavía no pidieron la llamada? (Reemplaza a «Oportunidades reales»; no se crea un estado nuevo en la base.)
- ¿Querés que la lista única «Captados» quede dentro de Contactos (junto a Etapas) o como una sección propia en el menú de cada perfil?

## Herramientas usadas

- Skill kocos-crm-reglas-de-captacion: procedimiento de la skill (reglas, derivar indicadores y listados de la misma definición, pruebas de regresión) y referencia reglas-comunes.md secciones 3 a 7.
- Graphify: `graphify explain "registrarCaptacion" --graph cerebro/mapa-codigo/graph.json` para ubicar la función, sus llamadores y su prueba de integración; el resto fue lectura directa de código.
- Supabase MCP (mcp__Supabase__execute_sql, proyecto enhgkeqiqcuwafsedaza): solo SELECT de esquema (information_schema) y agregados (count, filter, group by) por rubro; no se leyeron nombres, teléfonos ni textos de mensajes de prospectos (la regex sobre mensajes y evidencias devolvió solo cantidades).
- Capturas y textos del recorrido en /tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/tour2711 (02__hoy, 23__panel_juridico, 31__panel_agencia_0km, 37__panel_coberturas_medicas, 43__panel_marketing, 09__resumen, 10__resultados, 14__contactos, 28__conversaciones, 30__estadisticas y _rutas.json). El recorrido ya traía _rutas.json y _errores.txt (404 de /jarvis, /chats, /citas, /mas, /piezas y /meta).
- Lectura directa de cerebro/00-arranque-para-agentes.md, 02-ordenes-vigentes.md (órdenes del 27/11), 03-crm-y-bots.md y 15-hallazgos-21-11.md.
- No usé subagentes ni skills de diseño en esta pasada: el análisis fue de código, base y capturas, y no los necesitaba.
