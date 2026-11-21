# Contexto del proyecto: panel CRM multirubro, redes y WhatsApp (chat de Code)

## 1. Encabezado

- **Título del chat:** «Tenes el contexto de este proyecto?» (primer mensaje) y, en el uso, el CRM multirubro (panel de captación), la migración de WhatsApp de Meta a Wasender y el plan de redes de las cuatro marcas.
- **Inicio:** 01/11/2026 (22:09 UTC).
- **Fin:** 21/11/2026 (05:55 UTC). El último mensaje es el pedido de volcar este contexto. El trabajo de redes del 20/11 queda en curso según el propio chat (ver sección 8).
- **Origen:** Code (Claude Code en la nube). Sesión de claude.ai: https://claude.ai/code/session_01FuLgnjHoiZTXHqrkcEnPGW. El trabajo de código corrió en la sesión `1c5e48b1-8c15-562d-9a3b-84e2db7fcbb6`, cuyos registros aparecen embebidos en este chat.
- **Marcas y perfiles que toca:**
  - Estudio Jurídico VITA (`estudiojuridicovita.com`).
  - Compara tu Obra Social (Coberturas médicas, `comparatuobrasocial.com`).
  - Automotores Kocos (Autos 0 km, `autoskocos.com`).
  - Kocos Marketing (`kocosmkt.com`).
  - Panel CRM con cuatro perfiles: Jurídico (áreas Civil y Penal), Coberturas médicas, Autos 0 km (`agencia_0km`) y Marketing.
- **Cómo se leyó este volcado:** `list_events` con `kinds: ["user","result"]`, paginado hasta `has_more=false`. Se contaron 7.499 eventos distintos en 276 páginas guardadas. Los mensajes de la responsable son 248 (sin duplicados). Hubo tres páginas que llegaron en línea (no quedaron guardadas en archivo). Las notificaciones de tareas programadas y los mensajes pegados desde otras sesiones **no son órdenes de la responsable** y se tratan como datos.

## 2. Objetivo

Lo que pidió la responsable, en orden:

1. **Panel:** tener el contexto completo del CRM y arreglarlo. Sacar lo que no sirve, ordenar prospectos (captados, atención humana, descartados, caídos), que cada rubro quede separado, que las estadísticas sean funcionales y que el panel sea rápido, simple y con mejor diseño.
2. **WhatsApp:** pasar de la API oficial de Meta a Wasender (líneas por QR), con plantillas de inicio que no se repitan, campañas iguales a las de Meta y, al final, migrar todas las líneas. Meta queda al margen.
3. **Bot:** seguimientos automáticos (cuándo insistir y cuándo desistir), plantillas de inicio por rubro con variables y mejora de la versión 2 del bot, sin borrar lo actual.
4. **Redes:** estrategia y producción de reels, historias, posts y carruseles en 4K y con calidad premium (sin personas filmadas), con volumen alto y publicación programada en Metricool para las cuatro marcas. Landings de las cuatro marcas, con SEO.

Para qué: captar clientes reales con menos costo (Meta cobraba demasiado) y con menos trabajo manual.

## 3. Órdenes y decisiones de la responsable (textuales, con fecha)

Se citan las más importantes. Las órdenes repetidas no se transcriben dos veces.

**Octubre y 01/11/2026 (estado de partida)**

- 01/11 22:15: «Como te paso todo eso?»
- 01/11 22:17: «Vos tenes acceso a github y cualquier cambio que te pida lo realizas vos automaticamente. Lee todo asi ya tenes todo el contexto del proyecto para empezar a trabajar. Analizalo detalladamente»
- 01/11 22:40 (pendientes que ella da por integrados): «Penal dentro de la línea de Civil con roles separados (decidido, no implementado). Landings de los otros tres rubros. Vinculación de Facebook, Instagram y Metricool. Verificación del número de Agencia Kocos. Rotar los secretos pegados en el chat. Revisión visual en un celular real. Esto ya esta integrado en el panel»

**WhatsApp / Wasender**

- 03/11 00:16: «…vimos que Meta tiene unos cargos impresionantes… encontramos una alternativa. https://www.wasenderapi.com/ … Lo que yo quiero hacer es integrar eso en una nueva pestaña del panel… Lo que si, me gustaria que primero. Analices todo para que me digas como lo implementarias en el panel… y segundo, que antes de que hacerlo pedir una confirmacion y hacerlo en otra rama, para que antes de subirlo sea una preview para verificiar si funciona o no funciona»
- 08/11 07:05: «como podemos empezar a implementar WAsender?»
- 10/11 12:42: «empecemos con la implementacion de wasender.»
- 10/11 13:20: «no pises ni rehagas ni edites lo que ya esta hecho con meta.»
- 10/11 14:55: «Sobre las equivalencias, no vamos a usar mas meta. Solo Wasender. Dejamos para lo ultimo pasar todos los numeros a wasender.»
- 10/11 18:33: «Ese mismo algoritmo tiene que estar en las campañas de Wasender. Directamente copia ese algoritmo que venimos usando… Solamente que en vez de elegir el metodo de mensajes meta, que sea Wasender. Simplemente eso.» Y: «…un sistema la cual sea una rotacion de plantillas, ya que sabemos que meta bloquea mucho el tema de los numeros cuando se repite mucho esa plantilla.»
- 10/11 23:52: «Arranca con el bloque dos asi ya pasamos los numeros de meta a waasender»
- 13/11 12:25: «para conectar las lineas de wasender, no solo inclui el qr, sino tambien la funcion del codigo.»
- 14/11 06:11: «mañana conecto todas las lineas, la idea es quedarnos unicamente con wasender y dejar al margen meta, por ahora no toques nada de meta.»
- 17/11 08:27: «eliminaste el numero principal, el que esta vinculado a meta, volve a agregarlo, que pueda cargar campañas con los numeros que ya estaban»
- 17/11 08:59: «es que se esta mezclando todo lo de wasender con lo de meta, hay que separar eso»

**Panel: orden, separación y prioridades**

