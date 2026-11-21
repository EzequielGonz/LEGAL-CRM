# C · Recorrido del panel de producción (solo lectura)

Fecha del recorrido: sábado 21/11/2026, de 05:10 a 05:40 (hora del servidor). Sitio: legal-crm-nine.vercel.app.
Cómo: Playwright con Chromium, escritorio 1440x900 y celular 390x844, con el código de ingreso usado solo para entrar (no figura en ningún archivo). No se hizo clic en ningún botón que guarde, envíe, lance, archive, edite, conecte, pause o borre; no se escribió en formularios; no se abrió ningún chat (para no marcar nada como leído) y se abrió una sola ficha, solo para leer su estructura.
Cobertura: 4 perfiles x 17 pantallas (más 5 pantallas propias de Marketing), 16 pantallas comunes y la ficha de un contacto. 78 pantallas en escritorio y las mismas 78 en celular. Todas respondieron 200, sin errores de consola, sin respuestas HTTP 4xx/5xx en la carga.
Capturas en `/home/user/cerebro-privado/analisis/capturas/` (prefijo `desk-` y `mov-`). Se borraron las capturas de pantallas que muestran nombres y teléfonos de prospectos (Hoy, Chats, Contactos, Prospectos, Oportunidades, Resultados, Descartados, Limpieza, Incidencias, Seguimiento, Consultas directas, Presupuestos). Esas pantallas están descriptas solo con cifras.

Qué NO se pudo mirar: el detalle de un chat (`/inbox/[id]`, `/conversacion/[id]`), el interior de las secciones plegadas «Más opciones», los grupos plegados de Ajustes, el interior del chat del asistente («Pedile algo») ni los detalles que solo aparecen al tocar «Ver quiénes» o «Ver texto y asignar». Una pasada de lectura en celular alcanzó para ver la estructura, no el uso real.

Medición de velocidad: de 3,2 a 5,3 s hasta red inactiva desde este entorno (el cerebro dice 0,3–1,6 s a la vista; no son comparables: acá se mide hasta que termina de cargar todo). `/perfiles` tardó 5,3 a 6,3 s y `/derivar` 5,3 s; `/oportunidades` 4,7 s; `/redes/perfiles` 5,0 s.

---

## 1. Estructura general (igual en los 4 perfiles)

- Ingreso: pantalla «lámpara» con un código de 6 u 8 dígitos. Entra a `/perfiles`.
- `/perfiles` («¿Con qué perfil trabajás?»): 4 tarjetas (Estudio Jurídico VITA, Automotores Kocos, Compara tu Obra Social, Kocos Marketing) y a la derecha el panel «En vivo» (Hoy / Base completa), con 9 contadores por perfil, todos en 0 ese día. Ese panel todavía existe en producción aunque el cerebro dice que se pidió quitarlo el 19/11; además recorta los nombres («Estudio Jurídic…», «Compara tu Ob…») y la cuarta tarjeta queda cortada al pie.
- Menú lateral (escritorio) o barra inferior de 4 íconos más «Menú» (celular): Trabajo = Hoy, Chats, Contactos, Campañas. Configurar = Bot IA, WhatsApp oficial (Meta), WhatsApp por QR (Wasender), Redes, Ajustes. Abajo: «Bandeja para Claude», «Pedile algo», Modo oscuro, Cambiar de perfil, Cerrar sesión.
- Encabezado fijo con migas («Estudio Jurídico VITA / Hoy»), fecha y un botón «Pedile algo».
- Dos avisos permanentes arriba de TODAS las pantallas: (1) ámbar, «Cambiá el código de ingreso. El de 6 números todavía sirve…» con enlace «Cambiar el código»; (2) rojo, «1 problema(s) frenan la operación. 1 mensaje(s) que entraron quedaron retenidos por seguridad…» con «Ver qué hacer».
- Al pie de cada pantalla hay un bloque plegado «Más opciones ▾» (clase `mas-opciones`) sin pista de qué contiene.
- Accesibilidad de base: `lang="es"`, un solo `h1`, `main`, 3 `nav`, enlace «Saltar al contenido», texto base 16 px, sin imágenes sin texto alternativo relevantes.
- Cada perfil toma su color de marca (dorado, celeste, verde, naranja) en tarjetas, botones y tabs activos.

## 2. Pantalla por pantalla (con cifras por perfil)

