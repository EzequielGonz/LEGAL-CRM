# Traspaso Legal CRM (Code, 13/11 al 21/11/2026)

## 1. Encabezado

- **Título del chat:** «Traspaso Legal CRM» (título de la sesión en Code).
- **Inicio:** 13/11/2026, 18:34 UTC (hora del registro).
- **Fin:** el último trabajo de código fue el 15/11/2026, 08:57 UTC. El 21/11/2026, 05:57 UTC, la sesión cortó con «API Error: Usage credits ran out before the response was finished» mientras pedía este volcado. Estado de la sesión en el registro: `failed`.
- **Origen:** Code (Claude Code en la nube), repo `EzequielGonz/LEGAL-CRM`.
- **Sesión:** `session_01FuLgnko39B7TMetzSucFNJ`.
- **Modelos según metadatos:** `claude-opus-5-5` (último usado); configurado `claude-fable-5-2`. Subagentes con otros modelos.
- **Otros repos en la sesión:** `estudio-juridico-vita-final`, `coberturas-sociales-landing`, `agencia-kocos-mkt`, `0km-kocos-agencia`. No consta que se hayan tocado.
- **Perfiles y partes que toca:** los cuatro perfiles (Jurídico con Civil y Penal, Coberturas médicas, Autos 0 km, Marketing) y el panel común: Hoy, Resultados, Campañas (solo Wasender), Bots IA (conocimiento, informe de mejoras, laboratorio), asistente general, Salud, Perfiles y acceso al panel.
- **Costo de la sesión según metadatos:** unos USD 238 de costo acumulado, con uso extra (ver sección 12).

## 2. Objetivo

Lo que pidió el dueño, del 13 al 15/11:

- Que el bot de los cuatro perfiles conteste mejor y no pierda gente. Incluye la confirmación al captar, las crisis, el enojo, los contestadores y el tope de mensajes por contacto.
- Que el envío de campañas por Wasender sea humano: ritmo variable, plantillas al azar, sin patrón repetido, y arranque con 20 por día en modo entrenamiento.
- Quitar Meta del envío y dejar solo Wasender («por ahora no toques nada de meta»).
- Mejorar la velocidad del panel sin cambiar lo estético ni lo funcional.
- Hacer una auditoría exhaustiva (diseño, accesibilidad, seguridad, carga, funciones) con varios agentes, revisión cruzada y publicación.
- Un laboratorio del bot y un asistente general sencillos y funcionales.

Para qué: no está dicho en una frase. Se infiere que es que la captación sea segura y que el panel sea usable (inferido de las órdenes).

## 3. Órdenes y decisiones del dueño (textuales, con fecha)

Hora en UTC, como en el registro. El dueño escribió en todo momento en el chat de Code.

**13/11/2026**

- 13/11 18:42 (repetido en 18:46 y 18:47): «si anda bien el modo, no probe el audio, busca alguno que haya enviado alguien, el codigo es [secreto: código de ingreso al panel, hay que cambiarlo]. termina todo directamente /clear». Decisión: modo oscuro queda por defecto; buscar un audio real para probar el bot; terminar todo sin frenar.
- 13/11 19:13: «que es tanto lo que se hizo en esta sesion y la otra que tarda tanto?». Pregunta sobre tiempo y costo. No hay decisión registrada.

**14/11/2026**

- 14/11 05:50: «/compact <compacta unicamente lo innecesario, para continuar con el contexto de base, sin perder detalles importantes>».
- 14/11 05:57: «quedo armado el algoritmo de inicio de conversacion en cada rubro? con las plantillas variables, ritmo variable, nunca un patron definido o repetitivo? que quedo sin implementar?»
- 14/11 06:11 (mensaje largo, varias decisiones):
  - «mañana conecto todas las lineas, la idea es quedarnos unicamente con wasender y dejar al margen meta, por ahora no toques nada de meta.»
  - «Si, me parece bien lo que planteas en base al algoritmo. Pero dias de descanso no pondría, si o si necesitamos de lunes a sabados, quizas pausas mas largas pero buscar otra vuelta.»
  - «Ejecuta y aplica los puntos 1 a 5, agrega mas plantillas y bastantes mas variantes, siempre enfocado en bases frias, inicio de mensaje y para cada rubro. Que no haya un patron repetitivo, que se mande al azar todo...»
  - «Mejora la velocidad de carga del panel, la velocidad en general, sin tocar nada estetico ni nada funcional.»
  - «Mejora tambien el bot, en base a los chats que ya hay, sin eliminar, editar ni cambiar lo que hay, siempre sumando cosas, al bot v2, mejoras respectivas y que correspondan al rubro en particular.»
  - «Tenes muchisimos plugins y skills cargados [...] usa todo lo que sirva y no desconfigure ni haga nada raro. si tenes alguna pregunta o propuesta en base al panel actual, decime antes de avanzar»