- 08/11 04:20: «Revisa el crm por favor, esta caido.» (Vercel desactivado por pago; ver sección 5.)
- 08/11 06:58: «ya pague la suscripcion» (la responsable pagó el plan de Vercel. Claude no pagó nada.)
- 12/11 11:59: «Hace una auditoría completa y exhaustiva… como si fueses el dueño… no modifiques nada todavia, revisa todo exhaustivamente a detalle y dame un reporte»
- 12/11 12:38: «ok, avanza… 3 arranca a hacer todo junto, no por punto. Ponete un punto de control y pausa en 25 minutos… NO LO SUBAS A PRODUCCION HACELO UNA PREVIEW Y DEJALO LISTO PARA IMPLEMENTARLO EN CASO DE APROBACION»
- 12/11 13:01: «revisa y arregla la organizacion completa de los chats y contactos y hoy, todas esas secciones estan demasiado desorganizadas.»
- 12/11 20:49 (orden vigente para Hoy y chats): «En la sección HOY hay que corregir y separar los captados y la atención humana y reconecer los descartados… esos hay que descartarlos, insistir una vez como ya esta programado el bot, pero una vez que se pierde ya se elimina y ni se muestra si no esta cerrado… armar una especie de powerpoint con las estadisticas de la ultima semana y del mes… En sección chats… que sea claro y facil… unificar o buscarle el sentido…»
- 12/11 20:49 (continuación): «Aplicar el bot v2 a todo el panel, ya dejarlo predefinido… redes, también buscarlo hacerlo funcional desde una url… como si tuvieramos instagram facebook y whatsapp abiertos dentro del mismo panel… propone ejecuta los cambios y subi a produccion todo.»
- 13/11 06:54: «los seguimientos necesito que hagas una ruta automatica, cuando insistir, cuando desistir, etc. Y ya dejalo prendido.» Y: «Las plantillas necesito que tomes 10 distintas de inicio de conversación… 10 plantillas distintas por rubro y 40 variables sobre la misma plantilla…» Y: «La mejora del bot, no hagas una version nueva, mejora la v2… sin editar ni borrar lo actual.»
- 13/11 06:57: «El seguimiento, que no se tenga que activar ni cargar manualmente, el agente que reconozca cuando hacerlo, cuando no, que sea automatico.»
- 13/11 07:01: «las estadisticas que sumaste son basicas, no puedo ver nada, quien se derivo, quien se cerro… tiene que ser todo funcional…»
- 13/11 08:12: «si la tarea no se termina en la sesion de 8 51, programa otra tarea 6hs despues… mantene el modelo fable, solo para tareas muy muy pero muy sencillas…»
- 13/11 08:36: «Ojo por que hay muchos errores todavia… los chats, contactos y oportunidades se mezclan con los de otros rubros… una incidencia o detención tiene que ser un reclamo serio, un problema real, no que se enojen o pidan no contacto… en recuperar hay contactos de hace 15 dias… se va a caidos… tenes 60 personas que piden una persona cuando capaz se quejaron… necesitamos detectar las oportunidades reales y reconocer lo que no sirve… apenas entras a los perfiles, las estadisticas no se actualizan…»
- 13/11 08:58: «que cada rubro sea separado eso es importante, cada uno con sus funciones y contenido, que no se mezcle nada con nada. acordate eso»
- 13/11 09:01: «al asistente virtual del panel, dale permisos a TODO incluso a editar codigo o secciones o lo que sea, que pueda hacer TODO, programado para 8 51, no ejecutes ahora»
- 13/11 09:18: «si el asistente déjalo así… Los 67 que hablo la persona, reconoce el mensaje de lo último que hablo, si concreto una llamada derívelo a captado, sino si déjalo en quedaron sin respuesta»
- 13/11 09:22: «ante la duda de un posible captado, agrega, posible captación a revisar o algo así. no lo hagas muy largo súmalo rápido»
- 14/11 06:11: «Ejecuta y aplica los puntos 1 a 5, agrega mas plantillas y bastantes mas variantes, siempre enfocado en bases frias… Que no haya un patron repetitivo, que se mande al azar todo»
- 14/11 06:11: «Mejora la velocidad de carga del panel… sin tocar nada estetico ni nada funcional.»
- 14/11 07:17: «2 las plantillas viejas archivalas, que se carguen solas y se ejecute solo este algoritmo nuevo… Tambien que se puedan generar nuevas plantillas con el asistente del panel.» Y: «genera en la seccion de bots, un reporte, que la propia ia (gemini) relea las conversaciones y haga un analisis…»
- 15/11 04:45: «listo aplica las tres propuestas recomendadas. en todos los rubros al agendar una llamada o captar, no saluda ni agradece… hay que agregar que responda, agradezca y reafirme que un profesional va a comunicarse»
- 15/11 04:46: «la respuesta al captar, debe ser adaptado a cada rubro, los botones del inicio de mensajes ya no van a estar, ya que era una limitación de meta.»
- 15/11 05:28 (decisiones): «Textos internos: cambiar «Wasender», «v1/v2» y «JSON» por palabras simples, por ejemplo «Línea por QR» o «Versión nueva». Esto no lo modifiques.» Y: «Disculpa breve y cortar, ante denuncia o amenaza, avisar.» Y: «Si, enviar lineas de ayuda y un cartel de urgencia en el panel.» Y: «No, el bot no da precios, indica que el precio lo determina el equipo encargado de eso.» Y: «ingreso de 8 digitos.» Y: «Arranca por el primer hasta ultimo bloque, no frenes…»
- 15/11 05:34: «1. Lanzamiento con 20 por día. ok, al momento de cargar una campaña, usar funcion de entrenamiento con un boton que determine el ritmo sobre esa campaña… mantener el poder elegir limite y ritmo… 2. Tope por contacto. Si, eso si que lo detecte bien. El tope de 3 esta bien.»
- 15/11 05:34: «Empeza con el bloque 1 aplicalo y termina con todos los bloques sin frenar.»
- 15/11 07:16 (laboratorio y asistente): «en la parte de conocimiento del bot, hacer un boton que despliegue una seccion… en el que puedan crearse modelos nuevos, roles… que sea general en todo el panel… Al lado… otro boton… el asistente virtual ya integrado, que se puedan enviarle archivos excel… ejemplo, pasarle 4 excels con contactos, que defina una campaña en conjunto con nosotros…»
- 15/11 07:26: «Las dos cosas. SIEMPRE, manteniendo sin tocar lo que ya esta activo y seleccionado, osea cada bot… que esto sea manual y no cambie nada de lo que ya hay andando»
- 15/11 07:32: «Como rol en cada perfil, no general, tambien que se pueda general, es decir… que no haya limites, ni reglas fijas, que pueda hacerse todo»
- 15/11 07:32: «2 si, la prueba a/b tiene que aplicarse en las campañas, los bots predeterminados y que rigen de base, nunca se ven alterados por el laboratorio, si no esta especificamente modificado por nosotros.» Y: «1 solo gemini, con sus distintos modelos… que hayan opciones de vincular otro modelo pidiendonos un url…»
- 15/11 07:50: «Eso, si esta como regla general en algun lado, que siempre se incluyan todas las skills y plugins disponibles… Cambialo, si es que esta en claude.md o en algun archivo de contexto»
- 15/11 08:40: «demasiado complicado el tema del laboratorio del bot… hasta que puedas hablar con el asistente y te ayude a crear una nueva version… no tanta seccion ni detalle, no se ni como usarlo»
- 15/11 08:44: «se pueden cambiar los bots generales tambien, no solo los 4 rubros… en el asistente general que tambien muestre graficos sencillos con el resumen completo del panel de la semana… los otros proveedores ia que puedan agregarse con un enlace… pero esta demasiado complicado la organizacion»
- 18/11 06:50: «hay errores en el panel, botones redirigen a otro lado. anda lento. tambien, las publicaciones programadas en metricool, al instagram de kocosmkt, algunas no pudieron subirse, reintenta subirlas o programalas de nuevo»

**Redes (agosto a noviembre)**