Convención: J = Jurídico, C = Coberturas, A = Autos 0 km, M = Marketing.

### 2.1 Hoy (`/hoy?perfil=`) con pestañas Resumen · Resultados · Historial · Salud del sistema
- Qué muestra: saludo, aviso «N personas captadas esperan el llamado hace más de 24 horas», cuatro chips de estado (línea con calidad, campaña, bot con nota sobre 100, Wasender si hay), y dos columnas: «Atención humana» (escribieron y el bot no contesta) y «Captados para derivar», con botones Responder/Ficha y Derivar/Chat.
- Cifras: J atención humana 5, captados para derivar 15 (aviso dice 13 con más de 24 h), bot 37/100. C atención 0, captados 2, bot 32/100. A atención 1, captados 4, bot 46/100. M atención 3, captados 2 (5 «derivados sin resultado» en «También hoy»), bot 40/100.
- Funciona: se carga, se ve el estado real de línea y campaña, botones visibles.
- Problemas:
  - Los chips de estado de campaña se cortan en seco sin puntos suspensivos en escritorio («…la línea de W», «…califica la línea AGENCIA 0KM») y con puntos en celular: el motivo de pausa no se alcanza a leer.
  - Los motivos de pausa muestran texto crudo: C «Campaña pausada · ad», M «Campaña pausada · domingo» (un sábado).
  - «Atención humana» y «Captados» incluyen casos de hace 4 a 9 semanas (septiembre y octubre) rotulados «Oportunidad real» o «Más de 24 h». La etiqueta «Más de 24 h» no distingue 2 días de 28; falta antigüedad en días.
  - Tres entradas a «Pedile algo» en la misma pantalla (encabezado, botón junto al saludo y tarjeta del menú).
  - Los dos avisos globales más el aviso de captados dejan los datos de acción bajo el pliegue en celular (ver 4).

### 2.2 Chats (`/inbox`, `/panel/<perfil>/chats`, `/conversaciones`) · Activos · Todos los chats · [Consultas directas en M] · Descartados · Incidencias
- Activos (J): Para cerrar 15, Te escribieron 6, Oportunidades reales 3, Hablando ahora 7; «Posible captación a revisar» y «Agendaron» en cero. Cada fila tiene Derivar y Chat. Filtros: Todas / Esperan tu respuesta / Los atiende una persona / Más filtros (base, respuesta, canal). Etiquetas por fila: área, canal (Meta/Wasender), Detenido, Te escribió, Requiere atención humana.
- Descartados: J Caídos 40, Perdidos 79, No quieren que les escriban 63. C, A: no se leyó el detalle. M (al abrir `/descartados` sin parámetro quedó en Marketing por la cookie): Caídos 168, Perdidos 66, No quieren que les escriban 27, Sin respuesta 1.
- Funciona: listas rápidas, orden por último mensaje.
- Problemas:
  - Cifras de «esperan a una persona» incoherentes entre pantallas (ver hallazgo 7).
  - En C y M hay chats cuyo título es el número de teléfono y cuyo último mensaje es «👋 <número>, quiero ayudarte con tu consulta»: el saludo automático se arma con el teléfono donde iría el nombre. Los mismos dos números aparecen como chats tanto en Coberturas como en Marketing (separación de rubros comprometida o números de prueba).
  - Chats de Coberturas muestran que el bot se presenta como «Nancy de Compara tu Obra Social», mientras que el informe del bot de Jurídico califica como falla grave «la invención de nombres de pila para el asesor virtual (Nancy)».
  - M tiene un chat con «Mensaje que no se puede mostrar».
  - «Todos los chats» en J: las filas de campaña muestran «Vos: Primer mensaje de la campaña «…»»: es texto técnico en vez del mensaje real.

