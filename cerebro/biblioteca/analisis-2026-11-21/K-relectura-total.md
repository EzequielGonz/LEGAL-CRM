# K · Relectura total contra el cerebro (21/11/2026, solo lectura)

Qué es esto: comparé lo que dicen las fuentes con lo que dicen `cerebro/README.md`, `02-ordenes-vigentes.md`, `12-preguntas-para-entender.md` y el resto de los archivos 01 a 14. Manda lo que el dueño contestó el 21/11 (bloques A a J de `02` y `12`). Cowork es historia (muestra hacia dónde se apuntaba); Code es lo vigente.

Marcas de fuente que uso en cada ítem:

- **[crudo]**: lo vi yo en los eventos de la sesión de Code (`list_events`) o en un archivo crudo.
- **[volcado]**: sale del volcado que hizo otra sesión en `cerebro/chats/*code*.md` y que yo no pude comprobar en el crudo.
- **[código]** y **[doc]**: lo leí en `/home/user/LEGAL-CRM` (`src/`, `docs/`, `.claude/referencias/`, `.ai-context/`) o en los clones de las landings (`origin/main`).
- **[biblioteca]**: documentos de Cowork en `cerebro-privado/biblioteca/`.

No copié claves, tokens, el código del panel ni datos de prospectos. No toqué el repo.

---

## 0. Alcance real de la relectura (leer antes de confiar en el resto)

**No llegué al principio de las sesiones de Code salvo en una.** Cada página de `list_events` (kinds `user` y `result`, límite 100) cubre apenas unos minutos de la sesión, porque casi todo son resultados de herramientas. Con 276 páginas solo en la sesión «Contexto del proyecto» (7.499 eventos, según su volcado), el costo en contexto era inviable. Lo que sí hice:

| Sesión | Páginas leídas en crudo | Tramo cubierto | Estado |
| --- | --- | --- | --- |
| Panel Jurídico (`…iyC2tDGbRPYKqpwJN`) | 3, hasta `has_more` falso | **completa**: 19/11 22:53 al 21/11 | leída entera |
| Contexto completo del proyecto (`…jPcDVSYDvLxSq9yna`) | 3 | 20/11 08:27 a 21/11 05:57 (Word de 39 páginas, repos) | parcial |
| Contexto del proyecto (`…jHoiZTXHqrkcEnPGW`) | 4 | 18/11 06:56 a 21/11 (reconexión de Metricool, 44 de 44 reprogramadas) | parcial (~1 % de las páginas) |
| Perfiles redes sociales VITA (`…ii3hdhmn8zyaCJffr`) | 4 | 20/11 14:00 a 21/11 | parcial |
| Traspaso Legal CRM (`…ko39B7TMetzSucFNJ`) | 4 | 15/11 08:45 a 08:56 y la cola del 21/11 | parcial (~5 %) |
| Metricool context (`…j5dyMXat2HmKarMfG`) | 2 (llegaron en línea) | 21/11 05:56 a 06:09 | parcial; no seguí: cada página volcaba decenas de miles de caracteres de subagentes y gastaba el contexto |

Para el resto de esas sesiones usé sus 5 volcados (`cerebro/chats/2026-11-*-code-*.md`), que dicen haber paginado completo. Los contrasté con lo que vi en crudo y coinciden (mensaje inicial del 19/11, «ya volví a conectarlo en Metricool» del 18/11, «DAME TODOS LOS REPOSITORIOS» del 20/11, los cortes por crédito). **Lo marcado [volcado] queda sin verificar en crudo.** De Metricool context no hay volcado: solo vi su cola.

Fuentes que sí leí completas o casi: los 6 archivos que pidieron (cerebro 01 a 14, README, bitácora, traspasos), los volcados de Code, los de Claude común y Cowork (secciones de órdenes, datos, pendientes y preguntas), `reglas-comunes.md`, `CONTEXTO_ACTUAL_CRM.md` (parcial), `docs/mejoras-1411/CIERRE-AL-CAPTAR-1511.md`, `docs/verificar-numero`, `.ai-context/handoff.md`, la biblioteca de Cowork (`SCRAPER_Y_BUGS`, `RETOMAR_LANDINGS_Y_T7`), el mapa de páginas, rutas y reglas del código, y los 31 chats de la exportación de Claude común (los 8 del proyecto más 11 sin texto, solo con imágenes; los demás son de AutosMix, física y otros temas).

