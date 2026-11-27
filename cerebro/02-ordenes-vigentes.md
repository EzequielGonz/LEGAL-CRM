---
description: Órdenes vigentes del dueño, reconciliadas entre Fase 1 (Cowork) y Fase 2 (Code). Manda la más nueva; se anota qué reemplazó.
actualizado: 20/11/2026 06:00
---

# Órdenes vigentes

## La única restricción

**No se paga nada sin autorización expresa del dueño**: créditos, planes, publicidad, generadores pagos (Veo, Kling, Runway, ElevenLabs, vidIQ con créditos), servidores, celulares en la nube, dominios. Presupuesto ya autorizado: Gemini para los bots, USD 30 por mes (20/10). Recomendación vigente: dejar desactivado el pase automático a créditos pagos de Claude o con tope bajo.

Todo lo demás son **decisiones de negocio** del dueño (abajo), no trabas de proceso. Claude implementa, prueba, publica y verifica sin pedir «dale» por cada paso.

## Lo que Claude sigue cuidando por oficio (no son trabas)

- Las claves viven solo en las variables de Vercel. No se escriben en el repo, el chat ni los informes. El código de ingreso al panel no se guarda en archivos.
- Los datos personales de prospectos no se copian a documentos, pruebas, capturas publicadas ni corpus.
- La Preview de Vercel usa la misma base y las mismas líneas que producción: probar ahí tiene efectos reales.
- Antes de afirmar que algo está encendido, se comprueba en la base.

## Forma de trabajo

| Fecha | Orden |
| --- | --- |
| 15/10 | Acceso total a todo el proyecto. Claude implementa directo (GitHub, base, configuración, despliegue) sin pedir «dale» por cada acción |
| 19/10 | Nada de ZIP ni paquetes para el programador: se implementa, se prueba (typecheck, lint, pruebas, build), se publica en main y se recorre como usuaria antes de informar |
| 14/11 | Se trabaja con el modelo principal; otro modelo solo para tareas secundarias muy simples |
| 15/11, 20/11 | Usar todas las skills, plugins, conectores y agentes que sumen, sin pedir permiso salvo pagos; buscar más al empezar cada tarea; repartir trabajos grandes entre agentes en paralelo (copias separadas si tocan código), cerrar con revisión cruzada y segunda opinión de otro modelo; al delegar, pasar la lista de skills útiles y permiso de usar otras |
| 20/11 | Rol de Claude: agencia premium completa (director creativo, diseñador, motion designer, estratega y community manager, performance, SEO y landings, investigador de tendencias) + ingeniería senior del CRM. «Hacer todo», de punta a punta |
| 20/11 | Velocidad: «sin releer todo, sigamos derecho» desde el último traspaso (para eso existe este cerebro) |
| 20/11 | **Aprendizaje continuo**: releer y entender a fondo el negocio y sus expectativas en cada sesión; actualizar el cerebro en el momento en que se aprende algo; sumar solo roles, skills y plugins que sirvan (protocolo en `README.md`) |
| 15/11 | Los textos internos del panel («Wasender», «v1/v2», «JSON») no se cambian |
| 13/11 | Tarea automática que revise sola la Bandeja para Claude: «por ahora no». El dueño dice «ok» y Claude toma las tareas (`.claude/referencias/bandeja-claude.md`) |

## Comunicación con el dueño

- Español rioplatense con voseo, simple, sin jerga técnica («no entiendo lo que decís»).
- **Respuestas cortas**, listas cortas y tablas. Avisar en pocas palabras qué se está haciendo.
- Instrucciones para ella: **un solo prompt** claro. Si hay archivo, **Word (.docx)**.
- Lo que tenga que hacer Cowork o Claude in Chrome (su escritorio, con sus perfiles abiertos): **prompt listo para pegar**. Nunca decir que no se puede pasar a Cowork.
- Cada informe distingue **especificado, implementado, probado, publicado, habilitado**, con la versión comprobada.
- Commit y push sin que lo pida, con checkpoint después de cada tanda.

## Lo que no quiere (correcciones que ya hizo)

| Claude hizo o propuso | Ella quería |
| --- | --- |
| Reels con objetos y tipografía animada | Personajes animados, guion, una ciudad, una historia real, calidad |
| Bajar a 1 reel por día (auditoría de Chrome del 20/11) | «No bajamos ningún ritmo, pegamos o pegamos» |
| Reels con persona real o cara a cámara (auditoría 20/11) | Animados, sin caras |
| Preguntar si borrar lo publicado o programado | Nada se borra: archivar o pasar a borrador con motivo |
| Un boceto por rubro | Un boceto de un solo perfil (VITA) |
| Cambiar la bio y cargar el botón de WhatsApp | «el botón y la bio, dejalos así como ya están tranqui» |
| Programar las destacadas para el día siguiente | «publicalas ahora mismo» |
| Guías largas con varios archivos | Un solo prompt; archivos en Word |
| Decir que no podía pasarle una tarea a Cowork | Prompt listo para pegar |
| Carteles en pantalla («Situación ilustrativa», «Voz generada con IA») | Sin carteles: van en el texto de la publicación |
| Selector Simple/Avanzado en el panel | Lo avanzado en desplegables |

## Negocio general