### 2.3 Contactos (`/contactos`) · Etapas · Citas · Seguimiento · [Prioritarios · Piden presupuesto en M] · Por base
- Etapas (embudo de 6): J 7.852 personas (4.431 sin contactar, 3.207 sin respuesta, 214 respondieron, 55 en conversación, 17 captados, 2 derivados). C 1.316 (451 / 776 / 89 / 32 / 2 / 0). A 1.898 (1.265 / 566 / 67 / 43 / 4 / 0). M 1.663 (468 / 924 / 271 / 171 / 7 / 5).
- Citas (`/agenda`): J, C, A, M con 0 citas. La pestaña llamada «Citas» muestra además contadores «Captados sin derivar», «Seguimientos (69)» y «Atención humana (14)», que no son citas; tabla vacía «No hay pendientes en esta sección».
- Seguimiento: explica la ruta (mismo día, 2–3 días, último intento, nunca respondió, cuándo suelta). Cifras: J programados 11, enviados 0, soltados 40, para revisar 12; C 0/0/27/1; A 0/0/39/0; M 0/0/50/0. J tiene 12 «Necesitan revisión» (todos «Contacto 2 · Conflicto de horario … venció el plazo de 72 horas sin una franja válida: no se envía y queda para revisión», con botones Reintentar y Descartar). Es la pantalla con más elementos clicables pequeños (94 en escritorio, 72 en celular).
- Por base: lista de bases con contadores (contactos, sin contactar, sin respuesta, respondieron, captados).
- Prospectos (`/prospectos`, solo J, sin enlace en menú): tabla de 7.852 con nombre, teléfono, área y estado, paginada. Muestra teléfonos completos en la tabla.
- Oportunidades (`/oportunidades`): 7.852 en 158 páginas, orden y listas (Nuevos, En conversación, En seguimiento, Captados, Perdidos, Captados fuera de AMBA, Captados con ubicación sin confirmar…). Más lenta de las pantallas (4,7 s).
- Problemas: «Citas» mal rotulada; «Seguimientos 69» no coincide con 11+40+12; el embudo de M cuenta 5 derivados y la pestaña «Clientes derivados» muestra 5, pero dos de ellos dicen «Espera a una persona» (no «Derivado»).

### 2.4 Campañas (`/campanas`, `/panel/<perfil>/campanas`) · Campañas · Bases [· Extraer negocios en M]
- Resumen superior: «Ninguna campaña está enviando» en los 4 perfiles. J: 0 preparadas, 2 pausadas, 6 terminadas (8). C: 2 pausadas, 2 terminadas (4). A: 1 pausada, 1 terminada (2). M: 1 pausada, 3 terminadas (4). Todas por Meta salvo 1 de J por Wasender.
- Cada campaña muestra canal, estado, motivo y «X de Y enviados · Z fallaron · N respondieron · M agendados». Ejemplos: J «Campaña Graves 1911» 115 de 182 enviados, 43 fallaron, 10 respondieron, 2 agendados, 24 sin enviar que «no se van a enviar solos». C «obrasociaal» 60 de 446, 125 fallaron. A «24/10 0km» 383 de 1.763, 115 fallaron, 63 respondieron. M «Aberturas y Carpinterías – Octubre 2026» 347 de 585, 162 fallaron.
- Fallos sobre enviados, por campaña: J de 1 % a 37 % (las de Meta de 10 a 37 % salvo la Reactivación), C de 19 % a 29 %, A 7 %, M de 28 % a 75 %.
- Bases: J 13 bases (3 llamadas «ART GRAVES», 320 filas c/u, dos con 0 contactos nuevos = cargas duplicadas), C 4, A 2 (una llamada «vita», nombre de otro rubro, 1 fila), M más de 10 (nombradas con la lista entera de rubros, ilegibles).
- Funciona: se ve el estado y el «Preparar una campaña» (que solo prepara).
- Problemas: motivos de pausa incoherentes con la línea (ver hallazgos 3 y 4); nombres de campaña y bases con formato libre; los 4 botones de acción primaria («Preparar una campaña», «Preparar con IA») quedan pegados a la barra inferior en celular.
- Marketing extra: `/panel/marketing/captacion` («Captación — Google Maps»: cola de 41 búsquedas listas, 0 pendientes, 0 con error, cada una «N nuevos de 11»), `/extraer` (Outscraper; tope 500 por extracción, «Disponibles hoy: 1000 de 1000»), `/presupuestos` (abiertos/todos; muestra «pedido hace 728 h» en horas, 30 días), `/prospectos` (negocios por etapa; «Envío automático del primer mensaje: apagado»; 591 elementos interactivos en escritorio), `/consultas-directas` (4 consultas, todas «Sin datos para analizar»).