- 08/11 07:32: «…no vamos a grabar a nadie, hacelo tipo dibujo en 4k, o dame opciones de como podemos hacerlo. yo subiria volumen de contenido, un poco mas…»
- 08/11 07:34: «No hay nada programado.» (corrige a Claude, que había dicho que sí había piezas programadas)
- 08/11 07:46: «esos numeros en todo el contenido, eliminalo, esas palabras chiquitas que agregas arriba del titulo tambien… y dale un estilo mas premium, mas refinado, como un editor profesional… ultra hd 4k»
- 08/11 07:56: «el tema del cartel del cta en las historias, es que no queda funcional el "boton". No sirve, no te lleva a nada, ahi perderiamos clientes»
- 08/11 08:22: «no me gusta nada, ni el estilo del contenido, ni la fuente, ni los dibujos, no hay voz, no hay nada. no hay nada premium, nada de calidad, mejora todo. hacelo realmente premium, sos un experto en edicion»
- 08/11 08:40: «relee bien el contexto de cada rubro, y adapta el contenido 100% a ese rubro especifico. no quiero contenido generico… Revisa las landings y conservando totalmente el diseño y animaciones generales, emprolijalos…»
- 08/11 08:42: «Quiero post, fotos y videos de calidad. 4k real y no algo BASICO… repitamos algunas fotos cada cierto tiempo para no crear tantos posts de 0.»
- 09/11 05:56: «No me gusta nada el diseño, ni el formato ni nada del contenido que creaste… analiza videos virales… necesitamos gancho, retención, interacción, cierre, interés, necesitamos despertar dopamina.» Y: «…tienen que responder la historia o escribirnos por whatsapp.»
- 09/11 07:26: «5 reels por rubro por dia, 2 posts, 1 carrusel, 2 historias, por dia y por rubro, hacelo a 15 dias no a 30 dias y recorda de reciclar posts y demás para no hacer todo de 0. Probemos esa estrategia primero.»
- 09/11 07:44: «ok, me encanto el nuevo formato de reels, con voz, pero en vita no esta implementado… agrega un poco mas el logo y nombre de los rubros en los reels fotos y demás. ahora si. Termina y publica todo…»
- 09/11 07:55: «programa una tarea en este mismo chat a las 7:50 con el modelo opus 5.5 esfuerzo extra…»
- 09/11 07:59: «Que hago con vita? Entonces que salgan a partir del 10/11 las publicaciones»
- 09/11 08:52: «…el header de vita esta horrible… Las fotos que tiene son horribles… autoskocos tambien sigue siendo generica… tienen que ser landings sabiendo que sos desarrollador UI UX profesional, diseñador grafico profesional…»
- 09/11 09:06: «Analiza a fondo… cada empresa que haga lo mismo que los 4 rubros… Recorda vincular las palabras clave que sumas en el contenido de redes al conocimiento del bot del panel…»
- 09/11 09:12: «No, el bot no esta apagado. Solo agrega al rol del bot que responde las palabras clave y listo, sumalo nada mas, como contexto, sin tocar nada de lo que existe»
- 09/11 11:52: «Sigue teniendo fotos genéricas y no tiene un diseño premium… buscale la vuelta al diseño de las landing»
- 20/11 04:30 (orden vigente de redes): «Paso 1, boceto (rápido): hacé el boceto de UN solo perfil, VITA (@estudiojuridicovita): 1 reel de mini historia animada, hecho en código y gratis… Personaje recurrente de barrio… Cierre «Comentá PALABRA»… Paso 2, cuando te diga «aprobado»: ejecutá todo sin volver a preguntar.»
- 20/11 04:47: «si puede ser en 4k ultra hd mejor aun»; 04:48: «a los reels y posteos y demas siempre agregale donde puedas el logo o nombre del rubro que corresponda»
- 20/11 05:33: «el concepto me gusta, osea toda la base esta perfecta, pero hay que pulir muchisimo mas los detalles, el realismo… armemos un cronograma de aca a 10 dias duplicando el cronograma actual, en volumen de publicaciones.»
- 20/11 05:41: «listo, todo eso publicalo y programalo en metricool, pero que sea del 20/11, que empiece ya este nuevo cronograma.»
- 20/11 05:42: «los que ya estan programados, deja que se suban igual»
- 20/11 05:50: «todos los reels publicaciones y todo, ya deja todo publicado y programado, para todos los rubros»
- 20/11 06:00: «subi tambien reels de prueba… reversionalas tomando la base y cambiando algunas cosas asi meta no nos detecta que son publicaciones duplicadas y subi aun mas el volumen de todo.»
- 20/11 06:06 (decisión sobre piezas en borrador): «patentamientos nada, no lo hagas, black friday mandale, pero sin numeros reales, el aumento de prepagas nada. el resto todooo subi y publica todo.»
- 20/11 06:18: «mientras no hayan numeros, todo ok»
- 20/11 06:21: «ok hace un checkpoint hasta aca, no hagas mas nada, programa 5:55 am seguir…»
- 20/11 07:23: «dale, te dejo activado que se pase a creditos automaticamente, cuando detectes eso, frena, deja un checkpoint y programa para cuando se reestablezca el limite te parece?»
- 20/11 08:35: «DAME TODOS LOS REPOSITORIOS TAMBIEN QUE TENES CONECTADOS» y 08:36: «SUMALOS AL WORD. LOS REPOS»
- 20/11 08:56: «arranca, si no terminas programa retomar 10:49 am hoy»

**Pedido de volcado (21/11/2026)**

- 21/11 05:53 a 05:55 (repetido cinco veces): «Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto…» (con las reglas de destino `cerebro/chats/` en la rama `cerebro-chats`). Este archivo responde a ese pedido.

**Reglas de la responsable que aparecen en el chat**

- 12/11 (contraseña del panel): el código de ingreso se usa solo para entrar. No se escribe en archivos, commits, informes ni chat. Ver sección 9 y CONTRADICE.
- 15/11 (regla general): «Eso, si esta como regla general en algun lado, que siempre se incluyan todas las skills y plugins disponibles…» Claude debía cambiarlo en CLAUDE.md si estaba escrito. El chat no confirma que se haya hecho.
- Regla de «Nada se activa solo» y «nada se borra, se archiva» (CLAUDE.md y mensajes de 12/11 y 13/11).

## 4. Correcciones de la responsable

- 08/11 07:34: «No hay nada programado.» (Claude había dicho que sí).
- 08/11 07:46: se quitaron los números de página (01/05), las etiquetas chicas sobre los títulos y la línea decorativa. El CTA de historias no era funcional («no te lleva a nada»).
- 08/11 08:22 y 09/11 05:56: el diseño no era premium; no tenía voz, ni animación, ni relación con cada rubro. Se pidió rehacer.
- 09/11 06:46: «no entendi» (Claude había mandado algo confuso). Se pidió aclarar.
- 09/11 06:58 y 07:23: «muchos detalles asi en las landing los hacen parecer muy hechas por ia… esos puntos marcados no me gustan, sigue viendose muy ia.»
- 09/11 08:52: se criticó que las landings de VITA, Compara tu obra social, Kocos Marketing y Autos Kocos tuvieran «factor wow» nulo, y que las fotos fueran genéricas.
- 13/11 07:01: las estadísticas eran «solo números», sin quién se derivó, quién se cerró ni de dónde vienen los clientes.
- 13/11 08:36: las incidencias y detenciones mezclaban enojos y pedidos de «no contactar» con reclamos reales; las oportunidades reales estaban mezcladas con las que no servían.
- 15/11 08:40 y 08:44: el laboratorio del bot era «demasiado complicado», «no tanta seccion ni detalle, no se ni como usarlo». Pidió gráficos simples y todo a la vista.
- 20/11 05:33: «el concepto me gusta… pero hay que pulir muchisimo mas los detalles, el realismo… que no aparezca ningun cartel de caracter ilustrativo.»
- 20/11 06:00 y 06:06: sobre las piezas en borrador, la responsable cambió la decisión de Claude: Black Friday se publica (sin números reales), prepagas y patentamientos no.

## 5. Qué se hizo (estado)

Estados: **especificado / implementado / probado / publicado / habilitado**. Lo que sigue es lo que consta en el chat. Donde no hay confirmación, se pone «(no confirmado)».

**5.1 Infraestructura y Vercel**