| Fecha | Orden |
| --- | --- |
| 13/11 | **Cada rubro separado**: nada de un perfil se ve ni se abre desde otro. Lo común se muestra dentro de cada perfil, rotulado. Sin perfil en la dirección vale el último usado, nunca Jurídico por defecto |
| 13/11 | **Nada se borra**: se archiva o pasa a borrador, con motivo y forma de revertir |
| 13/11, 17/11 | Lo hecho con Meta no se pisa ni se rehace. Desde el 17/11 Meta y Wasender van totalmente separados en los 4 perfiles |
| 16/10 | Asesor que se presenta en los 4 perfiles: Leonardo Gonzalez |
| 20/10 | Presupuesto Gemini: USD 30/mes |
| 20/11 | **Nombre de la agencia de marketing: Kocos Marketing** (ORVIAN descartado) |
| 20/11 | **Autos: «Automotores Kocos» o «Autos Kocos» valen igual; nunca «Agencia Kocos»** (para no chocar con Marketing, que figura así en Instagram). La web de autos tiene que dejar de decir «Agencia Kocos» |
| 20/11 | Integrar a `main` el cerebro y las ramas que son solo documentos o herramientas de redes |

## Campañas y envíos

| Fecha | Orden |
| --- | --- |
| 15/11 · **confirmada 20/11** | **Las campañas con bases y las publicidades las lanza el dueño.** Claude las deja completas y listas («qué falta para lanzar» en cero); él aprieta lanzar. Publicar código no lanza nada |
| 14/11 → 17/11 | Cada campaña elige método: Meta o Wasender (el 14/11 se había decidido solo Wasender; el 17/11 se habilitó elegir y cambiar el método en una campaña pausada) |
| 14/11 | Wasender: lunes a sábado, sin días de descanso, sin patrón fijo (hora de arranque, cantidad, tandas, pausas y texto cambian cada día). 12 plantillas por perfil (~680 variantes c/u); las 40 viejas archivadas |
| 15/11 | Botón de entrenamiento de línea: 20 por día durante 7 días, sin quitar la elección manual |
| 15/11 | Con Wasender el primer mensaje no lleva botones |
| 15/11 | Tope: nunca más de 3 automáticos sin respuesta a la misma persona |
| 15/11 | Freno: campaña con ≥100 envíos y <1 % de respuesta se frena (se puede saltear a mano) |
| 14/11 | Aviso de captación a destinatarios: pendiente hasta que él lo pida |
| Marketing | Presupuesto tipo factura, 10 % de descuento de bienvenida al final, video de propuesta <1 min |

## Bots y conversaciones

| Fecha | Orden |
| --- | --- |
| 15/11 | **No hay pausa general**: los bots responden siempre los entrantes; seguimiento y lo programado siguen normal |
| 16/10, 18/10 | Atención 24 h en todos los rubros. Asesores lunes a sábado 8–21 h; fuera de esa franja la IA atiende, intenta captar y agenda la llamada |
| 15/11 | **El bot nunca da precios** (ni números, rangos ni cuotas). Puede explicar de qué depende un valor (25/10) |
| 24/10 | El bot no promete día ni hora del contacto; quién atiende lo asigna el dueño a mano |
| 24/10 | Marketing: el cierre lo hace una persona; el bot nunca pasa datos de pago. Solo pregunta precio → pasa a una persona y no es captado |
| 24/10 | Coberturas no recomienda una prestadora: compara y deriva siempre a un vendedor |
| 25/10 | «Ya tengo abogado»: una sola pregunta por segunda opinión, sin cuestionar a su abogado; si dice que no, se detiene |
| 24/10, 15/11 | «¿De dónde sacaron mi número?»: disculpa y «no tenemos el registro»; queda «pidió no ser contactado» |
| 15/11 | Enojo: disculpa breve y cortar. Amenaza o denuncia contra nosotros: además, avisar |
| 15/11 | Crisis: líneas de ayuda (911, 144, 137) siempre, aunque una persona haya tomado el chat, y cartel urgente en el panel |
| 24/10 | Detención sin apagar al agente: si no quiere que le escriban, disculpa; se frenan campañas y seguimientos; si vuelve a escribir, se lo atiende sin ofrecer ni insistir (salvo menores) |
| 13/11 | Audios: se transcriben y el bot los contesta (llave por perfil, encendida en los 4). Si no se pudo, pide que lo escriba como mucho una vez cada 30 min |
| 15/11 | Al captar: agradece, confirma quién se va a comunicar y se despide, sin preguntas |
| 14/11 → 15/11 | Mejorar el bot = sumar fichas a la v2. Desde el 15/11 el Laboratorio permite versiones nuevas (v3…), otros modelos de Gemini, roles y A/B; nada activo cambia sin acción manual; los bots de base siguen con v2 y el modelo principal |
| 25/10 | Fase 3 (biblioteca de agentes, entrenamiento pago, comparaciones) cerrada y descartada. El conocimiento por versiones sigue |
| 20/11 | Palabras clave de redes en el rol de los bots: se suman al final, sin pisar nada |

## Seguimiento, caídos e incidencias

| Fecha | Orden |
| --- | --- |
| 12/11, 13/11 | Seguimiento automático encendido en los 4 perfiles (perfil nuevo nace encendido). Antes de los contactos 2 y 3 el bot relee y decide si insistir |
| 13/11 | Caídos: «que pasen 3 días y otro mensaje, si no responde en 24 hs, a caídos». Lo viejo (>96 h sin el mensaje) cae directo |
| 12/11, 13/11 | Segundo intento por Wasender a quien nunca respondió: uno solo, 5 a 7 días después, otro texto (no sale pasados 10 días) |
| 13/11 | Incidencia = solo amenaza legal/denuncia contra nosotros o queja de un captado. Enojo, insultos, «no me escriban», «ya tengo abogado», número equivocado → Perdidos o No contactar solos |
| 13/11 | Perdido no espera a una persona; el chat vuelve al bot |
| 13/11 | «Oportunidades reales» (antes «Piden una persona»): solo interés real, por puntaje |
| 13/11 | «Quedaron sin respuesta»: si lo último concretó una llamada → captado; si no, queda; ante la duda → «Posible captación a revisar». No se les escribe solos |
| 13/11 | Fallas del sistema en lugar propio, separadas de incidencias de personas |
| 19/11 (sin publicar) | Botón Archivar en Hoy y Activos; descartados de más de un mes → Archivados; si vuelve a escribir, vuelve solo |