### 2.5 Bot IA (`/agentes`, `/panel/<perfil>/agentes`)
- Nota del bot sobre 100: J 37, C 32, A 46, M 40; todas «Mejorable». Desglose Captación /50, Retención /20, Trato /15, Calidad /15. J: 214 conversaciones, 17 captados. C: 89 y 2. A: 67 y 4. M: 271 y 7. Sugerencias sueltas («Que retome la conversación cuando la persona duda…»).
- Contiene «Probar el bot real» (área, base como contacto, versión v1/v2, mensajes de mentira) e «Informe de mejoras del bot» (período, informe generado 20/11 con 25 conversaciones leídas; ya figura «Sumada al bot ✓»).
- Problemas: pantalla larguísima (más de 5.400 px en J, 27 botones al fondo); en celular se desborda a lo ancho (J 406, C 450, M 642 px sobre 390), seguramente por los menús desplegables con nombres de bases larguísimos; la versión del conocimiento v1/v2 aparece sin decir cuál rige hoy más allá del título del menú.
- `/biblioteca-agentes` (sin enlace en menú): dice que el «Agente principal» y los agentes por perfil están «Apagado · versión 1 · preparado» y que «ninguno responde», con último cambio 15/10 «migración». Contradice a Bot IA, donde el bot responde y se mide. Confunde qué manda.

### 2.6 WhatsApp oficial (Meta) (`/meta/lineas`) · Líneas de Meta · Plantillas de Meta · Perfil de WhatsApp y redes
- Ver sección 5 por línea.
- Plantillas (`/redes/plantillas`): J lee 18 plantillas de Meta (leídas 21/11, 04:21). Hay una con uso «escrita a mano … (sin elegir del catálogo)» y 1.610 envíos registrados (último 5/10). Permite cargar plantillas desde archivo y «Enviar propuestas a revisión de Meta» (no tocado).
- Perfil de WhatsApp (`/redes/whatsapp`): info 39/139, descripción 291/512 caracteres, rubro, web. Se guarda directo en WhatsApp.
- Problemas: aparecen textos de configuración interna (`WHATSAPP_CIVIL_*`, `WHATSAPP_CIVIL_WABA_ID`, «cargada …7986»); la fila PENAL figura como «Civil» (tag de área) y tiene «Agente» y «Campañas» tildados aunque está desactivada; la caja «Conexiones que ya existen en la configuración privada y no están asignadas a ninguna línea: WHATSAPP_PENAL (incompleta) · asignar» aparece también dentro de Coberturas, Autos y Marketing (arrastra un detalle de Jurídico a otros rubros).

### 2.7 WhatsApp por QR (Wasender) (`/wasender`) · Líneas · Plantillas
- J: 1 línea «Asesoria Vita - 2» (más 1 archivada). M: 1 línea «LINEA - KOCOS MARKETING». C y A: ninguna («Todavía no hay líneas»).
- Cada línea: estado, «Día 8 de calentamiento: hoy puede enviar hasta 80 mensajes», interruptores (Envía mensajes, Responde el bot, Modo prueba), «Reemplaza a la línea de Meta», botones Conectar con QR / Ver estado / Máximo por día / Archivar.
- Plantillas Wasender: J con 60 textos por plantilla de primer mensaje (por ejemplo `jur_fria_alta_temprana`, 59 variantes), `form_recibido_jur`, etc.
- Problemas: las dos líneas dicen «Sesión cerrada desde el celular» y a la vez «Día 8 de calentamiento… hoy puede enviar hasta 80» (dato viejo con la línea caída); el modo de reemplazo de Meta se ofrece cerca de botones que ejecutan acciones reales.

### 2.8 Redes (`/redes`, `/redes/accesos`, `/redes/perfiles`, `/redes/publicidad`, `/contenido`) · Accesos · Publicaciones · Contenido · Publicidad
- Accesos: tarjetas Instagram / Facebook / Bandeja de Meta con «Abrir…», «Cargar dirección»; en J la de Facebook dice «Falta cargar la dirección».
- Publicaciones: 0 programadas en los 4 perfiles. «Conexión con Instagram y Facebook: Sin conectar. Falta un paso en el servidor: cargar METRICOOL_USER_TOKEN y METRICOOL_USER_ID en las variables privadas de Vercel». Número de marca (blogId) vacío.
- Perfiles (`/redes/perfiles`): Facebook «Sin vincular» (menciona `FACEBOOK_CIVIL_PAGE_ID` y `FACEBOOK_CIVIL_PAGE_ACCESS_TOKEN`); Instagram «Se edita en la app», con biografía sugerida (no se tocó la bio, orden vigente).
- Publicidad: «Apagada · no gasta», formulario de objetivo, tope por día, cuenta, zona, edades, intereses, y «Encender (necesita autorización)».
- Contenido: «Autopublicación apagada… Calendario en pausa», 0 necesita atención, 0 borradores, 0 próximas, 0 publicadas; asistente de 5 pasos para crear pieza.
- Problemas: nombres de variables de Vercel y de Metricool expuestos a la responsable; el panel pide «Programar publicaciones» al asistente sin tener conectado Metricool; los 4 perfiles igual de vacíos.