- 14/11 07:17: «3 Datos para el bot: cargá en la ficha de cada perfil lo que el bot no debe inventar. Autos: marcas, formas de pago y requisitos. Jurídico: si la primera revisión no tiene costo. Coberturas: zonas. Marketing: qué incluye la propuesta inicial.»
- 14/11 07:17 (corrección, ver sección 4): «Ya esta todo hecho en las indicaciones de los agentes eso... no lo viste?»
- 14/11 07:17: «2 las plantillas viejas archivalas, que se carguen solas y se ejecute solo este algoritmo nuevo, si queremos forzar a enviar mas mensajes, deja la opción, como el limite maximo por dia al cargar campaña como tiene. Tambien que se puedan generar nuevas plantillas con el asistente del panel.»
- 14/11 07:17: «genera en la seccion de bots, un reporte, que la propia ia (gemini) relea las conversaciones y haga un analisis en base a datos de reales para sumar mejoras, hacer cambios etc, que me de una propuesta y poder aplicarlo tanto manual como con el asistente. Y poder hacer un agente nuevo o agregarlo al agente base del rubro»
- 14/11 07:17: «despues hace pruebas no con gente real, pero proba ese nuevo algoritmo, usa el panel como si fueses dueño, revisa todo y busca algo a mejorar o corregir y planteamelo»
- 14/11 08:36: «publica todo». Decisión: publicar a producción la corrección de la confirmación al captar, que estaba en la rama esperando OK.
- 14/11 08:42: «Inténtalo de nuevo» (reintento después de un corte por límite de uso).

**15/11/2026**

- 15/11 04:36: «explicame mejor esto» (pidió explicar las propuestas del informe de mejoras del bot).
- 15/11 04:45: «listo aplica las tres propuestas recomendadas. en todos los rubros al agendar una llamada o captar, no saluda ni agradece ni dice nada, corta directamente la conversacion y deja al cliente en "visto" hay que agregar que responda, agradezca y reafirme que un profesional va a comunicarse, me explico?»
- 15/11 04:46: «la respuesta al captar, debe ser adaptado a cada rubro, los botones del inicio de mensajes ya no van a estar, ya que era una limitación de meta.»
- 15/11 05:03: «[secreto: código de ingreso] es el codigo, recorrelo y despues lo cambio, ayer y hoy, recorriendolo, no notaste errores de diseño o funcionalidad, accesibilidad o lo que sea? hace un analisis totalmente exhaustivo y revisa cada sección a detalle buscando pulir todo, incluso diseño animaciones, carga, seguridad, accesibilidad, funciones, etc etc y proponeme ajustar esos detalles.»
- 15/11 05:03: pidió confirmar que los agentes manejan mensajes sin sentido, reconocen si hablan con un bot y cortan cuando corresponde. Pidió también «Compara opiniones, revisiones, todo, con todos los agentes y modelos ia que tengas disponibles [...] toma el rol de auditor senior, programador senior, editor y diseñador senior, vendedor senior, desarrollador senior, ceo senior» y «Dame una propuesta y un plan de accion a ejecutar».
- 15/11 05:34: «1. Lanzamiento con 20 por día. ok, al momento de cargar una campaña, usar funcion de entrenamiento con un boton que determine el ritmo sobre esa campaña y tambien, mantener el poder elegir limite y ritmo en caso de querer ir por mas volumen por decision propia y no nos frene que no haya otra opcion. 2. Tope por contacto. Si, eso si que lo detecte bien. El tope de 3 esta bien. lo que sumaste al recorrido del bloque 3 lo apruebo todo. Empeza con el bloque 1 aplicalo y termina con todos los bloques sin frenar.»
- 15/11 05:42: «donde quedaste? si compacto la sesion no se arruina nada? podes retomar igual q como estabas ejecutando? respondeme simple sin leer todo para ahorrar»
- 15/11 05:46: «listo segui donde quedaste y termina, el codigo es [secreto: código de ingreso]»
- 15/11 05:53: «que vas a hacer en supabase?»
- 15/11 06:56: «terminaste?»
- 15/11 06:59: «Quedan dos detalles chicos que ya estaban antes. Arreglalos. [...] No hay ninguna pausa general, saca eso, los bots andan, solo las campañas no se ejecutan solas, en todo momento los mensajes entrantes los responde, y el seguimiento y todo lo que este programado sigue normal, solamente no ejecuta campañas con bases o publicidades etc etc sin que lo lancemos, revisa eso por favor.» Esta frase responde a la pregunta del asistente sobre las líneas de ayuda en crisis con pausa general (ver sección 12).
- 15/11 07:17: «/context-handoff:handoff»
- 15/11 07:26 (respuestas a las preguntas del asistente):
  - Sobre el código de 8 números para lanzar desde el asistente general: «Una confirmación como la que hay.» (Decisión: no pedir código de 8 números; confirmación como la actual.)
  - Sobre «modelos nuevos»: «Las dos cosas. SIEMPRE, manteniendo sin tocar lo que ya esta activo y seleccionado, osea cada bot, no hagas ningun cambio sobre lo que ya existe y esta funcionando, que esto sea manual y no cambie nada de lo que ya hay andando, me explico?»
  - Sobre la prueba A/B: «Si, quiero al prueba A/B, pruebas simuladas, pruebas sobre campañas especificas, poder aplicar a todo el perfil o crear un rol, no que rija siempre, sino en casos puntuales tambien.»