- 08/11 04:20 UTC: Vercel devolvía `DEPLOYMENT_DISABLED` (plan Hobby, pago pendiente). La responsable pagó la suscripción (06:58) y Claude desbloqueó el proyecto. Hacia 06:59 el panel respondía `/login` 200 y `/landing` 200. **Publicado y verificado en el chat.** Al 21/11 el plan sigue en Hobby (el log del chat muestra que retiene 1 hora de logs).
- 09/11 08:43: la responsable hizo «deploy to production» desde Vercel a mano, porque la automatización no tenía acceso (usó el navegador Opera). **Publicado (confirmado por la responsable).**
- 10/11: la Preview pedía login y Wasender no podía enviar. Se pidió activar «Protection Bypass for Automation» en Vercel (Deployment Protection). **Estado no confirmado en el chat.**
- 10/11: variables de Vercel mencionadas: `WASENDER_PAT` (token de Wasender, cargado en Vercel) y `WASENDER_CLAVE_CIFRADO` (clave para cifrar las claves de las líneas). El chat dice que estaban integradas en Vercel. **No se copian valores.** Ver sección 9.

**5.2 Landings y SEO (los cuatro sitios)**

- 08/11 (08:00–09:16 UTC): cambios de imágenes propias, correcciones y refuerzo de SEO. Commits pusheados directo a `main` según la salida de git: `estudio-juridico-vita-final` 4532df6, `coberturas-sociales-landing` caac286, `0km-kocos-agencia` 6b4b1de3, `agencia-kocos-mkt` 9dccbde4. Después, correcciones de dominio canónico con `www`: a4c3175, a02bf20, 8e64fee7, d6b53b4a y dd0afa27 (en `agencia-kocos-mkt`). **Publicado (en `main`), según la salida de git del chat.** Las ramas `claude/gracious-volta-rv2f3x` tienen solo el enlace de creación de PR, **sin PR abierto** (no confirmado).
- Verificación de canónicos y sitemap: 4/4 dominios respondieron logo=200, og=200, llms=200 e indexnow=200 (08/11 09:03). Los sitemaps usan `www`. Dato a tener en cuenta: el dominio sin `www` redirige 308 a `www`.
- 09/11 08:52 y 09/11 11:52: la responsable pidió rediseñar las landings con más efecto «wow» (animación, 3D). **Estado: no confirmado como cerrado.** La auditoría y el rediseño se pidieron en varias corridas.

**5.3 Redes: producción de piezas**

- 08/11–09/11: se produjeron piezas en 4K generadas con código (HTML y SVG, renderizadas con Playwright a deviceScaleFactor 2 → 2160×3840 vertical y 2160×2700 feed). Estado en el chat: **40 PNG en 4K y 4 MP4 de reels (uno por marca) generados y revisados** en el entorno de la sesión. Entregado a la responsable como zip `redes-4k-{vita,cob,okm,mkt}.zip` (enviado con SendUserFile). **Implementado; probado en el entorno; publicado solo a través de Metricool (ver 5.4).**
- Métricas de partida que Claude midió con Metricool (no verificado por mí): alcance y seguidores casi cero; los reels rendían de 3 a 20 veces más que los posts. Objetivos de alcance IG al tercer mes: VITA 6.000; Coberturas 3.500; Autos 0 km 3.000; Marketing 3.500.
- Volumen propuesto el 08/11 (aprobado de palabra): 6 reels, 3 carruseles, 2 posts y 4 historias por día, de lunes a sábado, por marca.
- 20/11: plan de cronograma de 10 días para las cuatro marcas (del 20/11 al 29/11): 632 piezas (272 reels, 320 historias, 40 carruseles), que salen en Instagram y Facebook, es decir 1.264 publicaciones. Versión A (pieza original), versión B (otro gancho, +5 días), versión R (remake de los temas que mejor retuvieron del 10 al 19/11), tope de 6 reels por tema y marca, y freno si la retención o el alcance cae más de 30 % el 25/11. Horarios en la tabla del 20/11 06:02 UTC.
- 20/11 06:06: Claude había propuesto dejar en borrador varias piezas. La responsable decidió publicar Black Friday de Autos (sin números reales) y no publicar aumento de prepagas ni patentamientos. **Decisión tomada; el estado de cada pieza en Metricool no consta en el chat.**

**5.4 Redes: programación en Metricool**

- IDs de marca: Mkt `7242607`, Vita `7549864`, Cob `7549939`, 0km `7552104`.
- 09/11: la responsable pidió programar las publicaciones «que empiecen hoy mismo, 9/11»; para VITA, desde el 10/11.
- 10/11: Instagram de VITA devolvía «The Instagram account is restricted» (dato reportado en un informe programado, no confirmado).
- 18/11: algunas publicaciones del Instagram de Kocos Marketing no subieron. La responsable pidió reintentar o reprogramar. La responsable dijo «ya volvi a conectarlo en metricool» el 18/11 07:00. **Reintento: no confirmado.**
- 20/11: la programación del cronograma nuevo (del 20/11 en adelante) se pidió; la tabla de horarios está en el chat, pero **el chat no confirma que se haya cargado en Metricool.** Hay un pedido de «cuántos reels programaste?» (20/11 05:52) sin respuesta visible.
- 20/11 (ahora de Claude): la programación se hace en horario de Buenos Aires (America/Argentina/Buenos_Aires), con `getScheduledPosts` antes de cargar, para no duplicar.

**5.5 WhatsApp: migración a Wasender**

- 03/11: análisis inicial pedido (sin implementar).
- 10/11 (inicio): se implementó en Preview el envío por Wasender con el mismo algoritmo de campañas de Meta (decisión de la responsable). Una línea conectada en Preview (10/11 14:47). **Implementado; probado en Preview.** Advertencia de la responsable: la Preview comparte base y líneas con producción, así que probar ahí tiene efecto real (10/11 13:34).
- 10/11 18:06: pedido de pasar todo a producción. Se hizo por tandas. **Publicado (confirmación a medias en el chat).**
- 12/11 12:38 y 20:49: la responsable aprobó el plan de auditoría de 6 puntos y dijo que se subiera a producción. **Autorizado.**
- 13/11 08:51 (corrida nocturna): Claude informó **publicado y comprobado en producción**: rubros separados, Caídos (motor encendido), oportunidades reales, incidencias, fallas del sistema separadas, limpieza con deshacer (con «Ver los movidos en la limpieza»), portada de perfiles que se actualiza cada 30 segundos, campañas sin cortes por tiempo. Cifras de limpieza (antes → después): figuran esperando a una persona 94 → 18 (de esos, 7 oportunidades reales); dejaron de responder y seguían a la vista 347 → 0; incidencias abiertas 55 → 0; caídos: 265 personas pasaron a Caídos. **Según el informe de Claude; no verificado por mí.**
- 13/11 (pendiente informado): Wasender no ofrece vincular con un código de 8 caracteres desde un programa; solo QR y un método con extensión de navegador. **No implementado; abierto.** Claude preguntó dónde estaba la opción del código en el panel de Wasender.
- 15/11 04:41 UTC: Claude publicó la **corrección del bot** (cuando alguien acepta una llamada, recibe la confirmación). Antes de publicar pasaron 486 pruebas, lint y build. **Publicado.** Claude aclaró que la corrección todavía no se vio en una charla real.
- 15/11 (decisión): lanzamiento con **20 envíos por día por línea**, con revisión una semana antes de subir. **Decidido; el chat no confirma que ya esté aplicado.**
- 15/11: tope por contacto de **3** mensajes sin respuesta, sumando todos los caminos. **Aprobado.**
- 15/11 (decisiones sobre crisis y datos): líneas de ayuda y cartel de urgencia en el panel (aprobado); el bot no da precios (aprobado); ante denuncia o amenaza, disculpa breve, corte y aviso (aprobado). **Implementación no confirmada.**
- 15/11 (laboratorio del bot): pedido de rehacerlo simple, con gráficos, para probar bots generales y campañas (A/B), y que las pruebas no alteren los bots predeterminados. **Pedido; estado no confirmado.** Prueba A/B aprobada en campañas.
- 17/11: la responsable reportó que al reanudar una campaña faltaba la línea de Wasender; que solo aparecían las líneas de Wasender sin las de Meta; y que las líneas de Meta se habían eliminado por error. **Pedido de reparar (eliminaste el numero principal… volve a agregarlo). Estado: abierto en el chat.** «Hay que separar» Wasender de Meta (17/11 08:59).
- Número de plan de Wasender: **6 líneas** (10/11 13:34).

