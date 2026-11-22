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