Aviso: durante la relectura el cerebro cambió (apareció `14-estilo-del-dueno.md`, se ampliaron `02` y `08`). Comparé contra la versión de las 09:49.

---

## 1. Datos, decisiones y órdenes que el cerebro NO tiene

| # | Fecha | Qué | Fuente |
| --- | --- | --- | --- |
| 1 | 20/11 07:23 | **El dueño dejó activado el pase automático a créditos pagos de Claude**: «dale, te dejo activado que se pase a créditos automáticamente, cuando detectes eso, frena, deja un checkpoint y programa para cuando se reestablezca el límite». Es una autorización condicional. Después hubo cortes: límite de 5 h el 20/11 (reinicio 13:50 UTC) y «Usage credits ran out» el 21/11 05:57 UTC | [volcado] Perfiles VITA §3 y Contexto del proyecto §3; los cortes los vi en crudo |
| 2 | 20/11 a 21/11 | Costo acumulado de las sesiones según sus metadatos (no es factura): Traspaso Legal CRM ~USD 238, Metricool context ~USD 218, Contexto completo ~USD 30 a 34. El volcado de Traspaso dice que «no consta autorización expresa» para ese uso extra | [crudo] metadatos de los resultados; [volcado] Traspaso §12 |
| 3 | 08/11 04:20 a 06:59 | **Caída del panel por pago de Vercel**: «Revisa el crm por favor, está caído» → `DEPLOYMENT_DISABLED` (plan Hobby, pago pendiente) → «ya pagué la suscripción» (06:58) → panel de vuelta. El plan figura como Hobby (1 h de logs, 60 s por función). El 09/11 08:43 el dueño hizo a mano un «deploy to production» desde Vercel. El 10/11 se pidió «Protection Bypass for Automation» para la Preview (sin confirmar) | [volcado] Contexto del proyecto §3 y §5.1 |
| 4 | 20/11 06:00 | Orden textual: «todas las piezas… reversionalas tomando la base y cambiando algunas cosas **así meta no nos detecta que son publicaciones duplicadas**… subí aún más el volumen». El cerebro (`02` línea 149) la reemplazó por «cambios reales, no trucos anti-duplicado» sin que conste que el dueño lo haya dicho (ver parte 2) | [volcado] Perfiles VITA §3 y §12 |
| 5 | 09/11 | Objetivos de alcance en Instagram **al tercer mes**: VITA 6.000, Coberturas 3.500, Autos 0 km 3.000, Marketing 3.500. Distintos de las metas al 21/12 de `01` | [volcado] Contexto del proyecto §5.3 («no verificado por mí» según el propio volcado) |
| 6 | 20/11 04:30 | Flujo en dos pasos del dueño: «Paso 1, boceto de UN solo perfil, VITA… Paso 2, cuando te diga “aprobado”: ejecutá todo sin volver a preguntar». El 05:41 («listo, todo eso publicalo y programalo en metricool, pero que sea del 20/11») se tomó como el «aprobado» aunque no usó la palabra. El cerebro tiene el flujo del 21/11 pero no esta excepción | [volcado] Perfiles VITA §3 |
| 7 | 19/11 | En la misma orden del rediseño del panel: «Incidencias dejarlo tal cual», «Contactos dejarla tal como está» (`02` solo recoge Contactos), «Campañas dejarla tal como está». Y: «si querés luego de agregar mis correcciones, podés entrar a mi Chrome… cuando los tengas me los comentás y **yo te doy el ok para que arranques a re-diseñar**». El rediseño visual completo sigue esperando ese ok y no hay navegador conectado para revisarlo (el conector respondió «Browser not connected») | [crudo] PJ (mensaje inicial); [volcado] Rediseño §3 y §8 |
| 8 | 19/11 | Efectos colaterales conocidos de esos ajustes: al sacar «También hoy» desaparecen los accesos a Citas próximas, Derivados sin resultado y «El bot se trabó». Archivar un captado solo lo oculta de las listas de trabajo: sigue contando en métricas y Resultados. Agenda y conteos de la semana no excluyen archivados | [volcado] Rediseño §8 y §12 |
| 9 | 20/11 08:05 a 08:12 | En el chat «Pedido de asistente IA»: el dueño pidió charlas guardadas en asistente y Laboratorio y un Laboratorio más sencillo; 3 minutos después: «**NO TOQUES NI ALTERES NADA DE LO QUE YA EXISTE**… eso sí hacelo todo, pero lo demás no toques nada». El rediseño del Laboratorio quedó afuera. También: «las skills asignadas solo por las reglas no, todas todas, incluso propone nuevas… las reglas viejas olvidalas» | [volcado] Claude común, Pedido de asistente IA §3 y §4 |
| 10 | 15/11 04:45 | Resultado de las «tres propuestas» y del cierre por rubro al captar: en 45 días hubo 26 captaciones con chat y en **20 no salió cierre del bot** (Jurídico 13 de 13, Coberturas 2 de 2, Autos 2 de 4, Marketing 3 de 7). Está implementado y probado (5 pruebas, `cierre-captacion.ts`), «habilitado con el bot encendido, en la próxima captación»; nadie lo vio todavía en una charla real | [doc] `docs/mejoras-1411/CIERRE-AL-CAPTAR-1511.md` |
| 11 | 15/11 | Decisión sobre «¿de dónde sacaron mi número?»: el dueño respondió «acá se respeta como está armado hoy» frente a la propuesta de registrar el origen de cada base y que lo revise un abogado de datos personales. La revisión legal quedó abierta. `reglas-comunes` §6 dice además que «el origen lo atiende el equipo de marketing»; el cerebro dice «no tenemos el registro» | [volcado] Contexto del proyecto §10.5; [doc] reglas-comunes §6 |
| 12 | 14/11 07:17 | Para las fichas del bot el dueño dijo: «ya está todo hecho en las indicaciones de los agentes… no lo viste?» (Autos: marcas, formas de pago y requisitos; Jurídico: si la primera revisión tiene costo; Coberturas: zonas; Marketing: qué incluye la propuesta inicial). **Los valores no están en ninguna fuente que pude leer** | [volcado] Traspaso §3 y §7 |
| 13 | 13/11 | Reconocimiento de las 67 conversaciones «quedaron sin respuesta»: ninguna había concretado llamada; en Marketing 61 eran contestadores automáticos de otros negocios y pasaron a Perdidos | [volcado] Contexto del proyecto §5.6 |
| 14 | 14/11 | Primera tanda real de seguimiento: vencieron 2 seguimientos de Jurídico, el bot decidió no insistir y pasaron a Caídos; quedaron 11 programados para el 16/11 (10 de Jurídico, 1 de Coberturas), que son los que cayeron en «conflicto» | [volcado] Contexto del proyecto §5.6 |
| 15 | 15/11 | Decisión pendiente sobre la pantalla Redes del panel: Facebook y WhatsApp **no se editan** porque si el campo queda vacío al guardar pisa lo que hay en Meta | [volcado] Traspaso §6 y §8 |
| 16 | 17/11 04:34 a 05:58 | Cuando pidió las 6 líneas, el dueño descartó el celular físico («la del teléfono fijo no es opción»), dijo que Wasender «todo el tiempo se desconecta» y defendió que el algoritmo de 20 por día evita el bloqueo (Claude opinó lo contrario; el desacuerdo quedó sin resolver). BlueStacks falló porque WhatsApp exige detectar el SMS automáticamente. Hoy cambió el cuadro: son 13 chips (`02`, bloques D y E) | [volcado] Claude común, Alternativas a la API de Meta §3, §4 y §8 |
| 17 | 22/10 | Quedaron «pendientes ajenos»: aprobación en Meta de `form_recibido_autos` y `form_recibido_cob`, y faltan `FACEBOOK_<ÁREA>_PAGE_ACCESS_TOKEN` en Vercel para Coberturas, Autos y Marketing | [biblioteca] `RETOMAR_LANDINGS_Y_T7.md` |
| 18 | 24/10 | Cowork dejó abiertos: 225 incidencias viejas pendientes desde el 09/10; la base «ART GRAVES» cargada tres veces y «LEVES» sin usar | [volcado] Cowork bot-detención §8 |
| 19 | 24/10 | Hallazgos del scraper de Marketing: dos herramientas con reglas distintas («Extraer negocios» y la pestaña «Análisis/Barrido»); el 22/10 el barrido armó 41 bases chicas; el tope «disponibles hoy» se cuenta con medianoche UTC (reinicia a las 21:00 AR); «Ejecutar base» usa `kocos_primer_contacto_v2` porque la apertura aprobada `mkt_apertura_propuesta` no está asignada a la línea | [biblioteca] `SCRAPER_Y_BUGS_24-10.md` |
| 20 | 21/11 06:08 | Estado de Metricool context al cortar: 14 reels programados para el 21/11 (VITA 08:50, 10:30, 13:50; Coberturas igual; Autos igual; Kocos 10:30, 13:50, 16:30, 19:20, 20:50), commit `632dec7` en el PR #77, retoma programada a las 10:23 UTC (7:23 en Buenos Aires). El límite de 5 h se reinicia a las 10:20 UTC | [crudo] Metricool context, cola |
| 21 | 20/11 a 21/11 | Un hook (`cache-guard`, umbral 100.000 tokens) **bloquea el primer mensaje tras 5 minutos de inactividad** y propone mandar `handoff` o repetir el mensaje en 2 minutos. Cuesta unas 12 veces menos con la caché tibia. Sirve para el cuidado de créditos | [crudo] resultados de Panel Jurídico, Contexto completo y Metricool |
| 22 | 20/10 (Cowork) | Orden de «cargar en el panel las cuatro frases identificadoras “desde la web de…” como textos con fuente Landing». No hay constancia de que se hiciera (ver parte 2, ítem 5) | [volcado] Cowork landings §8 |
| 23 | 17/10 | Cowork acordó una regla de modelos por tarea (Haiku para correr y reportar, Sonnet medio para código, Opus solo para juicio visual). Hoy rige «Opus 5.5 esfuerzo medio» (traspaso b). Es historia, pero convive con la orden del 13/11 08:12 («mantené el modelo fable solo para tareas muy sencillas») | [volcado] Cowork Simple/Avanzado §2.3; Contexto del proyecto §3 |