### 2.9 Ajustes (`/configuracion`, `/panel/<perfil>/configuracion`)
- Grupos plegables: Perfil y marca, Canales/líneas/plantillas, Agenda y horario, Mensajes de voz, Bot, Automatizaciones y pausas, Notificaciones y dispositivos, Acceso/PIN/sesiones, Sistema/tareas/integraciones. Con buscador. En C, A y M el texto dice «los grupos que siguen valen para los cuatro perfiles: lo que cambies acá cambia en todos».
- Resúmenes: J «3 de 8 canales conectados», C/A/M «2 de 4»; «Pausa general levantada»; «2 números de aviso»; «5 eventos retenidos sin revisar».
- Problemas: el contador «canales conectados» se calcula distinto por perfil sin explicar qué cuenta; J no repite la advertencia de «vale para los cuatro»; en celular tiene muchos controles pequeños (11 a 45).

### 2.10 Salud del sistema (`/salud`) y Resultados (`/resultados`)
- Salud: J «2 frenan la operación · 1 para revisar · 3 en orden»; C «1 frenan…»; A «2 frenan…»; M «2 frenan…». Bloque «Fallas del sistema»: J 46 mensajes no salieron en 24 h, 12 seguimientos no pudieron salir, el bot no contestó 2 veces en 24 h (error «falla_modelo: el modelo no respondió en 20 segundos»), 5 mensajes entrantes retenidos por seguridad (de todo el sistema).
- Resultados J (semana 16–21/11): contactados 385 (+53 %), respondieron 32 (8,3 %), conversaron 18, oportunidades reales 4, captados 4, derivados 0 (−100 % contra 2), ventas 0, perdidos 15. Día por día: jue 19 → 61 mensajes, 10 respondieron; vie 20 → 136 y 11. C, A y M: todo en 0 en la semana (antes, perdidos 13, 6 y 67).
- Problemas: el aviso global «1 mensaje retenido» contra «5 mensajes retenidos» en Salud, Incidencias y Ajustes; «El detalle completo está en Avanzado» sin que exista una pantalla llamada así; el motivo «falla_modelo» está en lenguaje técnico; el texto de «Lo captó el bot» en Resultados muestra la frase literal que escribió la persona (puede incluir datos de contacto).

### 2.11 Incidencias (`/incidencias`)
- J: 1 abierta (amenaza o denuncia del 18/11, con botones Resuelta/Descartar), 137 detenciones vigentes, 5 mensajes retenidos, 0 archivos sin guardar. C: 0 / 51 / 5 / 0. A: 0 / 19 / 5 / 0. M: 0 / 31 / 5 / 0. Los 4 perfiles dicen «5 cosa(s) esperan una decisión» (o 6 en J) y todos muestran los «5 mensajes retenidos» del sistema entero.
- Se repiten dos veces los mismos 4 contadores en la misma pantalla (cinta arriba y bloque debajo).

### 2.12 Asistente y bandeja
- `/asistente` (general): «La semana en todo el panel», 7 cifras con flecha: mensajes enviados 385 (+53 %), personas que respondieron 32, captados 4, citas 0, derivados 0 (−100 %), campañas en curso 0, chats que piden persona 4. Todo concentrado en Jurídico; C, A y M en 0. Atajos: lanzar campañas con planillas, cómo vienen los 4 perfiles, mejorar un bot, programar publicaciones, buscar captados, revisar chats que piden una persona.
- `/bandeja` («Bandeja para Claude»): formulario con perfil, enlaces y texto de hasta 4.000 caracteres; 0 abiertas, 1 lista. Texto largo sobre «Cowork»: es vocabulario interno del equipo, no de la responsable.
- Ficha de contacto (`/ficha/<id>`): encabezado con nombre, «Quién atiende este chat» (Devolver al bot), «Archivos que mandó», botones «Marcar como captado», «Cerrar como perdido», «Marcar revisado», «No escribirle más…» (no se tocó ninguno). Sin desborde.
- Otras: `/landing` (pública, solo Jurídico, formulario Civil/Penal, 2,4 s), `/limpieza` («Movidos en la limpieza del 13/11»: 145 movidos), `/descartados`, `/prospectos-por-base`.