**5.6 Bot y seguimiento automático**

- 12/11–13/11: la ruta de seguimiento quedó automática. Regla que informó Claude: a los 3 días sale un mensaje más; si pasan 24 horas sin respuesta, la persona pasa sola a Caídos. «Para recuperar» ya no existe: los Caídos están en Descartados. **Publicado (según Claude, 13/11).**
- 14/11 (revisión de la primera tanda real, informe de solo lectura generado el 15/11 12:00 UTC por una tarea programada): vencieron 2 seguimientos del Jurídico el 14/11 a la noche; en los dos el bot decidió no insistir y la persona pasó a Caídos. Hay 11 seguimientos programados para el 16/11 (10 de Jurídico y 1 de Coberturas), de los cuales **5 son de personas que ya están en Perdidos**. Hay 3 seguimientos cancelados porque la persona fue captada antes. Claude propuso cancelar las 5 y que pasar a Perdidos o captar cierre el seguimiento siempre. **Propuesta sin respuesta de la responsable en el chat.**
- 13/11: Claude informó el reconocimiento de las 67 conversaciones «quedaron sin respuesta»: ninguna había concretado una llamada (las que sí concretaron pasaron a Captados). En Marketing, 61 eran contestadores automáticos de otros negocios y pasaron a Perdidos.
- 13/11: el bot v2 se mejoró sin borrar lo existente (orden de la responsable). **Implementado según Claude; no verificado por mí.**
- 14/11–15/11: plantillas de inicio por rubro con variables y ritmo al azar (orden de 14/11). **Implementado según Claude; el chat no confirma el detalle.**
- 15/11: laboratorio del bot y asistente general con gráficos simples (órdenes 15/11). **Estado: pedido; sin confirmación de cierre en el chat.**

**5.7 Panel: separación por rubro, Hoy, Chats y Contactos**

- 13/11 (informe de Claude, corrida de las 8:51): rubros separados. Recorrió 440 pantallas siguiendo cada enlace y ninguna sacaba de su perfil; las 1.361 personas y chats de las listas eran del perfil correcto. Incidencias pasó a ser por perfil. Salud muestra solo lo de ese perfil y lo del sistema. Ajustes generales dentro de cada perfil. **Publicado y comprobado según Claude.**
- 13/11: Hoy y las listas muestran los mismos números. Toda tarjeta de persona abre su ficha o su chat. **Publicado según Claude.**
- 13/11: pendiente de la corrida de las 14:51: quitar de Hoy lo que no lleva a una acción; estadísticas con embudo y origen; asistente con permiso para todo; diseño llamativo (no empezado). **Quedó pendiente según Claude.**
- 13/11 18:34: Claude dejó el traspaso `docs/mejoras-1311/handoff-legal-crm.md` (sin código de acceso), subido a la rama y a `main` según Claude. **Publicado según Claude.**

**5.8 Auditoría de seguridad**

- 13/11: la sesión, los webhooks y la base quedaron bien protegidos según Claude. Quedan **cuatro avisos de dependencias sin resolver**: el arreglo automático rompía la compilación y Claude lo deshizo. Hay que planificar la subida de versión (Next y React). **Pendiente.**
- El chat dice que el proyecto usa Next.js 15.5 y React 19 desde el 13/11 (commit «Next 15.5 y React 19: dependencias»). Ver CONTRADICE.

**5.9 Otras partes del chat**

- 09/11 09:06: la responsable pidió vincular las palabras clave de redes con el conocimiento del bot, sin tocar lo existente (09/11 09:12). **Implementado según Claude; no verificado.**
- 14/11–15/11: reporte de bots: Gemini relee conversaciones y propone mejoras; se puede aplicar manual o con el asistente (orden 14/11). **Estado: pedido; el informe de 15/11 existe en Bot IA.** Claude no aplicó ninguna propuesta sin autorización; la responsable dijo que aplicara tres: consulta de turno médico, oferta baja de aseguradora y «Sí, quiero ver» en Autos (propuesta de Claude en 15/11 04:45; la responsable pidió aplicarlas).
- 16/11 (planificado): envíos de Wasender arrancan el lunes 16/11 (según Claude, 15/11 04:41).

## 6. Todo lo concreto (archivos, ramas, commits, Metricool, plantillas)

**Repos de trabajo**

- `EzequielGonz/LEGAL-CRM`: panel. Rama de trabajo del chat `cerebro-chats` (esta memoria; creada desde `main` para este volcado).
- Ramas mencionadas en el chat:
  - `claude/gracious-volta-rv2f3x`: rama de trabajo de Wasender y de las landings (indicada por la responsable el 08/11 y el 10/11). Sin PR abierto (no confirmado). **Qué hacer:** revisar y decidir si se integra o se archiva.
  - `claude/happy-wozniak-ajfi1z`: rama indicada por la responsable el 20/11 04:30 para el trabajo de redes del 20/11 en adelante. **Estado: no confirmado.**
  - `cerebro-chats`: rama de la memoria. No integrar a `main` salvo decisión.
- Repos de landings (no son LEGAL-CRM): `estudio-juridico-vita-final`, `coberturas-sociales-landing`, `0km-kocos-agencia`, `agencia-kocos-mkt`. Ver 5.2.

**Commits de LEGAL-CRM citados en el chat (según la salida de git log)**