- 15/11 07:32: «Como rol en cada perfil, no general, tambien que se pueda general, es decir... que no haya limites, ni reglas fijas, que pueda hacerse todo, formas de probas o formas de aplicar limitadas no, que justamente el asistente pueda hacer todo lo que yo le pida y de la forma que quiera.» Sobre proveedores: «1 solo gemini, con sus distintos modelos, etc etc. que hayan opciones de vincular otro modelo pidiendonos un url [...] pero por ahora gemini y sus distintos modelos.» Sobre el A/B: «si, la prueba a/b tiene que aplicarse en las campañas, los bots predeterminados y que rigen de base, nunca se ven alterados por el laboratorio, si no esta especificamente modificado por nosotros.»
- 15/11 07:34: «Ok, publicalo. Publica todo junto, usa otros agentes, de mayor o menor capacidad segun lo consideres, planifica todo y delega tareas, maneja la orquesta... arranca.» 07:36: «Pero lo estas ejecutando asi? Arranca es dale.»
- 15/11 07:49: «en los dos prompts que le diste a los agentes, solo agregaste 2 skills, tenes muchisimas skills y plugins mas que podes darle, que use todos, en caso de ser necesario obvio, pero que pueda usar todos y en base a eso generar lo mejor.»
- 15/11 07:50: «Eso, si esta como regla general en algun lado, que siempre se incluyan todas las skills y plugins disponibles, incluso que busque skills y plugins que ayuden, mejoren o lo que sea para implementar. Cambialo, si es que esta en claude.md o en algun archivo de contexto»
- 15/11 07:52: «lo que ya hicieron sin estas skills y plugins que mencionamos, que lo revisen y vean si se puede mejorar algo.»
- 15/11 08:17: «retoma»
- 15/11 08:23: «las verificaciones que sean dentro de todo rapidas, no tan exhaustivas.»
- 15/11 08:40: «demasiado complicado el tema del laboratorio del bot, la idea era una seccion en la que entres y sea todo mas sencillo hastaa que puedas hablar con el asistente y te ayude a crear una nueva version... esta demasiado tecnico, con funciones que no sirven... el asistente general cuando entras te despliega un menu de costado, la idea es que tenga mas cosas... sencillas, pero FUNCIONALES, hace algo asi rapido aplicalo y que quede mas funcional por favor. no tanta seccion ni detalle, no se ni como usarlo»
- 15/11 08:41: «no, lo tecnico tampoco va escondido, simplificalo con graficos sencillos, faciles de leer... que haya forma de cambiar cosas en el laboratorio pero que no sea inentendible»
- 15/11 08:44: «se pueden cambiar los bots generales tambien, no solo los 4 rubros, que se pueda modificar todo en el laboratorio y justamente probar campañas o lo que sea con ese modelo de prueba. en el asistente general que tambien muestre graficos sencillos con el resumen completo del panel de la semana, etc etc, que haya informacion y estadisticas generales tambien, de todo, y que sea sencillo y facil de ver. los otros proveedores ia que puedan agregarse con un enlace. los modelos que puedan elegirse, eso esta bien... pero esta demasiado complicado la organizacion»

**21/11/2026**

- 21/11 05:53 y 05:54 (mismo texto, el segundo tras el corte): «Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto. Usá todas las skills, plugins y conectores que tengas. No resumas de más: prefiero que sobre a que falte.» Es el pedido de este volcado.

**Reemplazos:**

- 15/11 08:23 («verificaciones [...] no tan exhaustivas») reemplaza, en lo que son verificaciones de rutina, al 15/11 05:03 («análisis totalmente exhaustivo»). La auditoría exhaustiva pedida el 15/11 05:03 se hizo igual.
- 15/11 08:40 a 08:44 reemplazan, en la forma, al diseño del laboratorio de 15/11 07:26 a 07:32 (todo en un formulario técnico). El contenido se mantiene: prueba A/B, roles por perfil, bots generales editables, otros proveedores por enlace.
- 15/11 07:26 («Una confirmación como la que hay») reemplaza la recomendación del asistente de pedir código de 8 números para lanzar desde el asistente.
- 15/11 06:59 («No hay ninguna pausa general») reemplaza la lectura del asistente de que la pausa general seguía activa (ver sección 12).

## 4. Correcciones del dueño

- **14/11 07:17:** el asistente pidió datos del bot que ya estaban cargados en las instrucciones de los agentes. Quería que se revisara antes de preguntar: «no lo viste?»
- **14/11 06:11:** el asistente había propuesto un día de descanso por semana. Lo rechazó: «dias de descanso no pondría».
- **15/11 04:45:** al agendar o captar, el bot cortaba sin saludar ni agradecer. Quería que respondiera, agradeciera y dijera que un profesional se va a comunicar.
- **15/11 04:46:** la respuesta al captar tenía que ser propia de cada rubro. Ya no van los botones del inicio de mensaje, por una limitación de Meta.
- **15/11 07:49 y 07:52:** el prompt a los subagentes solo listaba dos skills. Quería que usaran todas las skills y plugins útiles, y que se revisara lo ya hecho sin ellas.
- **15/11 08:40 a 08:44:** el laboratorio estaba demasiado técnico, con funciones que no servían y un menú lateral confuso. Quería una sección sencilla y funcional, con gráficos simples, y que el asistente general mostrara el resumen semanal con gráficos.
- **15/11 06:59:** el asistente había informado que la pausa general seguía activa («Siguen igual la pausa general, los agentes apagados y las campañas pausadas»). El dueño dijo que no hay pausa general.

## 5. Qué se hizo, con estado

Estados: especificado / implementado / probado / publicado / habilitado. Se usan los reportes del asistente y los resúmenes de compactación del registro. **No se verificó nada en la base ni en producción para este volcado**; lo que no se pudo confirmar va marcado como «no consta».

**13/11 (chat «Traspaso Legal CRM»)**