---

## 3. Celular (390x844)
- Barra inferior flotante de 4 íconos (Hoy, Chats, Contactos, Campañas) más ≡; menú superior «Menú» y un ícono de asistente. Sin errores de consola y sin desborde en 71 de 78 pantallas.
- Desborde horizontal: `/agentes` en los 4 perfiles (J 406, C 450, M 642 px; A no) y `/resultados` en los 4 (409 px). Causa probable: tablas «Cifras por día» y selectores con textos largos.
- Los dos avisos globales ocupan unos 270 px de 844 (32 %). En `/hoy` el contenido útil (captados, atención humana) arranca por debajo del pliegue.
- Las tabs (Resumen / Resultados / Historial / Salud) se cortan por la derecha («Salud d…») sin indicio de scroll.
- La barra inferior flotante tapa el contenido final de cada pantalla (se ve en `/campanas`, donde los botones «Preparar una campaña» y «Preparar con IA» quedan tocando la barra).
- Elementos clicables menores a 32 px en celular: Seguimiento 72 (J), 27–40 (otros), Perfiles 21, Resultados 8–10, Ajustes 8–11.
- Tablas de 4–6 columnas (Citas, Prospectos, Consultas directas, Cifras por día) se resuelven en celular con tarjetas o scroll; no se verificó legibilidad a fondo.
- Las pantallas de perfiles `/panel/<perfil>/...` y raíz de Jurídico se comportan igual: la diferencia de rutas no se ve al usuario.

## 4. Diseño y accesibilidad (resumen)
- Tema oscuro dorado coherente, jerarquía clara (`h1` único, `h2` por bloque). Los chips con punto de color (verde/amarillo/rojo) dependen del color; llevan texto, así que cumplen.
- Contraste bajo en subtítulos atenuados del menú («Tareas para Claude» dentro de la tarjeta resaltada) y en la fila PENAL desactivada.
- Tres entradas a «Pedile algo»; cuatro etiquetas distintas para la misma idea de «esperan a una persona»: «Atención humana», «Esperan tu respuesta», «Los atiende una persona», «Piden una persona», «Esperan a una persona».
- Nombres de perfil inconsistentes: «Estudio Jurídico VITA», «Estudio Jurídico», «Jurídico»; «Automotores Kocos», «Agencia 0KM», «Autos 0 km»; «Compara tu Obra Social», «Coberturas médicas»; «Kocos Marketing», «Marketing».
- Etiquetas técnicas: Wasender, Meta, WABA, blogId, Outscraper, `falla_modelo`, Error 131042, «Fase 2», «Cowork».
- El medidor circular del bot usa siempre amarillo aunque el perfil sea naranja, verde o celeste (se ve en `/agentes` de Marketing).
- Gráfico «Día por día» tiene tabla alternativa («Cifras por día»), buen punto de accesibilidad.

---

## 5. Estado de cada línea de WhatsApp por perfil (según `/meta/lineas`, `/wasender` y Salud, 21/11)