- `bf0b396` 20/11 03:09 «Claude Traspasos: estado del 18/11 y contexto de Metricool por marca».
- `d4e7a58` 18/11 06:58 «Botones que cambiaban de perfil y velocidad de Hoy y Campañas».
- `f581a9e` 17/11 09:06 «Meta y Wasender separados en los cuatro perfiles».
- `454e981` 17/11 08:53 «Campañas: “qué falta para lanzar” se vuelve a consultar al guardar la configuración».
- `e145d40` 17/11 08:38 «Campañas: cambiar el método de envío entre Meta y Wasender sin recrearla».
- `6ecd995` 15/11 08:54 «Estado: Asistente en su pantalla, Laboratorio simple y migración 0633».
- `15b2638` 15/11 05:56 «Bloque 1 (bots): pruebas, ajustes de crisis, enojo y aceptación; migración 0620 aplicada».
- `edd5669` 15/11 04:53 «Cierre por rubro al captar: el bot agradece y confirma, sin dejar en visto».
- `ee074a6` 14/11 08:43 «Documentos: la corrección de la confirmación quedó publicada».
- `27feeaa` 14/11 06:39 «Bot v2: 12 fichas nuevas por rubro, más contestadores reconocidos, sin pedir texto ante stickers».
- `686b4f6` 14/11 06:17 «Wasender: ritmo humano (plan del día, tandas variables, texto al azar sin repetir…)».
- `e4b0892` 13/11 17:20 «Hoy solo con lo que lleva a una acción; embudo del período en Resultados».
- `20d2faa` 13/11 12:01 «Cada rubro separado: perfil activo, Incidencias y Salud por perfil…».
- `b095207` 13/11 17:39 «Asistente con permiso para todo: catálogo de operaciones y menú a medida».
- `bbc29bc` 13/11 17:44 «Seguridad: política de contenido, sin optimizador de imágenes y planillas sin “xlsx”».
- `9f7f5e0` 13/11 09:22 «Plan 4: grupo “Posible captación a revisar” para los casos dudosos».
- Antes del 13/11 hay commits de «Plan 3» y «Plan 4» (ver `docs/ESTADO.md` en el repo).
- Commits de despliegue de Vercel vistos en la salida (rama `main`): `5c91da00` #75 «Chat: adjuntar PDF (documento de WhatsApp)»; `ca4f1eea` #74 «Pedido de plantillas a Meta por tandas»; `bf698c1f` #73; `9ee094a3` #72 «Conocimiento del bot por versiones (v1/v2) + plantillas sin botones»; `3f823760` #71 «Detención sin apagar al agente; recontacto revisa las respuestas recientes…».

**Archivos y rutas (LEGAL-CRM, según el chat)**

- `CLAUDE.md`, `docs/ESTADO.md`, `.claude/referencias/reglas-comunes.md`, `.claude/referencias/casos-de-aceptacion.md` (leídos).
- `docs/mejoras-1311/` (planes 3 y 4, auditoría `AUDITORIA.md`, traspaso `handoff-legal-crm.md`).
- `docs/redes/programadas.jsonl` (registro de piezas programadas, por marca). `docs/redes/perfil-profesional/vita/` (estética aprobada del feed).
- `.ai-context/handoff-redes-4-marcas.md` y `.ai-context/indicaciones-chat-nuevo-redes.md` (leídos el 20/11).

**Migraciones (Supabase)**

- `0620`: aplicada según el commit `15b2638` (15/11). Bots y reglas de bloque 1.
- `0633`: mencionada en el commit `6ecd995` (15/11). **Estado de aplicación no confirmado.**
- Según el chat, las tablas nuevas tienen RLS y acceso solo con la clave de servicio del servidor. Ningún cliente lee variables privadas.

**Metricool**

- IDs de marca: `7242607` (Kocos Marketing), `7549864` (Estudio Jurídico VITA), `7549939` (Compara tu Obra Social), `7552104` (Automotores Kocos).
- Publicaciones: ver 5.3 y 5.4. Lista de piezas por fecha y hora: **no consta en el chat**; la fuente está en `docs/redes/programadas.jsonl` y en la tabla del 20/11 06:02 UTC.
- Historias de destacadas: 81 historias del 20/11 (de 1:28 a 1:50). Pedido de verificación con `getScheduledPosts`. **Resultado: no confirmado.**

**Tareas programadas (scheduled tasks) mencionadas**

- 09/11 07:50 (modelo Opus 5.5 con esfuerzo extra), 13/11 08:51 (corrida nocturna con informe), 13/11 14:51 (corrida de tarde), 12/11 13:50, 20/11 05:55 (retomar), 20/11 10:49.
- Dos tareas programadas identificadas en el chat: `trig_016fRYSEWByrNRk8BS3tfK8H` («Revisar el primer seguimiento real del panel», 15/11 12:00 UTC) y `trig_018N1mFkkgyxyFcaZuaAkkYG` («Informe de resultados de redes (10 al 19/11)», 20/11 13:00 UTC; pedía commit y push a `claude/gracious-volta-rv2f3x`; **resultado no confirmado**).

**Artefactos fuera del repo (en el entorno de la sesión)**

- `redes2/piezas.html` (generador de piezas), `redes2/out/` (40 PNG 4K y 4 MP4), `redes/plan-redes.html` (plan con tabla de competidores argentinos, opciones de producción A–E y objetivos de alcance), `entrega/redes-4k-*.zip`.

**Enlaces**

- Panel: https://legal-crm-nine.vercel.app/perfiles (y /campanas, /landing).
- Sesiones: https://claude.ai/code/session_01FuLgnjHoiZTXHqrkcEnPGW (esta), 1c5e48b1-8c15-562d-9a3b-84e2db7fcbb6 (sesión de trabajo de Code).

**Cambios de configuración fuera del código**

- Vercel: plan pagado (08/11, por la responsable). Variables mencionadas solo por nombre: `WASENDER_PAT`, `WASENDER_CLAVE_CIFRADO`, `SITE_URL` (en landings; se le dio prioridad a `www`). Deployment Protection / Protection Bypass for Automation (10/11, no confirmado).
- Metricool: permisos actualizados por la responsable (09/11 11:25) y cuenta de Instagram de Kocos Marketing reconectada (18/11).
- Wasender: plan de 6 líneas. Líneas por QR.
- Meta: sin cambios nuevos desde el 14/11; la responsable pidió no tocar nada de Meta, pero el 17/11 pidió reincorporar el número principal para cargar campañas con números existentes. **Estado: pendiente.**

**Qué quedó encendido o apagado por este chat**

- **Encendido:** seguimiento automático de WhatsApp (regla de Caídos a 24 h; motor encendido el 13/11). Envío por Wasender en Preview y producción según el 10/11–15/11 (no confirmado en producción: los envíos de Wasender arrancan el 16/11 según Claude). Corrección del bot (cuando se acepta una llamada, recibe confirmación; publicada el 15/11).
- **Apagado / no tocado:** pausa general (según el chat, levantada el 16/10 para no iniciar campañas, «sin iniciar campañas»); campañas en pausa; agentes de la IA apagados; prueba A/B de campañas: solo sobre campañas, nunca sobre los bots predeterminados.
- **Pendiente de decisión:** activar o no el envío automático de 20 por día por línea.

## 7. Datos del negocio que aparecieron

- Cuatro marcas, cuatro perfiles (ver encabezado). Jurídico: áreas Civil y Penal (Penal dentro de la línea de Civil con roles separados, decidido el 01/11, no implementado en esa fecha).
- Plan de Wasender: 6 líneas (10/11).
- Límite de envíos: 20 por día por línea al lanzar (15/11, decidido); tope de 3 mensajes sin respuesta por contacto (aprobado).
- Horarios de publicación (20/11 06:02 UTC): reels 08:50 a 20:50 (de 20 al 24/11), 08:30 a 20:30 (25/11), 07:30 a 20:30 (26 al 29/11); historias de 08:00 a 21:30; carrusel 11:00 u 11:20.
- Volumen (20/11 nuevo cronograma): 15 piezas nuevas por marca por día (20 al 25/11) y 17 (26 al 29/11). 632 piezas en 10 días. 1.264 publicaciones.
- Objetivos de alcance IG al tercer mes: VITA 6.000; Coberturas 3.500; Autos 0 km 3.000; Marketing 3.500.
- Reglas de contenido: no inventar precios ni resultados; no testimonios; Coberturas no recomienda una prepaga; Autos sin afirmaciones de stock ni financiamiento; Jurídico respeta las normas del Colegio de Abogados (según el informe de contenido del 08/11, citado en el chat).
- Precios de packs de Marketing: el bot no los da (15/11).
- Datos que la responsable pidió cargar en las fichas de los bots, **no provistos en el chat**: Autos (marcas, formas de pago, requisitos); Jurídico (si la primera revisión es gratis); Coberturas (zonas); Marketing (qué incluye la propuesta inicial).
- Números de WhatsApp de las marcas aparecen en el chat (líneas de negocio). **No se copian acá.**
- Proveedores y servicios: Vercel (Hobby), Supabase, Metricool, Wasender (líneas por QR), Gemini (único proveedor de IA por ahora; se pueden agregar otros con un enlace), Playwright (render de piezas), GSAP (animación).