| Tarea | Estado | Notas |
|---|---|---|
| Traspaso a un chat nuevo: `docs/mejoras-1311/handoff-legal-crm.md` | publicado | El archivo quedó en la raíz primero; el dueño lo pasó a esa carpeta. No tiene el código de acceso. |
| Next.js 15.5.29 + React 19, con codemod de APIs async | implementado, probado, publicado | 456 pruebas pasaban ese día. Avisos de dependencias: 0. |
| Embudo de Resultados: «Conversaron», «Oportunidades reales», «Ventas» (migración 0612) | publicado | Jurídico, semana del 13/11: 22 respondieron, 12 conversaron, 3 oportunidades, 3 captados, 0 ventas. |
| Gráfico «Día por día» en Resultados (migración 0614) | publicado | |
| Diseño: menú plegable a íconos, barra inferior en celular, portada con profundidad, «En vivo» no tapa tarjetas, modo oscuro por defecto | publicado | Modo oscuro pedido por el dueño. |
| Rutas con riesgo (migración 0613): la agenda se reemplaza sin borrar, «vaciar la cola» y quitar un teléfono de avisos ya no borran, 5 rutas devuelven 404 o 400 en vez de «ok» silencioso | publicado | Sin probar con datos reales: guardar horarios, quitar teléfono de avisos. |
| Salud: tiempos del latido por etapa; avisos de fallas cada 10 minutos (uno por tipo, perfil y día) | publicado | **Habilitado: no.** Había 0 dispositivos con avisos activos. |
| Audios | probado en parte | Dos audios reales de prueba (13 s y 71 s) se transcribieron bien. Ningún audio entrante llegó después de encender la función; no se vio al bot responder un audio real. |
| Recorrido de producción | probado | 166 pantallas de computadora y 55 de celular, sin fallas. |

**14/11 (algoritmo de envíos, bot y plantillas)**

| Tarea | Estado | Notas |
|---|---|---|
| Ritmo humano de Wasender: plan del día por línea, tandas, pausas variables, texto al azar sin repetir, control de parecido entre textos | implementado, probado (simulación de 12 días × 4 líneas, sin enviar), publicado (686b4f6) | Rige cuando hay una campaña de Wasender en curso con línea conectada. |
| Problema hallado en la simulación: cada línea mandaba todo el cupo entre la mañana y el mediodía | publicado | Ahora se reparte hasta la noche. |
| Plantillas frías: 12 nuevas por perfil; 40 viejas archivadas con motivo | publicado (ee4df91) | Las campañas de Jurídico quedaron en «Al azar» (677 textos). |
| Campaña pausada con plantilla fija pasa a rotación; no se lanzó ni reanudó nada | publicado | |
| El límite diario de una campaña de Wasender frena el día y no pausa la campaña | publicado | Problema hallado en la simulación: la campaña quedaba pausada hasta reanudarla a mano. |
| El asistente puede generar plantillas y avisa si las variantes son casi iguales | publicado | |
| Informe de mejoras del bot en Bot IA (Gemini, 7, 14, 30 o 60 días, hasta 60 conversaciones sin teléfonos, documentos, correos ni nombres, hasta 6 propuestas) | implementado, probado (11 pruebas unitarias), publicado en los cuatro perfiles | Solo suma; nunca edita ni borra. Migraciones 0617 y 0618. Se generaron 11 propuestas; ninguna aplicada al 14/11. |
| Informe con fechas y lista de correcciones ya hechas (`RESUELTO_EN_EL_SISTEMA`) | publicado (697af84, 14/11) | Antes marcaba problemas ya resueltos. |
| Informe pasa a segundo plano (`after`) | publicado | Antes había un timeout de 120 s en `/api/agentes/informes`. |
| Bot v2: 12 fichas nuevas (`fuente = 'mejora 14/11'`), contestadores nuevos, sin «escribilo» ante stickers | publicado (27feeaa) | Sin borrar ni editar lo que ya había. |
| Fichas con datos del negocio | publicado | El asistente ajustó 4 fichas nuevas para que digan lo que el dueño ya había dado (marcas, usado como parte de pago en Autos, guía de packs en Marketing). Las del dueño no se tocaron. |
| Velocidad: sin precarga automática en listas, marca y menú en paralelo, `profile_metrics` en una pasada (migración 0616) | publicado (5d68500) | Sin cambios estéticos ni funcionales. |
| Confirmación al captar: se perdía cuando el bot usaba captar y después finalizar_consulta en la misma respuesta (4 casos en Jurídico en 14 días) | implementado (c51c5a2), publicado tras «publica todo» (70a0c74 en main, 14/11 08:36) | Habilitado en producción. No se vio todavía en una charla real. |
| Motor de Wasender: campañas sin plantilla fija rotan solas («Al azar» por defecto) | publicado | |

**15/11 (bloques 1 a 4 de la auditoría y laboratorio)**