---

## 2. Datos que el cerebro tiene mal o desactualizados

| # | Archivo y línea | Dice | Corrección | Fuente |
| --- | --- | --- | --- | --- |
| 1 | `02` línea 10 | «Recomendación vigente: dejar desactivado el pase automático a créditos pagos» | El 20/11 07:23 el dueño lo dejó **activado** con freno y checkpoint (parte 1, ítem 1). Hay que reescribirlo como orden vigente condicional y fijar el alcance (tope, hasta cuándo) | [volcado] |
| 2 | `02` línea 149 | «Versiones B y R con cambios reales… no trucos anti-duplicado» como orden del 20/11 | La orden textual del dueño fue la contraria (reversionar para que Meta no detecte duplicados). La regla de variantes reales es una interpretación de Claude (volcado de Perfiles VITA, CONTRADICE 2; `13` hallazgo 8). `14` ya lo marca «a definir»; `02` no | [volcado] |
| 3 | `05` tabla «WhatsApp con mensaje prellenado» | Las 4 landings mandan una **frase fija** («desde la web de …») que el CRM reconoce como fuente Landing | En `origin/main` de las 4 landings **no existe** esa frase. VITA manda «Hola VITA Abogados, quiero hacer una consulta sobre mi caso.» y Marketing «Hola, quiero consultar por un proyecto para mi marca.». La fuente «Landing» del CRM depende de un texto configurado por perfil (`src/lib/fuente.ts`) que no coincide. Además, la frase de Autos dice «Agencia Kocos», contra la orden del 20/11 | [código] landings y `fuente.ts` |
| 4 | `06` «Notas Next 15» | «llamadas largas a Gemini en segundo plano (`after`)» | Solo el Laboratorio y los informes del bot usan `after()`. El turno del bot se **espera dentro del webhook** (`await runAgentTurn(...)` en `inbound.ts`, `maxDuration` 60 s) | [código] |
| 5 | `03` «Las 6 líneas (pedido 17/11, sin resolver)» y tabla de líneas | Quiere 6 líneas sin 6 teléfonos; las 3 de Wasender desconectadas; línea PENAL «inactiva» | El 21/11 el dueño dijo que tiene varios teléfonos y esta semana suma 13 chips (4 VITA, 4 Marketing, 3 Coberturas, 2 0 km), y que **Penal se unifica con Civil**. La sección vieja ya no describe el plan; la fila PENAL debería dejar de ofrecerse | `02` bloques D y E |
| 6 | `03` y `07` | «No hay pausa general» | Cierto en la base el 20/11, pero el **código la conserva y falla cerrado**: si falta la fila `automation_pause` o no se puede leer, el bot no contesta y no sale nada, sin aviso. «Sin pausa» depende de que esa fila exista con ambos valores en `false` | [código] `automation-pause.ts` |
| 7 | `02` «Cada rubro separado» | Se presenta como regla cumplida | Es separación de **interfaz** (URL, cookie, filtros por `rubro_id`). Con un solo PIN, cualquier sesión puede operar por API sobre cualquier campaña, chat o línea. El volcado de Traspaso dice que el 13/11 se recorrieron 440 pantallas sin salirse de su perfil, pero eso mide navegación, no permisos | [código]; [volcado] |
| 8 | `07` y `08` | «Campaña Graves 1911 en curso, 0 envíos»; «6 avisos sin destinatario»; «10 seguimientos en conflicto»; «calendario vacío desde el 25/11» | El informe D del 21/11 (que no verifiqué) dice: terminó 182/182; 30 avisos sin destinatario; 13 conflictos; VITA, Coberturas y Autos tienen 13 piezas por día del 25 al 29/11 (0 reels). Hay que re-comprobar antes de usar `07` | informe D |
| 9 | `06` | «LEGAL-CRM tiene 88 ramas… 6 con trabajo propio»; main `36f742b`; «77 operaciones del asistente» | El informe F cuenta 93 ramas (9 con trabajo propio) y 80 PR; `main` está en `66c457b` (solo documentos); el catálogo del asistente tiene 79 operaciones. El PR #80 está invertido (main hacia happy-wozniak) | informes A y F |
| 10 | `02` fila «14/11 Se trabaja con el modelo principal; otro modelo solo para tareas secundarias» | Fecha 14/11 | La orden textual es del **13/11 08:12** («mantené el modelo fable, solo para tareas muy muy pero muy sencillas»), junto con «si la tarea no se termina en la sesión de 8:51, programá otra 6 hs después» | [volcado] Contexto del proyecto §3 |
| 11 | `02` y `08` (P1-23) | Código de ingreso «de 6 en uso; 8 pendiente» | El volcado de Traspaso dice que el PIN de 8 dígitos y el aviso por código anterior ya se publicaron el 15/11 (`aviso-codigo-anterior.tsx`). El dueño pidió dejar el actual; falta saber cuál de los dos está activo | [volcado] Traspaso §5 |
| 12 | `CLAUDE.md`, `01`, `02`, `03`, `08`, `09`, `10`, `11` | «la responsable» | Orden del 21/11: en textos nuevos usar «el dueño» o «los dueños». Quedan muchas menciones viejas (y los subagentes de Traspaso escribían «la dueña») | `02` bloque B |
| 13 | `03` «Bots» | «Modelo principal: Gemini 3.8 Flash» | El código tiene tres proveedores: `gemini_api` (en vivo), `vertex` (modelo ajustado) y `simulado` | [código] `agentes/modelo.ts` |
| 14 | `10` fila 14 (nombre de la agencia «abierto: preguntar») | Marcada abierta | Resuelta el 20/11 (Kocos Marketing). Queda sin aclarar qué pasa con `@orvianmkt`, el Instagram que el chat del 05/11 usó como «perfil de la agencia» (ver parte 5) | `02`; Claude común ORVIAN |

