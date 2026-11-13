# Plan 4 · 13/11 · auditoría exhaustiva, orden real de las personas y diseño

Se suma al Plan 3 (`PLAN-3.md`); no lo reemplaza. Lo que acá contradiga al Plan 3, manda acá porque es posterior.

**Antes de empezar a trabajar, leer completo `PLAN-4-DETALLE.md`:** tiene el orden (A → B → C → D → G → E → F), los datos medidos, los pasos con archivos, las reglas en tablas, los criterios de aceptación de cada bloque y el inventario de todo lo pendiente. Donde este documento y el detalle difieran, manda el detalle.

## Pedido (textual, 13/11 a la madrugada)

> Ojo por que hay muchos errores todavia, los chats, contactos y oportunidades se mezclan con los de otros rubros, los datos no son claros, hay que trabajar demasiado sobre eso, los chats estan mal, muchas veces aparece alguien que dice que tiene abogado, se le consulta sobre una segunda opinion, no responde, se le vuelve a enviar y tampoco responde... ya va directo a caido, despues hay muchos en detenciones e incidencias que van mas a perdido o a algo descartado o lo que sea y listo, una incidencia o detención tiene que ser un reclamo serio, un problema real, no que se enojen o pidan no contacto etc etc, me explico? en recuperar hay contactos de hace 15 dias, eso ya esta, se va a caidos, mas si no responden. en la parte de hoy tambien lo mismo, hay cosas que no sirven para nada... las estadisticas no estan muy bien hechas. en la seccion de contactos, exactamente lo mismo, tenes 60 personas que piden una persona cuando capaz se quejaron y solo pierdo tiempo, necesitamos detectar las oportunidades reales y reconocer lo que no sirve. Clickeas sobre un contacto de la parte de contactos y no lleva a nada, eso tambien es necesario, que te muestre ficha o chat... hay que facilitar todo. apenas entras a los perfilesm, las estadisticas no se actualizan... hay que revisar mucho aun, hace una auditoria mas exhaustiva y programala en las horas que ya quedamos, de paso, subi un poco más el diseño del panel, detalles en motion, 3d, 4d, dale más estetica.

Después mandó dos referencias de diseño «para tomar ideas de diseño, organización y demás»: el perfil de Instagram `code.xr` y su página de Topmate. Ver «Referencia de diseño» más abajo.

## Principio que manda sobre todo lo demás (responsable, 13/11)

> que cada rubro sea separado eso es importante, cada uno con sus funciones y contenido, que no se mezcle nada con nada. acordate eso

Cada perfil es un panel propio: sus chats, contactos, oportunidades, campañas, plantillas, bot, líneas, estadísticas, avisos, incidencias y ajustes. Dentro de un perfil no se ve ni se puede abrir nada de otro. Lo que de verdad es común a los cuatro (acceso, salud del sistema, ajustes generales) se muestra aparte, dicho con todas las letras, y sin sacar a la persona del perfil en el que está. Toda pantalla, consulta, enlace, aviso y función nueva se revisa contra este principio antes de publicarse.

## Decisiones de la responsable (respuestas del 13/11)

1. **Cuándo alguien pasa a Caídos.** Textual: «que pasen 3 días y otro mensaje, si no responde en 24 hs, a caídos». Es decir: si la persona dejó de contestar (por ejemplo dijo que ya tiene abogado, se le ofreció una segunda opinión y no respondió, y el recontacto del mismo día tampoco tuvo respuesta), a los 3 días sale **un** mensaje más; si pasan 24 horas sin respuesta, la oportunidad pasa sola a Caídos y sale de «Recuperar» y de toda vista de trabajo. Quien ya lleva más tiempo sin responder (los de hace 15 días) va directo a Caídos, sin otro mensaje.
2. **Qué es una incidencia.** Solo dos cosas quedan como incidencia de una persona: **amenaza legal o denuncia**, y **queja de un cliente captado**. Enojo, insultos, «no me escriban más», «ya tengo abogado», número equivocado: pasan solos a Perdidos o a No contactar, con su motivo, sin aviso ni cartel. El pedido de baja o la pregunta por el origen de los datos sigue como hasta ahora (disculpa y «pidió no ser contactado»), sin contarse como incidencia. El circuito de menores no cambia.
3. **Fallas del sistema.** Textual: «la falla del sistema, intentá ubicar dónde avisarnos, pero separado». Mensajes que no salieron, línea caída, bot que no pudo contestar: van a un lugar propio, separado de las incidencias de personas, pensado para avisarle al equipo.
4. **Limpieza de lo ya cargado.** Reclasificar solo: releer cada chat mal ubicado (los ~60 de «piden una persona», incidencias y detenciones viejas, «Recuperar» viejo) y moverlo a donde corresponde con el motivo escrito. No se borra nada. Tiene que quedar una lista «Movidos en la limpieza» para revisar y deshacer.
6. **Asistente** (13/11, después): queda con la confirmación antes de ejecutar («el asistente dejalo así»). La tarea que revisa sola la Bandeja para Claude: «por el momento no». No se crea ni se vuelve a proponer.
7. **Los que quedaron sin respuesta** (la última palabra fue de la persona y nadie le contestó; 67 medidos). Textual: «reconocé el mensaje de lo último que habló, si concretó una llamada derivalo a captado, si no dejalo en quedaron sin respuesta». Detalle en `PLAN-4-DETALLE.md`, bloque C, paso 4.
5. **Diseño.** Eligió «bien llamativo»: tarjetas que se inclinan en 3D, fondos animados, gráficos con relieve, además de transiciones, cifras que cuentan y profundidad.