| Tarea | Estado | Notas |
|---|---|---|
| Bloque 1, bots: Gemini con tiempo de 20 s y un reintento; `captar` solo con aceptación real; marcas de tiempo en el historial (más de 24 h); crisis y enojo; contrato de precios; rescate con turnos de error | implementado, probado en pruebas unitarias, publicado (75e4158) | Quedó parte pendiente en el resumen del 15/11 (ver sección 8). |
| Bloque 2, seguridad: intentos de PIN atómicos (0621), dispositivo conocido de 90 días (0624), sesión de 7 días sin uso y 30 en total, PIN de 8 dígitos, mensajes de error públicos sin datos de base (unas 45 rutas), tope de 3 contactos sin respuesta (`TOPE_SIN_RESPUESTA = 3`) | publicado | El código de ingreso del dueño quedó escrito en el chat varias veces; hay que cambiarlo. |
| Bloque 3, accesibilidad y diseño: cartel de crisis en el panel, estados de error, etiquetas, contraste | publicado | Según el reporte, los problemas de accesibilidad bajaron de unos 240 a 19 en computadora y de 19 a 8 en celular (axe). |
| Bloque 3, velocidad: refactor de consultas, carga diferida del chat, conteo del total de chats una vez por minuto | publicado | |
| Bloque 4, negocio: entrenamiento de campañas (20 por día durante 7 días; botón «Modo entrenamiento» encendido por defecto al crear campañas nuevas; un límite manual de más de 20 lo apaga) (0622); freno por respuesta: con 100 envíos o más y menos de 1 % de respuesta en 7 días, la línea frena, y se puede ignorar a mano (0623); alerta push cuando se desconecta una línea (`src/lib/wasender/entrada.ts`); tope por contacto | publicado | Habilitado solo el valor por defecto al crear campañas nuevas. No lanzó ninguna campaña. |
| Cartel rojo de crisis en el panel (incidencias de tipo `crisis`, migración 0620) | publicado | |
| Revisión de todas las pantallas en producción | probado | 166 de computadora y 55 de celular, sin errores del servidor. Un aviso aislado de hidratación en «Prospectos por base» de Marketing no se repitió en 8 recargas. |
| Un subagente del bloque 3 llegó al límite de gasto (429) a las 05:45 UTC; se guardó como WIP (e80d77d, solo en la rama) y después se completó | implementado | |
| Asistente general en su propia página, con resumen semanal, gráficos simples y botones de acción rápida; laboratorio en una sola pantalla con selector de perfil, chat embebido y comparación de versiones con gráficos | implementado en la rama (6ecd995 y afe29e3, 15/11 08:53 y 08:54). Tests: 574 pasan, typecheck y build OK (08:55). | **Publicado a main: no consta.** Migración 0633: no consta si se aplicó. Este era el estado al final del trabajo de código. |
| Otros proveedores de IA con enlace | no implementado | Pedido del 15/11 08:44; el dueño dijo que por ahora solo Gemini (07:32). |
| Aplicar las tres propuestas recomendadas del informe (Jurídico: consulta de turno médico pendiente y oferta baja de la aseguradora; Autos: «Sí, quiero ver») | no consta | Pedido del 15/11 04:45. |
| Cambio de respuesta al captar y al agendar (no cortar sin saludar ni agradecer) | no consta | Pedido del 15/11 04:45 y 04:46. |
| Archivar unas 30 variantes malas de Marketing y corregir el generador de plantillas (`docs/mejoras-1411/plantillas-frias.mjs`) | no consta | Estaba en pendientes del resumen del 15/11 05:45. |

**21/11 (volcado)**

- La sesión original cortó a las 05:57 UTC por falta de créditos al pedir este volcado. Esta entrada se escribió desde el registro de eventos, sin acceso al chat original.

## 6. Todo lo concreto

**Repo y producción**

- Repo: `EzequielGonz/LEGAL-CRM`. Producción: `legal-crm-nine.vercel.app` (proyecto Vercel `legal-crm`).
- Base: Supabase del CRM. Los cambios de datos se registraron en `ops_change_log` (filas 239, 291, 292, 293, 303, 310, entre otras).

**Archivos clave (rutas dentro del repo)**

- Bots: `src/lib/ai-agent/agent.ts`, `reintento.ts`, `rescate.ts`, `probar-real.ts`; `src/lib/agentes/aceptacion.ts`, `tiempo-historial.ts`, `crisis-y-enojo.ts`, `contrato.ts`, `guia-cierre.ts`; `src/lib/inbound.ts`.
- Acceso y sesión: `src/lib/acceso/pin.ts`, `src/lib/acceso/session.ts`; `src/components/acceso/aviso-codigo-anterior.tsx`; `src/middleware.ts`.
- Campañas y Wasender: `src/lib/campanas/entrenamiento.ts`, `src/lib/contacto/tope.ts`, `src/lib/wasender/ritmo.ts`, `src/lib/wasender/ritmo-humano.ts`, `src/lib/wasender/campanas.ts`, `src/lib/wasender/entrada.ts`.
- Errores y salud: `src/lib/error-publico.ts`, `src/lib/salud/avisar-fallas.ts`.
- Panel: `src/lib/hoy/periodos.ts`, `src/lib/resultados.ts`, `src/lib/resultados-grafico.ts`, `src/lib/rutas/comprobar.ts`, `src/lib/agenda.ts` (`horarioOfrecido`), `src/components/perfiles/cartel-crisis.tsx`, `src/app/vidrio.css`.

**Docs del repo**

- `docs/ESTADO.md` (historial operativo).
- `docs/mejoras-1311/`: `handoff-legal-crm.md`, `AUDITORIA.md` (§10), `PLAN-4.md`.
- `docs/mejoras-1411/`: `ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`, `SEGUNDA-VUELTA.md`, `BOT-V2-1411.md`, `plantillas-frias.mjs`.
- `docs/auditoria-1511/`: `ENTREGA.md`, `MIGRACIONES.md`, `INFORME.md`.

**Pruebas**