---

## 3. Tareas pedidas o prometidas que quedaron sin hacer

| # | Fecha | Pedido o promesa | Estado | Fuente |
| --- | --- | --- | --- | --- |
| 1 | 15/11 08:44 | Otros proveedores de IA «con un enlace»; el dueño dijo antes «por ahora Gemini» | no implementado | [volcado] Traspaso §5 |
| 2 | 14/11 y 15/11 | Archivar unas 30 variantes malas de Marketing y corregir el generador `plantillas-frias.mjs` | no consta | [volcado] Traspaso §5 y §8 |
| 3 | 15/11 | Pendientes del bloque 1 de bots: espera de Gemini con atención humana si falla, `rescate.ts` con turnos de error, antirráfagas, alinear `probar-real.ts` con el bot en vivo | no consta que se hayan terminado | [volcado] Traspaso §8 |
| 4 | 14/11 | Ver al bot contestar un **audio real**; ningún audio entrante llegó tras encender la función | pendiente | [volcado] Traspaso §5 |
| 5 | 13/11 | Avisos de fallas a dispositivos: 0 dispositivos activados. Hoy el dueño dice que no se avisa a nadie; la alarma `sin_destinatario` sigue acumulando | decisión pendiente (no configurar) | [volcado]; `02` bloque A |
| 6 | 13/11 | «Sin probar con datos reales»: guardar horarios de agenda, quitar un teléfono de avisos, llegada de un aviso de falla, dos latidos a la vez | pendiente | [volcado] Traspaso §8 |
| 7 | 20/11 05:52 y 05:59 | «¿Cuántos reels y publicaciones programaste por rubro?» y el cronograma resultante en Excel por rubro y día | no consta (el cerebro lo tiene en P2-17) | [volcado] Perfiles VITA §8 |
| 8 | 20/11 05:45 y 05:47 | Revisar errores tipográficos y de edición de **cada** pieza antes de programar; hay 34 historias con solo el título del tema | pendiente de producción | [volcado] Perfiles VITA §8 |
| 9 | 20/11 | Resumen en un solo prompt y archivos en Word para Cowork | no consta | [volcado] Perfiles VITA §8 |
| 10 | 21/11 11:30 (pieza) | La historia de Coberturas afirma que la Corte declaró inconstitucional la liberación de precios de prepagas el 20/11, con fuente de prensa, **sin verificación**. Hay que comprobarla (MCP JurisprudenciaARG) antes de que salga | pendiente | [volcado] Perfiles VITA §12.6 |
| 11 | 17/11 08:27 y 08:59 | «Eliminaste el número principal vinculado a Meta, volvé a agregarlo… hay que separar Wasender de Meta». La separación se hizo el 17/11; el estado de la línea principal de Marketing (sin acceso al número) sigue abierto | parcial | [doc] `.ai-context/handoff.md`; [volcado] |
| 12 | 15/11 | Cancelar o no las 5 tareas de seguimiento de personas ya en Perdidos antes del 16/11 08:05 | sin respuesta en el chat | [volcado] Contexto del proyecto §8.5 |
| 13 | 15/11 | Lanzar con 20 por día y revisar una semana antes de subir; ¿ya se aplicó? Hay campañas de Wasender sin línea conectada | sin confirmar | [volcado] |
| 14 | 19/11 | Rediseño visual del resto del panel: espera el ok del dueño y la revisión en su Chrome | bloqueado | [volcado] Rediseño §8 |
| 15 | 20/10 (Cowork) | Resend: cuenta, dominio verificado, `RESEND_API_KEY` y `LANDING_EMAIL_FROM`; GA4: marcar `clic_whatsapp` y `formulario_enviado` como eventos clave; cargar las frases «Landing» en el panel | pendiente | [volcado] Cowork landings §8 |
| 16 | 20/10 y 22/10 | Meta: aprobar `form_recibido_autos` y `form_recibido_cob`; tokens de páginas de Facebook para tres rubros | sin dato | [biblioteca] |
| 17 | 24/10 | Limpiar las 225 incidencias viejas y la base «ART GRAVES» triplicada | sin dato | [volcado] Cowork |
| 18 | 20/11 | Retomar la producción de los reels 21 a 29/11 con la tarea programada de las 10:23 UTC (el dueño dejó solo esa; borró el entrenamiento diario y los recordatorios, `02`) | en curso, no confirmado | [crudo] cola de Metricool context; `02` |
| 19 | 21/11 | Propuesta del «cerebro dentro del panel» (bandeja, aprendizaje desde el panel): está en `02` y `08`, sin etapas aprobadas | propuesta sin autorización | `02`, `08` |
| 20 | 08/11 | Revisión visual de las landings en un celular real (pedida desde el 01/11) y rediseño con «efecto wow» (09/11): no consta cierre | abierto | [volcado] Contexto del proyecto §8.11 |