## Trabajo, en orden

### A. Mezcla entre perfiles (lo más grave: va primero)

Síntoma: chats, contactos y oportunidades de un rubro aparecen en otro.

- Listar todas las consultas de `src/lib/**` y `src/app/api/**` que leen `conversations`, `contacts`, `opportunities`, `messages`, `campaign_contacts`, `followup_tasks` y comprobar en cada una que filtra por el perfil pedido (`rubro_id` y/o `area`). Ojo con: el filtro por `area` solo (Jurídico tiene Civil y Penal; un contacto puede tener oportunidades en dos perfiles), búsquedas globales, «Todos los chats», Contactos, Resultados, Seguimiento, Hoy, la ficha (historial de otras oportunidades del mismo teléfono) y las métricas en memoria (`unstable_cache` de `profile_metrics`: la clave tiene que incluir el perfil).
- Medir en la base: conversaciones cuyo `area` no coincide con el perfil de su oportunidad o de su contacto; contactos con `rubro_id` nulo o distinto al de su base importada; oportunidades sin conversación; el mismo teléfono en dos perfiles.
- Probar en producción con una sesión: cada lista de cada perfil, comparando los ids contra la base. Ningún id de otro perfil.
- Corregir el código y, si hay filas mal etiquetadas, corregirlas con registro en `ops_change_log` (sin borrar).
- Prueba unitaria o de integración que falle si una consulta nueva olvida el perfil.

#### Avance del bloque A (13/11, 6:15, antes de la corrida de las 8:51)

Medido en la base (todo en cero, la base está bien etiquetada): conversaciones con área distinta a la de su contacto; oportunidades con área o perfil distinto al de su contacto o su conversación; contactos, destinatarios u oportunidades de una campaña o base de otra área; conversaciones con una línea (de Meta o de Wasender) de otro perfil; conversaciones sin oportunidad; un contacto con chats en dos áreas. Solo hay 5 teléfonos que existen en dos perfiles a la vez (4 con chat en ambos): son personas distintas en la base, una por perfil, y está bien que así sea.

**Conclusión: la mezcla no está en los datos, está en las pantallas.** Encontrado hasta ahora:

1. **Incidencias (`/revision`) no filtra por perfil.** `src/app/(dashboard)/revision/page.tsx` lee `incidences`, `contact_detentions`, `webhook_quarantine` y `message_attachments` enteras y las muestra dentro del panel de Jurídico: ahí aparecen personas de los cuatro perfiles. Lo mismo `src/app/api/revision/**`. Se resuelve junto con el bloque B (incidencias por perfil; fallas del sistema aparte).
2. **Las pantallas de Jurídico viven en la raíz** (`/inbox`, `/campanas`, `/prospectos`, `/bases`, `/seguimiento`, `/agenda`, `/agentes`, `/estadisticas`, `/casos-cerrados`, `/configuracion`, `/revision`) con el marco fijo de Jurídico (`src/app/(dashboard)/layout.tsx`). Cualquier enlace a una de esas rutas desde otro perfil cambia de perfil sin avisar, y desde ahí el menú ya es el de Jurídico. Enlaces así ya ubicados:
   - `src/lib/salud/reglas.ts`: calidad de línea baja o media → `href: "/campanas"` para cualquier perfil (tiene que ir a las campañas del perfil de esa línea); y `/inbox/${id}` o `/inbox` en los avisos de conversaciones (usar `/conversacion/${id}`, que ya redirige al perfil correcto, y la lista de chats del perfil).
   - `src/components/configuracion/configuracion-perfil.tsx`: «Ajustes generales (todos los perfiles)» → `/configuracion?nivel=avanzado#…`, que abre el panel de Jurídico. Hace falta que los ajustes generales se abran dentro del perfil desde el que se entró.
   - `src/components/adjuntos/adjuntos-lista.tsx` y `src/app/panel/marketing/presupuestos/page.tsx`: `/inbox/${conversation_id}` fijo.
   - `src/components/ui/metrics-panel.tsx` y `src/components/cartera/vista-cartera.tsx`: enlace a `/revision`.