- `tests/unitarias/bots-auditoria-1511.test.ts`, `negocio-1511.test.ts`, `bot-24-10.test.ts` (respuestas largas instantáneas), `acceso-y-webhooks.test.ts` (vencimiento de sesión).
- Cantidad de pruebas según el momento: 456 (13/11), 473 (14/11 mañana), 486 (14/11), 510 (15/11, reporte de las 06:56), 574 (15/11 08:55).
- No se corrieron las pruebas de integración (`tests/integracion/correr.sh`): necesitan Docker, que no estaba en el entorno.

**Campañas y plantillas (Wasender)**

- «ART - TEST WASENDER»: 1.147 contactos pendientes; su línea está archivada. Hay que asignarle una línea conectada antes de reanudarla. No se reanudó.
- Campañas de Jurídico en «Al azar» (677 textos). La campaña pausada de Jurídico que tenía plantilla fija pasó a «Al azar». No se lanzó ni reanudó nada.
- Campañas, publicaciones y plantillas: no se lanzó nada que el dueño no haya pedido. Ningún envío real (no había líneas conectadas en el registro).

**Fuera de código**

- Meta: no se tocó. Facebook y WhatsApp en Redes no se editaron por la regla de Meta; la decisión queda pendiente.
- Metricool, Google y redes sociales: no se tocaron.
- Variables de Vercel: no se cambió ninguna. La variable del código de acceso se usó solo en comandos, por nombre y no por valor.

## 7. Datos del negocio que aparecieron

- Jurídico, semana del 13/11: 22 respondieron, 12 conversaron, 3 oportunidades, 3 captados, 0 ventas.
- Líneas de Wasender: una por perfil, con calentamiento de 20, después 40 y después 60 por día. Coberturas y Autos no tenían línea cargada el 14/11. El dueño debía conectar las líneas el 15/11 (no consta).
- Envíos: arrancan el lunes 16/11, porque el domingo no envía. Lunes a sábado, sin días de descanso.
- Datos que el dueño pidió para las fichas del bot (ya estaban cargados en las instrucciones de los agentes; los valores no quedaron consignados en el registro): marcas, formas de pago y requisitos de Autos, incluido el usado como parte de pago; si la primera revisión de Jurídico no tiene costo; zonas de Coberturas; qué incluye la propuesta inicial de Marketing, incluida la guía de packs.
- Regla de negocio que aparece en los resúmenes: el bot no da precios; los pone el equipo.
- Nada de roles del equipo ni proveedores nuevos (salvo que se quiere sumar otros modelos de IA por enlace).

## 8. Pendiente, a medias o bloqueado

- **Pausa general:** hay que verificar en la base si existe. El asistente la dio por activa y el dueño dijo que no existe (ver sección 12).
- **Asistente y laboratorio simples (6ecd995, afe29e3):** están en la rama, con tests y build OK. No consta que se hayan publicado a main ni que se haya aplicado la migración 0633.
- **Tres propuestas del informe y cambio de respuesta al captar y al agendar:** pedidos el 15/11. No consta que se hayan aplicado.
- **Ver al bot responder un audio entrante real:** pendiente hasta que llegue uno.
- **Avisos de fallas:** cero dispositivos con avisos activos. El dueño tiene que activarlos en al menos uno (Ajustes › Avisos).
- **Código de ingreso:** sigue sin cambiar según el registro. Lo escribió en el chat varias veces y el dueño tiene que cambiarlo; el nuevo debe tener 8 dígitos.
- **Líneas:** asignar una línea conectada a «ART - TEST WASENDER»; conectar las líneas de Coberturas y Autos.
- **Otros proveedores de IA:** no hecho. Por ahora solo Gemini. Falta que el dueño diga qué proveedor agregar.
- **Facebook y WhatsApp en Redes:** no se editan. Si el campo queda vacío al guardar, pisa lo que hay en Meta. El dueño tiene que decidir.
- **Variantes malas de Marketing:** archivar unas 30 y corregir el generador. No consta.
- **Pendientes del bloque 1 del 15/11:** tiempo de espera de Gemini con atención humana si falla; `rescate.ts` con turnos de error; debounce de ráfagas; alinear `probar-real.ts` con el bot en vivo; banner de crisis urgente. No consta que estén terminados.
- **Sin probar con datos reales:** guardar horarios de agenda, quitar un teléfono de avisos, la llegada de un aviso de falla, dos latidos a la vez.
- **Pruebas de integración:** no corridas (Docker).
- **Crisis y líneas de ayuda:** la pregunta sobre si salen con la pausa general activa queda sin respuesta explícita. El dueño dijo que no hay pausa general, así que habría que verificar que las líneas salgan.

## 9. Aprendizajes