| Perfil | Línea | Canal | Estado que muestra el panel | Qué implica |
| --- | --- | --- | --- | --- |
| Jurídico | CIVIL | Meta | Conectada, calidad alta; variables cargadas; 18 plantillas leídas 21/11 04:21; Agente y Campañas habilitados | Puede enviar y responder. Ninguna campaña está enviando; una campaña (ART Graves - Reactivación) sigue pausada «automáticamente por calidad baja» con la línea en calidad alta (motivo desactualizado) |
| Jurídico | PENAL | Meta | Desactivada; «faltan variables en la configuración privada» (`WHATSAPP_PENAL_*`, sin WABA ni token); aparece con área «Civil» | No existe línea de Penal. Perfil dice «Civil y Penal»; estadísticas: Civil 7.852, Penal 0 |
| Jurídico | Asesoria Vita - 2 | Wasender | Desconectada: «Sesión cerrada desde el celular», sin enviar ni recibir desde el 13/11 13:52; calentamiento «Día 8, hasta 80»; hay 1 línea archivada | Hay que escanear el QR de nuevo. La campaña de Wasender se pausó el 12/11 «por pedido de la responsable» (un día antes de la fecha de desconexión) |
| Coberturas | COBERTURAS MEDICAS | Meta | Conectada, calidad alta | Operativa. Sus 2 campañas pausadas: «ad» (motivo crudo) y «obrasociaal» por Error 131042, problema de pago de la cuenta de WhatsApp Business (60 de 446 enviados, 125 fallaron). Salud no lo muestra como freno |
| Coberturas | Wasender | QR | Sin líneas | No se usa |
| Autos 0 km | AGENCIA 0KM | Meta | Conectada, calidad BAJA | Sus campañas se pausan solas mientras siga así (pausada: «24/10 0km»); las respuestas a quienes escriben siguen funcionando. Salud: «2 frenan la operación» |
| Autos 0 km | Wasender | QR | Sin líneas | No se usa |
| Marketing | MARKETING | Meta | «Sin acceso al número»: Meta no encuentra el número con este token (identificador incorrecto o token sin acceso) | Envíos y respuestas automáticas deshabilitados; el último movimiento visible en chats es del 6/11 |
| Marketing | LINEA - KOCOS MARKETING | Wasender | Desconectada: sin enviar ni recibir desde el 15/11 23:09; «Día 8 de calentamiento» | Hay que escanear el QR. Con ambas líneas caídas, Marketing no puede enviar ni responder por ningún canal |

Resumen: solo 3 líneas de Meta están conectadas (Civil, Coberturas, Autos 0 km); de esas, Autos 0 km tiene calidad baja. De 2 líneas Wasender activas, ambas están desconectadas. Marketing es el perfil sin ninguna línea operativa.

---

## 6. Hallazgos priorizados

### P0 · Frenan la operación o muestran datos que llevan a decidir mal
1. Marketing sin ningún canal: línea Meta «Sin acceso al número» y su Wasender desconectada desde el 15/11. Todo el perfil responde 0 en la semana. (Hoy lo marca, pero no explica el impacto: «Línea MARKETING · sin acceso al número».)
2. Jurídico: Wasender desconectada desde el 13/11 y 46 mensajes que no salieron en 24 h, más 12 seguimientos que «no pudieron salir» (J), todos por conflicto de horario vencido de 72 h. Los 12 están esperando decisión (Reintentar / Descartar) y ya son más de 24 h.
3. Coberturas: la campaña «obrasociaal» está pausada por Error 131042 (pago de la cuenta de WhatsApp Business), pero Salud no lo cuenta como problema que frena la operación ni lo explica fuera de la tarjeta de la campaña.
4. Estado contradictorio de la calidad de línea en Jurídico: la línea CIVIL figura «calidad alta», pero una campaña sigue pausada «porque Meta califica la línea CIVIL con calidad baja».
5. 5 mensajes entrantes «retenidos por seguridad» sin responder. El aviso global y la pantalla de Hoy dicen 1; Salud, Incidencias y Ajustes dicen 5. Es el único aviso que ve en todas las pantallas.