3. **Salud y la barra de salud muestran avisos de todos los perfiles dentro de cualquiera.** En Salud de Autos aparece «Jurídico: la línea de Wasender está desconectada» con el botón «Conectar con QR», que lleva a `/wasender?perfil=juridico`. Propuesta: en cada perfil, primero lo suyo; lo de otros perfiles plegado bajo «Otros perfiles» y con el nombre del perfil en el botón.
4. **Más de veinte pantallas caen en Jurídico cuando el enlace no trae `?perfil=`** (`searchParams.perfil ?? "juridico"` en Hoy, Resultados, Oportunidades, Contenido, «Por base», la cartera, Redes, Wasender, Salud, Bandeja…). Un solo enlace que pierda el parámetro muestra gente de Jurídico con la sensación de seguir en el otro perfil. Arreglo de fondo: recordar el perfil activo (una cookie que se escribe en el middleware al entrar a cualquier pantalla con `?perfil=` o `/panel/<perfil>/`) y usarlo como respaldo en lugar de Jurídico, en una sola función compartida; y que el encabezado muestre siempre, bien visible, en qué perfil se está.
5. La biblioteca de bots (`/biblioteca-agentes`) y `/api/agentes/biblioteca` muestran los bots de los cuatro perfiles: es así por diseño, pero conviene decirlo en la pantalla.

Falta: (a) comprobar lista por lista que los ids que muestra cada pantalla son del perfil (juntar los enlaces a ficha, chat y oportunidad de Hoy, Chats, Contactos, Recuperar, Descartados, Resultados, Seguimiento, «Por base», Oportunidades, Campañas, Agenda y Captados en cada perfil, y cruzarlos con la base); (b) terminar el recorrido de enlaces en Jurídico y Coberturas (quedó hecho en Autos y Marketing, 70 pantallas cada uno); (c) revisar los avisos a los dispositivos y la vista del teléfono (`/telefono`), que no se llegaron a mirar. El guion del recorrido quedó en el directorio temporal de la sesión (`panel/mezcla/rastrear.js`): entra a un perfil, sigue cada enlace y marca toda pantalla cuyo `data-tema` sea de otro perfil y toda respuesta de la API con áreas o perfiles ajenos; ojo que quita `volver` de las direcciones, así que `/biblioteca-agentes` da un falso positivo.

### B. Reglas nuevas de clasificación

- **Caídos automáticos.** Mapear la decisión 1 al circuito actual (`src/lib/seguimiento/**`, reglas comunes §5): el «mensaje a los 3 días» es el contacto 2 (hoy 60 h por defecto: llevarlo a 72 h); nuevo paso: 24 horas después del contacto 2 sin respuesta → `caído` con motivo «No respondió al seguimiento». También cae quien el bot decidió no insistir (ya está). «Recuperar» solo muestra a quienes todavía están dentro del circuito. Regla pura con pruebas; motor en el latido con candado contra dobles pasadas.
- **Incidencias.** Revisar qué alimenta hoy «Incidencias», «Detenciones» y «Atención humana» (`src/app/(dashboard)/revision/**`, `src/lib/hoy/**`, `colasDeHoy`). Dejar como incidencia de persona solo amenaza legal/denuncia y queja de captado. El resto se cierra solo como perdido o no contactar, con motivo, igual que los descartes automáticos (que hoy esperan 6 horas: revisar si para enojo y pedido de no contacto conviene cerrar en el momento).
- **«Piden una persona».** Hoy entra cualquiera que el bot derivó. Tiene que quedar solo la oportunidad real: pidió hablar con alguien y hay interés, pregunta de precio o condiciones, datos entregados, captado que volvió a escribir. Queja, enojo, rechazo o baja no entran. Clasificador: primero reglas claras sobre el último mensaje y el motivo de derivación; en la duda, el bot relee el chat (mismo esquema que `criterio-servidor.ts`) y devuelve `{tipo, motivo}`.
- **Fallas del sistema.** Sección propia (propuesta: bloque «Fallas del sistema» en Salud del sistema, con contador en el menú solo cuando hay alguna, y el mismo aviso a los dispositivos que ya existe para la calidad de línea). Entran: envíos fallidos o inciertos, línea desconectada, bot que no pudo contestar, plantillas rechazadas.
- Actualizar `.claude/referencias/reglas-comunes.md` §5 y §6 con estas decisiones, con fecha.