## Panel y diseño

| Fecha | Orden |
| --- | --- |
| 13/11 | Diseño «bien llamativo»: vidrio, 3D, tarjetas que se inclinan, fondos animados, cifras que cuentan, gráficos con relieve. Referencia: Instagram code.xr y su Topmate («Glassy Dashboard/Sidebar/Navigation Tabs»). **Modo oscuro por defecto** |
| 24/10 | Mismo menú y rutas en los 4 perfiles; lo técnico en desplegables. Sin vista de teléfono separada: el panel se adapta al celular (ver contradicción en `10-cruce-fase1-fase2.md`) |
| 18/10 | Conversaciones y Contactos muestran solo oportunidades reales; la base fría vive en «Por base» |
| 19/11 | Hoy: sin «personas, no mensajes», sin chip del bot, sin «También hoy»; vista previa con 4 barras de la semana y «Ver todos los resultados». Cada bloque responde «a quién le escribo ahora» |
| 19/11 | Perfiles: sin el cuadro «En vivo». Contactos: dejarlo como está |
| 13/11 | Asistente del panel con permiso para todo, siempre propone y confirma; lanzar campañas con confirmación reforzada; activar agentes con el código de acceso |
| 15/11 | Asistente general en su pantalla /asistente |
| 15/11 | Código de ingreso de 8 números (el de 6 sigue hasta cambiarlo; al 20/11 se sigue usando el de 6) |
| Siempre | Gestionar desde el panel los perfiles de WhatsApp, Instagram y Facebook de cada rubro. Publicidad configurada en el panel para activar después (activarla = gasto) |
| 20/10 | El contenido de Instagram y Facebook lo publica Claude vía Metricool, no el panel |

## Redes y contenido (las más recientes mandan)

| Fecha | Orden | Reemplaza |
| --- | --- | --- |
| 20/11 | **Cronograma doble del 20/11 al 29/11** («que empiece ya») | El calendario 25/11–04/12 y la orden del 18/11 de no programar después del 24/11 |
| 20/11 | **Sin freno**: «No bajamos ningún ritmo, pegamos o pegamos». «Subí aún más el volumen»: hasta 4 historias extra por día y marca (10:30, 14:30, 17:00, 22:30) + 1 TRIAL_REEL por día y marca (solo IG; versión nueva de un reel publicado hace ≥5 días) | Subida por etapas con freno; propuesta de 1 reel/día |
| 20/11 | Grupo de control 20–24/11: lo programado antes «dejá que se suba igual», aunque diga «el botón está en el perfil» | — |
| 20/11 | Mini historias animadas con personajes, guion, Buenos Aires e historia creíble. **Sin caras reales ni personas grabadas** | Auditoría: reels con persona |
| 20/11 | **Sin carteles en pantalla.** Aclaraciones en el texto de la publicación; voz sintética lleva además la marca de contenido con IA | — |
| 20/11 | Logo y nombre de la marca en todas las piezas | — |
| 20/11 | Calidad premium y viral: planos rápidos e irreales, caídas, golpes de cámara, escalas imposibles, «dopamina a cada rato», sonido y pausas de cine. Referencia de ritmo: julianeaborna (recursos, no copia) | — |
| 20/11 | 4K cuando se pueda (2160×3840); en serie 1080×1920 a 30 fps | — |
| 20/11 | Versiones B y R con cambios reales (gancho, escena, voz, música u orden), no trucos anti-duplicado | — |
| 20/11 | Ortografía revisada en cada pieza antes de programar | — |
| 20/11 | Cierre: «Comentá PALABRA» o «Respondé esta historia con PALABRA». **Nunca «el botón está en el perfil»** (no existe) | «Escribinos PALABRA por WhatsApp · botón en el perfil» |
| 20/11 | **No tocar la bio ni el botón** de los perfiles | Auditoría: cargar el botón y reescribir bios |
| 20/11 | Sin publicidad paga por ahora («esperemos que pegue algún reel») | — |
| 20/11 | Sin generadores pagos: todo con código y herramientas gratis | — |
| 20/11 | Lo que se mejora en un rubro va al motor compartido y después a los otros tres | — |
| 20/11 | Las 44 de Kocos del 25 al 29/11 (estilo viejo) pasan a borrador | Reprogramarlas 25–29/11 (18/11) |
| 20/11 | Feed y estética del kit de perfil: aprobados | — |
| 20/11 | Temas: ACARA no → «¿Contado, prendario o plan?»; aumento de prepagas no → «¿Pagás por cosas que no usás?»; Black Friday Autos 27/11 sí, sin números reales; cuota de Coberturas «antes de pagar, compará» aprobada sin números; todo lo demás aprobado (VITA laboral y penal, «Lo que dijo la Corte») | — |
| 20/11 | TikTok y YouTube: abrir dentro de los 10 días | — |
| 20/11 | Destacadas: publicadas y armadas a mano por el dueño en los 4 rubros | — |

## Landings, SEO y Google

| Fecha | Orden |
| --- | --- |
| 07/09, 17/09 | Aparecer primeros en Google con el nombre de cada marca y sus búsquedas |
| 20/11 | Medición de punta a punta: UTM, referencia en WhatsApp y formulario, GA4, píxel de Meta, Search Console y Bing |
| 20/11 | Perfil de Empresa de Google para VITA y Autos si atienden en persona; canales de YouTube para Shorts |
| Siempre | Un llamado a la acción predeterminado por rubro y canal para identificar el origen de cada lead (lo define Claude) |