### P1 · Confusión, contradicciones y fugas entre rubros
6. Un mismo dato, distintas cifras: «esperan a una persona» = 4 (Perfiles/Asistente), 5 (Hoy), 6 (Chats), 14 (Estadísticas y Citas) en Jurídico. «Seguimientos» = 69 (Citas), 40 (caídos), 11/40/12 (Seguimiento). Captados sin derivar 15 y «13 con más de 24 h»; en Perfiles aparece «Campaña finalizada» mientras en Hoy dice «Campaña pausada».
7. Fugas entre perfiles: el cuadro «WHATSAPP_PENAL (incompleta) · asignar» aparece dentro de Coberturas, Autos y Marketing; los 4 perfiles muestran los «5 mensajes retenidos» del sistema entero; los mismos dos teléfonos figuran como chats en Coberturas y Marketing; Autos 0 km tiene una base llamada «vita» (1 fila) y el selector de «Probar el bot real» la lista. Choca con «cada rubro separado».
8. Datos viejos en las colas de acción: Atención humana y Captados con hasta 9 semanas, etiquetados «Oportunidad real» o «Más de 24 h». Falta antigüedad en días y un criterio para pasar a «descartado».
9. Dos avisos permanentes (código, mensaje retenido) más el aviso de captados en cada pantalla: en celular ocupan aproximadamente un tercio de la pantalla; en escritorio empujan el contenido unos 330 px.
10. Texto interno o técnico visible a la responsable: nombres de variables de Vercel (`WHATSAPP_CIVIL_*`, `METRICOOL_USER_TOKEN`, `FACEBOOK_CIVIL_PAGE_ID`), `falla_modelo`, Error 131042 sin traducir, motivos de pausa «ad» y «domingo», «Fase 2», «Cowork», «pedido hace 728 h», «Primer mensaje de la campaña «…»» como último mensaje, referencia a una pantalla «Avanzado» que no existe, el bloque «Más opciones ▾» sin contenido visible.
11. `/biblioteca-agentes` afirma que los agentes están «Apagado… ninguno responde» mientras Bot IA muestra bots activos con nota y conversaciones. Mismo asunto, mensaje opuesto.
12. El bot de Coberturas se presenta como «Nancy», que el propio informe de Jurídico clasifica como falla grave (inventar nombre de pila). Saludos automáticos con el teléfono en lugar del nombre («👋 <número>, quiero ayudarte…»).
13. Tasas de fallo de envío altas: Marketing de 28 % a 75 % por campaña (la de 8 contactos: 6 fallaron), Coberturas 19–29 %, Jurídico hasta 37 %. Con calidad de línea ya baja en Autos.

### P2 · Diseño, accesibilidad y celular
14. Desborde horizontal en celular: `/agentes` (J 406, C 450, M 642 px) y `/resultados` (409 px en los 4 perfiles).
15. Pestañas cortadas en celular («Salud d…»), barra inferior que tapa botones finales, chips de estado truncados sin puntos suspensivos en escritorio.
16. «Pedile algo» tres veces en la misma pantalla; cuatro nombres distintos para «espera a una persona»; nombres de perfil inconsistentes (Jurídico, Estudio Jurídico VITA; Autos 0 km, Agencia 0KM, Automotores Kocos; Coberturas médicas, Compara tu Obra Social; Marketing, Kocos Marketing).
17. `/agentes` mide más de 5.400 px; `/seguimiento` (J) tiene 94 elementos pequeños; `/panel/marketing/prospectos` tiene 591 elementos interactivos.
18. «Citas» contiene colas que no son citas (captados, seguimientos, atención humana). Estadísticas y Resultados repiten el mismo bloque con distintos números.
19. «Panel En vivo» sigue en `/perfiles` pese a lo anotado como pedido de quitarlo; con nombres recortados.
20. Medidor del bot siempre amarillo, no toma el color del perfil; contraste bajo en subtítulos atenuados del menú y de la fila desactivada.
21. Duplicados de bases en J: «ART GRAVES» tres veces (320 filas), dos con 0 contactos nuevos; nombres de bases de Marketing son la lista completa de rubros.
22. Rutas: Jurídico vive en la raíz y los otros en `/panel/<perfil>/`; pantallas sin enlace (`/prospectos`, `/oportunidades`, `/biblioteca-agentes`, `/limpieza`, `/redes/*`) son difíciles de volver a encontrar. `/derivar` y `/recuperar` redirigen sin avisar.

### Lo que anda bien (para conservar)
- Los 4 perfiles cargan sin errores de consola ni de red; velocidad sostenida.
- Cada perfil con su color y menú idéntico; migas siempre dicen dónde estás.
- Textos de ayuda claros en Campañas («Crear una campaña solo la prepara…»), Seguimiento (la ruta explicada) y Bases («Cargar una base nunca envía mensajes»).
- Embudo, «Día por día» con tabla alternativa, estado real de las líneas preguntado a Meta, nada se borra.
- Contactos de Marketing separa dos circuitos (saliente y consultas directas).

## 7. Datos de contraste con el cerebro
- `03-crm-y-bots.md` dice 77 operaciones del asistente, 5 agentes, velocidad 0,3–1,6 s y «sin desbordes a 1440 y 390»: hoy hay desborde a 390 en `/agentes` y `/resultados`, y las cargas medidas acá son de 3 a 5 s (distinta medición).
- Dice que `/telefono` redirige a `/perfiles` y que «En vivo» sale con la rama pendiente: el panel «En vivo» sigue presente en producción.
- Dice «Código de 6 dígitos hoy, pasa a 8»: el aviso ámbar sigue pidiendo cambiarlo.