### C. Limpieza de datos (después de B, con sus reglas)

- Pasada única sobre lo cargado, por perfil: «piden una persona», incidencias, detenciones, «Recuperar».
- Cada movimiento con motivo y con marca de limpieza (`ops_change_log` y un campo o tabla que permita listar «Movidos en la limpieza 13/11» y deshacer uno por uno).
- No se manda ningún mensaje en la limpieza. Los que llevan más de 4 días sin responder van a Caídos sin mensaje.
- Antes de mover: contar por destino y guardar el resumen en `AUDITORIA.md`. Después: recorrer las pantallas y comprobar que los números bajaron a lo real.

### D. Pantallas que no sirven todavía

- **Contactos:** cada fila abre la ficha (clic en toda la fila) y tiene acceso directo al chat.
- **Entrada a los perfiles:** las cifras de la portada no se actualizan. Revisar la portada (`/` o selector de perfil) y `profile_metrics` en memoria: la portada tiene que mostrar el dato del momento (o decir «hace N segundos» y refrescar al volver a la pestaña).
- **Hoy:** quitar lo que no lleva a una acción. Cada bloque responde «a quién le escribo ahora». Lo informativo baja o se va a Resultados.
- **Estadísticas / Resultados:** revisar que cada número salga de una sola definición (la misma en Hoy, Resultados, portada y campañas), con período claro, comparación con el período anterior y embudo por origen (campaña → respondió → conversó → pidió persona real → captado → derivado).
- La pasada de modernización del Plan 3 (punto 6) sigue en pie y se hace con el diseño nuevo.

### E. Auditoría exhaustiva

Todo lo del punto 0 del Plan 3 (seguridad, funcionamiento, datos, sencillez, rendimiento), más:

- La mezcla entre perfiles (A) como hallazgo de seguridad y de datos.
- Cada lista del panel contra la base: mismo conteo, mismas personas, mismo perfil.
- Cada estado que ve la responsable (etapas, etiquetas, filtros) con su definición escrita en una sola tabla en `AUDITORIA.md`: qué significa, de qué dato sale, en qué pantallas aparece. Donde dos pantallas usen definiciones distintas para el mismo nombre, unificar.
- Recorrido completo como usuaria en los cuatro perfiles, a 375 y 1280 px, con consola abierta.

### F. Diseño «bien llamativo»

Dirección (tomada de la referencia, adaptada a un panel de trabajo que se usa muchas horas):