- **Orden de publicación:** publicar primero a `main` y después subir la rama. Si se suben seguidas, Vercel construye la preview primero y la producción queda en cola (14/11).
- **Cortes por límite:** el límite de 5 horas (14/11 08:38 UTC) y los créditos agotados (21/11 05:57 UTC) cortaron turnos. Las tareas en segundo plano se pierden: conviene dejar un punto de control en la rama antes de lanzarlas.
- **Informes de IA con datos viejos:** marcan como problemas cosas ya corregidas. La solución fue dar fecha a cada conversación y una lista de correcciones.
- **Next 15:** `params`, `searchParams`, `cookies()` y `perfilActivo()` son async y hay que hacer `await`.
- **Variantes de plantillas:** cambiar una o dos palabras arma un patrón igual. Para variar de verdad hay que cambiar la estructura (orden, arranque, largo). La pantalla de plantillas ahora avisa.
- **Listas en Next:** la precarga automática multiplica pedidos al servidor. En listas largas, `prefetch={false}`.
- **Timeout de 120 s:** `/api/agentes/informes` (14/11 07:44 UTC). Se pasó a segundo plano con `after`.
- **Logs de cambios:** `ops_change_log` es solo de agregar. Un update dio error; se escribió una fila aparte.
- **Preview de Vercel:** pide sesión de Vercel; se recorre con un enlace compartido temporal, solo mirando.
- **React #418 (hidratación):** apareció una vez en la preview y una en producción, en «Prospectos por base» de Marketing. No se repitió en 8 o 9 recargas; se tomó como ruido.
- **Subagentes:** dos del bloque 3 llegaron al límite de gasto. Se retomaron sin perder el trabajo, porque quedó en WIP.

## 10. Preguntas abiertas

1. ¿Se publica la rama con el asistente y el laboratorio simples (6ecd995) a `main`? ¿Se aplica la migración 0633?
2. ¿El dueño activa los avisos de fallas en al menos un dispositivo?
3. ¿Se aplican las tres propuestas recomendadas del informe y el cambio de respuesta al captar y al agendar?
4. ¿Qué proveedor de IA se agrega por enlace, además de Gemini? ¿Qué URL o forma de conexión?
5. ¿Se editan Facebook y WhatsApp desde Redes? Hoy no se tocan por la regla de Meta.
6. ¿Qué línea de Wasender se asigna a «ART - TEST WASENDER»? ¿Y cuándo se conectan las líneas de Coberturas y Autos?
7. ¿Hay pausa general o no? Si no la hay, ¿las líneas de ayuda en crisis deben salir siempre?
8. ¿Se archivan las unas 30 variantes malas de Marketing y se corrige el generador?

## 11. Ramas y cambios (explícito)

**Ramas (repo `EzequielGonz/LEGAL-CRM`):**

- `main`: producción. Recibió los cambios publicados del chat (13/11, 14/11, 15/11).
- `claude/relaxed-cerf-5oncz1`: rama de trabajo del chat (todo el trabajo de 13 al 15/11). Su última punta en el registro es 6ecd995 (15/11 08:54 UTC). Contiene commits no publicados, por ejemplo la migración 0633. **Acción:** confirmar qué está integrado en main y decidir si se integra o se archiva lo que falta.
- `publicar-informe`: rama auxiliar del 14/11 para publicar el informe a main. Se puede archivar.
- `mejoras-1211`: rama anterior; el dueño pidió no seguir en ella. No se describe en el registro.
- `cerebro-chats`: rama de este volcado, sin cambios fuera de `cerebro/chats/`.
- Worktrees de subagentes en `.claude/worktrees/` (por ejemplo, `agent-a7b1…`). Son temporales.

**Commits** (hash corto, fecha UTC, qué cambió):

- `6cd0f0a`, 13/11: «Traspaso de la sesión del 13/11» (main).
- `25bbdf5`, 13/11 19:19: «Bitácora: commits de la corrida» (main).
- `47ab6e0` y `870805d`, 13/11: Next 15.5.29 y React 19 (rama).
- `3e2627f`, 13/11: embudo de Resultados (migración 0612). `45fe6e5`: rutas con riesgo (0613). `d2aa492`: salud y avisos de fallas. `8a53ce1` y `e57579d`: diseño (0614 para el gráfico) (rama).
- `3504689`, 13/11 19:39: «Informe: comprobación de la publicación» (main y rama).
- `686b4f6`: ritmo humano de Wasender. `ee4df91`: plantillas frías. `5d68500`: velocidad. `27feeaa`: bot v2. `70f12e7`: documentos (14/11, publicados).
- `c51c5a2`, `6e120b1`, `a22808a`, 14/11 08:09 (rama): confirmación al captar (en la rama, sin publicar en ese momento) e informe con fechas.
- `697af84`, 14/11 08:09 (main): informe con fechas y correcciones ya hechas.
- `ac4090a` (rama) y `78866d8` (main), 14/11 08:17: documentos de la segunda vuelta.
- `70a0c74`, 14/11 08:36 (main): «Unir la rama: corrección de la confirmación después de captar». Aquí se publicó la confirmación al captar.
- `ee074a6`, 14/11 08:47 (main): documentos de la publicación.
- `e80d77d`, 15/11 ~05:45 (rama): «Trabajo en curso 15/11: bloques 1 y 3 a medio hacer (sin publicar)».
- `75e4158`, 15/11 ~06:27 (main): «Correcciones de la revisión cruzada y documentos de la auditoría». Es la publicación de los cuatro bloques.
- `53df46f`, 15/11 (publicado): los dos paneles, Asistente y Laboratorio.
- `afe29e3`, 15/11 08:53, y `6ecd995`, 15/11 08:54 (rama): asistente en su pantalla, laboratorio simple y migración 0633. **No consta publicación a main.**

**Despliegues (Vercel, proyecto `legal-crm`):**