## 8. Pendiente, a medias o bloqueado

1. **WhatsApp:** Wasender no tiene vinculación por código de 8 caracteres (solo QR y extensión de navegador) según Claude; la responsable pidió vincular con código (13/11). **Bloqueado hasta que la responsable muestre dónde está la opción** (captura o panel de Wasender).
2. **Numeros de Meta:** la responsable pidió (17/11) reincorporar el número principal de Meta para cargar campañas con los números que ya existían, y separar Wasender de Meta. **Abierto.**
3. **Reanudar campañas:** error «falta cargar la línea de Wasender» (17/11). **Abierto.** La campaña «ART - TEST WASENDER» tiene una línea archivada; hay que asignarle una línea conectada antes de reanudarla (15/11).
4. **Coberturas y Autos sin línea de Wasender cargada** (15/11). **Abierto.**
5. **Seguimiento:** la propuesta de cancelar las 5 tareas de personas que ya están en Perdidos antes del 16/11 a las 8:05 (15/11). **Sin respuesta en el chat.**
6. **Seguridad:** cuatro avisos de dependencias de Next/React sin resolver (13/11). **Pendiente.**
7. **Vercel:** plan Hobby (1 hora de logs); el log de errores del 20/11 muestra límite de uso de 5 horas alcanzado (13:02 UTC y 05:57 UTC del 21/11). **Pendiente de decisión** de plan (la responsable no aprobó gastos).
8. **Panel:** diseño llamativo (no empezado al 13/11); asistente con permiso para todo (programado; estado no confirmado); laboratorio del bot simple (pedido 15/11; estado no confirmado); estadísticas con embudo y origen (pedido 13/11).
9. **Redes:** cronograma nuevo del 20/11 al 29/11: programación en Metricool **no confirmada** en el chat. Piezas en borrador: lo jurídico nuevo (laboral y penal) y el fallo de la Corte de Coberturas (hasta revisión profesional o aprobación de la responsable); el aumento de prepagas (no se publica); el de patentamientos (no se publica); Black Friday de Autos (se publica, sin números reales).
10. **Publicaciones de Kocos Marketing** que no subieron el 18/11: reintento **no confirmado**.
11. **Landings:** rediseño con más efecto «wow» (09/11) y revisión visual en un celular real (pendiente desde 01/11). **No confirmado como cerrado.**
12. **Rotación de secretos:** la responsable pidió (01/11) rotar los secretos pegados en el chat. **No confirmado.** Ver sección 9.
13. **Documentación:** `docs/etapaN/` (ENTREGA, INFORME, MIGRACIONES) para cada entrega de código del chat (regla de CLAUDE.md). **No consta que se haya creado.**
14. **Redes (informe 10–19/11):** el informe `docs/redes/INFORME-RESULTADOS-2026-11-20.md` pedía commit y push a `claude/gracious-volta-rv2f3x`. **Resultado no confirmado.**
15. **Pedido de repos al Word (20/11 08:35):** la lista de repos se pidió para un documento Word. **No confirmado si se entregó.**

## 9. Aprendizajes

Lo que funcionó, lo que no y cómo se resolvió (según el chat):

- **Vercel desactivado por pago (08/11):** el panel no respondía. La causa fue `DEPLOYMENT_DISABLED` del plan Hobby con pago pendiente. Se resolvió pagando y desbloqueando el proyecto.
- **Vercel no permitía desplegar sin navegador (09/11):** hubo que usar Opera (navegador conectado) y que la responsable hiciera «deploy to production» a mano.
- **Preview y producción comparten base y líneas:** probar en Preview tiene efecto real. El bot puede volver a escribir a las 2 horas si no se toma el chat (10/11). Regla: al terminar una prueba, «Tomar el chat».
- **Vercel Hobby retiene 1 hora de logs:** las consultas de logs de más de 1 hora fallan con `bad_request` (08/11).
- **Canónicos y `www`:** el dominio sin `www` redirige 308 a `www`. Se corrigió para que los sitemaps y canónicos apunten a `www` (08/11).
- **Metricool:** algunas publicaciones de Instagram fallan por restricciones de cuenta o por conexión caída; hay que reconectar la cuenta en Metricool y reintentar (18/11).
- **Claude y la compactación de sesión:** la responsable pidió puntos de control y tareas programadas para retomar; varias veces hubo que reiniciar la tarea. Los errores de «límite de uso» (5 horas) se vieron el 20/11 y el 21/11 (`usage_limit_reached`).
- **Seguimiento automático real (14/11):** dos personas pasaron a Caídos por decisión del bot; el resto no salió aún. Se detectó que cinco tareas programadas eran de personas en Perdidos (propuesta: cancelar y cerrar el seguimiento al pasar a Perdidos o captar).
- **Estadísticas:** la responsable no encontró útiles las métricas básicas (13/11). Se pidió un embudo y el origen de cada cliente.
- **Riesgo de plataforma:** la responsable pidió reversionar piezas para que Meta no las detecte como duplicadas (20/11 06:00). Esto va en contra de las reglas de originalidad de Instagram que Claude citó el 08/11. **No evaluado en el chat; riesgo a revisar.**
- **Código de ingreso del panel:** la responsable lo pegó en el chat varias veces (12/11 a 20/11). Claude lo usó solo como variable de entorno y no lo guardó en archivos (según Claude). Pero queda escrito en el historial del chat: **[secreto: código de ingreso del panel — hay que cambiarlo]**. La responsable dijo que lo cambiaría. Claude también lo advirtió el 15/11 («Código de acceso: cambialo, que quedó escrito en el chat»).
- **Secretos pegados:** el 01/11 la responsable pidió rotar los secretos pegados en el chat. El chat anterior también menciona un PIN de ingreso del 19/10 para rotar. **[secreto: PIN de ingreso del 19/10 — no confirmado si se rotó]**.
- **Clave de servicio de Supabase:** en el chat se menciona la clave de servicio solo como nombre y regla (no aparece el valor). **No se encontró una clave de Supabase expuesta en el texto del chat**, según la revisión de patrones (`service_role`, prefijos de claves y variables `SUPABASE_SERVICE_*`). Igual conviene confirmar que no quedó copiada en ningún registro.
- **Token de Wasender:** se cargó en Vercel (`WASENDER_PAT`); no aparece el valor en el chat (verificado). Clave de cifrado: igual (`WASENDER_CLAVE_CIFRADO`).

## 10. Preguntas abiertas