## Respuestas del dueño, 21/11 (bloque A de preguntas)

- **Modelo del negocio:** son dueños del panel; captan clientes y los **derivan a mano** a profesionales de cada rubro. El éxito sigue siendo captado + derivado.
- **«Leonardo Gonzalez» es un nombre de presentación** del bot, no una persona que atiende.
- **Calendario:** consultas y derivaciones de lunes a lunes; **las bases no se corren todos los días** (falta confirmar qué días sí).
- **Avisos de captado:** hoy no se avisa a nadie. Pendiente; no configurar destinatarios hasta que lo definan.
- **Comentarios con palabra clave:** pendiente automatizarlos.
- **Uso del panel:** PC y celular por igual, 2 personas → el celular no es secundario (los desbordes de `/agentes` y `/resultados` importan).

## Respuestas del bloque B y siguientes, 21/11

- **Quiénes son:** dos personas, desarrolladores y dueños del proyecto. **El que responde es hombre** (lo aclaró al responder «productora»): en los textos nuevos no usar «el dueño»; usar «el dueño» o «los dueños».
- **Modelo en todos los rubros:** conseguir el cliente cerrado (que acepta el contacto) y derivarlo a mano por WhatsApp: VITA → abogados; Coberturas → asesores (rotan); 0 km → vendedores de concesionarias cercanas a la localidad del cliente (se vende cualquier marca o modelo); Marketing → lo hacen ellos.
- **Siempre se apunta a la llamada** (VITA y Coberturas); presencial solo si el cliente lo pide.
- **Bases:** lunes a sábado de 8 a 21 h. Mismo horario de atención de abogados.
- **Prioridades:** 1 VITA (esencial) · 2 Marketing (proyectos grandes) · 3 Coberturas (grupos familiares) y 0 km.
- **VITA:** en bases mixtas, reconocer y priorizar las lesiones más graves (fracturas, etc.).
- **Coberturas:** el cliente que más deja es el grupo familiar.
- **Marketing:** buscan un servicio rápido, fácil, de ticket alto, que Claude pueda producir, y que deje dólares. Los precios de la web ($299.000 / $499.000 / $699.000) siguen vigentes, en pesos.
- **Cómo se enteran de un captado:** entrando al panel.
- **Corrección de proceso:** el recorrido del panel del 21/11 no leyó chats ni configuración; se repite como usuario real (informe H).

## Respuestas del bloque C (bases y campañas), 21/11

- **Bases:** llegan todas las semanas, de todos los rubros; son la fuente principal de captación. Origen y costo no importan. Marketing usa el scraper del panel.
- **Estrategia de crecimiento:** mejorar redes, landings y contenido orgánico; publicidad paga más adelante.
- **Arquitectura de líneas (decisión del dueño):** 1 línea fija por rubro en la API oficial de Meta, solo para recibir y centralizar consultas (landing, redes, respuestas). Los envíos en frío, el seguimiento y el recontacto salen por **varias líneas Wasender**.
- **Costo Meta:** cero en inicios de conversación. Migrar todos los inicios a Wasender. Meta solo para publicidad.
- **Error de pago de Coberturas (131042):** resuelto por el dueño.
- **Ritmo:** una campaña por rubro por semana. Volumen semanal: VITA 1.000–2.500 · 0 km 500–1.000 · Coberturas 1.000–2.000 · Marketing 5.000.
- **Análisis del panel:** el dueño pide un recorrido exhaustivo (agentes, roles, scraper, conversaciones). En curso: informes H (chats, campañas, captados) e I (agentes, roles, Marketing, líneas).

## Respuestas de los bloques D y E, 21/11

- **Corrección del dueño:** el panel **ya envía por Wasender o por Meta**, con plantillas, algoritmo de envío y todo integrado. No es una tarea pendiente: lo que falta es conectar más líneas y usarlas así.
- **Líneas:** hoy las 4 fijas de Meta. Esta semana se suman chips de Wasender: 4 VITA, 4 Marketing, 3 Coberturas, 2 0 km. Vinculación por QR o código.
- **Marketing en Meta:** falta vincular el número (pendiente del dueño).
- **Idea futura:** gestor propio de muchos teléfonos con proxies o IP rotativas por número, app propia y pasarela API al panel para reconectar solo.
- **Penal se unifica con Civil.**
- **Bots:** andan bien, se pulen a diario y generan informes. Dicen que son IA **solo si les preguntan**; tienen que sonar lo más humanos posible.
- **Regla para mejoras de bots:** siempre como **propuesta** con su información, **sumando** a la base existente (sin borrar ni rehacer) y **con autorización** de los dueños.
- **Rol del cerebro (dueño, 21/11):** entender absolutamente todo, estar presente en todas las sesiones y chats para contextualizar, gestionar mejor e identificar errores y mejoras. Base: panel completo + código, no solo la web.

## Respuestas de los bloques F a J, 21/11