- **Vidrio con profundidad:** tarjetas translúcidas con desenfoque de fondo (16–24 px), borde fino luminoso (más claro arriba que abajo), sombra difusa y radio grande (16–24 px). Píldoras redondas para filtros y búsquedas.
- **Fondo vivo:** dos o tres manchas de color del perfil que se mueven muy lento detrás del vidrio. Cada perfil con su color de acento (ya los tienen las marcas).
- **3D:** las tarjetas de cifras se inclinan siguiendo el cursor (pocos grados, con brillo que acompaña) y se elevan al pasar; en el celular no hay inclinación, solo la elevación al tocar.
- **Movimiento:** cifras que cuentan al cargar; cambio de pantalla con fundido y un pequeño desplazamiento (250–350 ms); indicador del menú y de las pestañas que se desliza a la opción activa; filas que entran en cascada una sola vez.
- **Gráficos con relieve:** áreas con degradado, anillos de avance con degradado, barras con extremos redondeados e información al pasar el cursor.
- **Menú lateral:** íconos con etiqueta, grupos con título, opción activa con píldora luminosa, plegable.
- Límites: respetar «reducir movimiento» del sistema; solo `transform` y `opacity` en las animaciones; el desenfoque se reduce en el celular si baja el rendimiento; contraste AA sobre el vidrio; el contenido de trabajo (listas, chats) sigue siendo denso y legible: lo llamativo va en portada, cifras, menú y transiciones, no en cada fila.
- Skills a usar: `frontend-design`, `ui-ux-pro-max`, `vectorlab-ux-skills:motion`, `transitions`, `reduced-motion`, `surfaces`, `ux-audit`; `design:accessibility-review` al final.
- **Claro u oscuro:** las portadas de las piezas más nuevas de la referencia (tablero, menú lateral, pestañas) son **claras**: vidrio blanco esmerilado sobre un fondo lavanda/celeste muy suave, con acento violeta o azul en degradado y burbujas de vidrio como adorno. Ese es el punto de partida, porque el panel se usa de día y muchas horas: **claro de vidrio por defecto**, con el acento de cada perfil en lugar del violeta, y modo oscuro disponible (fondo casi negro con manchas de color y vidrio `rgba(255,255,255,.05)`), que es la otra mitad de la referencia.
- **Menú y pestañas (de la referencia):** menú lateral de vidrio con radio grande, plegable a una barra de íconos (de ~320 a ~68 px en 400–450 ms, con las etiquetas que entran en cascada), opción activa con una píldora que **se desliza** hasta la nueva opción (~300 ms, resorte sin rebote), contadores en píldoras, buscador en píldora hundida y tarjeta de la persona abajo. Pestañas en cápsula con la misma píldora deslizante; en el celular, barra inferior de íconos donde la opción activa se expande y muestra su nombre. Al presionar, una leve reducción (0,95) antes de soltar.

### G. Asistente del panel con permiso para todo (pedido del 13/11; se hace en la corrida de las 8:51, no antes)

Textual: «al asistente virtual del panel, dale permisos a TODO incluso a editar código o secciones o lo que sea, que pueda hacer TODO».

Hoy (`src/lib/asistente/permisos.ts`) el asistente tiene quince tipos de acción (publicaciones, campañas, bot, roles, chats) y nunca ejecuta solo: propone y la persona confirma.

1. **Todo lo que el panel hace, el asistente también.** Recorrer cada ruta de `src/app/api/**` que cambia algo y darle al asistente una herramienta para cada una: contactos y fichas (etapa, notas, derivar, perder, reabrir, no contactar, devolver al bot), seguimiento (ver, soltar, reprogramar, ajustes), plantillas de Meta y de Wasender (crear, editar, archivar, variantes), campañas completas, bases (importar ya cargadas, asignar rol), bot (fichas de conocimiento, roles, encender y apagar), líneas de Wasender, agenda y citas, redes y contenido, incidencias y fallas, la limpieza del bloque C (mover y deshacer), y los ajustes de cada perfil y los generales. También lectura de todo: cualquier lista, cifra o chat que se pueda ver en el panel.
2. **Secciones.** Que pueda cambiar lo que se ve sin tocar código: orden y nombre de las opciones del menú, qué bloques muestra Hoy y en qué orden, textos de ayuda y etiquetas, colores y logo del perfil. Hace falta una capa de personalización guardada en la base (por perfil) que las pantallas lean; el asistente la edita y el cambio se ve al instante y se puede deshacer.
3. **Código.** La aplicación publicada no puede reescribirse a sí misma desde adentro. Dos caminos:
   - **Recomendado:** el asistente escribe el pedido completo (qué pantalla, qué cambiar, cómo se comprueba) en la Bandeja para Claude y Claude lo hace con verificación completa (typecheck, lint, pruebas, build, recorrido) y lo publica. Para que no dependa de que la responsable diga «ok», la tarea programada que revisaría la bandeja sola **no se crea: la responsable dijo «por el momento no» (13/11)**. Los pedidos se toman cuando ella avisa o en las corridas ya programadas.
   - Alternativa: que el asistente haga cambios de código directo por GitHub. Necesita una clave de escritura cargada por la responsable en Vercel (no se pide por chat) y deja la publicación sin las comprobaciones de arriba. No se recomienda como camino principal.