---

## 4. Funciones del panel que se construyeron y el cerebro no menciona

Verifiqué cada una buscando el término en `cerebro/0*.md`, `1*.md` y `README.md` (0 coincidencias) y leyendo su código o documento.

| # | Función | Qué hace | Dónde |
| --- | --- | --- | --- |
| 1 | **Formulario de landing → WhatsApp automático a los 5 minutos** (21/10) | El latido escribe por WhatsApp con la plantilla aprobada `form_recibido_<rubro>` a quien dejó el formulario (ventana de 48 h, una sola vez, respeta pausa y detenciones); cuando responde sigue el bot del perfil. El cerebro solo cuenta «formulario → CRM» y el correo de Resend | `src/lib/landing-seguimiento.ts` |
| 2 | **Verificar el número en Meta desde el panel** (19/10) | En Configuración › Líneas, botón «Verificar el número en Meta»: lista los números de la cuenta, pide código por SMS o llamada, lo confirma y registra con PIN de 6 dígitos. Es la herramienta pensada para la línea de **Marketing «Sin acceso al número»** y no está en el pendiente 3b | `docs/verificar-numero/ENTREGA.md`, `api/lineas/numero` |
| 3 | **Menú del perfil a medida** (13/11) | Cada perfil puede renombrar, ocultar y reordenar secciones y pestañas sin tocar código; cada cambio queda en `ops_change_log` y se puede deshacer. El asistente puede proponerlo | `lib/personalizacion/*` |
| 4 | **Limpieza de lo ya cargado y pantalla «Movidos en la limpieza»** (13/11) | Releyó los chats mal ubicados y los movió con motivo escrito, sin borrar ni mandar mensajes, con deshacer uno por uno (`limpieza_movimientos`) | `lib/limpieza/*`, `/limpieza` |
| 5 | **Pantalla `/contenido`**: brief de marca, piezas, política por perfil y canal, cola de publicación (el cerebro solo nombra «política de contenido y cola» dentro de Redes y no habla del brief ni de la pantalla) | La publicación sale por Metricool solo si `tareas_servidor.contenido` está encendido (hoy apagado). Incluye calendario (`/api/calendario`) | `/contenido`, `lib/contenido/*` |
| 6 | **Auditoría de landings** | Descarga una página pública del propio sitio y revisa título, H1, canonical, alt, WhatsApp visible, formularios y HTTPS; guarda en `landing_audits`. Solo lectura | `lib/seo/auditoria.ts` |
| 7 | **Search Console por API con OAuth**, preparada y sin conectar | Funciona con `GSC_*` y `SEARCH_CONSOLE_ENABLED=true` cargadas en Vercel; tokens cifrados en `search_console_connections`. Es el camino técnico para el acceso que el dueño dio como «sí, más adelante» | `lib/seo/search-console.ts` |
| 8 | **Código de la Fase 3 que sigue en el repo** | Proveedor Vertex AI para modelos ajustados (`tuning_jobs`, `training_sets`), corpus real, comparación de agentes A/B/C (`agent_experiments`), simulador y evaluación (`eval_cases`, `eval_results`, `simulation_runs`). El cerebro dice «Fase 3 descartada» y solo lista las tablas | `lib/agentes/vertex.ts`, `lib/experimento/*` |
| 9 | **Marketing: prospección automática y exportación** | `auto-outreach`, cola de scraping y exportación de cada extracción, presupuestos programados, `venta.ts` (aceptación, «solo precio») | `lib/marketing/*`, `api/marketing/*` |
| 10 | **Web Push propio (VAPID)** para avisos a dispositivos, con suscripción, estado y prueba | el cerebro dice «avisos a dispositivos» pero no el mecanismo ni las variables | `lib/webpush.ts`, `api/push/*` |
| 11 | **Excepciones de calendario** que solo restringen horarios de la empresa y reagendamiento único de una cita incumplida (una hora después del inicio) | `contact_calendar_exceptions`, `cita_tareas` | `lib/contacto/*`, `lib/citas/*`; reglas-comunes §5 |
| 12 | **Devolver al bot desde la ficha**: si había un mensaje sin respuesta en las últimas 23 h, el bot lo contesta en ese momento | | reglas-comunes §5 |
| 13 | **Pantallas de Redes que el cerebro no detalla**: `/redes/perfiles`, `/redes/plantillas`, `/redes/publicidad` (apagada), `/redes/whatsapp` y enlace de Instagram (el cerebro solo describe Redes en general) | | mapa de páginas (informe A) |
| 14 | **Reglas de números de otros países**: sin contacto automático hasta configurar su zona horaria | | reglas-comunes §4 |
| 15 | **Llaves de `system_settings` no listadas** en `07`: `avisos_meta`, `calidad_lineas`, `catalogo_auto_sync`, `limites_outscraper`, `evaluacion_plantillas`, `agente_ganador`, `corpus_desde` | | informe A §6 |