- **Panel:** se usan todas las pantallas, sobre todo los captados; está bien como está. Las ventas cerradas se van a registrar de otra forma (pendiente), por ahora sin monto. El código de ingreso queda como está por ahora.
- **Contenido — flujo de aprobación:** boceto de reel, posteo, carrusel o historia **de un solo rubro** → el dueño aprueba el diseño → se produce → se programa en Metricool.
- **Redes:** solo publica Metricool; el dueño toca a mano bio y similares. TikTok y YouTube pendientes. Black Friday de Autos es solo contenido. Referencias de reels: las pasa después.
- **Web y medición:** sin píxel de Meta, sin aviso de cookies, sin logos vectoriales, sin fotos reales, sin firma en artículos. Acceso a Search Console y Analytics: sí, más adelante.
- **Plata:** proponer herramientas y deciden juntos (tope razonable). Gemini USD 30 por mes: **avisar al 80 %**.
- **Informes:** en el panel, sección Perfiles, **diario, semanal y mensual** (pendiente de construir, con autorización).
- **AutosMix e inmobiliaria:** fuera del proyecto. Se sacan del cerebro.
- **Entrenamiento diario del cerebro:** tarea programada todas las noches; el dueño pidió que relea todo (código, chats viejos y nuevos, archivos) y lo sume a la memoria.

## Órdenes del 21/11 (tarde)

- **Ajustes del 19/11** (rama `claude/pensive-galileo-d6ephy`: Hoy más limpio, archivar prospectos, archivo automático a 30 días): **quedan pendientes**, sin publicar.
- **Producción** (Vercel, base, Metricool): solo si el dueño lo pide o si Claude pide autorización y la recibe. Hasta nuevo aviso, el cerebro trabaja en solo lectura.
- **Roles de Claude:** diseñador gráfico senior, programador y desarrollador senior, marketer senior e ingeniero de software senior, usando todas las herramientas disponibles.
- **Profundidad:** leer todo a detalle (panel de punta a punta, código, cada archivo y cada respuesta) y volcarlo a la memoria.

## Pedido del dueño, 21/11: el cerebro dentro del panel (pendiente, propuesta)

- Sumar el cerebro al panel con el estilo de diseño del panel, una **bandeja para hablar con Claude** desde el panel y el cerebro, y que el cerebro **aprenda del panel**.
- Base existente para construir encima: «Bandeja para Claude» (`/bandeja`, tabla `bandeja_claude`, flujo en `.claude/referencias/bandeja-claude.md`) y el asistente «Pedile algo» (`/asistente`, Gemini, charlas en `0634_asistente_charlas`).
- Se diseña como propuesta, después de terminar el análisis; producción solo con autorización.
- **Tareas programadas eliminadas a pedido del dueño (21/11):** entrenamiento diario y recordatorios de retomar. El entrenamiento diario queda pendiente. Se conserva el de reels del chat de Metricool.

## Órdenes que faltaban, encontradas al releer todo (21/11, noche)

| Fecha | Orden o decisión | Fuente |
|---|---|---|
| 20/11 | El cerebro se actualiza solo y suma por su cuenta roles, skills y plugins que sirvan | este chat |
| 20/11 | Objetivo: orquestar y ordenar todo desde este chat, con el cerebro como memoria y biblioteca | este chat |
| 21/11 | Lo de Cowork es viejo: sirve para ver hacia dónde se apunta; lo vigente está en los chats de Code | este chat |
| 21/11 | De su lado solo pasa a privado LEGAL-CRM; lo demás se subió igual con su autorización | este chat |
| 21/11 | «Metricool context» la maneja él a mano: se puede leer, no se le mandan mensajes ni se toca | este chat |
| 20/11 07:23 | Dejó **activado** el pase automático a créditos pagos de Claude, con freno y checkpoint al detectarlo. Alcance y tope sin definir: **preguntar** (choca con «no se paga nada sin autorización») | Perfiles VITA (volcado) |
| 20/11 06:00 | Textual: reversionar las piezas «así Meta no nos detecta que son publicaciones duplicadas» y subir el volumen. La regla «variantes reales» fue interpretación de Claude: **preguntar cuál rige** | Perfiles VITA (volcado) |
| 20/11 17:15–17:20 | «Este es el chat de redes… creá los reels y publicalos tal cual como venías»; «publicalos ya a partir de hoy y usá subagentes» (de segunda mano) | Metricool context |
| 21/11 05:43 | «Deja así»: queda el «3 %» en la historia de Coberturas del 25/11 18:30 y en su reel. Excepción a «Coberturas sin números» | Metricool context |
| 21/11 05:53 | Creó los 4 PR de landings sin saber que no hacía falta; pasan a borrador y no se aprueban hasta probar la medición | Metricool context |
| 19/11 | «Incidencias dejarlo tal cual», «Campañas dejarla tal como está». El rediseño visual completo espera su ok | Rediseño (volcado) |
| 20/11 08:12 | «No toques ni alteres nada de lo que ya existe» (pedido de asistente IA); el rediseño del Laboratorio quedó afuera | Claude común |
| 13/11 08:12 | El modelo secundario solo para tareas muy sencillas (antes estaba fechado 14/11) | Contexto del proyecto |
| 15/11 | «¿De dónde sacaron mi número?»: se respeta como está armado; la revisión legal del origen de bases quedó abierta | Contexto del proyecto |

**Respuesta pendiente que le debía (21/11):** «¿Qué publicarías o tocarías en producción?» → nada sin su ok. Propuestas: el plazo del contacto 2, separar retenidos por rubro, los arreglos de celular y programar en Metricool solo lo que él apruebe. Detalle en `15-hallazgos-21-11.md`.

## Órdenes del 22/11

| Orden | Fuente |
|---|---|
| El cerebro es el director ejecutivo de la gestión del panel: orquesta cambios con lo aprendido, reparte a escritorios por área y nunca pierde el enfoque en los 4 rubros | este chat |
| Usar subagentes para gastar menos, y usar el cerebro como apoyo en cada tarea | este chat |
| Evaluar toda herramienta, skill o video que pase el dueño: qué sirve y si se puede implementar | este chat |
| Asistente personal tipo Jarvis dentro del panel (propuesta en `16`) | este chat |