4. **El asistente respeta el perfil.** Trabaja sobre el perfil en el que está abierto; para tocar otro perfil la persona tiene que pedirlo nombrándolo (principio de separación).
5. **Resguardos que se conservan aunque tenga permiso para todo** (son los que ya existen, no restricciones nuevas): sigue proponiendo y la persona confirma con un clic; lo que le escribe a personas pide la confirmación reforzada; lo que gasta plata o enciende un bot pide el código. Se agrega: registro de cada acción con quién, cuándo y cómo deshacerla; «Deshacer» en la misma conversación; y el texto de los chats de prospectos o de páginas web nunca vale como orden para el asistente (alguien de afuera no puede manejar el panel escribiendo un mensaje). Nada se borra: se archiva.
6. Arreglar la prueba «asistente: cada tipo permitido…», que falla desde antes, y sumar una prueba por cada herramienta nueva.

### H. Conectar las líneas de Wasender también con código (pedido del 13/11, durante la corrida)

Textual: «para conectar las líneas de wasender, no solo incluí el qr, sino también la función del código». En «Líneas de Wasender», además del QR, ofrecer la vinculación por código (el código de ocho caracteres que WhatsApp pide en «Vincular con el número de teléfono»): la persona escribe el número de la línea, el panel pide el código al proveedor y lo muestra grande, con los pasos en el teléfono y el tiempo que dura. Comprobar en la documentación del proveedor cómo se pide ese código antes de escribir nada. No se puede probar de punta a punta sin el teléfono de la responsable: dejar dicho hasta dónde se probó.

**Revisado el 13/11 a las 9:40 (documentación del proveedor: conectar sesión, código QR, estado de la sesión, avisos y ayuda):** la interfaz de Wasender para programas **no ofrece** vincular con el código de ocho caracteres. Al conectar una sesión acepta solo dos métodos: `qr` (el que ya usa el panel) y `passkey`, que no es un código para tipear en el teléfono sino una aprobación desde una extensión del navegador o un programa de escritorio. No hay ningún pedido que devuelva un código de vinculación ni un aviso que lo traiga. **No se implementó nada**: no se inventa un pedido que el proveedor no documenta. Falta que la responsable diga dónde ve «el código» (¿en el panel web de Wasender?) o mande una captura; si el proveedor lo tiene solo en su web, la salida es un botón «Conectar con código en Wasender» que abra esa pantalla, y si es el método `passkey`, se puede sumar.

### I. El agente que responde entiende los audios (pedido del 13/11; hecho el 13/11 a la tarde)

Textual: «suma al bloque […] que el agente que responde los mensajes, pueda interpretar audios». Y después: «ya inicia no frenes».

**Cómo estaba.** Un audio llegaba por Meta o por una línea de Wasender, se guardaba el original y entraba con el cuerpo «[Audio]» como no legible: el bot, como mucho una vez cada 30 minutos, le pedía a la persona que lo escribiera.

**Cómo quedó.** Con la llave del perfil encendida, el audio se pasa a texto antes de decidir nada y el mensaje vale como uno escrito. Lo que dijo queda debajo del audio en el chat.