- `dpl_6JKrXwwEcLCVN5LPeumPJZ1ceV4v`: 13/11 19:19 UTC, READY (main, 25bbdf5).
- `dpl_4o7cXqxHuzTafsJmPZve8y3EyFSc`: 13/11, READY (main, 6cd0f0a).
- `dpl_EEUSNH7vCrTdKzr6bmL8mPTyPZm3`: anterior a la corrección; timeout de 120 s en `/api/agentes/informes` (14/11 07:44 UTC).
- `dpl_EYzt6YZnAgbag1rezJHzdcfBbfsa`: 14/11 08:47 UTC, READY (main, 70a0c74), con la confirmación al captar. Sin errores de runtime en 30 minutos.
- `dpl_7bSFrN8QcgysLXts87uBv9fchAaF`: 15/11 06:29 UTC, READY (main, 75e4158), con los cuatro bloques. Sin errores de runtime.
- `dpl_2gV1o4ts76nqy8TT1vu5GkDnhkSP`: READY, con 53df46f (los dos paneles).
- Para 6ecd995 no hay despliegue en el registro (no consta).

**Migraciones (`supabase/migrations/`):**

- 0612 `embudo_etapa`; 0613 rutas (`reemplazar_disponibilidad`, `archived_at` en teléfonos de avisos); 0614 `embudo_por_dia`; 0615 índice de ritmo; 0616 `profile_metrics`; 0617 y 0618 informe de IA.
- 0619 rendimiento; 0620 `incidencia_crisis`; 0621 `intentos_pin_atomicos`; 0622 `campanas_entrenamiento`; 0623 `freno_respuesta_a_mano`; 0624 `intentos_dispositivo_conocido`.
- 0633 laboratorio (rama, sin confirmar).
- Estado de aplicación: los resúmenes dicen que 0619 a 0624 están aplicadas («all applied», `ops_change_log` 303 y 310) y que 0612 a 0618 tienen estado de «datos» aplicado. **No verifiqué nada en la base.** 0633: no consta.

**Cambios de configuración fuera del código:**

- Vercel: ninguno. La variable del código de acceso (nombre `PANEL_PIN`) se usó solo en comandos.
- Supabase: solo migraciones y datos (ver arriba).
- Meta, Metricool, Google y redes: sin cambios.
- Wasender: no se conectó ninguna línea en el registro; el dueño tenía que hacerlo el 15/11 (no consta).

**Qué quedó encendido o apagado por este chat:**

- Encendido: modo oscuro por defecto (13/11); campañas de Wasender en «Al azar» (14/11); ritmo humano de Wasender (14/11, rige con campaña en curso); modo entrenamiento por defecto en campañas nuevas (15/11); freno por respuesta (15/11); tope de 3 por contacto (15/11); captar solo con aceptación real (15/11); confirmación al captar corregida y en producción (14/11).
- Apagado: los avisos de fallas (0 dispositivos); nada se lanzó; las campañas siguen sin ejecutarse solas. Según el reporte del 15/11, los agentes estaban apagados y las campañas pausadas (no verificado).
- Informe del bot: solo genera; no aplica nada.

## 12. CONTRADICE

- **Pausa general.** El asistente informó el 15/11 06:56 UTC: «Siguen igual la pausa general, los agentes apagados y las campañas pausadas». El dueño respondió el 15/11 06:59: «No hay ninguna pausa general, saca eso, los bots andan». **Hay que verificar en la base** qué está encendido antes de dar por cierto cualquiera de los dos.
- **Stack.** El prompt del 15/11 07:49 a los subagentes dice «Next.js 14», pero el proyecto está en Next.js 15.5 desde el 13/11. El prompt o el contexto de agentes tienen que actualizarse. El `CLAUDE.md` del repo ya dice 15.5.
- **Modelos en commits.** El resumen del 15/11 fija «sin IDs de modelo en commits ni en código», pero los commits del chat llevan la línea `Co-Authored-By` con el nombre del modelo (por ejemplo, `70a0c74`). Hay que decidir cuál regla vale.
- **Uso extra y costo.** El `CLAUDE.md` dice «No se paga nada sin autorización expresa del dueño». Los metadatos muestran uso extra («isUsingOverage») y un costo acumulado de unos USD 238. **No consta una autorización expresa para ese uso extra.**
- **Código de ingreso.** El `CLAUDE.md` dice que el código de ingreso no va en el chat ni en archivos. Quedó escrito en el chat el 13/11, el 14/11 y el 15/11, y en el registro no consta que se haya cambiado. Hay que cambiarlo.
- **Verificaciones.** El 15/11 05:03 el dueño pidió un análisis «totalmente exhaustivo»; el 15/11 08:23 pidió verificaciones «rápidas, no tan exhaustivas». Se toma la segunda para las verificaciones de rutina (ver sección 3).
- **Propuestas del informe.** El 14/11 08:48 el reporte dice «Propuestas de los informes: no aplicadas». El 15/11 04:45 el dueño pidió «aplica las tres propuestas recomendadas». No consta que se hayan aplicado.
- **Confirmación de lanzamiento.** El asistente recomendó código de 8 dígitos para lanzar desde el asistente general (15/11 07:26). El dueño eligió «Una confirmación como la que hay». Prevalece la decisión del dueño.
- **Respuesta al captar.** El 15/11 04:46 el dueño pidió que la respuesta al captar fuera por rubro. No consta que esté hecha.
- **Pendientes de la sesión contra el registro.** El resumen del 15/11 05:45 dice que los bloques 1 y 3 quedaron a medias (WIP e80d77d). El reporte del 15/11 06:56 dice que los cuatro bloques están publicados (75e4158). Se toma el reporte posterior como el estado publicado.