---

## 5. Preguntas que no tienen respuesta en ninguna fuente

1. **Plan de Vercel del panel.** El 08/11 el dueño «pagó la suscripción» tras `DEPLOYMENT_DISABLED`, pero el panel figura en plan Hobby, que no permite uso comercial y limita funciones a 60 s (el latido usa 55). ¿Qué plan es hoy y quién lo paga?
2. **Alcance del pase automático a créditos (20/11).** ¿Hay un tope mensual? ¿Hasta cuándo rige? ¿Cuenta como «autorización expresa» el uso extra ya gastado (~USD 238 en una sesión)? Choca con «no se paga nada sin autorización expresa».
3. **Reversionar contra la detección de duplicados.** ¿Rige la orden textual del 20/11 06:00 o la regla de variantes reales que anotó Claude?
4. **«Patentamientos nada» y «aumento de prepagas nada» (20/11 06:06).** `02` dice que «¿Contado, prendario o plan?» y «¿Pagás por cosas que no usás?» son los reemplazos aprobados. En el volcado esas piezas siguen en el calendario (28/11 y 26/11) y la pregunta quedó abierta. No encontré en las páginas leídas dónde el dueño las aprobó.
5. **Black Friday de Kocos Marketing.** «Sin números reales» se dijo para Autos. El calendario trae «200 mensajes sin responder» y «200 chats». ¿Son cifras reales o ilustrativas?
6. **TRIAL_REEL.** El cerebro pide uno por marca y por día, pero Kocos no califica por seguidores. ¿Se salta Kocos o se busca otra vía?
7. **Historias sin texto.** El informe del 20/11 dice que salen sin texto y el calendario tiene 34 historias con solo el título. ¿El texto en la historia es obligatorio?
8. **Cantidad de versiones R.** El subagente informó 90 remakes y el CSV tiene 190 filas R. ¿Cuál vale?
9. **¿La afirmación de la Corte sobre prepagas (21/11) es verdadera?** Nadie la verificó.
10. **Política de origen de los datos** («¿de dónde sacaron mi número?»): registrar el origen de cada base, revisión de un abogado de datos personales y quién responde el origen (el equipo de marketing, según `reglas-comunes`).
11. **Valores de las fichas del bot** que el dueño dijo tener cargados (marcas, formas de pago y requisitos de Autos; costo de la primera revisión de VITA; zonas de Coberturas; alcance de la propuesta de Marketing). Ninguna fuente los guarda y `03` dice que la ficha no tiene precios ni condiciones.
12. **¿Las frases «desde la web de …» están cargadas en el panel como fuente Landing?** Las landings en `main` no las usan. Y ¿está aprobada en Meta la plantilla `form_recibido_*` de cada rubro? Sin eso, el mensaje de los 5 minutos no sale.
13. **¿Se unificó el scraper de Marketing?** (dos herramientas, tope diario en UTC, apertura sin asignar). ¿Cuál es el servicio de ticket alto que Marketing debe vender primero? (`12`, pregunta 12, responde «uno que Claude pueda hacer» sin nombrarlo.)
14. **Cómo se unifica Penal con Civil.** El dueño lo decidió el 21/11 (y el 01/11). ¿Se retira el agente `penal` y la línea PENAL, o se mantiene el rol separado dentro de Civil?
15. **¿Cuál es el código de ingreso activo, el de 6 o el de 8?** El volcado dice que el de 8 se publicó el 15/11; `02` dice que sigue el de 6.
16. **Facebook y WhatsApp en la pantalla Redes del panel.** ¿Se permite editarlos sabiendo que un campo vacío pisa lo de Meta?
17. **Informes diario, semanal y mensual en Perfiles (21/11).** ¿Qué cifras, qué formato y quién los lee? El 12/11 pidió «una especie de PowerPoint con las estadísticas de la última semana y del mes» en Hoy; ¿es lo mismo?
18. **`@orvianmkt`.** El chat del 05/11 lo usó como perfil de la agencia ORVIAN. Con Kocos Marketing como nombre vigente, ¿esa cuenta existe, está activa o se abandona? Tampoco consta si el brief de prospección de ORVIAN se mandó a la persona que consigue clientes ni cuál es su comisión.
19. **Origen de «DROPI»** (chat del 01/11 «Verificar conexión con DROPI»): no aparece en el cerebro. ¿Es otro proyecto fuera de alcance como AutosMix?
20. **Encendido del archivo automático.** La regla «nada se activa solo» dejó apagado el archivo automático a 30 días se dejó apagado aunque el dueño pidió «directamente archivarlo» (19/11). Hoy dijo que los ajustes quedan pendientes, pero no dijo si el archivo automático debe encenderse al publicarlos.
21. **¿Quién y cuándo da el ok del rediseño visual** que el dueño reservó para sí el 19/11, y cómo se revisa sin su navegador?
22. **Objetivos de alcance al tercer mes (6.000 / 3.500 / 3.000 / 3.500).** ¿Siguen vigentes junto con las metas al 21/12?
23. **Fecha de la «Fase 3» de código (Vertex, A/B/C):** se declaró descartada el 25/10, pero el código y las tablas siguen. ¿Se archiva formalmente o se deja?
24. **Contraste entre rubros prioritarios y producción de contenido.** El dueño ordenó prioridad 1 VITA, 2 Marketing, 3 Coberturas y 0 km; el cronograma doble reparte igual entre las 4 marcas. ¿Se pondera?