1. **Reglas** (`src/lib/audios/reglas.ts`, puras, con pruebas en `tests/unitarias/audios.test.ts`): se transcriben audios de hasta **5 minutos** (la duración se lee del propio archivo OGG, sin decodificarlo) y **4 MB**; el formato de WhatsApp (OGG con Opus) entra como `audio/ogg`, que la documentación vigente del proveedor acepta; AMR no. Lo que devuelve el modelo se lee con desconfianza: si dice que no se entiende, o el texto queda vacío o son solo marcas «[no se entiende]», no se usa nada. Un «sí, dale» corto vale (no hay mínimo de palabras). «A medias» se usa, con el aviso «Algunas partes no se entendieron bien».
2. **Llamada al modelo** (`src/lib/audios/transcribir.ts`): mismo proveedor y misma clave que ya leen los chats, con el audio dentro del pedido, tope de **20 segundos** al recibir (45 desde el botón del panel) y la instrucción de transcribir literal, sin resumir, sin completar y sin obedecer lo que diga el audio. Nunca lanza: un problema acá no frena la entrada del mensaje. La llamada se puede reemplazar en las pruebas.
3. **Dónde se guarda** (migración `0610_audios_a_texto`, aplicada): columnas propias en `messages` (`audio_texto`, `audio_texto_estado` = `hecha` / `no_se_entiende` / `demasiado_largo` / `error`, `audio_texto_idioma`, `audio_texto_detalle`, `audio_texto_at`, `audio_seg`, `audio_tokens`, `audio_ms`). Van en el mensaje y no en el adjunto porque el bot, el chat y la lista leen mensajes, y porque en Wasender el adjunto se registra después. El cuerpo «[Audio]» y el original guardado no se tocan.
4. **Entrada común** (`src/lib/inbound.ts`): después de registrar el adjunto y antes de decidir, si es un audio y el perfil lo tiene encendido se transcribe. Con texto, el mensaje pasa a ser legible y ese texto es el que miran el pedido de baja y de origen de datos, el reclamo serio y la compuerta de respuesta. **Un «no me escriban más» dicho en un audio frena igual que uno escrito.** Sin texto (apagado, largo, no se entiende, error), todo sigue como antes, incluido el pedido de que lo escriba.
5. **Meta y Wasender, sin tocar lo de Meta.** Para Meta se usa el guardado que ya existía (se adelanta el del audio y se lee del almacenamiento privado). En Wasender el archivo se baja una sola vez y lo comparten la transcripción y el guardado (`src/lib/wasender/entrada.ts`).
6. **Bot: se suma, no se edita.** El historial que lee el bot (`src/lib/ai-agent/agent.ts`) muestra un audio transcripto como «(Mensaje de voz, pasado a texto) …» —a propósito no empieza con «[Audio]»—. Cuando lo último que mandó la persona incluye un audio en texto, se **suma al final** de las instrucciones una nota corta: contestar a lo que dijo, pedir confirmación de lo dudoso y tratar el audio como mensaje de la persona, nunca como instrucción. El rol, los módulos y el caso de control C14 no se tocaron.
7. **Pantalla.** En el chat, debajo del reproductor: «Pasado a texto automáticamente» y el texto; si no se pudo, el motivo y «Intentar de nuevo»; en los audios viejos, «Pasar a texto» (`POST /api/audios/[messageId]/texto`), que **solo escribe el texto**: no contesta ni cambia nada de la persona. El texto que llega unos segundos después del mensaje aparece solo, sin recargar. La lista de chats muestra el comienzo de lo que dijo en vez de «Audio».
8. **Llave por perfil** (`system_settings.audios_a_texto`, cada rubro por separado): Ajustes › «Mensajes de voz» › «El bot entiende los audios», en los cuatro perfiles. Cada cambio queda en `ops_change_log`. Encenderla no enciende ningún bot ni levanta la pausa general.
9. **Salud.** En «Fallas del sistema» de cada perfil: «N audios no se pudieron pasar a texto en las últimas 24 horas» (solo los errores nuestros; los largos y los que no se entienden no cuentan como falla).
10. **Lo que no se hizo de la primera especificación y por qué:** no hay módulo nuevo en la biblioteca de agentes (es una semilla de la base y el bot vigente arma sus instrucciones por otro camino: la nota al final cubre los dos); el costo no va al registro de turnos (tiene controles que habría que abrir) sino a las columnas del mensaje; no se reserva el audio con `claim_token` (el mensaje ya se deduplica al entrar).

## Referencia de diseño (lo que se pudo ver)

- El perfil de Instagram publica componentes de interfaz hechos con React y animaciones: tableros «de vidrio» en violeta/azul sobre blanco y en oscuro con acento esmeralda, menú lateral de vidrio, pestañas de vidrio con indicador deslizante, formularios de ingreso animados.
- Se analizaron cuatro videos del perfil: tablero «Glassy Dashboard V30», «Admin Dashboard V7», «Glassy Sidebar V7» y «Glassy Navigation Tabs». De ahí salen los valores de la sección F:
  - Organización: menú lateral + barra superior con buscador en píldora; saludo con dos botones; **fila de cuatro cifras**, **gráfico grande a la izquierda (2/3) y anillo de avance o lista de fuentes a la derecha (1/3)**; debajo, tablero por columnas (etapas) y listas. Las cifras llevan etiqueta chica, número grande, variación con flecha y un ícono tenue arriba a la derecha.
  - Vidrio: desenfoque de 16–30 px con saturación, borde de 1 px más claro arriba que abajo, brillo interior en el borde superior, sombra ambiente amplia y suave, radios de 16–24 px (36–40 en el menú), píldoras completas en filtros y contadores.
  - Texto: sans geométrica, etiqueta 14 px media al 60 %, cifra 24–30 px en negrita con interletrado apretado, títulos de grupo de 11–12 px.
  - Movimiento: tarjeta que se eleva 4–8 px al pasar el cursor con el borde que se enciende (resorte), cambio de vista con fundido y desplazamiento de 8–10 px en 250–400 ms, fondo con manchas de color que derivan lento, píldora activa deslizante en menú y pestañas, líneas de gráfico curvas con relleno en degradado y barras con extremos redondeados.