1. ¿Wasender tiene la opción de vincular por código de 8 caracteres? ¿Dónde se ve en el panel de Wasender? (13/11 Claude preguntó.)
2. ¿Se reincorpora el número de Meta para campañas con números existentes, y se separa de Wasender? (17/11.)
3. ¿Se cancelan las 5 tareas de seguimiento de personas en Perdidos antes del 16/11 a las 8:05? (15/11.)
4. ¿Se enciende el envío de 20 por día por línea ya, o se espera la revisión de una semana? (15/11.)
5. ¿Qué respuesta del bot aplica la responsable en el caso de «¿de dónde sacaron mi número?» (decisión tomada: pedir disculpas y decir que no hay registro; registrar el origen de cada base y que lo revise un abogado de datos personales)? (15/11.) El chat dice «Aca se respeta como esta armado hoy», lo que deja la revisión legal abierta.
6. ¿Qué pasó con las 4 publicaciones fallidas del Instagram de Kocos Marketing (18/11) y con las historias de destacadas del 20/11?
7. ¿Se confirma la programación completa del cronograma 20/11–29/11 en Metricool (cuántos reels y publicaciones cargados)? (20/11 05:52.)
8. ¿Plan de Vercel: se mantiene Hobby o se pasa a Pro? (límite de uso alcanzado el 20/11.)
9. ¿Se publica la revisión de las cuatro dependencias de Next y React (13/11)?
10. Datos para las fichas de los bots (Autos, Jurídico, Coberturas, Marketing) (14/11). Ver sección 7.
11. ¿Se paga el crédito automático si se acaba el límite, o se frena? (20/11 07:23: la responsable lo dejó activado con «frena» si se detecta; regla de CLAUDE.md: no pagar sin autorización expresa.)
12. ¿Las piezas de Black Friday de Autos y las reversiones se hacen sin números reales? Confirmado el 20/11 06:06 («black friday mandale, pero sin numeros reales»).

## 11. RAMAS Y CAMBIOS

**Ramas**

- `cerebro-chats` (LEGAL-CRM): creada para esta memoria desde `main`. Contiene `cerebro/chats/` con este archivo y los de otros chats. **No integrar a `main` salvo decisión.** Sin PR.
- `claude/gracious-volta-rv2f3x` (LEGAL-CRM): rama de trabajo de Wasender y de las landings. **Sin PR abierto (no confirmado).** Qué hacer: revisar lo que contiene y decidir si se integra a `main`.
- `claude/happy-wozniak-ajfi1z` (LEGAL-CRM): indicada el 20/11 para el trabajo de redes del 20/11 en adelante. **Estado: no confirmado.** Qué hacer: integrar o archivar tras revisión.
- Landings (`estudio-juridico-vita-final`, `coberturas-sociales-landing`, `0km-kocos-agencia`, `agencia-kocos-mkt`): cambios publicados en `main` el 08/11. La rama `claude/gracious-volta-rv2f3x` de cada repo quedó con el enlace de creación de PR; **no hay PR**. Qué hacer: archivar la rama, o abrir PR si la responsable lo pide.

**Commits**

- Ver sección 6 (LEGAL-CRM) y 5.2 (landings). Los commits más importantes para el panel son los de 13/11 y 15/11.

**Archivos tocados por carpeta (LEGAL-CRM, según el chat)**

- `docs/`: `ESTADO.md`; `docs/mejoras-1311/*` (planes, auditoría, traspaso); `docs/redes/*`.
- `src/`: componentes de perfiles, Hoy, Chats, Contactos, Campañas, Wasender y laboratorio del bot. Lista exacta: ver los commits de la sección 6.
- `supabase/migrations/`: `0620`, `0633`.
- `.ai-context/`: `handoff-redes-4-marcas.md`, `indicaciones-chat-nuevo-redes.md` (leídos).

**Migraciones de base**

- `0620`: aplicada (commit `15b2638`, 15/11).
- `0633`: estado no confirmado (commit `6ecd995`, 15/11).

**Despliegues**

- LEGAL-CRM (Vercel, proyecto `legal-crm`): producción por commits de `main`. Despliegues citados: #71 a #75 (ver sección 6). Último commit visto en producción: `5c91da00` (#75).
- Landings: pushes directos a `main` (08/11). Cada uno con su propio proyecto en Vercel.
- Corrección del bot (15/11 04:41 UTC): publicada.

**Cambios de configuración fuera del código**

- Vercel: pago de la suscripción (08/11, por la responsable). Variables por nombre: `WASENDER_PAT`, `WASENDER_CLAVE_CIFRADO`, `SITE_URL`. Deployment Protection (10/11, no confirmado).
- Metricool: permisos actualizados (09/11). Cuenta de Instagram de Kocos Marketing reconectada (18/11).
- Supabase: migraciones 0620 y 0633 (ver arriba). Sin cambios de clave.
- Meta: sin cambios nuevos desde el 14/11. Número principal de Meta eliminado por error y pedido de reincorporar (17/11).
- Google: no se tocó nada del chat.
- Redes: publicaciones programadas en Metricool (ver sección 5.4). No se activó ningún envío de Meta.

## 12. CONTRADICE:

- **CONTRADICE: Next.js versión.** El chat (resumen del 08/11) dice «Next.js 14», pero CLAUDE.md dice «Next.js 15.5» y el commit del 13/11 dice «Next 15.5 y React 19». La versión vigente es 15.5. Conviene corregir el resumen viejo.
- **CONTRADICE: «Nada se activa solo» vs. automatización pedida.** CLAUDE.md dice que nada se activa solo y que publicar código no habilita envíos. La responsable pidió expresamente que el seguimiento quedara «prendido» (13/11) y que el crédito automático se activara con freno (20/11). El mandato de la responsable prevalece, pero hay que dejarlo escrito y revisable.
- **CONTRADICE: pago automático vs. «no se paga nada sin autorización expresa».** CLAUDE.md (20/11) dice que no se paga nada sin autorización expresa. El 20/11 la responsable dejó activado el paso a créditos automáticos «cuando detectes eso, frena». Es una autorización condicional; conviene confirmar el alcance.
- **CONTRADICE: código de acceso.** CLAUDE.md dice que el código de ingreso no se guarda en archivos ni se pide en el chat. La responsable lo pegó en el chat repetidamente (12/11 a 20/11). Claude no lo guardó en archivos; el texto quedó en el chat. Hay que cambiarlo.
- **CONTRADICE: piezas en borrador.** Claude propuso dejar en borrador Black Friday de Autos, aumento de prepagas, patentamientos y piezas jurídicas. La responsable decidió publicar Black Friday sin números reales, no publicar prepagas ni patentamientos (20/11 06:06). La decisión de la responsable reemplaza la propuesta de Claude.
- **CONTRADICE: Wasender y código de vinculación.** La responsable pidió (13/11 12:25) vincular las líneas de Wasender también con «la función del código». Claude informó que la documentación de Wasender no ofrece vincular por código de 8 caracteres. Hasta que se confirme, esta orden no se puede cumplir.
- **CONTRADICE: «No hay nada programado» (08/11).** Claude había dicho que sí había piezas programadas; la responsable lo corrigió.
- **CONTRADICE: reversión de piezas para evadir detección de duplicados (20/11).** La orden es subir reversiones «para que Meta no nos detecte» como duplicadas. Va contra las reglas de originalidad de Instagram que citó Claude el 08/11. No se evaluó en el chat.
- **CONTRADICE: versión de la cuenta de Metricool.** Claude informó el 10/11 que la cuenta de Instagram de VITA estaba restringida; la responsable dijo el 09/11 que el estado de VITA estaba destrabado. Las dos cosas pueden ser ciertas en fechas distintas, pero no hay confirmación del estado actual.