## Órdenes del 22/11 (tarde)

- **Claude orquesta como director ejecutivo**: reparte el trabajo en subagentes especializados por escritorio (en copias separadas si tocan código), no hace todo solo, y usa siempre el cerebro y la memoria. Claude revisa, junta, publica y verifica.
- Rediseño, animaciones y mejoras: **aplicarlos en cada detalle del panel** (estética del cerebro, bento, accesibilidad AA). El gestor de dispositivos y chips queda pendiente.
- Oficina: Gemini ordena en el panel, Claude trabaja; los agentes arrancan solo con «Arrancar ahora»; hasta borrador.
- La sesión «accesos» arranca pidiendo al dueño que **conecte Supabase a mano** (en la sesión y en la tarea programada de la Oficina).
- PostHog, Firecrawl y Skill Arena: instalados o por instalar, pero se usan solo con autorización o si hace falta de verdad.
- **Segundo contacto (72 h) por plantilla de Meta, automático (22/11 noche):** el límite es la ventana de 24 h de Meta. Mientras se migra a Wasender, el recontacto sale solo con plantillas aprobadas de Meta. No cierra ventas por conversación: solo reabre la charla.
- **Gravedad en campañas de Jurídico (22/11 noche, respuesta a la pregunta 5):** la etiqueta de gravedad (fractura, amputación…) se conecta a las campañas. Primero se envía a los lesionados más graves y el foco del cupo va a ellos.
- **Ramas y Vercel (22/11 noche):** el dueño pidió ordenarlas. Primero inventario y propuesta (`21-orden-de-ramas-y-vercel.md`); se archiva con etiqueta y nada se borra sin su OK.
- **Memoria en claude.ai:** el dueño la está cargando con Claude in Chrome (22/11 noche).
- **Ramas y PR (22/11 noche):** no tocar ramas ni archivar nada por ahora. Los PR sin integrar (#77, #80 y #40) quedan para después.

## Órdenes del 22/11 (cierre): rehacer el panel, simple y premium

- **El rediseño anterior no alcanzó** («no tiene ningún rediseño gráfico, solo mínimos detalles… todo es básico, genérico, con botones… lo dejaste más feo y más desorganizado»). Se rehace de verdad: ultra premium, interactivo, con las referencias que pasó (videos, code.xr).
- **Fácil y sencillo:** «demasiado extenso, demasiadas funciones, demasiado de todo que no te lleva a nada». Menos cosas por pantalla, **estadísticas circulares** (anillos), **animaciones simples**, textos sin tecnicismos. Lo que sale de la vista no se borra: va a «Más».
- **La Oficina como el video 1** (oficina 3D con agentes trabajando en escritorios), animada; el cerebro y el panel con la misma calidad. **Jarvis tiene que existir** de verdad en el panel.
- Usar referencias de otras páginas y CRM, y todas las skills, plugins, conectores y agentes, con los mejores modelos.
- Después: **propuesta de gestión de teléfonos** desde la computadora, con reconexión automática de líneas caídas (o aviso y reconexión en un toque).
- **Jarvis, secretario de todo el panel (22/11 cierre):** «tiene que ayudarme en todo el panel… como el asistente que está ahora pero mejorado nivel 1000». Se construye sobre el asistente actual (sin borrarlo): presente en cada pantalla, sabe dónde estás, da el parte del día, busca, resume, redacta borradores, lleva a la pantalla correcta y crea tareas, siempre con confirmación para lo que cambia algo. No lanza campañas ni publica.
- **Estilo del panel (22/11 cierre): el del reel 2** (Df93dArgY10). Fondo gradient mesh oscuro, glassmorphism real, sombras en capas, bento grid, botones neumórficos sobrios, parallax suave y efectos 3D sobrios: inclinación leve y anillos con relieve. «No tarjetas y animaciones genéricas, básicas». Siempre con estadísticas circulares, simple y accesible.
- **Corrección (22/11 cierre, más reciente):** «ese fondo raro no, manteniendo la estética clásica del panel pero sumando detalles». Sin gradient mesh ni esferas de color: fondo, colores y tipografía del panel de siempre. Se suman detalles premium: anillos con relieve, sombras suaves en capas, borde fino con brillo, inclinación 3D leve, entradas escalonadas y un vidrio sutil solo en la barra lateral y en Jarvis.

### 22/11 · Jarvis puede hacer TODO, siempre preguntando
- Orden del dueño: «que Jarvis pueda hacer TODO, preguntándome antes siempre». Reemplaza la veda anterior (Jarvis no lanzaba, no publicaba ni le escribía a nadie).
- Ahora Jarvis puede proponer lanzar o reanudar campañas, publicar, responder chats y encender bots o seguimientos. Lo que hace salir mensajes o publica nunca baja de **confirmación reforzada** (marcar que se entendió a quién, cuántos y desde qué línea) o código si el permiso lo pide. Nada se ejecuta sin el Sí del dueño. Sigue valiendo: las campañas las lanzan los dueños, ahora también confirmando desde Jarvis.
- Código: `src/lib/jarvis/seguridad.ts` (`esPropuestaSensible`, `decisionConfirmar`), prompt v1.x regla 2, pruebas en `tests/unitarias/jarvis-seguridad.test.ts`.

### 22/11 · El cerebro orquesta y la Oficina es un edificio por sectores
- Cada escritorio es un sector con puestos por tarea específica (guionista, render, analista…); se entra a cada uno desde `/oficina`. El Cerebro está al centro y recibe, reparte y revisa (Dirección = Cerebro).
- Mapa del código con Graphify en `cerebro/mapa-codigo/`: los agentes lo consultan antes de tocar código.
- Propuestas pendientes de OK (líneas propias con Evolution API, Jarvis con código vía rama + vista previa): `biblioteca/propuesta-lineas-codigo-agentes-2211.md`.

## Órdenes del 27/11 (panel, Oficina, Jarvis y Cerebro)

Sesión del panel (en paralelo hay otra sesión de **redes**: no se tocan `docs/redes/`, `.claude/referencias/redes/` ni sus filas de este archivo).

| Orden | Reemplaza a |
| --- | --- |
| **Oficina: alcance de cada tarea.** Además de un rubro, una tarea u orden se puede dar sobre **todo el panel** o sobre **los 4 rubros a la vez**. Va en el selector de la configuración de tareas de la Oficina | 22/11: tareas por perfil y por departamento |
| **Oficina: quién ejecuta.** Si no hay uso disponible de Claude, **Gemini ejecuta las tareas de la Oficina** (dentro del tope de USD 30 por mes, aviso al 80 %). Lo hecho por Gemini queda marcado «hecho por Gemini, sin repasar» y **Claude lo repasa después** con subagentes, con Opus como líder y orquestador. Nada hecho por Gemini se da por bueno sin ese repaso | 22/11: «Gemini ordena en el panel, Claude trabaja» |
| **Orquestación.** Opus lidera y orquesta; reparte en subagentes de **distintos modelos y esfuerzos** según la dificultad, y usa los agentes personalizados, skills, plugins, herramientas MCP, conectores y archivos de memoria que apliquen. Al cerrar se informa qué se usó | 22/11 (tarde): «Claude orquesta como director ejecutivo» (se refuerza) |
| **Jarvis sin límites de función.** Tiene que poder hacer todo lo que el dueño le pida: conocer todo el cerebro y el panel completo, recibir **Excel adjuntos** y **disparar conversaciones** con su aprobación. **No cambia código** (el dueño lo descartó el 27/11: «olvidate que cambie el código»); los cambios de código los pide por la Oficina o la Bandeja. Las confirmaciones antes de enviar, gastar o publicar se mantienen (22/11: «siempre preguntando») | — |
| **Un solo asistente.** En el panel queda **Jarvis** y la **Bandeja para Claude**. El «asistente virtual» se retira del menú (se archiva, no se borra) | — |
| **Cerebro funcional, no decorativo.** Tiene que contestar preguntas, aprender lo que se le enseña, ejecutar órdenes y **aprender por sí mismo** (código completo, rubros, recorrido del panel, internet), siempre **sumando** a su memoria, sin pisar lo anterior. Salud, Laboratorio, mapa, pedidos a Claude y pendientes de los dueños tienen que permitir **acciones** desde el propio Cerebro | 22/11: Cerebro como centro de mando (se exige que funcione) |
| **Bots: rubros separados** también dentro de la sección de bots. Biblioteca y Comparar agentes van **dentro de «Bot IA»** y tienen que funcionar | — |
| **Chats:** enviar a un contacto puntual una **plantilla de Meta** para reabrir la conversación. La ficha muestra **todos los datos del Excel** del prospecto que están en la base | — |
| **Plantillas de Meta: asignación manual.** **Penal se unifica con Civil**: una sola línea y un solo canal de Jurídico | Q59 (abierta): se resuelve unificando |
| **Captados:** un prospecto cuenta como captado solo si **pidió la llamada**; ordenar dónde se encuentran | — |
| **Hoy de cada perfil:** compacto, con botones que hagan algo; sin cifras repetidas | — |
| **Rediseño estético de todo el panel:** premium, elegante, colores suaves, tipografía cuidada, animaciones con vida pero sobrias. Entrada con efecto 3D en lugar de la lámpara; lo mismo en Perfiles. Tarjetas de perfiles con bordes y logos corregidos. Más velocidad | 22/11: pasteles apagados (se rehace entero) |

Plan por pasos y preguntas abiertas: `cerebro/22-plan-panel-2711.md`.

### Respuestas del dueño, 27/11 (mismo día)

- **Jarvis no cambia código.** Descartado. Lo demás de «sin límites de función» sigue.
- **Penal + Civil:** queda **la línea de Civil** como única línea de Jurídico. Las conversaciones de Penal pasan a esa; nada se borra.
- **Captado:** no se redefine preguntando; la definición ya está en los chats y en el entrenamiento de los bots. Se relee y se hace cumplir en el código.
- **Gemini en la Oficina:** mismo tope de USD 30 por mes, compartido con los bots.
- **Rediseño:** primero una **página de muestra**. Antes de diseñar, juntar todo el contexto: exigencias, referencias, gustos y pedidos del dueño, releyendo el cerebro y el proyecto entero (dossier en `cerebro/23-dossier-de-diseno.md`).

### Corrección del dueño sobre el diseño, 27/11 (manda sobre lo anterior)

| Orden | Texto |
|---|---|
| El diseño no se rehace | «es dejarlo tal cual está ahora pero mejorarlo un poco, no así de drástico el cambio». Se conserva el panel actual y se retoca. Nada de pantallas nuevas planas con tablas y botones. |
| Lo que le gusta | «las animaciones y demás del cerebro me encantan pero no es funcional». La animación del Cerebro y la Oficina 3D no se tocan; se les suma función. |
| Lo que no | Los colores pastel de las cajas: «re contra infantiles y de colegio». Y que «todo es pura decoración y se repite casi todo, el trabajo cotidiano es muy difícil». |
| Muestras | Con fotos alcanza; no hace falta una muestra navegable. |
| Prioridad | Implementar el pedido del 27/11 (plan en `22-plan-panel-2711.md`), no seguir con muestras. |

### Aprobación del plan y decisiones del dueño, 27/11 (mandan sobre los valores por defecto del plan 22)

El dueño aprobó el paso a paso y pidió ejecutarlo y aplicarlo en el panel a partir de las 9:00 del 27/11 (hora de Argentina).

| Tema | Decisión, con sus palabras |
|---|---|
| Oficina, alcance | «se tiene que poder pedir una tarea para los 4 rubros juntos o individuales, o mejoras al panel, etc. No tiene que limitar». Entonces: un rubro, varios, los 4 juntos (una sola tarea con un resultado conjunto), los 4 por separado, o todo el panel. |
| Oficina, competencia | «oficina tiene que ser todos los agentes ahora, pero que en cada uno de ellos compitan 100 más para ver quién tiene la mejor respuesta, como la skill arena». Cada agente resuelve con varias respuestas que compiten y un juez elige la mejor. |
| Reabrir un chat | El seguimiento automático cada 72 horas ya existe y no es esto. Lo que pide: «dentro del chat de un prospecto que la ventana de Meta de 24 hs haya cerrado, pueda enviarle un mensaje con una plantilla directo de la ventana del chat». Sin tope diario. |
| Ficha | Los datos se muestran como ahora, sin esconder nada detrás de «ver datos sensibles» (eso lo inventó Claude y fue rechazado). Se suman las columnas del Excel. |
| Captado | Incluye aceptar que lo contacte un asesor por WhatsApp, no solo una llamada. |
| Marketing | Pedir presupuesto pasa a «Interesado»; captado es quien pide reunión o llamada. «Que el bot intente siempre la llamada, porque si no se envían presupuestos que nunca avanzan y se pierde tiempo». |
| Seguridad | Sin código para enviar: queda la confirmación de siempre. |
| Gemini en la Oficina | Solo por botón. |
| Cerebro en internet | Encendido: «necesito que esté constantemente informándose y aprendiendo, de ventas, de absolutamente todo». Dentro del tope de USD 30 compartido. |
| Los 36 captados actuales | Los decide el dueño uno por uno. |
| Color | Tonos profundos sí. «Algunas animaciones y detalles del motor gráfico que está hecho también suman, pero no tan colorido». |
| Pendientes del dueño | Mañana (28/11) carga las variables del disparo de la Oficina y cambia el código de ingreso. |
| Proceso | «De dónde sacaste eso? Por favor leé el cerebro, la memoria, el proyecto completo, chat por chat». Antes de decidir algo que el dueño no dijo, se busca en el cerebro; si no está, se pregunta. |

**Funciones nuevas que el dueño sumó el 27/11 («sumalo»):** búsqueda con Ctrl+K dentro de cada perfil (contacto, chat, campaña o pantalla, sin cruzar rubros; en el nivel general, solo pantallas) y recordatorios por contacto («volver a llamar el jueves») visibles en Hoy.

| Campañas en curso (27/11, 9:10) | «Hay campañas corriendo en el panel, que no se pausen ni nada». Al integrar y publicar el plan no se pausa ni se toca ninguna campaña; las migraciones que tocan campañas, líneas o plantillas se aplican sin campañas enviando. |

### 27/11 · Oficina: «Arrancar» usa Gemini cuando no hay disparador

El dueño, textual: «que arranque cuando yo te lo pida tambien por mas que no haya disparador, usala».

- Cuando él pide arrancar una tarea de la Oficina y el disparador de Claude no está configurado (o no responde), la tarea la resuelve Gemini (3 respuestas que compiten y un juez), en vez de quedar en `sin_disparador`.
- Reemplaza, para ese caso, la decisión anterior de «Gemini solo por botón». El botón de Gemini sigue estando.
- Gemini no arranca por su cuenta: solo cuando él lo pide. Se mantiene el tope de USD 30 por mes.

### 27/11 · Gemini con el cerebro y el mapa

El dueño, textual: «el cerebro conectaselo a gemini y el mapa tambien asi tiene todo el contexto».

- Cada pedido que la Oficina le hace a Gemini lleva las partes del cerebro y de los mapas que tocan la tarea, más las órdenes vigentes (`src/lib/oficina/contexto-servidor.ts`). También las ve el juez.
- Viajan solo los documentos del repositorio; quedan afuera las charlas viejas, los traspasos y la bitácora. Lo aprendido en la base se suma cuando se pueda filtrar por rubro.
- El repaso de Claude sigue siendo obligatorio antes de aprobar.

### 27/11 · Auditoría exhaustiva en navegador y orden de trabajo
El dueño, textual: «hacela totalmente exhaustiva y correla en una web, si tenes que dedicar 10 agentes a auditar el panel entero, hacelo». Después: «toca todo lo que quieras, solo no lances campañas. proba todo.» Y: «primero termina la auditoria sobre el panel y despues terminas de implentar el plan aprobado por si hay ajustes».

- La auditoría se hace en producción, con navegador real: 12 zonas en solo lectura (cada una con un revisor que contrasta con el código) y 5 recorridos haciendo clic de verdad.
- Límite que dio el dueño: no lanzar campañas. Límites que Claude mantiene por criterio propio (no los dijo el dueño en este mensaje, salen de órdenes anteriores): no pausar ni tocar campañas, no mandar mensajes a personas reales, no cambiar cómo responde el bot en vivo, no cambiar datos de prospectos, nada se borra, tope de Gemini.
- Orden de trabajo: primero se cierra la auditoría; el plan aprobado (tandas A2–A8 y fases B–D) se integra y publica después, con los ajustes que la auditoría pida.
- También pidió usar más agentes y los agentes personalizados cargados: la auditoría usa los de `agent-protocols` y `agentic-council`.