- La página de Topmate no se pudo abrir desde acá (bloquea visitas automáticas) y el perfil de Instagram tampoco directamente: se vio por otra vía. Si la responsable quiere que se tome algo puntual de Topmate, hace falta una captura.
- No se copia el código ni el diseño de nadie: se toman las ideas (vidrio, profundidad, movimiento, organización en cifras → gráfico → listas) y se hacen propias con los colores de cada marca.

## Estado

| Bloque | Estado (13/11, 9:55) |
|--------|--------|
| A. Mezcla entre perfiles | **Hecho, publicado y comprobado** (440 pantallas sin saltos; 1.361 personas y chats de las listas, todos del perfil correcto). Falta: avisos a los dispositivos y vista del teléfono (`/telefono`), que no se miraron |
| B. Reglas nuevas | **Hecho y publicado**: quién habló último en la oportunidad, Caídos (72 h + 24 h; motor encendido), «Oportunidades reales» con puntaje de interés, reclamos serios (amenaza legal y queja de captado), «perdido ya no pide persona», «Posible captación a revisar», «Para recuperar» retirado. Falta: bloque «Fallas del sistema» en Salud con contador y aviso; aviso a los dispositivos al abrirse un reclamo; `reglas-comunes.md` §5 y §6 ya actualizadas |
| C. Limpieza de datos | **Hecha en los cuatro perfiles** (lote `limpieza-1311`, 468 movimientos, cada uno con deshacer; ver `AUDITORIA.md` §3). «Deshacer» probado |
| D. Pantallas | **Hecho y publicado** (13/11 a la tarde): Hoy solo con lo que lleva a una acción (tabla de qué se quedó y qué se fue en `AUDITORIA.md` §8.2), embudo del período en Resultados, tabla vieja «Captados y casos» retirada (redirige a Contactos), diálogos propios en Líneas de Wasender, «Base para campaña manual» de a 25, aclaración en «Marcar como derivado», chips de 40 px. Falta: las etapas «conversaron», «oportunidad real» y «ventas» en el embudo |
| E. Auditoría exhaustiva | **Avanzada.** A la tarde: política de contenido (CSP) publicada y recorrida en 106 pantallas; `xlsx` reemplazado; optimizador de imágenes apagado; avisos de dependencias de 4 a 2; plan de subida de Next escrito (`AUDITORIA.md` §9). Falta: hacer esa subida, tiempos del latido, aviso a los dispositivos por reclamo o falla |
| F. Diseño | Pendiente |
| G. Asistente con permiso para todo | **Hecho, publicado y probado en producción** (13/11, 14:45): catálogo de 77 operaciones que se ejecutan por la misma ruta que la pantalla, perfil puesto por el servidor, tres niveles de confirmación, menú a medida por perfil con deshacer y pedidos de código a la Bandeja. Detalle y pruebas en `AUDITORIA.md` §8.4. No hay tarea que revise la bandeja sola (decisión de la responsable) |
| H. Wasender: conectar con código además del QR | Revisado: el proveedor no lo ofrece por su interfaz para programas. **13/11, 10:20: la responsable dijo «yo me encargo»**; no se hace nada más acá salvo que ella lo pida |
| I. El agente entiende los audios | **Hecho, publicado y encendido en los cuatro perfiles** (13/11, 14:40). Probado con pruebas unitarias y, en producción, con «Pasar a texto» sobre 3 audios viejos (4 a 6 segundos cada uno, texto correcto). **Falta ver un audio real entrando**: no se puede simular sin mandarle un audio a una línea |

**Lo que sigue (13/11, 15:00):** (1) bloque F, diseño «bien llamativo», por fases; (2) subida de Next según `AUDITORIA.md` §9; (3) aviso a los dispositivos por reclamo o falla y tiempos del latido; (4) etapas que faltan en el embudo; (5) hallazgos del inventario de rutas (`AUDITORIA.md` §8.5). La responsable pidió empezar antes de la hora programada («ya inicia no frenes»); la tarea de las 14:51 encuentra esto hecho y sigue desde acá.

Al terminar cada bloque: actualizar esta tabla, `BITACORA.md` y `AUDITORIA.md`, guardar en la rama y publicar.
